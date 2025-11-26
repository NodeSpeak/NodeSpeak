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

    // Si está conectado, podemos mostrar un mensaje de carga 
    if (isConnected) {
        return (
            <div className="min-h-screen bg-black text-[var(--matrix-green)] font-mono relative overflow-hidden">
                <MatrixRain />
                <div className="container mx-auto px-6 flex items-center justify-center h-screen relative z-10">
                    <p className="text-[var(--matrix-green)]">
                        <TypingEffect text="Redirecting to forum..." />
                    </p>
                </div>
            </div>
        );
    }

    // Si no está conectado, muestra el contenido principal
    return (
        <div className="min-h-screen bg-black text-[var(--matrix-green)] font-mono relative overflow-hidden">
            <MatrixRain />

            <div className="container mx-auto p-4 relative z-10">
                <header className="mb-8 flex justify-between items-center">
                    <h1 className="text-2xl font-mono text-[var(--matrix-green)]">{siteConfig.name}</h1>
                    <WalletConnect />
                </header>

                <main className="container mx-auto px-6 relative z-10 mt-8">
                    <div className="max-w-4xl mx-auto bg-black text-[var(--matrix-green)] border border-[var(--matrix-green)] rounded-md 
                          shadow-[0_0_20px_rgba(0,255,0,0.3)] font-mono overflow-hidden">
                        <div className="bg-black px-4 py-2 border-b border-[var(--matrix-green)] flex items-center text-sm">
                            <span className="mr-2 text-[var(--matrix-green)]">➜</span>
                            <span className="text-[var(--matrix-green)]">/home/user/nodespeak</span>
                        </div>

                        <div className="p-6 space-y-6">
                            <p className="text-[var(--matrix-green)]">
                                <span className="text-[var(--matrix-green)]">user@nodespeak</span>:~$ NodeSpeak <span className="animate-pulse">_</span>
                            </p>
                            <div className="space-y-4 pl-4">
                                <h1 className="text-3xl font-bold text-[var(--matrix-green)] animate-pulse">
                                    Welcome to {siteConfig.name} - (Arbitrum Main Network)
                                </h1>
                                <p className="text-[var(--matrix-green)] mt-4">
                                    <TypingEffect text="Initializing decentralized communication protocol..." />
                                </p>
                                <p className="text-[var(--matrix-green)] mt-4">
                                    <TypingEffect text="Connect your wallet to access the forum and communities." />
                                </p>
                                <div className="border-l-2 border-[var(--matrix-green)]/50 pl-4 py-2 my-4 text-[var(--matrix-green)] text-sm">
                                    <p>» Secure communication channels established</p>
                                    <p>» IPFS node operational</p>
                                    <p>» Smart contracts verified</p>
                                    <p>» Ready for Web3 integration</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm py-4 
                          border-t border-[var(--matrix-green)]/30">
                    <div className="container mx-auto px-6 flex justify-center space-x-8">
                        <a
                            href="https://github.com/NodeSpeak/NodeSpeakv1.1-main"
                            className="flex items-center space-x-2 text-[var(--matrix-green)]/80 hover:text-[var(--matrix-green)] 
                            hover:shadow-[0_0_10px_rgba(0,255,0,0.3)] transition-all duration-300"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Github className="w-5 h-5" />
                            <span>nodespeak</span>
                        </a>
                        <a
                            href="https://twitter.com/NodeSpeak"
                            className="flex items-center space-x-2 text-[var(--matrix-green)]/80 hover:text-[var(--matrix-green)] 
                            hover:shadow-[0_0_10px_rgba(0,255,0,0.3)] transition-all duration-300"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <X className="w-5 h-5" />
                            <span>@NodeSpeak</span>
                        </a>
                        <a
                            href="mailto:support@nodespeak.xyz"
                            className="flex items-center space-x-2 text-[var(--matrix-green)]/80 hover:text-[var(--matrix-green)] 
                            hover:shadow-[0_0_10px_rgba(0,255,0,0.3)] transition-all duration-300"
                        >
                            <Mail className="w-5 h-5" />
                            <span>support</span>
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default Landing;