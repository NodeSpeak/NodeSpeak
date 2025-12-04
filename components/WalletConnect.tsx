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
        <div className="text-xs flex items-center justify-end">
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
                    className="inline-flex items-center justify-center rounded-full bg-sky-100 text-sky-800 border border-sky-200 hover:bg-sky-200 transition-colors text-xs font-medium px-5 py-2 h-auto shadow-sm"
                >
                    {isLoading ? "Connecting..." : "Connection"}
                </Button>
            )}
        </div>
    );
};