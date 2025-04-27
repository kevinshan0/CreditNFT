// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev 6-decimal “USDC” clone for local testing
contract MockUSDC is ERC20 {
    constructor(uint256 initialMint) ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, initialMint);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}