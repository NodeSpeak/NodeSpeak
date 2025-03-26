import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { LogIn, LogOut, Loader2 } from 'lucide-react';

interface HackMDAuthButtonProps {
  onAuthStateChange?: (isAuthenticated: boolean) => void;
  className?: string;
}

export const HackMDAuthButton: React.FC<HackMDAuthButtonProps> = ({
  onAuthStateChange,
  className = ''
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [authInProgress, setAuthInProgress] = useState<boolean>(false);
  const { toast } = useToast();
  
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  const checkAuthStatus = async () => {
    try {
      setCheckingAuth(true);
      const response = await fetch('/api/mcp/hackmd/me');
      const isAuth = response.status === 200;
      setIsAuthenticated(isAuth);
      
      if (onAuthStateChange) {
        onAuthStateChange(isAuth);
      }
    } catch (error) {
      console.error('Error checking HackMD auth status:', error);
      setIsAuthenticated(false);
      
      if (onAuthStateChange) {
        onAuthStateChange(false);
      }
    } finally {
      setCheckingAuth(false);
    }
  };
  
  const handleLogin = () => {
    setAuthInProgress(true);
    // Abrir la ventana de autenticación de HackMD
    const authWindow = window.open('/api/mcp/hackmd/auth', 'hackmdAuth', 'width=600,height=700');
    
    // Verificar periódicamente si el usuario ha completado la autenticación
    const checkAuthInterval = setInterval(async () => {
      if (authWindow && authWindow.closed) {
        clearInterval(checkAuthInterval);
        await checkAuthStatus();
        setAuthInProgress(false);
        
        if (isAuthenticated) {
          toast({
            title: "Conexión exitosa",
            description: "Te has conectado correctamente a HackMD",
            duration: 3000,
          });
        }
      }
    }, 1000);
  };
  
  const handleLogout = async () => {
    try {
      setAuthInProgress(true);
      const response = await fetch('/api/mcp/hackmd/logout');
      
      if (response.ok) {
        setIsAuthenticated(false);
        
        if (onAuthStateChange) {
          onAuthStateChange(false);
        }
        
        toast({
          title: "Desconexión exitosa",
          description: "Te has desconectado de HackMD",
          duration: 3000,
        });
      } else {
        toast({
          title: "Error al desconectar",
          description: "No se pudo desconectar de HackMD",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error logging out from HackMD:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al desconectar de HackMD",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setAuthInProgress(false);
    }
  };
  
  if (checkingAuth) {
    return (
      <Button variant="outline" className={className} disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Verificando...
      </Button>
    );
  }
  
  return isAuthenticated ? (
    <Button 
      variant="outline" 
      className={className}
      onClick={handleLogout}
      disabled={authInProgress}
    >
      {authInProgress ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Desconectando...
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          Desconectar de HackMD
        </>
      )}
    </Button>
  ) : (
    <Button 
      variant="default" 
      className={className}
      onClick={handleLogin}
      disabled={authInProgress}
    >
      {authInProgress ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Conectando...
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4 mr-2" />
          Conectar con HackMD
        </>
      )}
    </Button>
  );
};
