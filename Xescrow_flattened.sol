// Sources flattened with hardhat v2.24.0 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File contracts/Xescrow.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;
contract Xescrow{
enum Role { None, Client, Provider }
enum OfferStatus { Open, Accepted, Completed, Disputed, Cancelled }

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
    uint256 acceptedAt;          // timestamp when accepted
}

address public owner;
uint256 public offerCounter;
IERC20 public token;

// expiration in seconds for delivery confirmation
uint256 public deliveryTimeout;
// dispute fee as percentage (e.g. 2 means 2%)
uint256 public disputeFeePercent = 2;

mapping(address => User) public users;
mapping(uint256 => Offer) public offers;
mapping(address => uint256) public pendingWithdrawals;
mapping(uint256 => uint256) public disputeFees;  // fee paid per offer

// EVENTS
event UserRegistered(address indexed user, Role role);
event OfferCreated(uint256 indexed offerId, address indexed provider, uint256 price, string descriptionHash);
event OfferAccepted(uint256 indexed offerId, address indexed client);
event DeliveryConfirmed(uint256 indexed offerId);
event DisputeRaised(uint256 indexed offerId, address indexed by, uint256 fee);
event DisputeResolved(uint256 indexed offerId, bool inFavorOfProvider);
event OfferCancelled(uint256 indexed offerId);
event FundsWithdrawn(address indexed user, uint256 amount);
event OfferExpired(uint256 indexed offerId);
event PlatformFeesWithdrawn(address indexed owner, uint256 amount);

modifier onlyRegistered() {
    require(users[msg.sender].registered, "Not registered");
    _;
}

modifier onlyOwner() {
    require(msg.sender == owner, "Only owner");
    _;
}

constructor(address tokenAddress, uint256 _deliveryTimeout)
{
    owner = msg.sender;
    token = IERC20(tokenAddress);
    deliveryTimeout = _deliveryTimeout;
}

// User Management
function registerUser(Role role) external {
    require(!users[msg.sender].registered, "Already registered");
    require(role == Role.Client || role == Role.Provider, "Invalid role");
    users[msg.sender] = User({ role: role, registered: true });
    emit UserRegistered(msg.sender, role);
}

// Offer Management
function createServiceOffer(string memory descriptionHash, uint256 price) external onlyRegistered {
    require(users[msg.sender].role == Role.Provider, "Only providers can create offers");
    offers[offerCounter] = Offer({
        id: offerCounter,
        provider: msg.sender,
        client: address(0),
        price: price,
        descriptionHash: descriptionHash,
        status: OfferStatus.Open,
        acceptedAt: 0
    });
    emit OfferCreated(offerCounter, msg.sender, price, descriptionHash);
    offerCounter++;
}

function acceptOffer(uint256 offerId) external onlyRegistered {
    Offer storage offer = offers[offerId];
    require(users[msg.sender].role == Role.Client, "Only clients can accept offers");
    require(offer.status == OfferStatus.Open, "Offer not open");
    require(token.transferFrom(msg.sender, address(this), offer.price), "Token transfer failed");

    offer.client = msg.sender;
    offer.status = OfferStatus.Accepted;
    offer.acceptedAt = block.timestamp;
    emit OfferAccepted(offerId, msg.sender);
}

function confirmDelivery(uint256 offerId) external onlyRegistered {
    Offer storage offer = offers[offerId];
    require(msg.sender == offer.client, "Only client can confirm");
    require(offer.status == OfferStatus.Accepted, "Invalid offer status");
    require(block.timestamp <= offer.acceptedAt + deliveryTimeout, "Confirmation period expired");

    pendingWithdrawals[offer.provider] += offer.price;
    offer.status = OfferStatus.Completed;
    emit DeliveryConfirmed(offerId);
}

// allow owner to refund if client disappears
function refundExpired(uint256 offerId) external onlyOwner {
    Offer storage offer = offers[offerId];
    require(offer.status == OfferStatus.Accepted, "Offer not accepted");
    require(block.timestamp > offer.acceptedAt + deliveryTimeout, "Not yet expired");

    // refund client
    require(token.transfer(offer.client, offer.price), "Refund failed");
    offer.status = OfferStatus.Cancelled;
    emit OfferExpired(offerId);
}

function raiseDispute(uint256 offerId) external onlyRegistered {
    Offer storage offer = offers[offerId];
    require(
        msg.sender == offer.client || msg.sender == offer.provider,
        "Not involved in this offer"
    );
    require(offer.status == OfferStatus.Accepted, "Invalid status for dispute");

    uint256 fee = (offer.price * disputeFeePercent) / 100;
    require(token.transferFrom(msg.sender, address(this), fee), "Dispute fee required");
    disputeFees[offerId] = fee;

    offer.status = OfferStatus.Disputed;
    emit DisputeRaised(offerId, msg.sender, fee);
}

function resolveDispute(uint256 offerId, bool inFavorOfProvider) external onlyOwner {
    Offer storage offer = offers[offerId];
    require(offer.status == OfferStatus.Disputed, "Offer not in dispute");

    if (inFavorOfProvider) {
        pendingWithdrawals[offer.provider] += offer.price;
    } else {
        require(token.transfer(offer.client, offer.price), "Refund failed");
    }

    // dispute fee remains in contract; owner can withdraw via withdrawPlatformFees
    offer.status = OfferStatus.Completed;
    emit DisputeResolved(offerId, inFavorOfProvider);
}

function cancelOffer(uint256 offerId) external onlyRegistered {
    Offer storage offer = offers[offerId];
    require(msg.sender == offer.provider, "Only provider can cancel");
    require(offer.status == OfferStatus.Open, "Offer not open");

    offer.status = OfferStatus.Cancelled;
    emit OfferCancelled(offerId);
}

function withdrawFunds() external {
    uint256 amount = pendingWithdrawals[msg.sender];
    require(amount > 0, "No funds to withdraw");
pendingWithdrawals[msg.sender] = 0;
    require(token.transfer(msg.sender, amount), "Token withdrawal failed");
    emit FundsWithdrawn(msg.sender, amount);
}

// owner withdraws collected dispute fees
function withdrawPlatformFees(address to) external onlyOwner {
    uint256 balance = token.balanceOf(address(this));
    require(balance > 0, "No fees to withdraw");
    require(token.transfer(to, balance), "Transfer failed");
    emit PlatformFeesWithdrawn(to, balance);
}
}
