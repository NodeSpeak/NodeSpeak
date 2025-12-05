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
            <div className="max-w-7xl mx-auto px-8 pt-12 pb-20">
                <header className="flex items-center justify-between mb-16">
                    <h1 className="text-2xl font-semibold text-slate-900">Node Speak v3.3</h1>
                    <div className="flex items-center gap-4">
                        <WalletConnect />
                    </div>
                </header>

                <main className="grid gap-10 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)] items-start">
                    <section className="space-y-6">
                        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 px-10 py-12">
                            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-6">
                                The Decentralized and Immutable Forum
                            </h2>
                            <p className="text-base md:text-lg text-slate-600 max-w-xl mb-8">
                                Node Speak is a platform that redefines online forums by using blockchain technology and decentralized storage. Designed to ensure permanence, transparency and resistance to censorship.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 mb-10">
                                <button className="text-sm font-medium text-slate-800 hover:text-slate-900 underline-offset-4 hover:underline">
                                    Explore the forum
                                </button>
                            </div>

                            <div className="grid gap-5 md:grid-cols-3 text-sm">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                                    <p className="font-medium text-slate-900 mb-2 text-base">Communities</p>
                                    <p className="text-slate-500 text-sm">
                                        Create and manage discussion topics.
                                        Follow profiles of interest.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                                    <p className="font-medium text-slate-900 mb-2 text-base">Posts & Threads</p>
                                    <p className="text-slate-500 text-sm">
                                        Post messages and reply to other participants.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                                    <p className="font-medium text-slate-900 mb-2 text-base">Admin Mode</p>
                                    <p className="text-slate-500 text-sm">
                                        Moderate, curate, and protect spaces in one interface.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200 border border-slate-100 px-8 py-7 flex flex-col gap-5">
                            <div>
                                <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase mb-3">
                                    Key Features
                                </p>
                                <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                                    <li>
                                        <span className="font-semibold">Blockchain and Security:</span> All messages are backed by blockchain technology, ensuring transparency and reliability.
                                    </li>
                                    <li>
                                        <span className="font-semibold">Permanent Storage:</span> We use IPFS (InterPlanetary File System) to ensure data is accessible in a decentralized and immutable way.
                                    </li>
                                    <li>
                                        <span className="font-semibold">No Censorship or Arbitrary Moderation:</span> Content is always available and moderated by each community running a version of NodeSpeak.
                                    </li>
                                    <li>
                                        <span className="font-semibold">Secure Content:</span> Persistent storage ensures content is protected against external manipulations.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </aside>
                </main>

                <footer className="mt-20 border-t border-slate-200 pt-10 flex flex-col md:flex-row items-center justify-between gap-6 text-lg text-slate-500">
                    <p className="text-lg">
                        &copy; {new Date().getFullYear()} NodeSpeak. Built for decentralized communities.
                    </p>
                    <div className="flex flex-wrap gap-4 text-lg">
                        <a
                            href="https://github.com/NodeSpeak/NodeSpeakv1.1-main"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full bg-slate-900 text-slate-50 px-4 py-2 font-medium hover:bg-black transition-colors"
                        >
                            <Github className="w-4 h-4 mr-2" />
                            GitHub
                        </a>
                        <a
                            href="https://twitter.com/NodeSpeak"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full bg-slate-100 text-slate-800 px-4 py-2 font-medium hover:bg-slate-200 transition-colors"
                        >
                            <X className="w-4 h-4 mr-2" />
                            @NodeSpeak
                        </a>
                        <a
                            href="mailto:support@nodespeak.xyz"
                            className="inline-flex items-center rounded-full bg-slate-100 text-slate-800 px-4 py-2 font-medium hover:bg-slate-200 transition-colors"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Support
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default Landing;