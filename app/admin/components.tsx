"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Loader2, Ban, CheckCircle } from "lucide-react";
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_Commuties";
import { Contract } from "ethers";

// Interfaces para los componentes
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

// Panel de administración de usuarios
export function AdminUsersPanel({ users, onRefresh, provider }: { users: User[], onRefresh: () => void, provider: any }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [reason, setReason] = useState("");
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);

  const handleBanUser = async () => {
    if (!selectedAddress) return;
    
    setIsProcessing(true);
    setActionError("");
    
    try {
      const contract = new Contract(forumAddress, forumABI, await provider.getSigner());
      
      // Llamar a la función de baneo en el contrato
      await contract.banUser(selectedAddress, reason || "Violación de las normas de la comunidad");
      
      // Actualizar la lista de usuarios
      onRefresh();
      setShowBanDialog(false);
      setReason("");
    } catch (error) {
      console.error("Error al banear usuario:", error);
      setActionError("Error al banear usuario. Verifica que tengas los permisos necesarios.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedAddress) return;
    
    setIsProcessing(true);
    setActionError("");
    
    try {
      const contract = new Contract(forumAddress, forumABI, await provider.getSigner());
      
      // Llamar a la función de desbaneo en el contrato
      await contract.unbanUser(selectedAddress);
      
      // Actualizar la lista de usuarios
      onRefresh();
      setShowUnbanDialog(false);
    } catch (error) {
      console.error("Error al desbanear usuario:", error);
      setActionError("Error al desbanear usuario. Verifica que tengas los permisos necesarios.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[var(--matrix-green)]">Administración de Usuarios</CardTitle>
        <CardDescription>Gestiona los baneos de usuarios en la plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        {actionError && (
          <div className="bg-red-900/20 border border-red-600 p-3 rounded-md mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-500 h-5 w-5" />
            <p className="text-red-400 text-sm">{actionError}</p>
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dirección</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No hay usuarios disponibles o coincidentes con la búsqueda
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.address}>
                  <TableCell className="font-mono">{user.address}</TableCell>
                  <TableCell>
                    {user.isBanned ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/20 text-red-400">
                        Baneado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/20 text-green-400">
                        Activo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.isBanned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAddress(user.address);
                          setShowUnbanDialog(true);
                        }}
                        className="text-green-400 border-green-400 hover:bg-green-900/20"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Desbanear
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAddress(user.address);
                          setShowBanDialog(true);
                        }}
                        className="text-red-400 border-red-400 hover:bg-red-900/20"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Banear
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onRefresh} disabled={isProcessing}>
          Actualizar Lista
        </Button>
      </CardFooter>

      {/* Diálogo para banear usuarios */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banear Usuario</DialogTitle>
            <DialogDescription>
              Esta acción impedirá que el usuario realice publicaciones y comentarios.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Dirección</Label>
            <Input
              value={selectedAddress}
              readOnly
              className="w-full bg-secondary/50 font-mono text-sm"
            />
            
            <Label className="mb-2 mt-4 block">Razón del baneo (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica por qué estás baneando a este usuario..."
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBanUser} 
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Banear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para desbanear usuarios */}
      <Dialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desbanear Usuario</DialogTitle>
            <DialogDescription>
              Esta acción permitirá que el usuario vuelva a realizar publicaciones y comentarios.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Dirección</Label>
            <Input
              value={selectedAddress}
              readOnly
              className="w-full bg-secondary/50 font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnbanDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUnbanUser} 
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desbanear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Panel de administración de posts
export function AdminPostsPanel({ posts, onRefresh, provider }: { posts: Post[], onRefresh: () => void, provider: any }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [reason, setReason] = useState("");
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleBanPost = async () => {
    if (!selectedPostId) return;
    
    setIsProcessing(true);
    setActionError("");
    
    try {
      const contract = new Contract(forumAddress, forumABI, await provider.getSigner());
      
      // Llamar a la función de baneo en el contrato
      await contract.banPost(selectedPostId, reason || "Contenido inapropiado");
      
      // Actualizar la lista de posts
      onRefresh();
      setShowBanDialog(false);
      setReason("");
    } catch (error) {
      console.error("Error al banear post:", error);
      setActionError("Error al banear post. Verifica que tengas los permisos necesarios.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnbanPost = async () => {
    if (!selectedPostId) return;
    
    setIsProcessing(true);
    setActionError("");
    
    try {
      const contract = new Contract(forumAddress, forumABI, await provider.getSigner());
      
      // Llamar a la función de desbaneo en el contrato
      await contract.unbanPost(selectedPostId);
      
      // Actualizar la lista de posts
      onRefresh();
      setShowUnbanDialog(false);
    } catch (error) {
      console.error("Error al desbanear post:", error);
      setActionError("Error al desbanear post. Verifica que tengas los permisos necesarios.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[var(--matrix-green)]">Administración de Posts</CardTitle>
        <CardDescription>Gestiona los baneos de publicaciones en la plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        {actionError && (
          <div className="bg-red-900/20 border border-red-600 p-3 rounded-md mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-500 h-5 w-5" />
            <p className="text-red-400 text-sm">{actionError}</p>
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No hay posts disponibles o coincidentes con la búsqueda
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-mono">{post.id.substring(0, 8)}...</TableCell>
                  <TableCell>{post.title}</TableCell>
                  <TableCell className="font-mono">{post.author.substring(0, 8)}...</TableCell>
                  <TableCell>
                    {post.isBanned ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/20 text-red-400">
                        Baneado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/20 text-green-400">
                        Activo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {post.isBanned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPostId(post.id);
                          setSelectedPost(post);
                          setShowUnbanDialog(true);
                        }}
                        className="text-green-400 border-green-400 hover:bg-green-900/20"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Desbanear
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPostId(post.id);
                          setSelectedPost(post);
                          setShowBanDialog(true);
                        }}
                        className="text-red-400 border-red-400 hover:bg-red-900/20"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Banear
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onRefresh} disabled={isProcessing}>
          Actualizar Lista
        </Button>
      </CardFooter>

      {/* Diálogo para banear posts */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banear Post</DialogTitle>
            <DialogDescription>
              Esta acción ocultará el post de la vista pública.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">ID del Post</Label>
            <Input
              value={selectedPostId}
              readOnly
              className="w-full bg-secondary/50 font-mono text-sm"
            />
            
            {selectedPost && (
              <>
                <Label className="mb-2 mt-4 block">Título</Label>
                <Input
                  value={selectedPost.title}
                  readOnly
                  className="w-full bg-secondary/50"
                />
                
                <Label className="mb-2 mt-4 block">Autor</Label>
                <Input
                  value={selectedPost.author}
                  readOnly
                  className="w-full bg-secondary/50 font-mono text-sm"
                />
              </>
            )}
            
            <Label className="mb-2 mt-4 block">Razón del baneo (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica por qué estás baneando este post..."
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBanPost} 
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Banear Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para desbanear posts */}
      <Dialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desbanear Post</DialogTitle>
            <DialogDescription>
              Esta acción hará que el post vuelva a ser visible públicamente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">ID del Post</Label>
            <Input
              value={selectedPostId}
              readOnly
              className="w-full bg-secondary/50 font-mono text-sm"
            />
            
            {selectedPost && (
              <>
                <Label className="mb-2 mt-4 block">Título</Label>
                <Input
                  value={selectedPost.title}
                  readOnly
                  className="w-full bg-secondary/50"
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnbanDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUnbanPost} 
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desbanear Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Panel de administración de comunidades
export function AdminCommunitiesPanel({ communities, onRefresh, provider }: { communities: Community[], onRefresh: () => void, provider: any }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [selectedCommunityId, setSelectedCommunityId] = useState("");
  const [reason, setReason] = useState("");
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  const handleBanCommunity = async () => {
    if (!selectedCommunityId) return;
    
    setIsProcessing(true);
    setActionError("");
    
    try {
      const contract = new Contract(forumAddress, forumABI, await provider.getSigner());
      
      // Llamar a la función de baneo en el contrato
      await contract.banCommunity(selectedCommunityId, reason || "Violación de las normas de la plataforma");
      
      // Actualizar la lista de comunidades
      onRefresh();
      setShowBanDialog(false);
      setReason("");
    } catch (error) {
      console.error("Error al banear comunidad:", error);
      setActionError("Error al banear comunidad. Verifica que tengas los permisos necesarios.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnbanCommunity = async () => {
    if (!selectedCommunityId) return;
    
    setIsProcessing(true);
    setActionError("");
    
    try {
      const contract = new Contract(forumAddress, forumABI, await provider.getSigner());
      
      // Llamar a la función de desbaneo en el contrato
      await contract.unbanCommunity(selectedCommunityId);
      
      // Actualizar la lista de comunidades
      onRefresh();
      setShowUnbanDialog(false);
    } catch (error) {
      console.error("Error al desbanear comunidad:", error);
      setActionError("Error al desbanear comunidad. Verifica que tengas los permisos necesarios.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[var(--matrix-green)]">Administración de Comunidades</CardTitle>
        <CardDescription>Gestiona los baneos de comunidades en la plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        {actionError && (
          <div className="bg-red-900/20 border border-red-600 p-3 rounded-md mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-500 h-5 w-5" />
            <p className="text-red-400 text-sm">{actionError}</p>
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Creador</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {communities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No hay comunidades disponibles o coincidentes con la búsqueda
                </TableCell>
              </TableRow>
            ) : (
              communities.map((community) => (
                <TableRow key={community.id}>
                  <TableCell className="font-mono">{community.id.substring(0, 8)}...</TableCell>
                  <TableCell>{community.name}</TableCell>
                  <TableCell className="font-mono">{community.creator.substring(0, 8)}...</TableCell>
                  <TableCell>
                    {community.isBanned ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/20 text-red-400">
                        Baneada
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/20 text-green-400">
                        Activa
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {community.isBanned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCommunityId(community.id);
                          setSelectedCommunity(community);
                          setShowUnbanDialog(true);
                        }}
                        className="text-green-400 border-green-400 hover:bg-green-900/20"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Desbanear
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCommunityId(community.id);
                          setSelectedCommunity(community);
                          setShowBanDialog(true);
                        }}
                        className="text-red-400 border-red-400 hover:bg-red-900/20"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Banear
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onRefresh} disabled={isProcessing}>
          Actualizar Lista
        </Button>
      </CardFooter>

      {/* Diálogo para banear comunidades */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banear Comunidad</DialogTitle>
            <DialogDescription>
              Esta acción ocultará la comunidad y sus publicaciones de la vista pública.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">ID de la Comunidad</Label>
            <Input
              value={selectedCommunityId}
              readOnly
              className="w-full bg-secondary/50 font-mono text-sm"
            />
            
            {selectedCommunity && (
              <>
                <Label className="mb-2 mt-4 block">Nombre</Label>
                <Input
                  value={selectedCommunity.name}
                  readOnly
                  className="w-full bg-secondary/50"
                />
                
                <Label className="mb-2 mt-4 block">Creador</Label>
                <Input
                  value={selectedCommunity.creator}
                  readOnly
                  className="w-full bg-secondary/50 font-mono text-sm"
                />
              </>
            )}
            
            <Label className="mb-2 mt-4 block">Razón del baneo (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica por qué estás baneando esta comunidad..."
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBanCommunity} 
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Banear Comunidad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para desbanear comunidades */}
      <Dialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desbanear Comunidad</DialogTitle>
            <DialogDescription>
              Esta acción hará que la comunidad vuelva a ser visible públicamente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">ID de la Comunidad</Label>
            <Input
              value={selectedCommunityId}
              readOnly
              className="w-full bg-secondary/50 font-mono text-sm"
            />
            
            {selectedCommunity && (
              <>
                <Label className="mb-2 mt-4 block">Nombre</Label>
                <Input
                  value={selectedCommunity.name}
                  readOnly
                  className="w-full bg-secondary/50"
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnbanDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUnbanCommunity} 
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desbanear Comunidad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
