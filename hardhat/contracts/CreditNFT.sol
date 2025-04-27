// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract CreditNFT is ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    IERC20Metadata public stableToken; // ERC-20 token (e.g., USDC) used for staking & repayments

    struct CreditData {
        address owner;
        uint256 creditLimit;    // max draw per cycle
        uint256 usedCredit;     // current debt
        uint256 creditScore;    // on-chain score
        uint256 lastReset;      // timestamp of last billing cycle reset
    }

    mapping(uint256 => CreditData) public creditData;
    mapping(address => uint256) public stakedAmount;

    uint256 public monthlyResetPeriod = 30 days;
    uint256 public interestRate = 5;         // 5% interest per cycle
    uint256 public latePaymentPenalty = 50;  // penalty points per missed cycle
    uint256 public baseCreditLimit;          // in smallest token unit
    uint256 public stakingRequirement;       // amount to stake to mint

    constructor(address _stableToken) ERC721("CreditNFT", "CRNFT") Ownable(msg.sender) {
        stableToken = IERC20Metadata(_stableToken);
        uint8 dec = stableToken.decimals();
        baseCreditLimit   = 1000 * (10 ** dec);   // 1000 USDC
        stakingRequirement = 500 * (10 ** dec);   // 500 USDC
    }

    /**
     * Stake stable token and mint an address-bound NFT
     * User must `approve` this contract for `stakingRequirement` first
     */
    function stakeAndMint() external {
        require(stakedAmount[msg.sender] == 0, "Already staked");
        stableToken.transferFrom(msg.sender, address(this), stakingRequirement);
        stakedAmount[msg.sender] = stakingRequirement;

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        creditData[tokenId] = CreditData({
            owner: msg.sender,
            creditLimit: baseCreditLimit,
            usedCredit: 0,
            creditScore: 700,
            lastReset: block.timestamp
        });
    }

    /**
     * Draws credit (stable token) up to the available limit
     */
    function drawCredit(uint256 tokenId, uint256 amount) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        CreditData storage cd = creditData[tokenId];
        _maybeResetCredit(tokenId);
        require(cd.usedCredit + amount <= cd.creditLimit, "Exceeds credit limit");
        cd.usedCredit += amount;
        stableToken.transfer(msg.sender, amount);
    }

    /**
     * Repay credit. User must `approve` this contract first
     */
    function repayCredit(uint256 tokenId, uint256 amount) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        CreditData storage cd = creditData[tokenId];
        require(cd.usedCredit >= amount, "Repay too much");
        stableToken.transferFrom(msg.sender, address(this), amount);
        cd.usedCredit -= amount;
        // Reward or penalize score based on repayment size
        if (amount * 2 >= cd.usedCredit) {
            cd.creditScore += 5;
        } else {
            cd.creditScore = cd.creditScore > 2 ? cd.creditScore - 2 : 0;
        }
    }

    /**
     * Applies interest & penalties at each cycle, then resets timestamp
     */
    function _maybeResetCredit(uint256 tokenId) internal {
        CreditData storage cd = creditData[tokenId];
        if (block.timestamp >= cd.lastReset + monthlyResetPeriod) {
            if (cd.usedCredit > 0) {
                // Apply interest on outstanding debt
                uint256 interest = (cd.usedCredit * interestRate) / 100;
                cd.usedCredit += interest;
                // Penalty on credit score
                cd.creditScore = cd.creditScore > latePaymentPenalty
                    ? cd.creditScore - latePaymentPenalty
                    : 0;
            }
            cd.lastReset = block.timestamp;
        }
    }

    /**
     * View credit data
     */
    function getCreditData(uint256 tokenId) external view returns (CreditData memory) {
        return creditData[tokenId];
    }

    // --- Admin functions ---
    function setInterestRate(uint256 _rate) external onlyOwner { interestRate = _rate; }
    function setLatePaymentPenalty(uint256 _penalty) external onlyOwner { latePaymentPenalty = _penalty; }
    function setMonthlyResetPeriod(uint256 _period) external onlyOwner { monthlyResetPeriod = _period; }
    function setBaseCreditLimit(uint256 _limit) external onlyOwner { baseCreditLimit = _limit; }
    function setStakingRequirement(uint256 _req) external onlyOwner { stakingRequirement = _req; }
}
