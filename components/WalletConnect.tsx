"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/contexts/WalletContext";
import { Check, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import router from "next/router";

export const WalletConnect = () => {
    const { isConnected, address, connect, disconnect, ensName } = useWalletContext();
    const [isLoading, setIsLoading] = useState(false);

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            await connect();
            router.push('/foro'); // Redirección después de conectar
        } catch (error) {
            console.error("Error de conexión:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="wallet-status text-xs flex items-center justify-end min-w-[200px]">
            {isConnected ? (
                <div className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-[#00ff41]" />
                    <div>
                        {ensName ? (
                            <span>{ensName}</span>
                        ) : (
                            <span className="font-mono">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>)}
                    </div>
                    <Button
                        onClick={disconnect}
                        className="bg-red-500 text-white text-xs py-1 px-2 h-auto flex items-center space-x-1"
                    >
                        <LogOut className="h-4 w-4" /> <span>Exit</span>
                    </Button>
                </div>
            ) : (
                <Button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="bg-transparent border border-[#00ff41] text-[#00ff41] hover:bg-[#003b00] transition-colors text-xs py-1 h-auto"
                >
                    {isLoading ? "Connecting..." : "Connection"}
                </Button>
            )}
        </div>
    );
};
