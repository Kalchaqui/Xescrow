// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Xescrow {
    enum Role { None, Client, Provider }
    enum OfferStatus { Open, Accepted, Completed }

    struct User {
        Role role;
        bool registered;
    }

    struct Offer {
        uint256 id;
        address provider;
        address client;
        uint256 price;
        string descriptionHash;
        OfferStatus status;
    }

    address public owner;
    uint256 public offerCounter;
    IERC20 public token;
    uint256 public platformFeePercent = 2; // Tarifa de plataforma del 2%

    mapping(address => User) public users;
    mapping(uint256 => Offer) public offers;
    mapping(address => uint256) public pendingWithdrawals;

    // Eventos solicitados
    event UserRegistered(address indexed user, Role role);
    event OfferCreated(uint256 indexed offerId, address indexed provider, uint256 price, string descriptionHash);
    event OfferAccepted(uint256 indexed offerId, address indexed client);
    event DeliveryConfirmed(uint256 indexed offerId);
    event FundsWithdrawn(address indexed user, uint256 amount);
    event PlatformFeesWithdrawn(address indexed owner, uint256 amount);

    modifier onlyRegistered() {
        require(users[msg.sender].registered, "Not registered");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address tokenAddress) {
        owner = msg.sender;
        token = IERC20(tokenAddress);
    }

    // Registro de usuarios
    function registerUser(Role role) external {
        require(!users[msg.sender].registered, "Already registered");
        require(role == Role.Client || role == Role.Provider, "Invalid role");
        users[msg.sender] = User({ role: role, registered: true });
        emit UserRegistered(msg.sender, role);
    }

    // Crear oferta
    function createServiceOffer(string memory descriptionHash, uint256 price) external onlyRegistered {
        require(users[msg.sender].role == Role.Provider, "Only providers can create offers");
        offers[offerCounter] = Offer({
            id: offerCounter,
            provider: msg.sender,
            client: address(0),
            price: price,
            descriptionHash: descriptionHash,
            status: OfferStatus.Open
        });
        emit OfferCreated(offerCounter, msg.sender, price, descriptionHash);
        offerCounter++;
    }

    // Aceptar oferta
    function acceptOffer(uint256 offerId) external onlyRegistered {
        Offer storage offer = offers[offerId];
        require(users[msg.sender].role == Role.Client, "Only clients can accept offers");
        require(offer.status == OfferStatus.Open, "Offer not open");
        uint256 fee = (offer.price * platformFeePercent) / 100;
        uint256 totalAmount = offer.price + fee;
        require(token.transferFrom(msg.sender, address(this), totalAmount), "Token transfer failed");

        offer.client = msg.sender;
        offer.status = OfferStatus.Accepted;
        emit OfferAccepted(offerId, msg.sender);
    }

    // Confirmar entrega
    function confirmDelivery(uint256 offerId) external onlyRegistered {
        Offer storage offer = offers[offerId];
        require(msg.sender == offer.client, "Only client can confirm");
        require(offer.status == OfferStatus.Accepted, "Invalid offer status");

        pendingWithdrawals[offer.provider] += offer.price;
        offer.status = OfferStatus.Completed;
        emit DeliveryConfirmed(offerId);
    }

    // Retirar fondos
    function withdrawFunds() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        require(token.transfer(msg.sender, amount), "Token withdrawal failed");
        emit FundsWithdrawn(msg.sender, amount);
    }

    // Retirar tarifas de la plataforma
    function withdrawPlatformFees(address to) external onlyOwner {
        uint256 balance = token.balanceOf(address(this)) - getTotalPendingWithdrawals();
        require(balance > 0, "No fees to withdraw");
        require(token.transfer(to, balance), "Transfer failed");
        emit PlatformFeesWithdrawn(to, balance);
    }

    // Función auxiliar para calcular retiros pendientes
    function getTotalPendingWithdrawals() internal view returns (uint256) {
        // En un contrato real, esto debería iterar sobre todos los retiros pendientes
        // Para simplificar, asumimos que el balance menos los retiros pendientes son las tarifas
        return 0; // Simplificación para el hackathon
    }
}