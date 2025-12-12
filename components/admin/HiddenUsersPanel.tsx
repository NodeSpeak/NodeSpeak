"use client";

import React, { useState } from "react";
import { useAdminContext } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EyeOff, Eye, Search, UserX } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { AddressDisplay } from "@/components/AddressDisplay";

export const HiddenUsersPanel: React.FC = () => {
  const { hiddenUsers, unhideUser } = useAdminContext();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = hiddenUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.address.toLowerCase().includes(searchTerm.toLowerCase())
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


  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <EyeOff className="w-6 h-6" />
              Usuarios Ocultados
            </CardTitle>
            <CardDescription>
              Gestiona los usuarios que han sido ocultados de la plataforma
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {hiddenUsers.length} {hiddenUsers.length === 1 ? "usuario" : "usuarios"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nombre de usuario o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-6 text-base"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserX className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">
              {searchTerm
                ? "No se encontraron usuarios con ese criterio"
                : "No hay usuarios ocultados"}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Usuario</TableHead>
                  <TableHead className="font-semibold">Dirección</TableHead>
                  <TableHead className="font-semibold">Fecha de Ocultamiento</TableHead>
                  <TableHead className="font-semibold">Motivo</TableHead>
                  <TableHead className="text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.address} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar address={user.address} size="sm" />
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AddressDisplay
                        value={user.address}
                        type="address"
                        showCopy
                        showTooltip
                        autoResponsive
                      />
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatDate(user.hiddenAt)}
                    </TableCell>
                    <TableCell>
                      {user.reason ? (
                        <span className="text-sm text-slate-600">{user.reason}</span>
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
                        onClick={() => unhideUser(user.address)}
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
