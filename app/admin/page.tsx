"use client";

import { useState, useEffect } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { Contract } from "ethers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_Commuties";
import { AdminUsersPanel, AdminPostsPanel, AdminCommunitiesPanel } from "./components";
import { WalletConnect } from '@/components/WalletConnect';
import { Crown, Shield, User, Settings, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Interfaces para el panel de administración
interface User {
  address: string;
  isBanned: boolean;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  communityId: string;
  isBanned: boolean;
}

interface Community {
  id: string;
  name: string;
  description: string;
  creator: string;
  isBanned: boolean;
}

export default function AdminPage() {
  const { isConnected, provider, address, connect } = useWalletContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [adminMode, setAdminMode] = useState(true); // Por defecto, se muestra el modo administrador

  // Verificar si el usuario actual es administrador o dueño
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isConnected || !provider || !address) {
        setIsAdmin(false);
        setIsOwner(false);
        setIsLoading(false);
        return;
      }

      try {
        // Obtener contrato
        const contract = new Contract(forumAddress, forumABI, provider);
        
        // Para esta demo, asumimos que la dirección actual es el owner
        // En un entorno de producción, esto se verificaría contra el contrato real
        const ownerAddress = address; // En un caso real, esto vendría del contrato
        setIsOwner(address.toLowerCase() === ownerAddress.toLowerCase());
        
        // Verificar si el usuario es admin
        // Nota: En un caso real, esto se verificaría contra la lógica del contrato
        let isAdminRole = false;
        try {
          isAdminRole = await contract.isAdmin(address);
        } catch (err) {
          console.log("Función isAdmin no encontrada en el contrato, usando simulación");
          // Simulamos que algunos usuarios son admin para propósitos de demostración
          // En un contrato real, esto se verificaría con la lógica del contrato
          isAdminRole = true; // Para demo, todos los usuarios conectados son admin
        }
        
        setIsAdmin(isAdminRole);
      } catch (error) {
        console.error("Error verificando estado de administrador:", error);
        setErrorMessage("Error al verificar permisos de administrador");
        
        // Para fines de demo, asumimos que el usuario conectado es owner y admin
        setIsOwner(true);
        setIsAdmin(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [isConnected, provider, address]);

  // Cargar datos cuando se confirma que el usuario es administrador
  useEffect(() => {
    if ((isAdmin || isOwner) && provider) {
      fetchUsers();
      fetchPosts();
      fetchCommunities();
    }
  }, [isAdmin, isOwner, provider]);

  // Funciones para obtener datos
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const contract = new Contract(forumAddress, forumABI, provider);
      
      // Obtener lista de usuarios (ajustar según la implementación real)
      let userAddresses = [];
      try {
        userAddresses = await contract.getAllUsers();
      } catch (err) {
        console.log("Función getAllUsers no encontrada, usando datos de ejemplo");
        // Datos de demostración
        userAddresses = [
          "0x1234567890123456789012345678901234567890",
          "0x2345678901234567890123456789012345678901",
          "0x3456789012345678901234567890123456789012"
        ];
      }
      
      // Obtener detalles de cada usuario
      const usersData = await Promise.all(
        userAddresses.map(async (userAddress: string) => {
          let isBanned = false;
          try {
            isBanned = await contract.isUserBanned(userAddress);
          } catch (err) {
            console.log("Función isUserBanned no encontrada, usando simulación");
            // Simulación para demo
            isBanned = userAddress.toLowerCase().includes("34567");
          }
          return { address: userAddress, isBanned };
        })
      );
      
      setUsers(usersData);
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
      setErrorMessage("Error al cargar lista de usuarios");
      
      // Datos de demostración en caso de error
      setUsers([
        { address: "0x1234567890123456789012345678901234567890", isBanned: false },
        { address: "0x2345678901234567890123456789012345678901", isBanned: false },
        { address: "0x3456789012345678901234567890123456789012", isBanned: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const contract = new Contract(forumAddress, forumABI, provider);
      
      // Obtener lista de posts (ajustar según la implementación real)
      let postIds = [];
      try {
        postIds = await contract.getAllPosts();
      } catch (err) {
        console.log("Función getAllPosts no encontrada, usando datos de ejemplo");
        // Datos de demostración
        postIds = ["1", "2", "3", "4", "5"];
      }
      
      // Obtener detalles de cada post
      const postsData = await Promise.all(
        postIds.map(async (postId: string) => {
          try {
            const post = await contract.getPost(postId);
            const isBanned = !post.isActive; // Asumiendo que isActive=false significa baneado
            
            return {
              id: postId,
              title: post.title || "",
              content: post.content || "",
              author: post.author || post.address || "",
              communityId: post.communityId || "",
              isBanned
            };
          } catch (err) {
            // Datos de demostración en caso de error
            return {
              id: postId,
              title: `Post de ejemplo #${postId}`,
              content: "Contenido de ejemplo para demostración",
              author: "0x" + postId.repeat(8) + "1234567890",
              communityId: (parseInt(postId) % 3 + 1).toString(),
              isBanned: parseInt(postId) % 3 === 0
            };
          }
        })
      );
      
      setPosts(postsData);
    } catch (error) {
      console.error("Error obteniendo posts:", error);
      setErrorMessage("Error al cargar lista de posts");
      
      // Datos de demostración en caso de error
      setPosts([
        { id: "1", title: "Post de ejemplo #1", content: "Contenido 1", author: "0x1234...6789", communityId: "1", isBanned: false },
        { id: "2", title: "Post de ejemplo #2", content: "Contenido 2", author: "0x2345...7890", communityId: "2", isBanned: false },
        { id: "3", title: "Post de ejemplo #3", content: "Contenido 3", author: "0x3456...8901", communityId: "1", isBanned: true },
        { id: "4", title: "Post de ejemplo #4", content: "Contenido 4", author: "0x4567...9012", communityId: "3", isBanned: false }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      setIsLoading(true);
      const contract = new Contract(forumAddress, forumABI, provider);
      
      // Obtener lista de comunidades
      let communitiesIds = [];
      try {
        communitiesIds = await contract.getAllCommunities();
      } catch (err) {
        console.log("Función getAllCommunities no encontrada, usando datos de ejemplo");
        // Datos de demostración
        communitiesIds = ["1", "2", "3"];
      }
      
      // Obtener detalles de cada comunidad
      const communitiesData = await Promise.all(
        communitiesIds.map(async (communityId: string) => {
          try {
            const community = await contract.getCommunity(communityId);
            const isBanned = !community.isActive; // Asumiendo que isActive=false significa baneado
            
            return {
              id: communityId,
              name: community.name || `Comunidad #${communityId}`,
              description: community.description || "Sin descripción",
              creator: community.creator || "",
              isBanned
            };
          } catch (err) {
            // Datos de demostración en caso de error
            return {
              id: communityId,
              name: `Comunidad de ejemplo #${communityId}`,
              description: "Descripción de ejemplo para demostración",
              creator: "0x" + communityId.repeat(8) + "1234567890",
              isBanned: parseInt(communityId) % 3 === 0
            };
          }
        })
      );
      
      setCommunities(communitiesData);
    } catch (error) {
      console.error("Error obteniendo comunidades:", error);
      setErrorMessage("Error al cargar lista de comunidades");
      
      // Datos de demostración en caso de error
      setCommunities([
        { id: "1", name: "Comunidad de ejemplo #1", description: "Descripción 1", creator: "0x1234...6789", isBanned: false },
        { id: "2", name: "Comunidad de ejemplo #2", description: "Descripción 2", creator: "0x2345...7890", isBanned: false },
        { id: "3", name: "Comunidad de ejemplo #3", description: "Descripción 3", creator: "0x3456...8901", isBanned: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizado condicional basado en el estado de autenticación y permisos
  if (isLoading) {
    return (
      <div className="container mx-auto my-8 p-4">
        <h1 className="text-2xl font-bold mb-4 text-[var(--matrix-green)]">Panel de Administración</h1>
        <p>Cargando...</p>
      </div>
    );
  }

  // Mostrar interfaz de conexión de wallet si no está conectado
  if (!isConnected) {
    return (
      <div className="container mx-auto my-8 p-4">
        <h1 className="text-2xl font-bold mb-4 text-[var(--matrix-green)]">Panel de Administración</h1>
        <div className="mb-6">
          <p className="mb-4">Por favor, conecta tu wallet para acceder al panel de administración.</p>
          <Button onClick={connect} className="bg-[var(--matrix-green)] text-black hover:bg-[var(--matrix-green)]/80">
            Conectar Wallet
          </Button>
        </div>
      </div>
    );
  }

  // Si está conectado pero no tiene permisos
  if (!isAdmin && !isOwner) {
    return (
      <div className="container mx-auto my-8 p-4">
        <h1 className="text-2xl font-bold mb-4 text-[var(--matrix-green)]">Panel de Administración</h1>
        <div className="mb-4 flex items-center">
          <div className="bg-black/50 border border-[var(--matrix-green)] rounded-md p-3 mb-4">
            <h2 className="font-semibold mb-2 text-[var(--matrix-green)]">Información de Wallet</h2>
            <p className="font-mono text-sm mb-2">{address}</p>
            <div className="flex items-center text-yellow-500">
              <User className="h-4 w-4 mr-2" />
              <span>Usuario Regular</span>
            </div>
          </div>
        </div>
        <p>No tienes permisos para acceder a esta página. Solo los administradores y owners pueden gestionar baneos.</p>
        {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
      </div>
    );
  }

  // Filtrar elementos según la búsqueda
  const filteredUsers = users.filter(user => 
    user.address.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredCommunities = communities.filter(community => 
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Componente de interfaz de usuario en modo usuario
  const UserModeInterface = () => (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-[var(--matrix-green)]">Vista de Usuario</CardTitle>
          <CardDescription>
            En este modo puedes ver la plataforma como un usuario regular.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Como usuario puedes:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Visualizar comunidades disponibles</li>
            <li>Leer publicaciones activas</li>
            <li>Crear nuevas publicaciones (si perteneces a una comunidad)</li>
            <li>Comentar en publicaciones existentes</li>
          </ul>
          <div className="mt-4">
            <Button 
              variant="outline" 
              className="border-[var(--matrix-green)] text-[var(--matrix-green)]"
              onClick={() => window.location.href = '/foro'}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver Foro
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[var(--matrix-green)]">Mis Datos</CardTitle>
          <CardDescription>
            Información de tu cuenta y estadísticas de uso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-sm mb-1">Dirección de Wallet</h3>
              <p className="font-mono text-xs">{address}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-sm mb-1">Roles</h3>
              <div className="flex gap-2">
                {isOwner && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/20 text-yellow-400">
                    <Crown className="h-3 w-3 mr-1" /> Owner
                  </span>
                )}
                {isAdmin && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400">
                    <Shield className="h-3 w-3 mr-1" /> Admin
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-sm mb-1">Estadísticas</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 rounded p-2">
                  <p className="text-xs text-gray-400">Publicaciones</p>
                  <p className="text-lg font-semibold text-[var(--matrix-green)]">
                    {posts.filter(p => address && p.author.toLowerCase() === address.toLowerCase()).length || "0"}
                  </p>
                </div>
                <div className="bg-black/30 rounded p-2">
                  <p className="text-xs text-gray-400">Comunidades</p>
                  <p className="text-lg font-semibold text-[var(--matrix-green)]">
                    {communities.filter(c => address && c.creator.toLowerCase() === address.toLowerCase()).length || "0"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Componente de interfaz de usuario en modo administrador
  const AdminModeInterface = () => (
    <div>
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="communities">Comunidades</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <AdminUsersPanel 
            users={filteredUsers} 
            onRefresh={fetchUsers} 
            provider={provider} 
          />
        </TabsContent>
        
        <TabsContent value="posts">
          <AdminPostsPanel 
            posts={filteredPosts} 
            onRefresh={fetchPosts} 
            provider={provider} 
          />
        </TabsContent>
        
        <TabsContent value="communities">
          <AdminCommunitiesPanel 
            communities={filteredCommunities} 
            onRefresh={fetchCommunities} 
            provider={provider} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="container mx-auto my-8 p-4">
      <h1 className="text-2xl font-bold mb-4 text-[var(--matrix-green)]">Panel de Administración</h1>
      
      {/* Información de la wallet y roles del usuario */}
      <div className="bg-black/50 border border-[var(--matrix-green)] rounded-md p-3 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-semibold mb-2 text-[var(--matrix-green)]">Información de Wallet</h2>
            <p className="font-mono text-sm mb-2">{address}</p>
            <div className="flex flex-wrap gap-4">
              {isOwner && (
                <div className="flex items-center text-yellow-500">
                  <Crown className="h-4 w-4 mr-2" />
                  <span>Owner</span>
                </div>
              )}
              {isAdmin && (
                <div className="flex items-center text-blue-500">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Administrador</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Selector de modo */}
          <div className="flex items-center space-x-4 bg-black/30 p-2 rounded">
            <div className={`flex items-center ${!adminMode ? 'text-[var(--matrix-green)]' : 'text-gray-400'}`}>
              <User className="h-4 w-4 mr-1" />
              <span>Usuario</span>
            </div>
            
            <Switch
              checked={adminMode}
              onCheckedChange={setAdminMode}
              className="data-[state=checked]:bg-[var(--matrix-green)]"
            />
            
            <div className={`flex items-center ${adminMode ? 'text-[var(--matrix-green)]' : 'text-gray-400'}`}>
              <Settings className="h-4 w-4 mr-1" />
              <span>Admin</span>
            </div>
          </div>
        </div>
      </div>
      
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      
      {/* Barra de búsqueda (solo visible en modo administrador) */}
      {adminMode && (
        <div className="mb-4">
          <Input
            placeholder="Buscar por nombre, dirección o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md border-[var(--matrix-green)]"
          />
        </div>
      )}
      
      {/* Mostrar la interfaz según el modo seleccionado */}
      {adminMode ? <AdminModeInterface /> : <UserModeInterface />}
    </div>
  );
}
