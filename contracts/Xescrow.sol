// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Xescrow
 * @notice Este contrato es experimental para ser presentado en hackathon de Odisea Nucleo. La versión completa será llevada a Mainnet
 * @dev Contrato para gestionar un escrow de servicios entre cliente y proveedor usando la moneda nativa de Mantle Sepolia Testnet
 * @custom:network Mantle Sepolia Testnet
 * @author Braulio Chávez-Diego Raúl Barrionuevo
 */
contract Xescrow {
    /** 
     * @dev Roles de usuario
     * - `None`: No registrado
     * - `Client`: Solicita servicios
     * - `Provider`: Ofrece servicios
     */
    enum Role { None, Client, Provider }

    /**
     * @dev Estados de una oferta
     * - `Open`: Disponible para aceptar
     * - `Accepted`: Aceptada por cliente
     * - `Completed`: Entregada y finalizada
     */
    enum OfferStatus { Open, Accepted, Completed }

    /**
     * @dev Información del usuario
     * @param role Rol asignado (Client o Provider)
     * @param registered Indica si el usuario está registrado
     */
    struct User {
        Role role;
        bool registered;
    }

    /**
     * @dev Detalles de una oferta
     * @param id ID único de la oferta
     * @param provider Dirección del proveedor
     * @param client Dirección del cliente (si aceptó la oferta)
     * @param price Precio en MNT
     * @param descriptionHash IPFS hash de la descripción
     * @param status Estado actual de la oferta
     */
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
    uint256 public platformFeePercent = 2; 

    mapping(address => User) public users;
    mapping(uint256 => Offer) public offers;
    mapping(address => uint256) public pendingWithdrawals;

    /**
     * @dev Emitted cuando un usuario se registra
     * @param user Dirección del usuario
     * @param role Rol asignado (Client o Provider)
     */
    event UserRegistered(address indexed user, Role role);

    /**
     * @dev Emitted cuando se crea una oferta
     * @param offerId ID de la oferta
     * @param provider Dirección del proveedor
     * @param price Precio de la oferta en MNT
     * @param descriptionHash IPFS hash de la descripción
     */
    event OfferCreated(uint256 indexed offerId, address indexed provider, uint256 price, string descriptionHash);

    /**
     * @dev Emitted cuando un cliente acepta una oferta
     * @param offerId ID de la oferta
     * @param client Dirección del cliente
     */
    event OfferAccepted(uint256 indexed offerId, address indexed client);

    /**
     * @dev Emitted cuando el cliente confirma la entrega
     * @param offerId ID de la oferta
     */
    event DeliveryConfirmed(uint256 indexed offerId);

    /**
     * @dev Emitted cuando un usuario retira fondos
     * @param user Dirección del usuario
     * @param amount Monto retirado en MNT
     */
    event FundsWithdrawn(address indexed user, uint256 amount);

    /**
     * @dev Emitted cuando el dueño retira tarifas
     * @param owner Dirección del dueño
     * @param amount Monto de tarifas retiradas en MNT
     */
    event PlatformFeesWithdrawn(address indexed owner, uint256 amount);

    /**
     * @dev Requiere que el usuario esté registrado
     */
    modifier onlyRegistered() {
        require(users[msg.sender].registered, "Not registered");
        _;
    }

    /**
     * @dev Requiere que sea el dueño del contrato
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    /**
     * @dev Constructor del contrato
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Registra un usuario como Cliente o Proveedor
     * @param role Rol a asignar (1 = Client, 2 = Provider)
     * @custom:modifiers onlyRegistered
     * @custom:event UserRegistered
     */
    function registerUser(Role role) external {
        require(!users[msg.sender].registered, "Already registered");
        require(role == Role.Client || role == Role.Provider, "Invalid role");
        users[msg.sender] = User({ role: role, registered: true });
        emit UserRegistered(msg.sender, role);
    }

    /**
     * @dev Crea una nueva oferta laboral
     * @param descriptionHash IPFS hash de la descripción del servicio
     * @param price Precio del servicio en MNT
     * @custom:modifiers onlyRegistered
     * @custom:event OfferCreated
     */
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

    /**
     * @dev Acepta una oferta laboral
     * @param offerId ID de la oferta a aceptar
     * @custom:modifiers onlyRegistered
     * @custom:event OfferAccepted
     */
    function acceptOffer(uint256 offerId) external payable onlyRegistered {
        Offer storage offer = offers[offerId];
        require(users[msg.sender].role == Role.Client, "Only clients can accept offers");
        require(offer.status == OfferStatus.Open, "Offer not open");
        uint256 fee = (offer.price * platformFeePercent) / 100;
        uint256 totalAmount = offer.price + fee;
        require(msg.value == totalAmount, "Incorrect payment amount");

        offer.client = msg.sender;
        offer.status = OfferStatus.Accepted;
        emit OfferAccepted(offerId, msg.sender);
    }

    /**
     * @dev Confirma la entrega de un servicio
     * @param offerId ID de la oferta
     * @custom:modifiers onlyRegistered
     * @custom:event DeliveryConfirmed
     */
    function confirmDelivery(uint256 offerId) external onlyRegistered {
        Offer storage offer = offers[offerId];
        require(msg.sender == offer.client, "Only client can confirm");
        require(offer.status == OfferStatus.Accepted, "Invalid offer status");

        pendingWithdrawals[offer.provider] += offer.price;
        offer.status = OfferStatus.Completed;
        emit DeliveryConfirmed(offerId);
    }

    /** 
     * @dev Retira fondos del contrato en MNT
     * @custom:event FundsWithdrawn
     */
    function withdrawFunds() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
        emit FundsWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Retira tarifas acumuladas por el dueño en MNT
     * @param to Dirección de destino para las tarifas
     * @custom:modifiers onlyOwner
     * @custom:event PlatformFeesWithdrawn
     */
    function withdrawPlatformFees(address payable to) external onlyOwner {
        uint256 balance = address(this).balance - getTotalPendingWithdrawals();
        require(balance > 0, "No fees to withdraw");
        (bool success, ) = to.call{value: balance}("");
        require(success, "Transfer failed");
        emit PlatformFeesWithdrawn(to, balance);
    }

    /**
     * @dev Calcula los fondos pendientes de retiro
     * @return uint256 Total de fondos pendientes en MNT
     * @custom:note Esta función es una simplificación para el hackathon
     */
    function getTotalPendingWithdrawals() internal view returns (uint256) {
        // En un contrato real, esto debería iterar sobre todos los retiros pendientes
        // Para simplificar, asumimos que el balance menos los retiros pendientes son las tarifas
        return 0; // Simplificación para el hackathon
    }
}