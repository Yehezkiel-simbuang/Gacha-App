const { network, ethers, deployments } = require("hardhat");
const { assert, expect } = require("chai");

!network.config.chainId == 31337
    ? describe.skip
    : describe("Gacha", function () {
        let accounts;
        const chainId = network.config.chainId;
        const casePrice = ethers.utils.parseEther("0.000001");
        beforeEach(async () => {
            accounts = await ethers.getSigners();
            await deployments.fixture(["all"]);
            mockContract = await ethers.getContract(
                "VRFCoordinatorV2Mock",
                accounts[0]
            );
            gachaContract = await ethers.getContract("Gacha", accounts[0]);
        });

        describe("Constructor", function () {
            it("Returns the correct owner", async () => {
                assert.equal(
                    await gachaContract.getOwner(),
                    accounts[0].address
                );
            });
        });

        describe("payCase", function () {
            it("Return error when not enough eth to pay cases", async () => {
                payCaseResponse = await gachaContract.payCase({
                    value: casePrice,
                });
                expect(payCaseResponse).to.be.revertedWithCustomError(
                    gachaContract,
                    "NotEnoughETH"
                );
            });
            it("Return true if eth enough and update numCases variable", async () => {
                await gachaContract.payCase({
                    value: ethers.utils.parseEther("1"),
                });
                numCaseResponse = await gachaContract.getNumCase(
                    accounts[0].address.toString()
                );
                assert.equal(numCaseResponse, 1);
            });
        });

        describe("openCase", function () {
            it("return error when sender doesnt have any case to open", async () => {
                openCaseResponse = gachaContract.openCase();
                expect(openCaseResponse).to.be.revertedWithCustomError(
                    gachaContract,
                    "YouDontHaveAnyCase"
                );
            });
            it("return a requestID and update the requestToSender and numCase variable", async () => {
                const fee = await gachaContract.getPrice();
                for (let i = 1; i < 3; i++) {
                    await gachaContract.payCase({ value: fee.toString() });
                }
                openCaseResponse = await gachaContract.openCase();
                openCaseReceipt = await openCaseResponse.wait(1);

                reqID = openCaseReceipt.events[1].args[0];
                //args[0] = requestID;
                //args[1] = msg.sender;

                assert.equal(
                    await gachaContract.getrequestToSender(
                        reqID
                    ),
                    accounts[0].address
                );
                // console.log(typeof (accounts[0].address.toInt()));
                numCaseResponse = await gachaContract.getNumCase(
                    accounts[0].address.toString()
                );
                console.log(Number(numCaseResponse._hex));
                assert.equal(numCaseResponse, 1);
            });
        });

        describe("FulfillRandomWords", function () {
            it("Minted the Item after random numbers returned", async () => {
                await new Promise(async (resolve, reject) => {
                    gachaContract.once("Item_minted", async () => {
                        try {
                            const TokenURI = await gachaContract.tokenURI("0");
                            const TokenCounter = await gachaContract.getTokenCounter();
                            console.log(TokenURI);
                            console.log(TokenCounter);
                            assert.equal(TokenURI.toString().includes("ipfs://"), true);
                            assert.equal(TokenCounter.toString(), "1");
                            resolve();
                        } catch (e) {
                            console.log(e);
                            reject();
                        }
                    })
                    try {
                        const fee = await gachaContract.getPrice();
                        for (let i = 1; i < 3; i++) {
                            await gachaContract.payCase({ value: fee.toString() });
                        }
                        openCaseResponse = await gachaContract.openCase();
                        openCaseResponse2 = await gachaContract.openCase();
                        openCaseReceipt = await openCaseResponse.wait(1);
                        // console.log(openCaseReceipt.logs[1].topics[0]);
                        await mockContract.fulfillRandomWords(
                            openCaseReceipt.events[1].args[0],
                            gachaContract.address
                        )
                    } catch (e) {
                        console.log(e);
                        reject();
                    }
                })
            })
        });
    });
