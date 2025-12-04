"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserProvider, JsonRpcProvider } from "ethers";

interface WalletContextProps {
    isConnected: boolean;
    address: string | null;
    ensName: string | null; // Agregamos ENS
    connect: () => Promise<void>;
    disconnect: () => void;
    provider: BrowserProvider | null;
}

const WalletContext = createContext<WalletContextProps>({
    isConnected: false,
    address: null,
    ensName: null, // Valor inicial para ENS
    connect: async () => {},
    disconnect: () => {},
    provider: null,
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [address, setAddress] = useState<string | null>(null);
    const [ensName, setEnsName] = useState<string | null>(null);
    const [provider, setProvider] = useState<BrowserProvider | null>(null);

    // Función para resolver ENS usando mainnet (ENS vive en Ethereum mainnet)
    const resolveEns = async (addr: string) => {
        try {
            // Usar un provider público de Ethereum mainnet para resolver ENS
            const mainnetProvider = new JsonRpcProvider("https://eth.llamarpc.com");
            const name = await mainnetProvider.lookupAddress(addr);
            setEnsName(name);
        } catch (error) {
            console.warn("Error al resolver ENS:", error);
            setEnsName(null);
        }
    };

    const connect = async () => {
        if (typeof window === "undefined" || !window.ethereum) {
            alert("Please install MetaMask, Trust or use other Web3 wallet");
            return;
        }

        let selectedProvider = window.ethereum as EthereumProvider;

        if (window.ethereum.providers) {
            selectedProvider =
                window.ethereum.providers.find((prov) => prov.isMetaMask) || selectedProvider;
        }

        if (!selectedProvider) {
            alert("Por favor, instala MetaMask o habilita un proveedor compatible.");
            return;
        }

        try {
            const accounts = await selectedProvider.request({ method: "eth_requestAccounts" });

            setAddress(accounts[0]);

            const prov = new BrowserProvider(selectedProvider);
            setProvider(prov);

            // Resolver ENS después de conectar
            await resolveEns(accounts[0]);
        } catch (error) {
            console.error("Error al conectar la wallet:", error);
        }
    };

    const disconnect = () => {
        setAddress(null);
        setProvider(null);
        setEnsName(null); // Limpiar ENS al desconectar
        sessionStorage.removeItem("wallet_connected");
    };

    useEffect(() => {
        if (provider && window.ethereum) {
            window.ethereum.on?.("accountsChanged", async (accounts: string[]) => {
                if (accounts.length === 0) {
                    setAddress(null);
                    setEnsName(null);
                } else {
                    setAddress(accounts[0]);
                    // Actualizar ENS cuando cambia la cuenta
                    await resolveEns(accounts[0]);
                }
            });
        }
    }, [provider]);

    return (
        <WalletContext.Provider
            value={{
                isConnected: !!address,
                address,
                ensName,
                connect,
                disconnect,
                provider,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWalletContext = () => useContext(WalletContext);