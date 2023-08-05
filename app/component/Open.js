import React, { useState, useEffect } from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useNotification } from "web3uikit";
import { contractAddresses, abi } from "../constants";
import { ethers } from "ethers";

export default function Open() {
    const { chainId: chainIdHex } = useMoralis();
    const chainId = parseInt(chainIdHex);
    const gachaAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const dispatch = useNotification();

    const { runContractFunction: openCase,
        isLoading, isFetching } = useWeb3Contract(
            {
                abi: abi,
                contractAddress: gachaAddress,
                functionName: "openCase",
                params: {}
            }
        )

    const { runContractFunction: getNumCase } = useWeb3Contract({
        abi: abi,
        contractAddress: gachaAddress,
        functionName: "getNumCase",
        params: { idx: account.toString() }
    })
    async function updateValue() {
        const price = await getPrice();
        setCasePrice(price.toString());
        const totalCase = Number((await getNumCase())._hex);
        console.log(Number(totalCase));
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

    const handleSuccess = async (tx) => {
        try {
            await tx.wait(1)
            updatePrice();
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
                            await openCase({
                                // onComplete:
                                // onError:
                                onSuccess: handleSuccess,
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
                </>
            ) : (
                <div>Please connect to a supported chain </div>
            )}
        </div>
    )
}