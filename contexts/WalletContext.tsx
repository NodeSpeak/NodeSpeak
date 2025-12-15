"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { BrowserProvider, JsonRpcProvider } from "ethers";
import { toast } from 'sonner';

// Arbitrum One network configuration
const ARBITRUM_CHAIN_ID = "0xa4b1"; // 42161 in hex
const ARBITRUM_NETWORK = {
    chainId: ARBITRUM_CHAIN_ID,
    chainName: "Arbitrum One",
    nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
    },
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://arbiscan.io"],
};

// Storage key for wallet persistence
const WALLET_STORAGE_KEY = "nodespeak_wallet_connected";

// Connection result types
export type ConnectionResult = 
    | { success: true; address: string }
    | { success: false; reason: 'no_wallet' | 'user_rejected' | 'chain_rejected' | 'error'; message?: string };

interface WalletContextProps {
    isConnected: boolean;
    address: string | null;
    ensName: string | null;
    connect: () => Promise<ConnectionResult>;
    disconnect: () => void;
    provider: BrowserProvider | null;
    isReconnecting: boolean;
    hasWallet: boolean;
    checkWalletAvailability: () => boolean;
}

const WalletContext = createContext<WalletContextProps>({
    isConnected: false,
    address: null,
    ensName: null,
    connect: async () => ({ success: false, reason: 'no_wallet' }),
    disconnect: () => {},
    provider: null,
    isReconnecting: false,
    hasWallet: false,
    checkWalletAvailability: () => false,
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [address, setAddress] = useState<string | null>(null);
    const [ensName, setEnsName] = useState<string | null>(null);
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [hasWallet, setHasWallet] = useState(false);
    const reconnectAttempted = useRef(false);

    // Check wallet availability (simple and robust detection)
    const checkWalletAvailability = useCallback((): boolean => {
        if (typeof window === "undefined") return false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return !!(window.ethereum || (window as any).web3);
    }, []);

    // Update hasWallet state on mount and window focus
    useEffect(() => {
        const updateWalletStatus = () => {
            setHasWallet(checkWalletAvailability());
        };
        
        updateWalletStatus();
        
        // Re-check when window gains focus (user might have installed wallet)
        window.addEventListener('focus', updateWalletStatus);
        
        return () => {
            window.removeEventListener('focus', updateWalletStatus);
        };
    }, [checkWalletAvailability]);

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

    // Helper to get the ethereum provider
    const getEthereumProvider = useCallback((): EthereumProvider | null => {
        if (typeof window === "undefined" || !window.ethereum) {
            return null;
        }

        let selectedProvider = window.ethereum as EthereumProvider;

        if (window.ethereum.providers) {
            selectedProvider =
                window.ethereum.providers.find((prov) => prov.isMetaMask) || selectedProvider;
        }

        return selectedProvider;
    }, []);

    // Reconnect wallet silently (used on page load)
    const reconnectWallet = useCallback(async () => {
        if (reconnectAttempted.current) return;
        reconnectAttempted.current = true;

        const wasConnected = localStorage.getItem(WALLET_STORAGE_KEY);
        if (!wasConnected) return;

        const selectedProvider = getEthereumProvider();
        if (!selectedProvider) return;

        setIsReconnecting(true);

        try {
            // Use eth_accounts (doesn't prompt user) instead of eth_requestAccounts
            const accounts = await selectedProvider.request({ method: "eth_accounts" });

            if (accounts && accounts.length > 0) {
                // Verify we're on the correct chain
                const chainId = await selectedProvider.request({ method: "eth_chainId" });

                if (chainId === ARBITRUM_CHAIN_ID) {
                    setAddress(accounts[0]);
                    const prov = new BrowserProvider(selectedProvider);
                    setProvider(prov);
                    await resolveEns(accounts[0]);
                } else {
                    // Try to switch to Arbitrum silently
                    try {
                        await selectedProvider.request({
                            method: "wallet_switchEthereumChain",
                            params: [{ chainId: ARBITRUM_CHAIN_ID }],
                        });
                        setAddress(accounts[0]);
                        const prov = new BrowserProvider(selectedProvider);
                        setProvider(prov);
                        await resolveEns(accounts[0]);
                    } catch {
                        // User rejected or chain not available, clear storage
                        localStorage.removeItem(WALLET_STORAGE_KEY);
                    }
                }
            } else {
                // No accounts available, user disconnected from wallet
                localStorage.removeItem(WALLET_STORAGE_KEY);
            }
        } catch (error) {
            console.warn("Error reconnecting wallet:", error);
            localStorage.removeItem(WALLET_STORAGE_KEY);
        } finally {
            setIsReconnecting(false);
        }
    }, [getEthereumProvider]);

    const connect = async (): Promise<ConnectionResult> => {
        // Re-check wallet availability before connecting
        const walletAvailable = checkWalletAvailability();
        setHasWallet(walletAvailable);

        if (!walletAvailable) {
            return { success: false, reason: 'no_wallet' };
        }

        const selectedProvider = getEthereumProvider();

        if (!selectedProvider) {
            return { success: false, reason: 'no_wallet' };
        }

        try {
            const accounts = await selectedProvider.request({ method: "eth_requestAccounts" });

            // Switch to Arbitrum network
            try {
                await selectedProvider.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: ARBITRUM_CHAIN_ID }],
                });
            } catch (switchError: unknown) {
                const error = switchError as { code?: number };
                // User rejected the chain switch
                if (error.code === 4001) {
                    return { success: false, reason: 'chain_rejected' };
                }
                // If the chain is not added, add it
                if (error.code === 4902) {
                    try {
                        await selectedProvider.request({
                            method: "wallet_addEthereumChain",
                            params: [ARBITRUM_NETWORK],
                        });
                    } catch (addError: unknown) {
                        const addErr = addError as { code?: number };
                        if (addErr.code === 4001) {
                            return { success: false, reason: 'chain_rejected' };
                        }
                        throw addError;
                    }
                } else {
                    throw switchError;
                }
            }

            setAddress(accounts[0]);

            const prov = new BrowserProvider(selectedProvider);
            setProvider(prov);

            // Save connection state to localStorage for persistence
            localStorage.setItem(WALLET_STORAGE_KEY, "true");

            // Resolver ENS después de conectar
            await resolveEns(accounts[0]);

            return { success: true, address: accounts[0] };
        } catch (error: unknown) {
            const err = error as { code?: number; message?: string };
            console.error("Error al conectar la wallet:", error);
            
            // User rejected the connection request
            if (err.code === 4001) {
                return { success: false, reason: 'user_rejected' };
            }
            
            return { 
                success: false, 
                reason: 'error', 
                message: err.message || 'Error desconocido' 
            };
        }
    };

    const disconnect = () => {
        setAddress(null);
        setProvider(null);
        setEnsName(null);
        localStorage.removeItem(WALLET_STORAGE_KEY);
    };

    // Auto-reconnect on mount
    useEffect(() => {
        reconnectWallet();
    }, [reconnectWallet]);

    // Listen for account changes
    useEffect(() => {
        if (typeof window === "undefined" || !window.ethereum) return;

        const handleAccountsChanged = async (accounts: string[]) => {
            if (accounts.length === 0) {
                setAddress(null);
                setEnsName(null);
                setProvider(null);
                localStorage.removeItem(WALLET_STORAGE_KEY);
            } else {
                setAddress(accounts[0]);
                await resolveEns(accounts[0]);
            }
        };

        const handleChainChanged = () => {
            // Reload to ensure consistent state on chain change
            window.location.reload();
        };

        window.ethereum.on?.("accountsChanged", handleAccountsChanged);
        window.ethereum.on?.("chainChanged", handleChainChanged);

        return () => {
            window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
            window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
        };
    }, []);

    return (
        <WalletContext.Provider
            value={{
                isConnected: !!address,
                address,
                ensName,
                connect,
                disconnect,
                provider,
                isReconnecting,
                hasWallet,
                checkWalletAvailability,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWalletContext = () => useContext(WalletContext);