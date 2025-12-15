"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Copy, Check, ArrowLeft, Sparkles, Shield, Globe, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WalletConnect } from "@/components/WalletConnect";
import { useWalletContext } from "@/contexts/WalletContext";
import { toast } from "sonner";

interface WalletAddress {
    name: string;
    address: string;
}

const cryptoAddresses: WalletAddress[] = [
    { name: "nodespeak.eth", address: "nodespeak.eth" },
    { name: "cristino.eth", address: "cristino.eth" },
    { name: "berty.eth", address: "berty.eth" },
];

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success("Address copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy address");
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="Copy address"
        >
            {copied ? (
                <Check className="w-4 h-4 text-green-500" />
            ) : (
                <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            )}
        </button>
    );
}

export default function DonatePage() {
    const { isConnected } = useWalletContext();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <header className="mb-12">
                    <div className="flex justify-between items-center">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-200 dark:shadow-sky-900/50">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                                Node Speak
                            </h1>
                        </Link>
                        <div className="flex items-center gap-4">
                            <LanguageSwitcher />
                            <ThemeToggle />
                            <WalletConnect />
                        </div>
                    </div>
                </header>

                {/* Back Button */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>

                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-xl shadow-rose-200 dark:shadow-rose-900/50 mb-6">
                        <Heart className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                        Support NodeSpeak
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Help us build the future of decentralized communities
                    </p>
                </div>

                {/* Mission Section */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 dark:border-slate-700 p-8 md:p-10 mb-8">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                            NodeSpeak is an independent, community-driven, open-source project developed by a small team with the goal of returning control over digital spaces to communities.
                        </p>
                        <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                            The project is grounded in the principles of <strong className="text-slate-900 dark:text-slate-100">freedom of expression</strong>, <strong className="text-slate-900 dark:text-slate-100">open governance</strong>, and <strong className="text-slate-900 dark:text-slate-100">digital sovereignty</strong>. Community support is essential to its continuity and growth. Contributions make it possible to advance development, security audits, and ongoing improvements.
                        </p>
                        <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                            External support ensures that the project remains open, transparent, and aligned with its founding values.
                        </p>
                    </div>

                    {/* Values Icons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-8 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Security Audits</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Smart contract reviews</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Infrastructure</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Servers & hosting</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                                <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Development</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">New features & fixes</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cryptocurrency Section */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 dark:border-slate-700 p-8 md:p-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                Cryptocurrency Contributions
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">Ethereum / EVM Compatible</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {cryptoAddresses.map((wallet) => (
                            <div
                                key={wallet.name}
                                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                        {wallet.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{wallet.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{wallet.address}</p>
                                    </div>
                                </div>
                                <CopyButton text={wallet.address} />
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            <strong>Note:</strong> These are ENS names that resolve to Ethereum addresses. You can send ETH, USDC, DAI, or any ERC-20 token on Ethereum mainnet or compatible L2 networks like Arbitrum, Optimism, or Base.
                        </p>
                    </div>
                </div>

                {/* Thank You Section */}
                <div className="text-center mt-12 mb-8">
                    <p className="text-slate-600 dark:text-slate-400">
                        Thank you for supporting open-source development and decentralized communities.
                    </p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                        Every contribution makes a difference. 💜
                    </p>
                </div>

                {/* Footer */}
                <footer className="text-center py-8 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        NodeSpeak © {new Date().getFullYear()} · Built with ❤️ by the community
                    </p>
                </footer>
            </div>
        </div>
    );
}
