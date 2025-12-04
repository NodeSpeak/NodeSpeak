"use client";
import React, { useState, useEffect, useRef } from "react";
import { Github, X, Mail } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";
import { useWalletContext } from "@/contexts/WalletContext";
import { useRouter } from 'next/navigation';
import siteConfig from "@/config";

function MatrixRain() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="matrix-rain absolute inset-0" aria-hidden="true" />
        </div>
    );
}

function TypingEffect({ text }: { text: string }) {
    const [displayedText, setDisplayedText] = useState("");
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Función para agregar caracteres uno por uno
        const typeText = (currentIndex: number) => {
            if (currentIndex <= text.length) {
                setDisplayedText(text.substring(0, currentIndex));

                // Programar el siguiente carácter
                timeoutRef.current = setTimeout(() => {
                    typeText(currentIndex + 1);
                }, 50);
            }
        };

        // Limpiar timeout previo y estado
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setDisplayedText("");

        // Iniciar el efecto de escritura
        typeText(0);

        // Limpiar al desmontar o cuando cambie el texto
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [text]);

    return (
        <span className="after:content-['_'] animate-blink">
            {displayedText}
        </span>
    );
}

function Landing() {
    const { isConnected } = useWalletContext();
    const router = useRouter();

    // Efecto para redirigir cuando isConnected cambia
    useEffect(() => {
        if (isConnected) {
            router.push('/foro');
        }
    }, [isConnected, router]);

    // Si está conectado, podemos mostrar un mensaje de carga mientras redirige
    if (isConnected) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff] flex items-center justify-center">
                <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 px-8 py-10 text-center">
                    <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase mb-3">
                        Redirecting
                    </p>
                    <p className="text-lg font-medium text-slate-800 mb-2">
                        Taking you to the forum…
                    </p>
                    <p className="text-sm text-slate-500">
                        <TypingEffect text="Loading your decentralized space" />
                    </p>
                </div>
            </div>
        );
    }

    // Si no está conectado, muestra la landing principal con estilo claro
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff] text-slate-900">
            <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
                <header className="flex items-center justify-between mb-10">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold tracking-[0.25em] text-slate-500 uppercase">
                            Arbitrum Social
                        </p>
                        <h1 className="text-xl font-semibold text-slate-900">Node Speak v3.0</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden md:inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 border border-sky-200">
                            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                            Now live on Arbitrum One
                        </span>
                        <WalletConnect />
                    </div>
                </header>

                <main className="grid gap-8 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)] items-start">
                    <section className="space-y-6">
                        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 px-8 py-10">
                            <p className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 border border-sky-200 mb-6">
                                Now live on Arbitrum One
                            </p>
                            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-4">
                                A calm social space for decentralized communities.
                            </h2>
                            <p className="text-sm md:text-base text-slate-600 max-w-xl mb-7">
                                NodeSpeak helps onchain collectives host conversations, showcase projects, and reward contributorsall within a single interface fully backed by smart contracts.
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mb-8">
                                <button className="inline-flex items-center justify-center rounded-full bg-emerald-900 px-4 py-2 text-xs font-medium text-emerald-100 shadow-sm shadow-emerald-500/40 border border-emerald-700">
                                    Connection
                                </button>
                                <button className="text-xs font-medium text-slate-800 hover:text-slate-900 underline-offset-4 hover:underline">
                                    Explore the forum 																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3 text-sm">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                    <p className="font-medium text-slate-900 mb-1">Communities</p>
                                    <p className="text-slate-500 text-xs">
                                        Create and grow tokenless or gated communities.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                    <p className="font-medium text-slate-900 mb-1">Posts & Threads</p>
                                    <p className="text-slate-500 text-xs">
                                        Rich TipTap editor publishing straight to IPFS.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                    <p className="font-medium text-slate-900 mb-1">Admin Mode</p>
                                    <p className="text-slate-500 text-xs">
                                        Moderate, curate, and protect spaces in one interface.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200 border border-slate-100 px-6 py-5 flex flex-col gap-4">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase mb-2">
                                    Why builders choose NodeSpeak
                                </p>
                                <p className="text-xs text-slate-600">
                                    Every interaction is backed by Arbitrum smart contracts. Wallet identities, moderation tools, community joins, and reactions stay verifiable. UI layers get prettier, the underlying trust stays intact.
                                </p>
                            </div>
                        </div>
                    </aside>
                </main>

                <footer className="mt-12 border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <p className="text-[11px]">
                        © {new Date().getFullYear()} NodeSpeak. Built for decentralized communities.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <a
                            href="https://github.com/NodeSpeak/NodeSpeakv1.1-main"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full bg-slate-900 text-slate-50 px-3 py-1 font-medium hover:bg-black transition-colors"
                        >
                            <Github className="w-3 h-3 mr-1" />
                            GitHub
                        </a>
                        <a
                            href="https://twitter.com/NodeSpeak"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full bg-slate-100 text-slate-800 px-3 py-1 font-medium hover:bg-slate-200 transition-colors"
                        >
                            <X className="w-3 h-3 mr-1" />
                            @NodeSpeak
                        </a>
                        <a
                            href="mailto:support@nodespeak.xyz"
                            className="inline-flex items-center rounded-full bg-slate-100 text-slate-800 px-3 py-1 font-medium hover:bg-slate-200 transition-colors"
                        >
                            <Mail className="w-3 h-3 mr-1" />
                            Support
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default Landing;