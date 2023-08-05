const fs = require("fs");
const { network, ethers } = require("hardhat");

module.exports = async () => {

    console.log("Writing to front end...");
    await updateContractAddresses();
    await updateAbi();
    console.log("Front end written!");
};

async function updateAbi() {
    const gacha = await ethers.getContract("Gacha");
    const MockVRF = await ethers.getContract("VRFCoordinatorV2Mock");
    fs.writeFileSync(
        process.env.frontEndAbiFile,
        gacha.interface.format(ethers.utils.FormatTypes.json)
    );
    fs.writeFileSync(
        process.env.frontEndAbiVRFFile,
        MockVRF.interface.format(ethers.utils.FormatTypes.json)
    );
}

async function updateContractAddresses() {
    const gacha = await ethers.getContract("Gacha");
    const MockVRF = await ethers.getContract("VRFCoordinatorV2Mock");
    const contractAddresses = JSON.parse(
        fs.readFileSync(process.env.frontEndContractsFile, "utf8")
    );
    const contractAddressesMOCK = JSON.parse(
        fs.readFileSync(process.env.frontEndContractsFileVRF, "utf8")
    );

    if (network.config.chainId.toString() in contractAddresses) {
        if (
            !contractAddresses[network.config.chainId.toString()].includes(
                gacha.address
            )
        ) {
            contractAddresses[network.config.chainId.toString()].push(
                gacha.address
            );
        }
    } else {
        contractAddresses[network.config.chainId.toString()] = [
            gacha.address,
        ];
    }

    if (network.config.chainId.toString() in contractAddressesMOCK) {
        if (
            !contractAddresses[network.config.chainId.toString()].includes(
                MockVRF.address
            )
        ) {
            contractAddresses[network.config.chainId.toString()].push(
                MockVRF.address
            );
        }
    } else {
        contractAddresses[network.config.chainId.toString()] = [
            MockVRF.address,
        ];
    }
    fs.writeFileSync(
        process.env.frontEndContractsFile,
        JSON.stringify(contractAddresses)
    );
    fs.writeFileSync(
        process.env.frontEndContractsFileVRF,
        JSON.stringify(contractAddressesMOCK)
    );
}
module.exports.tags = ["all", "frontend"];