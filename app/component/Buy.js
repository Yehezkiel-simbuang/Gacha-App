import React, { useState, useEffect } from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useNotification } from "web3uikit";
import { contractAddresses, abi, abiVRF, contractAddressesVRF } from "../constants";
import { ethers } from "ethers";

export default function Buy() {
    const { chainId: chainIdHex, account, isWeb3Enabled } = useMoralis();
    const chainId = parseInt(chainIdHex);
    const gachaAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const MockVRFaddress = chainId in contractAddresses ? contractAddresses[chainId][1] : null
    const [casePrice, setCasePrice] = useState("0");
    const [numCase, setNumCase] = useState("0");
    const [reqID, setReqID] = useState(0);
    const [tokenCount, setTokenCount] = useState(0);

    const dispatch = useNotification();

    //1. Call function from smartcontract

    const { runContractFunction: payCase, data: enterTxResponse } = useWeb3Contract(
        {
            abi: abi,
            contractAddress: gachaAddress,
            functionName: "payCase",
            msgValue: casePrice,
            params: {},
        }
    )
    const { runContractFunction: openCase, isLoading, isFetching } = useWeb3Contract(
        {
            abi: abi,
            contractAddress: gachaAddress,
            functionName: "openCase",
            params: {},
        }
    )

    const { runContractFunction: fulfillRandomWords } = useWeb3Contract(
        {
            abi: abiVRF,
            contractAddress: MockVRFaddress,
            functionName: "fulfillRandomWords",
            params: { _requestId: "3", _consumer: gachaAddress },
        }
    )

    const { runContractFunction: getTokenCounter } = useWeb3Contract({
        abi: abi,
        contractAddress: gachaAddress,
        functionName: "getTokenCounter",
        params: {}
    })

    const { runContractFunction: getPrice } = useWeb3Contract({
        abi: abi,
        contractAddress: gachaAddress,
        functionName: "getPrice",
        params: {}
    })

    const { runContractFunction: getNumCase } = useWeb3Contract({
        abi: abi,
        contractAddress: gachaAddress,
        functionName: "getNumCase",
        params: { idx: account.toString() }
    })

    const { runContractFunction: tokenURI } = useWeb3Contract({
        abi: abi,
        contractAddress: gachaAddress,
        functionName: "tokenURI",
        params: { tokenId: tokenCount },
    })

    async function updateValue() {
        const price = await getPrice();
        setCasePrice(price.toString());
        const totalCase = Number((await getNumCase())._hex);
        setNumCase(totalCase);
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateValue();
        }
    }, [isWeb3Enabled])

    const newNotification = () => {
        dispatch({
            type: "Info",
            message: "Buy Success",
            title: "Transaction Notification",
            position: "topR",
        })
    }

    const handleSuccess_pay = async (tx) => {
        try {
            await tx.wait(1);
            updateValue();
            newNotification(tx)
        } catch (error) {
            console.log(error)
        }
    }

    const handleSuccess_open = async (tx) => {
        try {
            const txResponse = await tx.wait(1);
            const RID = txResponse.events[1].args[0];
            setReqID(RID);
            await fulfillRandomWords();
            const token = await getTokenCounter().toString();
            setTokenCount(token);
            const _tokenURI = await tokenURI();
            console.log(_tokenURI);
            updateValue();
            newNotification(tx)
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="p-5">
            {gachaAddress ? (
                <>
                    <button
                        onClick={async () =>
                            await payCase({
                                // onComplete:
                                // onError:
                                onSuccess: handleSuccess_pay,
                                onError: (error) => console.log(error),
                            })
                        }
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            "Buy"
                        )}
                    </button>
                    <button
                        onClick={async () =>
                            await openCase({
                                // onComplete:
                                // onError:
                                onSuccess: handleSuccess_open,
                                onError: (error) => console.log(error),
                            })
                        }
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            "Open"
                        )}
                    </button>
                    <div>Case price: {ethers.utils.formatUnits(casePrice, "ether")} ETH</div>

                    <div>Case that the player has is: {numCase}</div>
                </>
            ) : (
                <div>Please connect to a supported chain </div>
            )}
        </div>
    )
}