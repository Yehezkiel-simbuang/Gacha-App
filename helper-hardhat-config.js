const NetworkConfig = {
    31337: {
        name: "hardhat",
        keyHash:
            "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        price: "10000000000",
        callbackGasLimit: "500000",
    },
    11155111: {
        name: "sepolia",
        vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        keyHash:
            "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callbackGasLimit: "500000",
        price: "10000000000",
        subscriptionId: "2911",
    },
};

module.exports = { NetworkConfig };
