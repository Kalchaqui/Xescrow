// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        // Mint inicial de 1000 USDC (6 decimales)
        _mint(msg.sender, 1000 * 1e6); // 1000 USDC
    }
}