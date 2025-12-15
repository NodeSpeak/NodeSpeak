"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/contexts/WalletContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, LogOut, ChevronDown, Copy, ExternalLink, RefreshCw, User } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WalletOnboardingModal } from "@/components/WalletOnboardingModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const WalletConnect = () => {
    const { isConnected, address, connect, disconnect, ensName, hasWallet } = useWalletContext();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const router = useRouter();

    const handleConnect = async () => {
        // Clear any previous feedback
        setFeedbackMessage(null);

        // If no wallet detected, show onboarding modal
        if (!hasWallet) {
            setShowOnboarding(true);
            return;
        }

        setIsLoading(true);
        try {
            const result = await connect();

            if (!result.success) {
                switch (result.reason) {
                    case 'no_wallet':
                        // Re-check failed, show onboarding
                        setShowOnboarding(true);
                        break;
                    case 'user_rejected':
                        setFeedbackMessage(t("wallet.connectAnytime"));
                        toast.info(t("wallet.connectAnytime"));
                        break;
                    case 'chain_rejected':
                        setFeedbackMessage(t("wallet.connectAnytime"));
                        toast.info(t("wallet.connectAnytime"));
                        break;
                    default:
                        toast.error(t("wallet.connectionError"));
                        break;
                }
            }
        } catch (error) {
            console.error("Connection error:", error);
            toast.error(t("wallet.connectionError"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        router.push('/');
    };

    const handleCopyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            toast.success(t("common.copied"));
        }
    };

    const handleViewOnExplorer = () => {
        if (address) {
            window.open(`https://arbiscan.io/address/${address}`, '_blank');
        }
    };

    // Format address for display: 0x8831...e9eb
    const formatAddress = (addr: string): string => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <>
            <div className="text-sm flex items-center justify-end">
                {isConnected ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-md">
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse" />
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                    {ensName ? ensName : formatAddress(address || '')}
                                </span>
                                <ChevronDown className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                            align="end" 
                            className="w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-2xl p-1.5"
                        >
                            {/* Profile Link */}
                            <DropdownMenuItem asChild className="rounded-xl">
                                <Link href="/profile" className="flex items-center gap-3 cursor-pointer px-3 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/30">
                                        <User className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                    </div>
                                    <span className="font-medium">{t("nav.profile")}</span>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1.5 bg-slate-200 dark:bg-slate-700" />

                            {/* Copy Address */}
                            <DropdownMenuItem 
                                onClick={handleCopyAddress} 
                                className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                                    <Copy className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">{t("nav.copyAddress")}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                        {address ? formatAddress(address) : ''}
                                    </span>
                                </div>
                            </DropdownMenuItem>

                            {/* View on Explorer */}
                            <DropdownMenuItem 
                                onClick={handleViewOnExplorer} 
                                className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                                    <ExternalLink className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                </div>
                                <span className="font-medium">{t("nav.viewOnExplorer")}</span>
                            </DropdownMenuItem>

                            {/* Change Wallet */}
                            <DropdownMenuItem 
                                onClick={() => {
                                    disconnect();
                                    setTimeout(handleConnect, 100);
                                }}
                                className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                                    <RefreshCw className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                </div>
                                <span className="font-medium">{t("nav.changeWallet")}</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1.5 bg-slate-200 dark:bg-slate-700" />

                            {/* Disconnect */}
                            <DropdownMenuItem 
                                onClick={handleDisconnect} 
                                className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:text-red-600 dark:focus:text-red-400"
                            >
                                <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
                                    <LogOut className="h-4 w-4" />
                                </div>
                                <span className="font-medium">{t("nav.disconnect")}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="flex flex-col items-end gap-1.5">
                        <Button
                            onClick={handleConnect}
                            disabled={isLoading}
                            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-medium px-5 py-2.5 h-auto shadow-lg shadow-sky-200 dark:shadow-sky-900/30 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                    {t("nav.connecting")}
                                </>
                            ) : (
                                t("nav.connect")
                            )}
                        </Button>
                        {feedbackMessage && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] text-right leading-tight">
                                {feedbackMessage}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Onboarding Modal for users without wallet */}
            <WalletOnboardingModal 
                open={showOnboarding} 
                onOpenChange={setShowOnboarding} 
            />
        </>
    );
};