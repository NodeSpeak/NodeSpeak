"use client";

import React, { useState, useEffect } from "react";
import { useAdminContext } from "@/contexts/AdminContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Home, RefreshCw, Undo2 } from "lucide-react";
import { Contract } from "ethers";
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_V3.3";
import { toast } from "@/hooks/use-toast";
import { AddressDisplay } from "@/components/AddressDisplay";

export const UserDeactivatedCommunitiesPanel: React.FC = () => {
  const { hiddenCommunities, unhideCommunity } = useAdminContext();
  const { isConnected, provider: walletProvider, address } = useWalletContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [reactivatingCommunity, setReactivatingCommunity] = useState<string | null>(null);
  
  // Estado para almacenar comunidades desactivadas por el usuario actual
  const [userDeactivatedCommunities, setUserDeactivatedCommunities] = useState<{
    id: string;
    name: string;
    hiddenAt: number;
    reason?: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtrar comunidades por término de búsqueda
  const filteredCommunities = userDeactivatedCommunities.filter(
    (community) =>
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener comunidades desactivadas por el usuario actual
  useEffect(() => {
    const fetchUserDeactivatedCommunities = async () => {
      if (!isConnected || !address) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // En un escenario real, aquí obtendríamos las comunidades desactivadas por el usuario
        // desde el contrato o la base de datos
        
        // Por ahora, simulamos el filtrado de comunidades desactivadas por el usuario actual
        // asumiendo que el reason contendría la dirección del usuario que la desactivó
        const userCommunities = hiddenCommunities.filter(
          (community) => community.reason?.includes(`${address.toLowerCase()}`) || false
        );
        
        setUserDeactivatedCommunities(userCommunities);
      } catch (error) {
        console.error("Error fetching user's deactivated communities:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las comunidades desactivadas",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserDeactivatedCommunities();
  }, [hiddenCommunities, isConnected, address]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  // Función para reactivar comunidad
  const handleReactivateCommunity = async (communityId: string, communityName: string) => {
    if (!isConnected || !walletProvider) {
      toast({
        title: "Error",
        description: "Por favor conecte su wallet para reactivar comunidades",
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

      const signer = await walletProvider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      // En un escenario real, llamaríamos a una función en el contrato para reactivar
      // Como no existe tal función, simplemente simularemos la reactivación
      
      // Simular delay para transacción
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Remover de la lista de comunidades ocultas
      unhideCommunity(communityId);
      
      // Actualizar estado local
      setUserDeactivatedCommunities(prev => 
        prev.filter(community => community.id !== communityId)
      );

      toast({
        title: "Comunidad reactivada",
        description: `La comunidad "${communityName}" ha sido reactivada exitosamente.`,
        variant: "default"
      });
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Mis Comunidades Desactivadas</CardTitle>
            <CardDescription className="text-slate-500">
              Comunidades que has desactivado como creador
            </CardDescription>
            <CardDescription>
              Gestiona tus comunidades desactivadas y reactívalas cuando lo desees
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {userDeactivatedCommunities.length}{" "}
            {userDeactivatedCommunities.length === 1 ? "comunidad" : "comunidades"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre de comunidad o ID..."
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
                : "No has desactivado ninguna comunidad"}
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Las comunidades que desactives aparecerán aquí para que puedas reactivarlas
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Fecha de Desactivación</TableHead>
                  <TableHead className="text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommunities.map((community) => (
                  <TableRow key={community.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-md flex items-center justify-center text-indigo-600 font-bold">
                          {community.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-medium">{community.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AddressDisplay
                        value={community.id}
                        type="id"
                        showCopy
                        showTooltip
                        autoResponsive
                      />
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatDate(community.hiddenAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReactivateCommunity(community.id, community.name)}
                        className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
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
                            Reactivar
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
