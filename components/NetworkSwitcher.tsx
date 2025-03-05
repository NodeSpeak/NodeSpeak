"use client";
import React, { useEffect } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';

const NetworkSwitcher = () => {
  const { isConnected, isGnosisChain, switchToGnosis, chainId } = useWalletContext();

  // Intenta cambiar automáticamente a Gnosis al montar el componente
  useEffect(() => {
    if (isConnected && !isGnosisChain) {
      console.log("Red incorrecta detectada, cambiando a Gnosis...");
      console.log("ChainId actual:", chainId);
      switchToGnosis();
    }
  }, [isConnected, isGnosisChain, chainId, switchToGnosis]);

  if (isConnected && !isGnosisChain) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-3 text-center z-50 shadow-lg">
        <p className="font-bold text-lg mb-1">Red incorrecta: {chainId}</p>
        <p className="mb-2">Esta aplicación requiere Gnosis Chain (ID: 0x64)</p>
        <button 
          onClick={switchToGnosis}
          className="bg-white text-red-600 px-4 py-2 rounded font-bold hover:bg-gray-100 transition-colors"
        >
          Cambiar a Gnosis Chain
        </button>
      </div>
    );
  }
  return null;
};

export default NetworkSwitcher;