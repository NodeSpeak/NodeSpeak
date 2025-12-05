"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useWalletContext } from "./WalletContext";

// Tipos para usuarios y comunidades ocultas
interface HiddenUser {
  address: string;
  username: string;
  hiddenAt: number;
  reason?: string;
}

interface HiddenCommunity {
  id: string;
  name: string;
  hiddenAt: number;
  reason?: string;
}

interface AdminContextProps {
  isAdmin: boolean;
  hiddenUsers: HiddenUser[];
  hiddenCommunities: HiddenCommunity[];
  hideUser: (address: string, username: string, reason?: string) => void;
  unhideUser: (address: string) => void;
  isUserHidden: (address: string) => boolean;
  hideCommunity: (id: string, name: string, reason?: string) => void;
  unhideCommunity: (id: string) => void;
  isCommunityHidden: (id: string) => boolean;
}

const AdminContext = createContext<AdminContextProps>({
  isAdmin: false,
  hiddenUsers: [],
  hiddenCommunities: [],
  hideUser: () => {},
  unhideUser: () => {},
  isUserHidden: () => false,
  hideCommunity: () => {},
  unhideCommunity: () => {},
  isCommunityHidden: () => false,
});

// Define admin addresses here - replace with your admin wallet addresses
// You can add multiple admin addresses by adding them to this array
const ADMIN_ADDRESSES: string[] = [
  // Modo de prueba: cualquier dirección es considerada admin
  // Para producción, reemplazar este array con direcciones específicas
];

// Función para verificar si el usuario es admin
// En modo de prueba, cualquier dirección conectada será admin
const isUserAdmin = (userAddress: string | undefined | null): boolean => {
  if (!userAddress) return false;
  
  // Modo de prueba: CUALQUIER dirección conectada es admin
  return true;
  
  // Modo producción (descomentar cuando esté listo):
  // return ADMIN_ADDRESSES.some(addr => addr.toLowerCase() === userAddress.toLowerCase());
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useWalletContext();
  const [hiddenUsers, setHiddenUsers] = useState<HiddenUser[]>([]);
  const [hiddenCommunities, setHiddenCommunities] = useState<HiddenCommunity[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar si el usuario actual es admin
  useEffect(() => {
    // Usar la nueva función isUserAdmin
    setIsAdmin(isUserAdmin(address));
  }, [address]);

  // Cargar datos de usuarios ocultos desde localStorage al montar
  useEffect(() => {
    const storedUsers = localStorage.getItem("nodespeak_hidden_users");
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        setHiddenUsers(parsed);
      } catch (error) {
        console.error("Error loading hidden users:", error);
      }
    }

    const storedCommunities = localStorage.getItem("nodespeak_hidden_communities");
    if (storedCommunities) {
      try {
        const parsed = JSON.parse(storedCommunities);
        setHiddenCommunities(parsed);
      } catch (error) {
        console.error("Error loading hidden communities:", error);
      }
    }
  }, []);

  // Guardar usuarios ocultos en localStorage cuando cambian
  useEffect(() => {
    if (hiddenUsers.length > 0) {
      localStorage.setItem("nodespeak_hidden_users", JSON.stringify(hiddenUsers));
    } else {
      localStorage.removeItem("nodespeak_hidden_users");
    }
  }, [hiddenUsers]);

  // Guardar comunidades ocultas en localStorage cuando cambian
  useEffect(() => {
    if (hiddenCommunities.length > 0) {
      localStorage.setItem("nodespeak_hidden_communities", JSON.stringify(hiddenCommunities));
    } else {
      localStorage.removeItem("nodespeak_hidden_communities");
    }
  }, [hiddenCommunities]);

  // Funciones para gestionar usuarios ocultos
  const hideUser = (address: string, username: string, reason?: string) => {
    if (!isAdmin) {
      console.warn("Solo administradores pueden ocultar usuarios");
      return;
    }

    const existingUser = hiddenUsers.find(
      (u) => u.address.toLowerCase() === address.toLowerCase()
    );

    if (existingUser) {
      console.warn("El usuario ya está oculto");
      return;
    }

    const newHiddenUser: HiddenUser = {
      address,
      username,
      hiddenAt: Date.now(),
      reason,
    };

    setHiddenUsers([...hiddenUsers, newHiddenUser]);
  };

  const unhideUser = (address: string) => {
    if (!isAdmin) {
      console.warn("Solo administradores pueden restablecer usuarios");
      return;
    }

    setHiddenUsers(
      hiddenUsers.filter((u) => u.address.toLowerCase() !== address.toLowerCase())
    );
  };

  const isUserHidden = (address: string): boolean => {
    return hiddenUsers.some(
      (u) => u.address.toLowerCase() === address.toLowerCase()
    );
  };

  // Funciones para gestionar comunidades ocultas
  const hideCommunity = (id: string, name: string, reason?: string) => {
    if (!isAdmin) {
      console.warn("Solo administradores pueden ocultar comunidades");
      return;
    }

    const existingCommunity = hiddenCommunities.find((c) => c.id === id);

    if (existingCommunity) {
      console.warn("La comunidad ya está oculta");
      return;
    }

    const newHiddenCommunity: HiddenCommunity = {
      id,
      name,
      hiddenAt: Date.now(),
      reason,
    };

    setHiddenCommunities([...hiddenCommunities, newHiddenCommunity]);
  };

  const unhideCommunity = (id: string) => {
    if (!isAdmin) {
      console.warn("Solo administradores pueden restablecer comunidades");
      return;
    }

    setHiddenCommunities(hiddenCommunities.filter((c) => c.id !== id));
  };

  const isCommunityHidden = (id: string): boolean => {
    return hiddenCommunities.some((c) => c.id === id);
  };

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        hiddenUsers,
        hiddenCommunities,
        hideUser,
        unhideUser,
        isUserHidden,
        hideCommunity,
        unhideCommunity,
        isCommunityHidden,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => useContext(AdminContext);
