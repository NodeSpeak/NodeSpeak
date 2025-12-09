"use client";

import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

// Query Keys - centralizados para evitar typos y facilitar invalidación
export const queryKeys = {
  // Comunidades
  communities: {
    all: ['communities'] as const,
    active: () => [...queryKeys.communities.all, 'active'] as const,
    detail: (id: string) => [...queryKeys.communities.all, 'detail', id] as const,
    members: (id: string) => [...queryKeys.communities.all, 'members', id] as const,
    topics: (id: string) => [...queryKeys.communities.all, 'topics', id] as const,
    userCommunities: (address: string) => [...queryKeys.communities.all, 'user', address] as const,
  },

  // Posts
  posts: {
    all: ['posts'] as const,
    active: () => [...queryKeys.posts.all, 'active'] as const,
    byCommunity: (communityId: string) => [...queryKeys.posts.all, 'community', communityId] as const,
    byTopic: (communityId: string, topic: string) => [...queryKeys.posts.all, 'community', communityId, 'topic', topic] as const,
    detail: (id: string) => [...queryKeys.posts.all, 'detail', id] as const,
    userLikes: (postIds: string[], userAddress: string) => [...queryKeys.posts.all, 'likes', userAddress, ...postIds] as const,
  },

  // Comentarios
  comments: {
    all: ['comments'] as const,
    byPost: (postId: string) => [...queryKeys.comments.all, 'post', postId] as const,
  },

  // Perfiles
  profiles: {
    all: ['profiles'] as const,
    detail: (address: string) => [...queryKeys.profiles.all, 'detail', address] as const,
    exists: (address: string) => [...queryKeys.profiles.all, 'exists', address] as const,
    followers: (address: string) => [...queryKeys.profiles.all, 'followers', address] as const,
    following: (address: string) => [...queryKeys.profiles.all, 'following', address] as const,
  },
} as const;

// Configuración por defecto del QueryClient
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Tiempo antes de considerar datos "stale" (5 minutos)
        staleTime: 5 * 60 * 1000,
        // Tiempo de cache (10 minutos)
        gcTime: 10 * 60 * 1000,
        // Reintentos en caso de error
        retry: (failureCount, error) => {
          // No reintentar si es un error de validación o del usuario
          if (error instanceof Error && error.message.includes('user rejected')) {
            return false;
          }
          return failureCount < 2;
        },
        // Refetch en background cuando la ventana recibe foco
        refetchOnWindowFocus: false,
        // Refetch cuando se reconecta a internet
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: siempre crear nuevo cliente
    return makeQueryClient();
  } else {
    // Browser: reutilizar cliente singleton
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function QueryClientProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  );
}

// Export para uso directo en componentes
export { getQueryClient };
