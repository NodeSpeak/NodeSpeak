"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletContext } from "@/contexts/WalletContext";
import { useAdminContext } from "@/contexts/AdminContext";
import { HiddenUsersPanel, UserCommunitiesPanel } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ArrowLeft, Users, Home, EyeOff, Construction } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loading } from "@/components/Loading";

export default function AdminPage() {
  const router = useRouter();
  const { isConnected, address, ensName } = useWalletContext();
  const { isAdmin, hiddenUsers, hiddenCommunities } = useAdminContext();
  const [activeTab, setActiveTab] = useState("hidden-users");

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  // Show loading while checking connection
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Loading type="admin-dashboard" />
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 transition-colors duration-300">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Acceso Denegado
            </CardTitle>
            <CardDescription className="text-red-600">
              No tienes permisos para acceder a esta página. Solo usuarios autorizados pueden acceder al panel de administración.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Dirección conectada:</strong>
                </p>
                <code className="text-xs bg-slate-100 px-2 py-1 rounded block break-all">
                  {address}
                </code>
              </div>
              <button
                onClick={() => router.push("/foro")}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-medium text-sm shadow-lg shadow-sky-200 dark:shadow-sky-900/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                <Users className="w-4 h-4" />
                Volver al Foro
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 dark:bg-slate-700 text-white p-2 rounded-lg">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      Panel de Administración
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full border border-amber-200 dark:border-amber-800">
                      <Construction className="w-3 h-3" />
                      En construcción
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    NodeSpeak - Centro de Moderación
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/foro"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-medium text-sm shadow-lg shadow-sky-200 dark:shadow-sky-900/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                <Users className="w-4 h-4" />
                Volver al Foro
              </Link>
              <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Administrador conectado</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardDescription className="dark:text-slate-400">Usuarios Ocultados</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2 dark:text-slate-100">
                <Users className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                {hiddenUsers.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Usuarios actualmente ocultos en la plataforma
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardDescription className="dark:text-slate-400">Comunidades Ocultadas</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2 dark:text-slate-100">
                <Home className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                {hiddenCommunities.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Comunidades actualmente ocultas en la plataforma
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1">
            <TabsTrigger
              value="hidden-users"
              className="gap-2 data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white dark:text-slate-300"
            >
              <Users className="w-4 h-4" />
              Usuarios Ocultados
            </TabsTrigger>
            <TabsTrigger
              value="my-communities"
              className="gap-2 data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white dark:text-slate-300"
            >
              <Home className="w-4 h-4" />
              Mis Comunidades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hidden-users" className="space-y-6">
            <HiddenUsersPanel />
          </TabsContent>

          <TabsContent value="my-communities" className="space-y-6">
            <UserCommunitiesPanel />
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="mt-8 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 dark:text-slate-100">
              <EyeOff className="w-5 h-5" />
              Sobre la Ocultación de Contenido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-4">
              <p>
                Al ocultar un usuario o comunidad, este contenido dejará de ser visible para los usuarios
                de la plataforma, pero los datos seguirán existiendo en la blockchain.
              </p>
              <p>
                La moderación se aplica solo a nivel de interfaz de usuario, proporcionando
                una forma de filtrar contenido inapropiado sin comprometer la integridad
                de los datos almacenados de forma descentralizada.
              </p>
              <p>
                Puedes restablecer cualquier elemento ocultado en cualquier momento desde este panel.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
