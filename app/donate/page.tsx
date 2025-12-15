"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, Check, ArrowLeft, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WalletConnect } from "@/components/WalletConnect";
import { HeartOutline } from "@/components/ui/HeartOutline";
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
                            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-700 flex items-center justify-center shadow">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100">
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
                    <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                        Support NodeSpeak
                    </h1>
                    <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Help advance an open, community‑governed platform for decentralized communities.
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
                </div>

                {/* Cryptocurrency Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 md:p-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                            <svg className="w-5 h-5 text-slate-700 dark:text-slate-200" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                Cryptocurrency Contributions
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">Ethereum / EVM compatible</p>
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

                    <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                            <strong>Note:</strong> These are ENS names that resolve to Ethereum addresses. You may send ETH, USDC, DAI, or other ERC‑20 tokens on Ethereum mainnet or compatible L2 networks (e.g., Arbitrum, Optimism, Base).
                        </p>
                    </div>
                </div>

                {/* Thank You Section */}
                <div className="text-center mt-12 mb-8">
                    <p className="text-slate-600 dark:text-slate-400">
                        Thank you for supporting open‑source development and decentralized communities.
                    </p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                        Every contribution helps sustain the project.
                    </p>
                </div>

                {/* Footer */}
                <footer className="text-center py-8 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        NodeSpeak © {new Date().getFullYear()} · Built with <HeartOutline size={12} className="mx-1 align-[-1px]" /> by the community
                    </p>
                </footer>
            </div>
        </div>
    );
}
