"use client";
import React, { useState, useEffect, useRef } from "react";
import { Github, X, Mail, Users, MessageSquare, Shield, Lock, Globe, Database, Sparkles } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";
import { ThemeToggle } from "@/components/theme-toggle";
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
    const { isConnected, connect } = useWalletContext();
    const router = useRouter();
    const [redirectTo, setRedirectTo] = useState<string | null>(null);

    // Handler para el botón "Explore the forum" - navega directamente sin login
    const handleExplore = () => {
        setRedirectTo('/activity');
    };

    // Efecto para redirigir cuando isConnected cambia
    useEffect(() => {
        if (isConnected && redirectTo) {
            router.push(redirectTo);
        }
    }, [isConnected, router, redirectTo]);

    // Si no está conectado, muestra la landing principal con estilo claro
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-sky-100/40 to-indigo-100/40 dark:from-sky-900/20 dark:to-indigo-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-100/30 to-pink-100/30 dark:from-violet-900/20 dark:to-pink-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8 md:pt-12 pb-20 relative z-10">
                {/* Header */}
                <header className="flex items-center justify-between mb-12 md:mb-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-200 dark:shadow-sky-900/50">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">Node Speak v3.3</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <WalletConnect />
                    </div>
                </header>

                {/* Hero Section */}
                <main className="grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
                    <section className="space-y-8">
                        {/* Main Hero Card */}
                        <div className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-white/60 dark:border-slate-700/60 px-8 md:px-12 py-10 md:py-14 overflow-hidden transition-all duration-500 hover:shadow-slate-300/60 dark:hover:shadow-slate-900/80">
                            {/* Subtle gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-indigo-50/0 group-hover:from-sky-50/50 group-hover:to-indigo-50/30 dark:group-hover:from-sky-900/20 dark:group-hover:to-indigo-900/20 transition-all duration-500 rounded-[2rem]" />
                            
                            <div className="relative z-10">
                                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-6 leading-[1.1]">
                                    The Decentralized and Immutable Forum
                                </h2>
                                <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-xl mb-8 leading-relaxed">
                                    Node Speak is a platform that redefines online forums by using blockchain technology and decentralized storage. Designed to ensure permanence, transparency and resistance to censorship.
                                </p>
                                <div className="flex flex-wrap items-center gap-4 mb-10">
                                    <button 
                                        onClick={handleExplore}
                                        className="group/btn relative inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 dark:from-sky-500 dark:to-indigo-600 text-white font-medium text-sm shadow-lg shadow-slate-300 dark:shadow-sky-900/50 hover:shadow-xl hover:shadow-slate-400/50 dark:hover:shadow-sky-700/50 transition-all duration-300 hover:-translate-y-0.5"
                                    >
                                        <span>Explore Forum</span>
                                        <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Feature Cards */}
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="group/card relative rounded-2xl border border-slate-100 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 p-5 transition-all duration-300 hover:border-sky-200 dark:hover:border-sky-700 hover:shadow-lg hover:shadow-sky-100/50 dark:hover:shadow-sky-900/30 hover:-translate-y-1">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/50 dark:to-sky-800/50 flex items-center justify-center mb-3 group-hover/card:from-sky-200 group-hover/card:to-sky-100 dark:group-hover/card:from-sky-800/50 dark:group-hover/card:to-sky-700/50 transition-colors">
                                            <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                                        </div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Communities</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                            Create and manage discussion topics.
                                            Follow profiles of interest.
                                        </p>
                                    </div>
                                    <div className="group/card relative rounded-2xl border border-slate-100 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 p-5 transition-all duration-300 hover:border-violet-200 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-violet-900/30 hover:-translate-y-1">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/50 dark:to-violet-800/50 flex items-center justify-center mb-3 group-hover/card:from-violet-200 group-hover/card:to-violet-100 dark:group-hover/card:from-violet-800/50 dark:group-hover/card:to-violet-700/50 transition-colors">
                                            <MessageSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Posts & Threads</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                            Post messages and reply to other participants.
                                        </p>
                                    </div>
                                    <div className="group/card relative rounded-2xl border border-slate-100 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 p-5 transition-all duration-300 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/30 hover:-translate-y-1">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/50 flex items-center justify-center mb-3 group-hover/card:from-emerald-200 group-hover/card:to-emerald-100 dark:group-hover/card:from-emerald-800/50 dark:group-hover/card:to-emerald-700/50 transition-colors">
                                            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Admin Mode (In progress)</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                            Moderate, curate, and protect spaces in one interface.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Sidebar */}
                    <aside className="space-y-5">
                        <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 border border-white/60 dark:border-slate-700/60 px-7 py-8 overflow-hidden">
                            {/* Decorative accent */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-500" />
                            
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/50 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <p className="text-sm font-bold tracking-wide text-slate-800 dark:text-slate-200 uppercase">
                                    Key Features
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/50 dark:to-transparent hover:from-sky-50 dark:hover:from-sky-900/30 transition-colors">
                                    <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center flex-shrink-0">
                                        <Lock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-0.5">Blockchain and Security:</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">All messages are backed by blockchain technology, ensuring transparency and reliability.</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/50 dark:to-transparent hover:from-violet-50 dark:hover:from-violet-900/30 transition-colors">
                                    <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0">
                                        <Database className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-0.5">Permanent Storage:</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">We use IPFS (InterPlanetary File System) to ensure data is accessible in a decentralized and immutable way.</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/50 dark:to-transparent hover:from-emerald-50 dark:hover:from-emerald-900/30 transition-colors">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                                        <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-0.5">No Censorship or Arbitrary Moderation:</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Content is always available and moderated by each community running a version of NodeSpeak.</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/50 dark:to-transparent hover:from-amber-50 dark:hover:from-amber-900/30 transition-colors">
                                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                                        <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-0.5">Secure Content:</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Persistent storage ensures content is protected against external manipulations.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </main>

                {/* Footer */}
                <footer className="mt-20 md:mt-28 border-t border-slate-200/60 dark:border-slate-700/60 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-base text-slate-500 dark:text-slate-400">
                        &copy; {new Date().getFullYear()} NodeSpeak. Built for decentralized communities.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="https://github.com/NodeSpeak/NodeSpeakv1.1-main"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 text-sm font-medium shadow-lg shadow-slate-300/50 dark:shadow-slate-900/50 hover:bg-slate-800 dark:hover:bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <Github className="w-4 h-4 mr-2" />
                            GitHub
                        </a>
                        <a
                            href="https://twitter.com/NodeSpeak"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <X className="w-4 h-4 mr-2" />
                            @NodeSpeak
                        </a>
                        <a
                            href="mailto:support@nodespeak.xyz"
                            className="inline-flex items-center rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:-translate-y-0.5 transition-all duration-300"
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