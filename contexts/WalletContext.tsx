"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

// Usamos la definición global de EthereumProvider que ya tienes definida

// Constantes para Gnosis Chain
const GNOSIS_CHAIN_ID = "0x64"; // 100 en hexadecimal

interface WalletContextProps {
  isConnected: boolean;
  address: string | null;
  ensName: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  provider: BrowserProvider | null;
  chainId: string | null;
  switchToGnosis: () => Promise<void>;
  isGnosisChain: boolean;
  isNetworkReady: boolean; // Nueva propiedad para indicar si la red es la correcta
}

const WalletContext = createContext<WalletContextProps>({
  isConnected: false,
  address: null,
  ensName: null,
  connect: async () => {},
  disconnect: () => {},
  provider: null,
  chainId: null,
  switchToGnosis: async () => {},
  isGnosisChain: false,
  isNetworkReady: false,
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  
  // Verificar si estamos en Gnosis Chain
  const isGnosisChain = chainId === GNOSIS_CHAIN_ID;
  const isNetworkReady = !!address && isGnosisChain;

  // Resolver ENS
  const resolveEns = async (addr: string, prov: BrowserProvider) => {
    try {
      const name = await prov.lookupAddress(addr);
      setEnsName(name);
    } catch (error) {
      console.warn("Error al resolver ENS:", error);
      setEnsName(null);
    }
  };

  // Función para cambiar a la red Gnosis
  const switchToGnosis = async () => {
    if (!window.ethereum) return;
    
    try {
      // Intentar cambiar a la red Gnosis si ya está configurada
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: GNOSIS_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // Si la red no está configurada (error 4902), agregarla
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: GNOSIS_CHAIN_ID,
              chainName: "Gnosis Chain",
              nativeCurrency: {
                name: "xDai",
                symbol: "xDAI",
                decimals: 18,
              },
              rpcUrls: ["https://rpc.gnosischain.com"],
              blockExplorerUrls: ["https://gnosisscan.io/"],
            }],
          });
        } catch (addError) {
          console.error("Error al agregar Gnosis Chain:", addError);
        }
      } else {
        console.error("Error al cambiar a Gnosis Chain:", switchError);
      }
    }
  };

  // Función para verificar y actualizar el estado de la cadena
  const updateChainStatus = async (provider: EthereumProvider) => {
    try {
      const chainIdHex = await provider.request({ method: "eth_chainId" });
      setChainId(chainIdHex);
      
      // Si no estamos en Gnosis, sugerir cambio automáticamente
      if (chainIdHex !== GNOSIS_CHAIN_ID) {
        console.warn("No estás en Gnosis Chain. Se requiere cambiar de red.");
      }
    } catch (error) {
      console.error("Error al obtener chainId:", error);
    }
  };

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Por favor instala MetaMask u otra wallet compatible con Web3");
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
      // Desconectar cualquier conexión existente primero
      disconnect();
      
      const accounts = await selectedProvider.request({ method: "eth_requestAccounts" });
      
      // Verificar la red actual
      await updateChainStatus(selectedProvider);
      
      setAddress(accounts[0]);
      const prov = new BrowserProvider(selectedProvider as any);
      setProvider(prov);
      
      // Resolver ENS después de conectar
      await resolveEns(accounts[0], prov);
    } catch (error) {
      console.error("Error al conectar la wallet:", error);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setProvider(null);
    setEnsName(null);
    setChainId(null);
    sessionStorage.removeItem("wallet_connected");
  };

  // Efecto para monitorear cambios en la wallet
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (address !== accounts[0] && provider) {
          setAddress(accounts[0]);
          await resolveEns(accounts[0], provider);
        }
      };

      const handleChainChanged = async (newChainId: string) => {
        setChainId(newChainId);
        
        // Si cambia la cadena, actualizar el proveedor
        if (window.ethereum && address) {
          const prov = new BrowserProvider(window.ethereum as any);
          setProvider(prov);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      // Al montar, intentar recuperar el estado actual
      if (window.ethereum) {
        window.ethereum.request({ method: "eth_accounts" })
          .then(async (accounts: string[]) => {
            if (accounts.length > 0) {
              await updateChainStatus(window.ethereum as EthereumProvider);
              setAddress(accounts[0]);
              const prov = new BrowserProvider(window.ethereum as any);
              setProvider(prov);
              await resolveEns(accounts[0], prov);
            }
          })
          .catch(console.error);
      }

      // Limpieza al desmontar
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [address]);

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!address,
        address,
        ensName,
        connect,
        disconnect,
        provider,
        chainId,
        switchToGnosis,
        isGnosisChain,
        isNetworkReady,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => useContext(WalletContext);