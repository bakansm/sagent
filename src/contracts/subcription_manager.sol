// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SagentSubscriptionManager { 
    address public owner; 

    
    IERC20 public stablecoin;

    enum Tier { FREE, PRO, PREMIUM }

    struct UserSubscription {
        Tier currentTier;         
        uint256 subscriptionEndTime; 
        uint256 dailyCredits;     
    }

    mapping(address => UserSubscription) public userSubscriptions;

    uint256 public PRO_PRICE;
    uint256 public PREMIUM_PRICE;

    uint256 public constant SUBSCRIPTION_DURATION = 30 days; 

    event SubscriptionPurchased(address indexed user, Tier newTier, uint256 paymentAmount, uint256 endTime, uint256 dailyCredits);
    event SubscriptionDowngraded(address indexed user, Tier oldTier, Tier newTier);
    event StablecoinAddressSet(address indexed _stablecoinAddress); 
    event PricesSet(uint256 proPrice, uint256 premiumPrice); 

    constructor(address _stablecoinAddress) {
        owner = msg.sender;
        stablecoin = IERC20(_stablecoinAddress);
        
        PRO_PRICE = 19 ether;  
        PREMIUM_PRICE = 39 ether; 

        emit StablecoinAddressSet(_stablecoinAddress);
        emit PricesSet(PRO_PRICE, PREMIUM_PRICE);
    }

    function setStablecoinAddress(address _newStablecoinAddress) external {
        require(msg.sender == owner, "Only owner can set stablecoin address");
        stablecoin = IERC20(_newStablecoinAddress);
        emit StablecoinAddressSet(_newStablecoinAddress);
    }

    function setPrices(uint256 _proPrice, uint256 _premiumPrice) external {
        require(msg.sender == owner, "Only owner can set prices");
        PRO_PRICE = _proPrice;
        PREMIUM_PRICE = _premiumPrice;
        emit PricesSet(_proPrice, _premiumPrice);
    }

    function subscribePro() external {
        require(stablecoin.transferFrom(msg.sender, owner, PRO_PRICE), "Failed to transfer stablecoin for PRO subscription. Check allowance and balance.");

        userSubscriptions[msg.sender] = UserSubscription({
            currentTier: Tier.PRO,
            subscriptionEndTime: block.timestamp + SUBSCRIPTION_DURATION,
            dailyCredits: 30
        });

        emit SubscriptionPurchased(msg.sender, Tier.PRO, PRO_PRICE, block.timestamp + SUBSCRIPTION_DURATION, 30);
    }

    function subscribePremium() external {
        require(stablecoin.transferFrom(msg.sender, owner, PREMIUM_PRICE), "Failed to transfer stablecoin for PREMIUM subscription. Check allowance and balance.");

        userSubscriptions[msg.sender] = UserSubscription({
            currentTier: Tier.PREMIUM,
            subscriptionEndTime: block.timestamp + SUBSCRIPTION_DURATION,
            dailyCredits: 60
        });

        emit SubscriptionPurchased(msg.sender, Tier.PREMIUM, PREMIUM_PRICE, block.timestamp + SUBSCRIPTION_DURATION, 60);
    }

    function getMySubscriptionStatus() external view returns (Tier, uint256, uint256) {
        UserSubscription storage sub = userSubscriptions[msg.sender];

        if (sub.currentTier == Tier.FREE || block.timestamp >= sub.subscriptionEndTime) {
            return (Tier.FREE, 0, 10); 
        }

        return (sub.currentTier, sub.subscriptionEndTime, sub.dailyCredits);
    }

    function getContractStablecoinBalance() external view returns (uint256) {
        return stablecoin.balanceOf(address(this));
    }

    function withdrawAllETHFunds() external {
        require(msg.sender == owner, "Only owner can withdraw ETH funds");
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH funds to withdraw");
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Failed to withdraw ETH funds");
    }
}