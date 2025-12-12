"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/contexts/WalletContext";
import { Check, LogOut, User } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AddressText } from "@/components/AddressDisplay";
// import { CypherpunkProfileButton } from '@/components/CypherpunkProfileButton';

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
        <div className="text-sm flex items-center justify-end">
            {isConnected ? (
                <div className="flex items-center space-x-3">
                    <Link
                        href="/profile"
                        className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200"
                    >
                        <Check className="h-3 w-3" />
                        <span className="font-medium">
                            {ensName ? ensName : <AddressText value={address || ''} autoResponsive />}
                        </span>
                    </Link>
                    <Button
                        onClick={handleDisconnect}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-xs py-1.5 px-3 h-auto flex items-center space-x-1 border border-red-200 rounded-full transition-colors"
                    >
                        <LogOut className="h-3 w-3" /> <span>Exit</span>
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