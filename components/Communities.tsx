"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/contexts/WalletContext";

interface Community {
    id: string;
    name: string;
    description: string;
    topicCount: number;
    postCount: number;
    creator: string;
    isMember?: boolean;
    isCreator?: boolean;
    memberCount?: number;
    topics: string[];
}

interface CommunitiesProps {
    communities: Community[];
    isCreatingCommunity: boolean;
    setIsCreatingCommunity: (value: boolean) => void;
    selectedCommunityId: string | null;
    handleSelectCommunity: (communityId: string) => void;
    handleCreateCommunity: (name: string, description: string, topics: string[]) => Promise<void>;
    handleJoinCommunity: (communityId: string) => Promise<void>;
    handleLeaveCommunity: (communityId: string) => Promise<void>;
    isLoading: boolean;
    creatingCommunity: boolean;
    joiningCommunityId: string | null;
    leavingCommunityId: string | null;
    setShowCommunityList: (show: boolean) => void;
}

export const Communities = ({
    communities,
    isCreatingCommunity,
    setIsCreatingCommunity,
    selectedCommunityId,
    handleSelectCommunity,
    handleCreateCommunity,
    handleJoinCommunity,
    handleLeaveCommunity,
    isLoading,
    creatingCommunity,
    joiningCommunityId,
    leavingCommunityId,
    setShowCommunityList
}: CommunitiesProps) => {
    // Accedemos al contexto de la wallet para verificar la red
    const { isGnosisChain, switchToGnosis, chainId, provider, address } = useWalletContext();
    const [localLoading, setLocalLoading] = useState(false);

    // Verificar la red cuando se monta el componente
    useEffect(() => {
        console.log("=== ESTADO EN COMMUNITIES ===");
        console.log("Chain ID:", chainId);
        console.log("Es Gnosis Chain:", isGnosisChain);
        console.log("Address:", address);

        if (!isGnosisChain) {
            console.warn("⚠️ Communities: No estás en Gnosis Chain");
        }
    }, [isGnosisChain, chainId, address]);

    // Function to handle clicking on a community
    const handleCommunityClick = (community: Community) => {
        handleSelectCommunity(community.id);

        // If the user is a member or creator, navigate to posts view
        if (community.isMember || community.isCreator) {
            setShowCommunityList(false); // Switch to posts view
        } else {
            // If not a member, simply select the community but stay in community view
            // This will highlight the community but not navigate away
        }
    };

    // Función mejorada para crear comunidad con debug
    const debugCreateCommunity = async () => {
        try {
            setLocalLoading(true);

            // Obtener los valores de los campos
            const nameElement = document.getElementById('community-name') as HTMLInputElement;
            const descriptionElement = document.getElementById('community-description') as HTMLTextAreaElement;
            const topicsElement = document.getElementById('community-topics') as HTMLInputElement;

            const name = nameElement?.value || "";
            const description = descriptionElement?.value || "";
            const topicString = topicsElement?.value || "General";
            const topicsArray = topicString.split(',').map(t => t.trim()).filter(t => t);

            if (!name || !description || topicsArray.length === 0) {
                alert("Please fill in all fields");
                setLocalLoading(false);
                return;
            }

            console.log("=== INICIANDO CREACIÓN DE COMUNIDAD ===");
            console.log("Datos de la comunidad:", { name, description, topics: topicsArray });
            console.log("Estado de la red:", { chainId, isGnosisChain });

            // Verificar si estamos en la red correcta
            if (!isGnosisChain) {
                console.log("⚠️ No estamos en Gnosis Chain. Cambiando red...");
                await switchToGnosis();

                // Dar tiempo para que el cambio de red se aplique
                console.log("Esperando a que el cambio de red se aplique...");
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Verificar si el cambio fue exitoso
                if (!isGnosisChain) {
                    console.log("❌ No se pudo cambiar a Gnosis Chain automáticamente");
                    alert("Error: No se pudo cambiar a Gnosis Chain. Por favor, cambia manualmente desde MetaMask y vuelve a intentar.");
                    setLocalLoading(false);
                    return;
                }
            }

            // Verificar que el provider sea válido
            if (!provider) {
                console.error("❌ Error: Provider no disponible");
                alert("Error: No hay conexión disponible con la blockchain");
                setLocalLoading(false);
                return;
            }

            // Obtener la red del provider para verificar
            try {
                const network = await provider.getNetwork();
                console.log("Red del provider:", network);

                // Confirmar que podemos obtener un signer
                const signer = await provider.getSigner();
                const signerAddress = await signer.getAddress();
                console.log("Signer address:", signerAddress);
            } catch (error) {
                console.error("Error al verificar provider:", error);
            }

            console.log("✅ Todo listo para crear la comunidad. Ejecutando handleCreateCommunity...");
            await handleCreateCommunity(name, description, topicsArray);
            console.log("Creación de comunidad completada");
        } catch (error) {
            console.error("❌ Error en debugCreateCommunity:", error);
            alert(`Error al crear la comunidad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <div className="terminal-window p-6 rounded-lg">
            {/* Mostrar información de red para debug */}
            <div className="mb-4 p-2 bg-black border border-gray-500 rounded text-xs">
                <p className="text-gray-400">Network Debug:</p>
                <p className="text-gray-300">ChainID: {chainId || 'No conectado'}</p>
                <p className={isGnosisChain ? 'text-green-500' : 'text-red-500'}>
                    {isGnosisChain ? '✓ Gnosis Chain' : '✗ Red incorrecta'}
                </p>
                {!isGnosisChain && (
                    <button
                        onClick={switchToGnosis}
                        className="mt-1 bg-blue-700 text-white px-2 py-1 rounded text-xs"
                    >
                        Cambiar a Gnosis
                    </button>
                )}
            </div>

            {!isGnosisChain && (
                <div className="mb-4 bg-red-900 bg-opacity-30 border-2 border-red-500 p-3 rounded text-white">
                    <p className="text-center mb-2">Esta aplicación requiere Gnosis Chain para funcionar correctamente.</p>
                    <p className="text-center mb-2">Red actual: {chainId || 'Desconocida'}</p>
                    <div className="flex justify-center">
                        <button
                            onClick={switchToGnosis}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                        >
                            Cambiar a Gnosis Chain
                        </button>
                    </div>
                </div>
            )}

            {isCreatingCommunity ? (
                <div className="border-2 border-[var(--matrix-green)] rounded-lg p-6 bg-black">
                    <h2 className="text-xl font-mono mb-4 text-center text-[var(--matrix-green)]">
                        Create New Community
                    </h2>
                    <form className="space-y-4">
                        <div className="flex flex-col">
                            <label className="text-[var(--matrix-green)] mb-1">Community Name</label>
                            <input
                                type="text"
                                placeholder="Enter community name"
                                className="bg-black border-2 border-[var(--matrix-green)] text-white p-2 rounded"
                                id="community-name"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[var(--matrix-green)] mb-1">Description</label>
                            <textarea
                                placeholder="What is this community about?"
                                className="bg-black border-2 border-[var(--matrix-green)] text-white p-2 rounded h-32"
                                id="community-description"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[var(--matrix-green)] mb-1">Topics (comma separated)</label>
                            <input
                                type="text"
                                placeholder="General, Technology, Blockchain"
                                className="bg-black border-2 border-[var(--matrix-green)] text-white p-2 rounded"
                                id="community-topics"
                            />
                            <p className="text-xs text-gray-400 mt-1">At least one topic is required</p>
                        </div>

                        <Button
                            type="button"
                            onClick={debugCreateCommunity}
                            className="w-full bg-[var(--matrix-green)] text-black py-2 rounded font-bold mt-4"
                            disabled={creatingCommunity || localLoading || !isGnosisChain}
                        >
                            {creatingCommunity || localLoading ? (
                                <div className="flex items-center justify-center">
                                    <span className="mr-2 animate-pulse">Creating...</span>
                                </div>
                            ) : !isGnosisChain ? (
                                "Switch to Gnosis Chain First"
                            ) : (
                                "Create Community"
                            )}
                        </Button>
                    </form>
                </div>
            ) : (
                <div>
                    <h2 className="text-xl font-mono mb-4 text-center text-[var(--matrix-green)]">
                        Communities
                    </h2>
                    <div className="space-y-4">
                        {communities.length === 0 ? (
                            <p className="text-center text-gray-400">No communities found. Create the first one!</p>
                        ) : (
                            communities.map((community) => (
                                <div
                                    key={community.id}
                                    className={`border-2 rounded-lg p-4 flex flex-col bg-black cursor-pointer transition-all ${selectedCommunityId === community.id
                                        ? "border-[var(--matrix-green)] border-4"
                                        : "border-[var(--matrix-green)] hover:border-opacity-80"
                                        }`}
                                    onClick={() => handleCommunityClick(community)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-bold text-white">{community.name}</h3>
                                        <div className="flex flex-col items-end">
                                            <div className="flex space-x-2">
                                                <span className="text-gray-400 text-sm">
                                                    {community.memberCount || 0} members
                                                    {community.isCreator && " (including you)"}
                                                </span>
                                            </div>
                                            <span className="text-gray-400 text-sm">{community.postCount} posts</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-300 mb-3">
                                        {community.description.length > 100
                                            ? community.description.substring(0, 100) + "..."
                                            : community.description}
                                    </p>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-sm text-[var(--matrix-green)]">
                                                {community.topics.length} topics
                                            </span>
                                            {/* Status badges */}
                                            {community.isCreator && (
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-purple-800 text-white">
                                                    Creator
                                                </span>
                                            )}
                                            {community.isMember && !community.isCreator && (
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-700 text-white">
                                                    Member
                                                </span>
                                            )}
                                        </div>

                                        {/* Join/Leave button - Only show for non-creators */}
                                        {!community.isCreator && (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();

                                                    // Verificar red antes de ejecutar
                                                    if (!isGnosisChain) {
                                                        console.log("Cambiando a Gnosis antes de unirse/salir de la comunidad");
                                                        await switchToGnosis();
                                                        await new Promise(resolve => setTimeout(resolve, 1000));
                                                    }

                                                    if (community.isMember) {
                                                        await handleLeaveCommunity(community.id);
                                                    } else {
                                                        await handleJoinCommunity(community.id);
                                                    }
                                                }}
                                                className={`px-3 py-1 rounded text-sm font-medium ${!isGnosisChain
                                                        ? "bg-yellow-600 text-white"
                                                        : joiningCommunityId === community.id || leavingCommunityId === community.id
                                                            ? "bg-gray-600 text-white"
                                                            : community.isMember
                                                                ? "bg-red-800 hover:bg-red-700 text-white"
                                                                : "bg-[var(--matrix-green)] hover:bg-opacity-80 text-black"
                                                    }`}
                                                disabled={!isGnosisChain || joiningCommunityId === community.id || leavingCommunityId === community.id}
                                            >
                                                {!isGnosisChain ? (
                                                    "Wrong Network"
                                                ) : joiningCommunityId === community.id ? (
                                                    <span className="animate-pulse">Joining...</span>
                                                ) : leavingCommunityId === community.id ? (
                                                    <span className="animate-pulse">Leaving...</span>
                                                ) : community.isMember ? (
                                                    "Leave"
                                                ) : (
                                                    "Join"
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};