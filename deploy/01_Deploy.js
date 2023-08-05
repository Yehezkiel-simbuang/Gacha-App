const { network, ethers } = require("hardhat");
const { NetworkConfig } = require("../helper-hardhat-config");
const { storeItem, storeMetadata } = require("../utils/PinataUpload");
const { verify } = require("../utils/verify");

const FUND_AMOUNT = ethers.utils.parseEther("200");
const imagesPath = "./Images/";
// const metadata = {
//     name: "",
//     description: "",
//     item: "",
//     attributes: {
//         Buff: "",
//         Stats: "",
//     },
// };

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts();
    const { deploy } = deployments;
    const chainID = network.config.chainId;
    const TokenURIITEM = [
        "ipfs://Qmd3uPeERkbLtM2GL2eQQb6KRCM2zst1VN9FdBK3Mk2Skq",
        "ipfs://QmcRxKa9G85SqAYBo5tw4ZxwSgfFMTNcvVhigxNYJYx1Mj",
        "ipfs://QmXXmPxj8fADXTaXxxCKykZJ3LdDYCANR6p8wEVBHXt8Y9",
        "ipfs://QmaggDaNupFhA4hUyyyWjxG8FiHCT4YwaDJ7QRz3aqeBfG",
        "ipfs://QmSBHv5dpjwBGnnMhTFAoVJcj8dQ1q9TcdRUJMuVBugYQm",
        "ipfs://QmYbbymjHxn6M8dbjj6KB5TN9ieTv3QyVBdY792iYtit7W",
        "ipfs://QmQf33K2xze6NvnocVzsFwL2q29aicmKoKsWSPwgGmP2jh",
        "ipfs://QmcCTMDihjNMUm2gEDx3tKjuL8HMHfx47Kxfksooo7FLZK",
        "ipfs://QmULYCA4RMfrmC88EU9NE9GMbgA59eKPjpy3rvpVb6PW4U",
        "ipfs://QmfRsmpgJHKjhggFKk78x8gA16BprLgAU9P7VwothtYmoH",
        "ipfs://QmPJZvcwDgUKfMT2y6ZCm95baGjEJXNaZ2jDfycexrW1rY",
        "ipfs://QmPNecGZHeYmZZJpM82Mk47XEyq3eYexD2iBuReEtsbHW7",
    ];
    let VRFAddress, subscriptionId, MockVRF;

    if (chainID == 31337) {
        MockVRF = await ethers.getContract("VRFCoordinatorV2Mock");
        VRFAddress = MockVRF.address;
        const txResponse = await MockVRF.createSubscription();
        const txReceipt = await txResponse.wait(1);
        subscriptionId = txReceipt.events[0].args.subId;
        const test = await MockVRF.fundSubscription(subscriptionId, FUND_AMOUNT);
        console.log(test);
    } else {
        VRFAddress = NetworkConfig[chainID]["vrfCoordinatorV2"];
        subscriptionId = NetworkConfig[chainID]["subscriptionId"];
    }
    // TokenURIITEM = await fillTokenURI(metadata);

    arg = [
        NetworkConfig[chainID]["price"],
        VRFAddress,
        NetworkConfig[chainID]["keyHash"],
        subscriptionId,
        NetworkConfig[chainID]["callbackGasLimit"],
        TokenURIITEM,
    ];
    const deploy_gacha = await deploy("Gacha", {
        from: deployer,
        args: arg,
        log: true,
    });
    console.log(deploy_gacha.address);
    // console.log(arg);
    if (chainID == 31337) {
        await MockVRF.addConsumer(subscriptionId, deploy_gacha.address);
        console.log("consumer added");
    }

    if (chainID != 31337 && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying...")
        await verify(deploy_gacha, arg)
    }
};

// async function fillTokenURI(metadata) {
//     const attr = [
//         {
//             Buff: "Create a shield every time you get a fatal attack (cooldown: 60 Seconds)",
//             stat: "+120 Def",
//         },
//         {
//             Buff: "Adds 5% of total defense to attack damage.",
//             stat: "+40 Def",
//         },
//         {
//             Buff: "Increases melee hero attacks",
//             stat: "+40 Atk",
//         },
//         {
//             Buff: "Added character atk speed by 10 %",
//             stat: "+40 Atk",
//         },
//         {
//             Buff: "Accuracy increased by 5%",
//             stat: "+40 Hp",
//         },
//         {
//             Buff: "Add new skills",
//             stat: "+40 Atk",
//         },
//         {
//             Buff: "HP recovery power increased by 5%",
//             stat: "+40 Hp",
//         },
//         {
//             Buff: "Attacks when character is attacked(cooldown : 3 Seconds)",
//             stat: "+40 Atk",
//         },
//         {
//             Buff: "Increases attack range by 10%",
//             stat: "+40 Atk",
//         },
//         {
//             Buff: "Makes the enemy receive a burn effect for 2 seconds with a 20% chance (Cooldown: 15 seconds)",
//             stat: "+80 Def",
//         },
//         {
//             Buff: "Stuns the enemy on every attack with a 25% chance",
//             stat: "+80 Atk",
//         },
//         {
//             Buff: "Increases attack distance and attack spd by 30% of total attack + speed",
//             stat: "+80 Atk",
//         },
//     ];
//     tokenURI = [];
//     const { responses: fileInfo, files } = await storeItem(imagesPath);
//     for (index in fileInfo) {
//         let TokenURITemplate = { ...metadata };
//         TokenURITemplate.name = files[index].replace(".PNG", "");
//         TokenURITemplate.description = `A ${TokenURITemplate.name} !`;
//         TokenURITemplate.item = `ipfs://${fileInfo[index].IpfsHash}`;
//         TokenURITemplate.attributes.Buff = attr[index].Buff;
//         TokenURITemplate.attributes.Stats = attr[index].stat;
//         console.log(`Uploading ${TokenURITemplate.name}....`);
//         const MetadataResponse = await storeMetadata(TokenURITemplate);
//         tokenURI.push(`ipfs://${MetadataResponse.IpfsHash}`);
//     }
//     console.log("Upload completed!");
//     console.log(tokenURI);
//     return tokenURI;
// }

module.exports.tags = ["all", "gacha"];
