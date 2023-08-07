import React, { useState, useEffect } from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useNotification } from "web3uikit";
import { contractAddresses, abi, abiVRF } from "../constants";
import { ethers } from "ethers";

export default function Buy() {
    const { chainId: chainIdHex, account, isWeb3Enabled } = useMoralis();
    const chainId = parseInt(chainIdHex);
    const gachaAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const mockAddress = chainId in contractAddresses ? contractAddresses[chainId][1] : null
    const [casePrice, setCasePrice] = useState("0");
    const [numCase, setNumCase] = useState("0");
    const [tokenCount, setTokenCount] = useState("");
    const [reqID, setReqId] = useState("");
    const [result, setResult] = useState("");

    const dispatch = useNotification();

    //1. Call function from smartcontract

    const { runContractFunction: payCase } = useWeb3Contract(
        {
            abi: abi,
            contractAddress: gachaAddress,
            functionName: "payCase",
            msgValue: casePrice,
            params: {},
        }
    )
    const { runContractFunction: openCase, data, isLoading, isFetching } = useWeb3Contract(
        {
            abi: abi,
            contractAddress: gachaAddress,
            functionName: "openCase",
            params: {},
        }
    )

    const { runContractFunction: fulfillRandomWords } = useWeb3Contract({
        abi: abiVRF,
        contractAddress: mockAddress,
        functionName: "fulfillRandomWords",
        params: { _requestId: reqID, _consumer: gachaAddress }
    })

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
        params: { tokenId: tokenCount - 1 },
    })

    async function updateValue() {
        const price = await getPrice();
        setCasePrice(price.toString());
        const totalCase = Number((await getNumCase())._hex);
        setNumCase(totalCase);
    }

    // function getRID() {
    //     useEffect(() => {
    //     }, [reqID]);
    // }

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
            const RID = Number((txResponse.events[1].args[0])._hex).toString();
            setReqId(RID);
            console.log(reqID);
            // getRID();
            await fulfillRandomWords();
            const token = await getTokenCounter();
            setTokenCount(token.toString());
            console.log(tokenCount);
            const _tokenURI = await tokenURI();
            setResult(_tokenURI);
            updateValue();
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
    }, [tokenCount]);

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
                                // onComplete:,
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
                    <div>Result: {result}</div>
                </>
            ) : (
                <div>Please connect to a supported chain </div>
            )
            }
        </div >
    )
}