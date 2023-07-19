const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const pinata = new pinataSDK(
    process.env.PINATA_API,
    process.env.PINATA_API_SECRET
);

async function storeItem(image_path) {
    imagesPath = path.resolve(image_path);
    const files = fs
        .readdirSync(imagesPath)
        .filter((file) => file.includes(".PNG"));

    let responses = [];

    for (const index in files) {
        const readableFileStream = fs.createReadStream(
            `${imagesPath}/${files[index]}`
        );
        const options = { pinataMetadata: { name: files[index] } };

        try {
            await pinata
                .pinFileToIPFS(readableFileStream, options)
                .then((result) => {
                    responses.push(result);
                });
        } catch (error) {
            console.log(error);
        }
    }
    return { responses, files };
}

async function storeMetadata(metadata_template) {
    const options = { pinataMetadata: { name: metadata_template.name } };
    try {
        const response = await pinata.pinJSONToIPFS(metadata_template, options);
        return response;
    } catch (error) {
        console.log(error);
    }
    return null;
}
module.exports = { storeItem, storeMetadata };
