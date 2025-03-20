"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/contexts/WalletContext";
import { Check, LogOut, User } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CypherpunkProfileButton } from '@/components/CypherpunkProfileButton';

export const WalletConnect = () => {
    const { isConnected, address, connect, disconnect, ensName } = useWalletContext();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            await connect();
        } catch (error) {
            console.error("Error de conexión:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        router.push('/');
    };

    return (
        <div className="wallet-status text-xs flex items-center justify-end">
            {isConnected ? (
                <div className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-[var(--matrix-green)]" />
                    <div>
                        {ensName ? (
                            <span>{ensName}</span>
                        ) : (
                            <span className="font-mono">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                        )}
                    </div>
                    <CypherpunkProfileButton />
                    <Button
                        onClick={handleDisconnect}
                        className="bg-[#441111] hover:bg-[#661111] text-white text-xs py-1 px-2 h-auto flex items-center space-x-1 border border-red-500"
                    >
                        <LogOut className="h-4 w-4" /> <span>Exit</span>
                    </Button>
                </div>
            ) : (
                <Button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="bg-black border-2 border-[var(--matrix-green)] text-[var(--matrix-green)] hover:bg-[#001800] transition-colors text-xs py-1 h-auto w-full md:w-auto px-4"
                >
                    {isLoading ? "Connecting..." : "Connection"}
                </Button>
            )}
        </div>
    );
};