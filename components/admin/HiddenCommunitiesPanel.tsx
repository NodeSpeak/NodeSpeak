"use client";

import React, { useState } from "react";
import { useAdminContext } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EyeOff, Eye, Search, Home } from "lucide-react";

export const HiddenCommunitiesPanel: React.FC = () => {
  const { hiddenCommunities, unhideCommunity } = useAdminContext();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCommunities = hiddenCommunities.filter(
    (community) =>
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatId = (id: string) => {
    // Si el ID es muy largo, mostrar versión acortada
    return id.length > 12 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <EyeOff className="w-6 h-6" />
              Comunidades Ocultadas
            </CardTitle>
            <CardDescription>
              Gestiona las comunidades que han sido ocultadas de la plataforma
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {hiddenCommunities.length}{" "}
            {hiddenCommunities.length === 1 ? "comunidad" : "comunidades"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nombre de comunidad o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-6 text-base"
            />
          </div>
        </div>

        {filteredCommunities.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">
              {searchTerm
                ? "No se encontraron comunidades con ese criterio"
                : "No hay comunidades ocultadas"}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Fecha de Ocultamiento</TableHead>
                  <TableHead className="font-semibold">Motivo</TableHead>
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
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                        {formatId(community.id)}
                      </code>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatDate(community.hiddenAt)}
                    </TableCell>
                    <TableCell>
                      {community.reason ? (
                        <span className="text-sm text-slate-600">{community.reason}</span>
                      ) : (
                        <span className="text-sm text-slate-400 italic">
                          Sin motivo especificado
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unhideCommunity(community.id)}
                        className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                      >
                        <Eye className="w-4 h-4" />
                        Restablecer
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
