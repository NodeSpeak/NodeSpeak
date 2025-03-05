"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/contexts/WalletContext";
import { Check, LogOut } from "lucide-react";
import { useRouter } from 'next/navigation';

export const WalletConnect = () => {
    const {
        isConnected,
        address,
        connect,
        disconnect,
        ensName,
        isGnosisChain,
        chainId,
        switchToGnosis,
        provider
    } = useWalletContext();

    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Efecto para verificar y mostrar la red actual
    useEffect(() => {
        if (isConnected) {
            console.log("=== CONEXIÓN ACTUAL ===");
            console.log("Conectado:", isConnected);
            console.log("Chain ID:", chainId);
            console.log("Es Gnosis Chain:", isGnosisChain);
            console.log("Dirección:", address);

            // Si no estamos en Gnosis, mostrar advertencia y sugerir cambio
            if (!isGnosisChain) {
                console.warn("⚠️ NO ESTÁS EN GNOSIS CHAIN. Se requiere cambiar de red.");
            } else {
                console.log("✅ Conectado a Gnosis Chain correctamente");
            }

            // Verificar que el provider sea válido
            if (provider) {
                console.log("Provider está configurado correctamente");

                // Verificar signer y confirmar que está en la red correcta
                provider.getSigner().then(signer => {
                    console.log("Signer obtenido correctamente");
                    return provider.getNetwork();
                }).then(network => {
                    console.log("Red del provider:", network);
                }).catch(error => {
                    console.error("Error al obtener signer o red:", error);
                });
            } else {
                console.error("❌ Provider no configurado correctamente");
            }
        }
    }, [isConnected, chainId, isGnosisChain, address, provider]);

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            console.log("Iniciando conexión a wallet...");
            await connect();
            console.log("Conexión completada, verificando red...");

            // Verificar si estamos en la red correcta después de conectar
            if (!isGnosisChain) {
                console.log("Red incorrecta detectada, intentando cambiar a Gnosis...");
                await switchToGnosis();

                // Esperar un momento para que el cambio de red se aplique
                console.log("Esperando a que el cambio de red se aplique...");
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Verificar nuevamente si ya estamos en Gnosis Chain
                console.log("Verificando si el cambio de red fue exitoso...");
                if (!isGnosisChain) {
                    console.warn("⚠️ No se pudo cambiar a Gnosis Chain. Por favor, inténtalo manualmente.");
                } else {
                    console.log("✅ Cambiado exitosamente a Gnosis Chain");
                }
            } else {
                console.log("✅ Ya estamos en Gnosis Chain");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = () => {
        console.log("Desconectando wallet...");
        disconnect();
        router.push('/');
    };

    // Añadir un botón para forzar el cambio a Gnosis
    const forceGnosisSwitch = async () => {
        try {
            console.log("Forzando cambio a Gnosis Chain...");
            await switchToGnosis();
            console.log("Solicitud de cambio enviada");
        } catch (error) {
            console.error("Error al forzar cambio a Gnosis:", error);
        }
    };

    return (
        <div className="wallet-status text-xs flex items-center justify-end">
            {isConnected ? (
                <div className="flex items-center space-x-2">
                    {/* Indicador visual de red correcta/incorrecta */}
                    {isGnosisChain ? (
                        <Check className="h-3 w-3 text-[var(--matrix-green)]" />
                    ) : (
                        <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"
                            title="Red incorrecta. Haz clic para cambiar a Gnosis Chain"
                            onClick={forceGnosisSwitch}
                            style={{ cursor: 'pointer' }} />
                    )}
                    <div>
                        {ensName ? (
                            <span>{ensName}</span>
                        ) : (
                            <span className="font-mono">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                        )}
                        {/* Mostrar cadena actual */}
                        <span className="text-xs ml-1 opacity-60">
                            {isGnosisChain ? '(Gnosis)' : `(${chainId || 'Unknown'})`}
                        </span>
                    </div>

                    {/* Botón de cambio de red si es necesario */}
                    {!isGnosisChain && (
                        <Button
                            onClick={forceGnosisSwitch}
                            className="bg-yellow-700 hover:bg-yellow-600 text-white text-xs py-1 px-2 h-auto flex items-center space-x-1 border border-yellow-500 mr-1"
                        >
                            <span>Gnosis</span>
                        </Button>
                    )}

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
                    className="bg-black border-2 border-[var(--matrix-green)] text-[var(--matrix-green)] hover:bg-[#001800] transition-colors text-xs py-1 h-auto w-full md:w-auto px-4"
                >
                    {isLoading ? "Connecting..." : "Connection"}
                </Button>
            )}
        </div>
    );
};