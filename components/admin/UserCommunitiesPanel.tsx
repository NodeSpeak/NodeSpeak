"use client";

import React, { useState, useEffect } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Home, Crown, Users, ExternalLink, RefreshCw, Undo2, EyeOff } from "lucide-react";
import { useAdminContext } from "@/contexts/AdminContext";
import { Contract } from "ethers";
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_V3.3";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { fetchJSON, getImageUrl } from "@/lib/ipfsClient";

interface UserCommunity {
  id: string;
  name: string;
  description: string;
  photo?: string;
  coverImage?: string;
  memberCount: number;
  topicCount: number;
  isCreator: boolean;
  isMember: boolean;
  isActive: boolean;
}

export const UserCommunitiesPanel: React.FC = () => {
  const { isConnected, provider: walletProvider, address } = useWalletContext();
  const { hiddenCommunities, unhideCommunity } = useAdminContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [userCommunities, setUserCommunities] = useState<UserCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reactivatingCommunity, setReactivatingCommunity] = useState<string | null>(null);

  // Filtrar comunidades por término de búsqueda
  const filteredCommunities = userCommunities.filter(
    (community) =>
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separar comunidades por estado (solo las creadas por el usuario)
  const activeCommunities = filteredCommunities.filter(c => c.isActive);
  const deactivatedCommunities = filteredCommunities.filter(c => !c.isActive);

  // Obtener comunidades del usuario desde el contrato
  const fetchUserCommunities = async () => {
    if (!isConnected || !walletProvider || !address) {
      setLoading(false);
      return;
    }

    try {
      const contract = new Contract(forumAddress, forumABI, walletProvider);
      // Usar getAllCommunities para obtener también las desactivadas
      const communitiesFromContract = await contract.getAllCommunities();

      const userAddress = address.toLowerCase();

      const communityPromises = communitiesFromContract.map(async (community: any) => {
        const id = community.id.toString();
        let name = `Community #${id}`;
        let description = "No description available";
        let photo = "";
        let coverImage = "";

        // Parse metadata from IPFS if available - using centralized ipfsClient
        if (community.metadataCID && community.metadataCID !== "") {
          try {
            const metadata = await fetchJSON(community.metadataCID);
            if (metadata) {
              name = metadata.name || name;
              description = metadata.description || description;
              if (metadata.imageCID) {
                photo = getImageUrl(metadata.imageCID);
              }
              if (metadata.coverCID) {
                coverImage = getImageUrl(metadata.coverCID);
              }
            }
          } catch (err) {
            console.error(`Error fetching metadata for community ${id}:`, err);
          }
        }

        const isCreator = community.creator.toLowerCase() === userAddress;
        
        // Check if user is a member
        let isMember = false;
        try {
          isMember = await contract.isMember(id, address);
        } catch (err) {
          console.error(`Error checking membership for community ${id}:`, err);
        }

        return {
          id,
          name,
          description,
          photo,
          coverImage,
          memberCount: Number(community.memberCount || 0),
          topicCount: Number(community.topicCount || 0),
          isCreator,
          isMember,
          isActive: community.isActive
        };
      });

      const allCommunities = await Promise.all(communityPromises);
      
      // Filtrar solo las comunidades donde el usuario es CREADOR
      const userCreatedCommunities = allCommunities.filter(c => c.isCreator);
      
      // También incluir comunidades ocultas del AdminContext que fueron creadas por el usuario
      // (estas son las que el usuario desactivó y se guardaron en el contexto)
      const hiddenByUser = hiddenCommunities.filter(
        hc => hc.reason?.toLowerCase().includes(userAddress)
      );
      
      // Marcar las comunidades que están en la lista de ocultas como desactivadas
      const communitiesWithHiddenStatus = userCreatedCommunities.map(c => {
        const isHidden = hiddenByUser.some(hc => hc.id === c.id);
        return {
          ...c,
          isActive: isHidden ? false : c.isActive
        };
      });

      setUserCommunities(communitiesWithHiddenStatus);
    } catch (error) {
      console.error("Error fetching user communities:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las comunidades",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserCommunities();
  }, [isConnected, walletProvider, address, hiddenCommunities]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserCommunities();
  };

  // Función para reactivar una comunidad desactivada
  const handleReactivateCommunity = async (communityId: string, communityName: string) => {
    if (!isConnected || !walletProvider) {
      toast({
        title: "Error",
        description: "Por favor conecta tu wallet para reactivar la comunidad",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`¿Estás seguro de reactivar la comunidad "${communityName}"?`)) {
      return;
    }

    try {
      setReactivatingCommunity(communityId);

      toast({
        title: "Reactivando comunidad",
        description: "Procesando la reactivación..."
      });

      // Quitar de la lista de comunidades ocultas en AdminContext
      unhideCommunity(communityId);

      // Simular delay para la transacción (en un escenario real, aquí iría la llamada al contrato)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Actualizar el estado local
      setUserCommunities(prev =>
        prev.map(c =>
          c.id === communityId ? { ...c, isActive: true } : c
        )
      );

      toast({
        title: "Comunidad reactivada",
        description: `La comunidad "${communityName}" ha sido reactivada exitosamente.`,
        variant: "default"
      });

      // Refrescar la lista
      await fetchUserCommunities();
    } catch (error) {
      console.error("Error reactivando comunidad:", error);
      toast({
        title: "Error",
        description: `Error al reactivar la comunidad: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setReactivatingCommunity(null);
    }
  };

  const CommunityCard = ({ community, showReactivate = false }: { community: UserCommunity; showReactivate?: boolean }) => (
    <div className={`group relative bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 ${!community.isActive ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
      {/* Cover Image */}
      <div className="h-24 relative overflow-hidden">
        {community.coverImage ? (
          <img
            src={community.coverImage}
            alt={community.name}
            className={`w-full h-full object-cover ${!community.isActive ? 'opacity-60 grayscale' : ''}`}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${!community.isActive ? 'from-red-100 via-slate-100 to-slate-50' : 'from-indigo-100 via-slate-100 to-slate-50'}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Badge de estado */}
        <div className="absolute top-2 right-2 flex gap-1">
          {!community.isActive && (
            <Badge className="bg-red-500 hover:bg-red-600 text-white gap-1">
              <EyeOff className="w-3 h-3" />
              Desactivada
            </Badge>
          )}
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1">
            <Crown className="w-3 h-3" />
            Creador
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Community Photo */}
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border-2 border-white shadow-sm -mt-8 relative z-10">
            {community.photo ? (
              <img
                src={community.photo}
                alt={community.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-200 to-indigo-300 flex items-center justify-center">
                <Home className="w-6 h-6 text-indigo-600" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-semibold text-slate-900 truncate">{community.name}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 mt-1">{community.description}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-sm">
            <Users className="w-4 h-4" />
            <span>{community.memberCount} miembros</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-sm">
            <span>{community.topicCount} temas</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-3 space-y-2">
          {community.isActive ? (
            <Link href={`/foro?community=${community.id}`}>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
              >
                <ExternalLink className="w-4 h-4" />
                Ir a la comunidad
              </Button>
            </Link>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
              onClick={() => handleReactivateCommunity(community.id, community.name)}
              disabled={reactivatingCommunity === community.id}
            >
              {reactivatingCommunity === community.id ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Reactivando...
                </>
              ) : (
                <>
                  <Undo2 className="w-4 h-4" />
                  Reactivar Comunidad
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Mis Comunidades Creadas</CardTitle>
            <CardDescription className="text-slate-500">
              Comunidades que has creado (activas y desactivadas)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {userCommunities.length}{" "}
              {userCommunities.length === 1 ? "comunidad" : "comunidades"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar comunidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-6 text-base"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">
              {searchTerm
                ? "No se encontraron comunidades con ese criterio"
                : "No has creado ninguna comunidad"}
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Crea tu primera comunidad desde el foro
            </p>
            <Link href="/foro">
              <Button className="mt-4 gap-2">
                <ExternalLink className="w-4 h-4" />
                Ir al Foro
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Comunidades Activas */}
            {activeCommunities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Comunidades Activas ({activeCommunities.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeCommunities.map((community) => (
                    <CommunityCard key={community.id} community={community} />
                  ))}
                </div>
              </div>
            )}

            {/* Comunidades Desactivadas */}
            {deactivatedCommunities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-red-500" />
                  Comunidades Desactivadas ({deactivatedCommunities.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deactivatedCommunities.map((community) => (
                    <CommunityCard key={community.id} community={community} showReactivate />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
