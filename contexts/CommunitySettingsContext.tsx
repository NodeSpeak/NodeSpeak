"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Tipos para configuración de comunidades
interface CommunitySettings {
  communityId: string;
  isClosed: boolean;
  creatorAddress: string;
  createdAt: number;
}

interface MembershipRequest {
  id: string; // `${communityId}_${requesterAddress}`
  communityId: string;
  requesterAddress: string;
  requestedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: number;
}

interface CommunitySettingsContextProps {
  communitySettings: CommunitySettings[];
  membershipRequests: MembershipRequest[];
  setCommunityType: (communityId: string, isClosed: boolean, creatorAddress: string) => void;
  isCommunityOpen: (communityId: string) => boolean;
  getCommunitySettings: (communityId: string) => CommunitySettings | undefined;
  canViewContent: (communityId: string, userAddress: string, isMember: boolean) => boolean;
  requestMembership: (communityId: string, requesterAddress: string) => void;
  approveMembership: (requestId: string, reviewerAddress: string) => string | null; // returns requester address
  rejectMembership: (requestId: string, reviewerAddress: string) => void;
  getPendingRequests: (communityId: string) => MembershipRequest[];
  getUserRequests: (userAddress: string) => MembershipRequest[];
  hasPendingRequest: (communityId: string, userAddress: string) => boolean;
  getRequestStatus: (communityId: string, userAddress: string) => 'pending' | 'approved' | 'rejected' | null;
}

const CommunitySettingsContext = createContext<CommunitySettingsContextProps>({
  communitySettings: [],
  membershipRequests: [],
  setCommunityType: () => {},
  isCommunityOpen: () => true,
  getCommunitySettings: () => undefined,
  canViewContent: () => true,
  requestMembership: () => {},
  approveMembership: () => null,
  rejectMembership: () => {},
  getPendingRequests: () => [],
  getUserRequests: () => [],
  hasPendingRequest: () => false,
  getRequestStatus: () => null,
});

// localStorage keys
const COMMUNITY_SETTINGS_KEY = "nodespeak_community_settings";
const MEMBERSHIP_REQUESTS_KEY = "nodespeak_membership_requests";

export const CommunitySettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [communitySettings, setCommunitySettings] = useState<CommunitySettings[]>([]);
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);

  // Cargar datos desde localStorage al montar
  useEffect(() => {
    const storedSettings = localStorage.getItem(COMMUNITY_SETTINGS_KEY);
    if (storedSettings) {
      try {
        setCommunitySettings(JSON.parse(storedSettings));
      } catch (e) {
        console.error("Error parsing community settings from localStorage:", e);
      }
    }

    const storedRequests = localStorage.getItem(MEMBERSHIP_REQUESTS_KEY);
    if (storedRequests) {
      try {
        setMembershipRequests(JSON.parse(storedRequests));
      } catch (e) {
        console.error("Error parsing membership requests from localStorage:", e);
      }
    }
  }, []);

  // Guardar settings en localStorage cuando cambien
  useEffect(() => {
    if (communitySettings.length > 0) {
      localStorage.setItem(COMMUNITY_SETTINGS_KEY, JSON.stringify(communitySettings));
    }
  }, [communitySettings]);

  // Guardar requests en localStorage cuando cambien
  useEffect(() => {
    if (membershipRequests.length > 0) {
      localStorage.setItem(MEMBERSHIP_REQUESTS_KEY, JSON.stringify(membershipRequests));
    }
  }, [membershipRequests]);

  // Establecer tipo de comunidad (al crear)
  const setCommunityType = useCallback((communityId: string, isClosed: boolean, creatorAddress: string) => {
    setCommunitySettings(prev => {
      // Si ya existe, actualizar
      const existing = prev.find(s => s.communityId === communityId);
      if (existing) {
        return prev.map(s =>
          s.communityId === communityId
            ? { ...s, isClosed, creatorAddress }
            : s
        );
      }
      // Si no existe, agregar
      return [...prev, {
        communityId,
        isClosed,
        creatorAddress,
        createdAt: Date.now()
      }];
    });
  }, []);

  // Verificar si comunidad es abierta (default: true)
  const isCommunityOpen = useCallback((communityId: string): boolean => {
    const settings = communitySettings.find(s => s.communityId === communityId);
    // Si no hay configuración, es abierta por defecto
    if (!settings) return true;
    return !settings.isClosed;
  }, [communitySettings]);

  // Obtener configuración de comunidad
  const getCommunitySettings = useCallback((communityId: string): CommunitySettings | undefined => {
    return communitySettings.find(s => s.communityId === communityId);
  }, [communitySettings]);

  // Determinar si usuario puede ver contenido
  const canViewContent = useCallback((communityId: string, userAddress: string, isMember: boolean): boolean => {
    // Si es miembro, siempre puede ver
    if (isMember) return true;

    // Buscar configuración
    const settings = communitySettings.find(s => s.communityId === communityId);

    // Si no hay config o es abierta, puede ver
    if (!settings || !settings.isClosed) return true;

    // Comunidad cerrada y no es miembro: no puede ver
    return false;
  }, [communitySettings]);

  // Solicitar membresía
  const requestMembership = useCallback((communityId: string, requesterAddress: string) => {
    if (!requesterAddress) return;

    const requestId = `${communityId}_${requesterAddress.toLowerCase()}`;

    setMembershipRequests(prev => {
      // Si ya existe una solicitud, no crear otra
      const existing = prev.find(r => r.id === requestId);
      if (existing) return prev;

      return [...prev, {
        id: requestId,
        communityId,
        requesterAddress: requesterAddress.toLowerCase(),
        requestedAt: Date.now(),
        status: 'pending'
      }];
    });
  }, []);

  // Aprobar solicitud de membresía
  const approveMembership = useCallback((requestId: string, reviewerAddress: string): string | null => {
    let requesterAddress: string | null = null;

    setMembershipRequests(prev => {
      return prev.map(r => {
        if (r.id === requestId && r.status === 'pending') {
          requesterAddress = r.requesterAddress;
          return {
            ...r,
            status: 'approved' as const,
            reviewedBy: reviewerAddress.toLowerCase(),
            reviewedAt: Date.now()
          };
        }
        return r;
      });
    });

    return requesterAddress;
  }, []);

  // Rechazar solicitud de membresía
  const rejectMembership = useCallback((requestId: string, reviewerAddress: string) => {
    setMembershipRequests(prev => {
      return prev.map(r => {
        if (r.id === requestId && r.status === 'pending') {
          return {
            ...r,
            status: 'rejected' as const,
            reviewedBy: reviewerAddress.toLowerCase(),
            reviewedAt: Date.now()
          };
        }
        return r;
      });
    });
  }, []);

  // Obtener solicitudes pendientes para una comunidad
  const getPendingRequests = useCallback((communityId: string): MembershipRequest[] => {
    return membershipRequests.filter(
      r => r.communityId === communityId && r.status === 'pending'
    );
  }, [membershipRequests]);

  // Obtener solicitudes de un usuario
  const getUserRequests = useCallback((userAddress: string): MembershipRequest[] => {
    if (!userAddress) return [];
    return membershipRequests.filter(
      r => r.requesterAddress === userAddress.toLowerCase()
    );
  }, [membershipRequests]);

  // Verificar si hay solicitud pendiente
  const hasPendingRequest = useCallback((communityId: string, userAddress: string): boolean => {
    if (!userAddress) return false;
    return membershipRequests.some(
      r => r.communityId === communityId &&
           r.requesterAddress === userAddress.toLowerCase() &&
           r.status === 'pending'
    );
  }, [membershipRequests]);

  // Obtener estado de solicitud
  const getRequestStatus = useCallback((communityId: string, userAddress: string): 'pending' | 'approved' | 'rejected' | null => {
    if (!userAddress) return null;
    const request = membershipRequests.find(
      r => r.communityId === communityId && r.requesterAddress === userAddress.toLowerCase()
    );
    return request?.status || null;
  }, [membershipRequests]);

  return (
    <CommunitySettingsContext.Provider
      value={{
        communitySettings,
        membershipRequests,
        setCommunityType,
        isCommunityOpen,
        getCommunitySettings,
        canViewContent,
        requestMembership,
        approveMembership,
        rejectMembership,
        getPendingRequests,
        getUserRequests,
        hasPendingRequest,
        getRequestStatus,
      }}
    >
      {children}
    </CommunitySettingsContext.Provider>
  );
};

export const useCommunitySettings = () => useContext(CommunitySettingsContext);
