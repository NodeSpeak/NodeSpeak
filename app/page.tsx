"use client";
import React, { useState, useEffect, useRef } from "react";
import { Github, X, Mail, Shield, Database, Users, MessageSquare, Lock, Sparkles } from "lucide-react";
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
        <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff] text-slate-900 flex flex-col">
            <div className="max-w-7xl mx-auto px-8 pt-12 pb-12 flex-1 flex flex-col w-full">
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Node Speak <span className="text-lg font-normal text-slate-500">v3.3</span></h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <WalletConnect />
                    </div>
                </header>

                <main className="flex-1 grid gap-10 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)] items-center content-center">
                    <section className="space-y-6">
                        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 px-10 py-12 hover:shadow-2xl transition-shadow duration-300">
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-50 to-indigo-50 text-sky-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-sky-100">
                                <Shield className="w-3.5 h-3.5" />
                                Decentralized & Censorship-Resistant
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
                                The Decentralized and Immutable Forum
                            </h2>
                            <p className="text-base md:text-lg text-slate-600 max-w-xl mb-8 leading-relaxed">
                                Node Speak is a platform that redefines online forums by using blockchain technology and decentralized storage. Designed to ensure permanence, transparency and resistance to censorship.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 mb-10">
                                <button className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl hover:from-sky-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105">
                                    <MessageSquare className="w-4 h-4" />
                                    Explore the Forum
                                </button>
                                <button className="inline-flex items-center gap-2 text-slate-700 px-6 py-3 rounded-full font-medium hover:bg-slate-100 transition-colors">
                                    Learn More
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3 text-sm">
                                <div className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-5 hover:border-sky-200 hover:shadow-md transition-all duration-200">
                                    <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center mb-3 group-hover:bg-sky-200 transition-colors">
                                        <Users className="w-5 h-5 text-sky-600" />
                                    </div>
                                    <p className="font-semibold text-slate-900 mb-2 text-base">Communities</p>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        Create and manage discussion topics. Follow profiles of interest.
                                    </p>
                                </div>
                                <div className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-200">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <p className="font-semibold text-slate-900 mb-2 text-base">Posts & Threads</p>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        Post messages and reply to other participants.
                                    </p>
                                </div>
                                <div className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-5 hover:border-purple-200 hover:shadow-md transition-all duration-200">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                                        <Shield className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <p className="font-semibold text-slate-900 mb-2 text-base">Admin Mode</p>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        Moderate, curate, and protect spaces in one interface.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200 border border-slate-100 px-8 py-7 flex flex-col gap-5 hover:shadow-xl transition-shadow duration-300">
                            <div>
                                <p className="text-sm font-bold tracking-[0.15em] text-slate-700 uppercase mb-5 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-sky-500" />
                                    Key Features
                                </p>
                                <ul className="text-sm text-slate-600 space-y-4">
                                    <li className="flex gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center mt-0.5">
                                            <Lock className="w-3.5 h-3.5 text-sky-600" />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-900">Blockchain and Security:</span>
                                            <span className="text-slate-600"> All messages are backed by blockchain technology, ensuring transparency and reliability.</span>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center mt-0.5">
                                            <Database className="w-3.5 h-3.5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-900">Permanent Storage:</span>
                                            <span className="text-slate-600"> We use IPFS (InterPlanetary File System) to ensure data is accessible in a decentralized and immutable way.</span>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center mt-0.5">
                                            <Shield className="w-3.5 h-3.5 text-purple-600" />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-900">No Censorship:</span>
                                            <span className="text-slate-600"> Content is always available and moderated by each community running a version of NodeSpeak.</span>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center mt-0.5">
                                            <Lock className="w-3.5 h-3.5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-900">Secure Content:</span>
                                            <span className="text-slate-600"> Persistent storage ensures content is protected against external manipulations.</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </aside>
                </main>

                <footer className="mt-auto pt-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-sm text-slate-600">
                        &copy; {new Date().getFullYear()} NodeSpeak. Built for decentralized communities.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="https://github.com/NodeSpeak/NodeSpeakv1.1-main"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-slate-50 px-4 py-2 text-sm font-medium hover:bg-black transition-all hover:scale-105 shadow-sm"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>
                        <a
                            href="https://twitter.com/NodeSpeak"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-200 transition-all hover:scale-105 shadow-sm"
                        >
                            <X className="w-4 h-4" />
                            @NodeSpeak
                        </a>
                        <a
                            href="mailto:support@nodespeak.xyz"
                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-200 transition-all hover:scale-105 shadow-sm"
                        >
                            <Mail className="w-4 h-4" />
                            Support
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default Landing;