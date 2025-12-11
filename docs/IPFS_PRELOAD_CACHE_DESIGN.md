# Diseño de Precarga y Caché IPFS para NodeSpeak

> **Documento de Diseño** - No implementar sin revisión
> **Fecha**: Diciembre 2024
> **Versión**: 1.0

---

## Resumen Ejecutivo

Este documento propone una estrategia de **precarga inteligente y caché persistente** para archivos IPFS en NodeSpeak, optimizando la experiencia de usuario mediante:

1. **Priorización por relevancia visual** (above-the-fold primero)
2. **Caché de dos niveles**: React Query (memoria) + IndexedDB (persistente)
3. **Precarga adaptativa** según condiciones de red y visibilidad
4. **Integración con el sistema de gateways existente**

### Beneficios esperados
- Reducción de LCP (Largest Contentful Paint) en ~40-60%
- Cache hit rate > 80% para usuarios recurrentes
- Cero refetches innecesarios para contenido inmutable

---

## 1. Estado Actual (Mapping)

### 1.1 Arquitectura de Archivos IPFS

```
lib/
├── ipfsClient.ts      # Cliente centralizado IPFS
│   ├── fetchText()           # Texto/JSON (caché memoria TTL 10min)
│   ├── fetchJSON()           # JSON parseado (caché memoria)
│   ├── fetchContent()        # Auto-detect JSON/texto
│   ├── fetchIPFSFileWithCache()  # Blobs (caché IndexedDB)
│   ├── getImageUrl()         # URL builder con gateway saludable
│   ├── getAllImageUrls()     # Todas las URLs de gateways
│   └── prefetchCIDs()        # Precarga básica existente
│
├── ipfsCache.ts       # IndexedDB wrapper (SSR-safe)
│   ├── getCachedFile()
│   ├── setCachedFile()
│   ├── hasCachedFile()
│   └── getAllCachedCIDs()
│
hooks/queries/
├── useIPFSFile.ts     # Hook React Query para blobs
│   ├── useIPFSFile()         # Hook principal
│   ├── prefetchIPFSFile()    # Prefetch individual
│   ├── prefetchIPFSFiles()   # Prefetch batch
│   └── useIPFSPrefetch()     # Hook con queryClient
```

### 1.2 Flujo de Datos por Tipo de Contenido

| Tipo | Fuente | Fetcher | Caché Actual | Componente |
|------|--------|---------|--------------|------------|
| **Avatar** (profile) | `profileCID` | `fetchIPFSFileWithCache` | IndexedDB + RQ | `IPFSImage`, `ImageWithFallback` |
| **Cover** (profile) | `coverCID` | `fetchIPFSFileWithCache` | IndexedDB + RQ | `IPFSImage`, `ImageWithFallback` |
| **Community photo** | `photo` | `getAllImageUrls` | Ninguno (direct URL) | `ImageWithFallback` |
| **Community cover** | `coverImage` | `getAllImageUrls` | Ninguno (direct URL) | `ImageWithFallback` |
| **Post image** | `imageCID` → `imageUrl` | `getImageUrl` | Ninguno (direct URL) | `<img>` directo |
| **Post content** | `contentCID` | `fetchContent` | Memoria TTL 10min | Texto/HTML |
| **Community data** | `contentCID` | `fetchContent` | Memoria TTL 10min | JSON |
| **Bio** | `bioCID` | `fetchText` | Memoria TTL 10min | Texto |
| **Video** | CID | `fetchIPFSFileWithCache` | IndexedDB + RQ | `IPFSVideo` |
| **File download** | CID | `fetchIPFSFileWithCache` | IndexedDB + RQ | `IPFSFileDownload` |

### 1.3 Configuración React Query Actual

```typescript
// lib/queryClient.tsx - Configuración global
{
  staleTime: 5 * 60 * 1000,    // 5 minutos
  gcTime: 10 * 60 * 1000,      // 10 minutos
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: 2
}

// hooks/queries/useIPFSFile.ts - Para archivos IPFS
{
  staleTime: Infinity,          // Nunca stale (inmutable)
  gcTime: Infinity,             // Nunca garbage collect
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  retry: false                  // Gateways manejan fallback
}
```

### 1.4 Gateways Configurados

```typescript
// Para texto/JSON (ipfsClient.ts)
const GATEWAYS = [
  'gateway.pinata.cloud',
  'ipfs.io',
  'dweb.link',
  'cf-ipfs.com',
  'hardbin.com',
  'w3s.link'
];

// Para archivos binarios (más rápidos para blobs)
const FILE_GATEWAYS = [
  'w3s.link',
  'cloudflare-ipfs.com',
  'gateway.pinata.cloud',
  'ipfs.io'
];
```

### 1.5 Problemas Identificados

1. **Inconsistencia de caché**: `ImageWithFallback` usa URLs directas sin IndexedDB
2. **Sin precarga proactiva**: Solo se carga on-demand
3. **Sin priorización**: Avatar y fondo below-the-fold se cargan igual
4. **Sin límite de concurrencia**: Múltiples fetches simultáneos pueden saturar
5. **Sin consideración de red**: Se precarga igual en WiFi que en metered
6. **Posts usan URL directa**: `imageUrl` bypasea el sistema de caché

---

## 2. Diseño Propuesto

### 2.1 Arquitectura de Precarga

```
┌─────────────────────────────────────────────────────────────────┐
│                        PÁGINA (ej: /foro)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    useIPFSPreload Hook                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  preloadNow(candidates)     ← Critical (avatar, 1st post)  │ │
│  │  preloadInBackground()      ← High/Medium (visible)        │ │
│  │  preloadOnIdle()            ← Low (below-fold)             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ipfsPrioritizer Module                       │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ classifyCID()  │  │ shouldPreload()│  │ getPreloadQueue()│  │
│  │ → priority     │  │ → network/vis  │  │ → sorted CIDs    │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Concurrency Limiter                           │
│         maxConcurrent: 3 (critical) / 2 (background)            │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  React Query    │  │   IndexedDB     │  │  Gateway Pool   │
│  (in-memory)    │  │  (persistent)   │  │  (multi-fetch)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2 Criterios de Prioridad

```typescript
type IPFSPriority = 'critical' | 'high' | 'medium' | 'low';

interface PreloadCandidate {
  cid: string;
  type: 'avatar' | 'cover' | 'post-image' | 'community-photo' | 'video' | 'file';
  context: 'visible' | 'near-viewport' | 'below-fold' | 'prefetch';
  estimatedSize?: 'small' | 'medium' | 'large'; // <100KB, 100KB-1MB, >1MB
}
```

| Tipo | Prioridad Base | Ajustes |
|------|----------------|---------|
| Avatar (propio) | `critical` | - |
| Avatar (otros) | `high` | `medium` si below-fold |
| Community photo | `high` | - |
| Post image (1st visible) | `critical` | - |
| Post image (2nd-5th) | `high` | - |
| Post image (6th+) | `medium` | `low` si below-fold |
| Cover image | `medium` | `low` si colapsado |
| Video | `low` | Solo metadatos |
| Files | `low` | Solo on-demand |

### 2.3 Condiciones de Red

```typescript
interface NetworkConditions {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  saveData: boolean;
  isMetered: boolean;
}

// Reglas de precarga
if (saveData || effectiveType === 'slow-2g') {
  // Solo critical
  maxPreload = 'critical';
} else if (effectiveType === '2g' || isMetered) {
  // Critical + high
  maxPreload = 'high';
} else {
  // Todo
  maxPreload = 'low';
}
```

---

## 3. API Pública Propuesta

### 3.1 `ipfsPrioritizer.ts`

```typescript
// lib/ipfsPrioritizer.ts

export type IPFSPriority = 'critical' | 'high' | 'medium' | 'low';

export interface PreloadCandidate {
  cid: string;
  type: 'avatar' | 'cover' | 'post-image' | 'community-photo' | 'video' | 'file';
  context?: 'visible' | 'near-viewport' | 'below-fold' | 'prefetch';
  estimatedSize?: 'small' | 'medium' | 'large';
}

export interface PrioritizedCID {
  cid: string;
  priority: IPFSPriority;
  type: PreloadCandidate['type'];
}

/**
 * Clasifica un CID según su prioridad de carga
 */
export function classifyCID(candidate: PreloadCandidate): PrioritizedCID;

/**
 * Determina si se debe precargar según condiciones de red
 */
export function shouldPreload(
  priority: IPFSPriority,
  networkConditions?: NetworkConditions
): boolean;

/**
 * Ordena candidatos por prioridad para cola de precarga
 */
export function getPreloadQueue(candidates: PreloadCandidate[]): PrioritizedCID[];

/**
 * Obtiene condiciones de red actuales (SSR-safe)
 */
export function getNetworkConditions(): NetworkConditions | null;
```

### 3.2 `useIPFSPreload.ts`

```typescript
// hooks/useIPFSPreload.ts

export interface UseIPFSPreloadOptions {
  /** Límite de concurrencia para cargas críticas */
  maxConcurrentCritical?: number; // default: 3
  /** Límite de concurrencia para background */
  maxConcurrentBackground?: number; // default: 2
  /** Respetar navigator.connection.saveData */
  respectDataSaver?: boolean; // default: true
}

export interface UseIPFSPreloadReturn {
  /**
   * Precarga inmediata para contenido crítico (above-the-fold)
   * Bloquea hasta completar o timeout
   */
  preloadNow: (candidates: PreloadCandidate[]) => Promise<void>;

  /**
   * Precarga en background usando requestIdleCallback
   * No bloquea, ejecuta cuando hay CPU idle
   */
  preloadInBackground: (candidates: PreloadCandidate[]) => void;

  /**
   * Cancela precargas pendientes en background
   */
  cancelPending: () => void;

  /**
   * Estado de la cola de precarga
   */
  status: {
    pending: number;
    loading: number;
    completed: number;
    failed: number;
  };
}

export function useIPFSPreload(options?: UseIPFSPreloadOptions): UseIPFSPreloadReturn;
```

### 3.3 `useIPFSCacheSync.ts`

```typescript
// hooks/useIPFSCacheSync.ts

export interface UseIPFSCacheSyncOptions {
  /** Intervalo de sincronización (ms) */
  syncInterval?: number; // default: 5 * 60 * 1000 (5 min)
  /** Máximo de entradas en IndexedDB */
  maxCacheSize?: number; // default: 500
  /** Tamaño máximo total (bytes) */
  maxCacheBytes?: number; // default: 100 * 1024 * 1024 (100MB)
}

export interface UseIPFSCacheSyncReturn {
  /**
   * Rehidrata React Query desde IndexedDB al montar
   */
  rehydrate: () => Promise<void>;

  /**
   * Limpia entradas antiguas de IndexedDB
   */
  prune: () => Promise<{ removed: number; freedBytes: number }>;

  /**
   * Estadísticas del caché
   */
  stats: {
    entryCount: number;
    estimatedBytes: number;
    oldestEntry: Date | null;
  };

  /**
   * Fuerza sincronización
   */
  sync: () => Promise<void>;
}

export function useIPFSCacheSync(options?: UseIPFSCacheSyncOptions): UseIPFSCacheSyncReturn;
```

### 3.4 `useIPFSVisibility.ts`

```typescript
// hooks/useIPFSVisibility.ts

export interface UseIPFSVisibilityOptions {
  /** Margen para considerar "near-viewport" */
  rootMargin?: string; // default: '200px'
  /** Threshold para IntersectionObserver */
  threshold?: number; // default: 0
}

/**
 * Hook para precarga reactiva basada en visibilidad
 * Usa IntersectionObserver para detectar elementos entrando al viewport
 */
export function useIPFSVisibility(
  cid: string | null,
  type: PreloadCandidate['type'],
  options?: UseIPFSVisibilityOptions
): {
  ref: React.RefObject<HTMLElement>;
  isVisible: boolean;
  isNearViewport: boolean;
};
```

---

## 4. Flujo de Integración por Página

### 4.1 `/foro` (Feed Principal)

```
┌──────────────────────────────────────────────────────────────┐
│  useEffect (mount)                                           │
│  └─ preloadNow([                                             │
│       { cid: currentUser.avatar, type: 'avatar' },           │
│       { cid: selectedCommunity.photo, type: 'community' },   │
│       { cid: posts[0].imageCID, type: 'post-image' }         │
│     ])                                                       │
├──────────────────────────────────────────────────────────────┤
│  useEffect (posts loaded)                                    │
│  └─ preloadInBackground([                                    │
│       ...posts.slice(1, 10).map(p => ({                      │
│         cid: p.imageCID,                                     │
│         type: 'post-image',                                  │
│         context: index < 5 ? 'near-viewport' : 'below-fold'  │
│       })),                                                   │
│       ...communities.map(c => ({                             │
│         cid: c.photo,                                        │
│         type: 'community-photo'                              │
│       }))                                                    │
│     ])                                                       │
├──────────────────────────────────────────────────────────────┤
│  PostCard (cada post)                                        │
│  └─ useIPFSVisibility(imageCID, 'post-image')                │
│     → Precarga cuando está a 200px del viewport              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 `/profile/[address]`

```
┌──────────────────────────────────────────────────────────────┐
│  useEffect (mount)                                           │
│  └─ preloadNow([                                             │
│       { cid: profile.avatar, type: 'avatar' },               │
│       { cid: profile.cover, type: 'cover' }                  │
│     ])                                                       │
├──────────────────────────────────────────────────────────────┤
│  useEffect (communities loaded)                              │
│  └─ preloadInBackground([                                    │
│       ...userCommunities.map(c => ({                         │
│         cid: c.photo,                                        │
│         type: 'community-photo'                              │
│       }))                                                    │
│     ])                                                       │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Sidebar / Community List

```
┌──────────────────────────────────────────────────────────────┐
│  Cuando se monta el sidebar:                                 │
│  └─ preloadInBackground([                                    │
│       ...visibleCommunities.map(c => ({                      │
│         cid: c.photo,                                        │
│         type: 'community-photo',                             │
│         context: 'visible'                                   │
│       }))                                                    │
│     ])                                                       │
├──────────────────────────────────────────────────────────────┤
│  CommunityCard (IntersectionObserver)                        │
│  └─ useIPFSVisibility(photo, 'community-photo')              │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Recomendaciones React Query

### 5.1 Configuración Diferenciada

```typescript
// Para archivos IPFS (blobs) - YA IMPLEMENTADO
const ipfsFileQueryOptions = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  retry: false,
};

// Para contenido texto/JSON - PROPUESTO
const ipfsTextQueryOptions = {
  staleTime: 30 * 60 * 1000,  // 30 min (vs 10 min actual)
  gcTime: 60 * 60 * 1000,     // 1 hora
  refetchOnWindowFocus: false,
  refetchOnMount: false,      // CAMBIO: evita refetch innecesario
  refetchOnReconnect: false,
  retry: 1,
};

// Para datos blockchain (posts, communities)
const blockchainQueryOptions = {
  staleTime: 1 * 60 * 1000,   // 1 min
  gcTime: 5 * 60 * 1000,      // 5 min
  refetchOnWindowFocus: true, // Mantener sincronizado
  retry: 2,
};
```

### 5.2 Persistencia Opcional con `persistQueryClient`

```typescript
// Opcional: usar @tanstack/query-persist-client-core
// para persistir React Query cache en IndexedDB

import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createIDBPersister } from './idbPersister';

const persister = createIDBPersister('nodespeak-query-cache');

persistQueryClient({
  queryClient,
  persister,
  dehydrateOptions: {
    // Solo persistir queries IPFS (inmutables)
    shouldDehydrateQuery: (query) => {
      return query.queryKey[0] === 'ipfs';
    },
  },
});
```

---

## 6. Plan de Trabajo (TODO)

### Fase 1: Infraestructura Base
| # | Tarea | Archivos | Riesgo | Prioridad |
|---|-------|----------|--------|-----------|
| 1.1 | Crear `lib/ipfsPrioritizer.ts` | Nuevo | Bajo | Alta |
| 1.2 | Crear `hooks/useIPFSPreload.ts` | Nuevo | Medio | Alta |
| 1.3 | Agregar detección de red | `ipfsPrioritizer.ts` | Bajo | Media |
| 1.4 | Limiter de concurrencia | `useIPFSPreload.ts` | Medio | Alta |

### Fase 2: Sincronización de Caché
| # | Tarea | Archivos | Riesgo | Prioridad |
|---|-------|----------|--------|-----------|
| 2.1 | Crear `hooks/useIPFSCacheSync.ts` | Nuevo | Medio | Media |
| 2.2 | Implementar `prune()` con LRU | `ipfsCache.ts` | Medio | Media |
| 2.3 | Rehidratación en startup | `useIPFSCacheSync.ts` | Bajo | Media |

### Fase 3: Precarga Reactiva
| # | Tarea | Archivos | Riesgo | Prioridad |
|---|-------|----------|--------|-----------|
| 3.1 | Crear `hooks/useIPFSVisibility.ts` | Nuevo | Bajo | Media |
| 3.2 | Integrar en `IPFSImage` | `IPFSImage.tsx` | Bajo | Alta |
| 3.3 | Migrar `ImageWithFallback` a usar caché | `ImageWithFallback.tsx` | Medio | Alta |

### Fase 4: Integración en Páginas
| # | Tarea | Archivos | Riesgo | Prioridad |
|---|-------|----------|--------|-----------|
| 4.1 | Integrar en `/foro` | `app/foro/page.tsx` | Bajo | Alta |
| 4.2 | Integrar en `/profile` | `app/profile/page.tsx` | Bajo | Media |
| 4.3 | Integrar en `IntegratedView` | `IntegratedView.tsx` | Medio | Media |

### Fase 5: Optimizaciones y Métricas
| # | Tarea | Archivos | Riesgo | Prioridad |
|---|-------|----------|--------|-----------|
| 5.1 | Agregar métricas de cache hit | `ipfsCache.ts` | Bajo | Baja |
| 5.2 | Dashboard de stats (dev) | Nuevo (opcional) | Bajo | Baja |
| 5.3 | Tests de rendimiento | `__tests__/` | Bajo | Media |

### Precauciones Especiales

| Área | Riesgo | Mitigación |
|------|--------|------------|
| **Videos** | Alto consumo de ancho de banda | Solo precargar metadatos, cargar on-play |
| **Archivos grandes** | Llenar IndexedDB | Límite de 100MB, pruning LRU |
| **Red metered** | Usuario en datos móviles | Respetar `navigator.connection.saveData` |
| **SSR** | IndexedDB no disponible | Todos los hooks son SSR-safe |
| **Concurrencia** | Saturar conexiones | Límite estricto de 3 críticos, 2 background |

---

## 7. Métricas y Tests Sugeridos

### 7.1 Métricas a Medir

```typescript
interface IPFSCacheMetrics {
  // Performance
  cacheHitRate: number;           // % de requests servidos desde caché
  avgFetchTime: number;           // ms promedio para fetch de red
  avgCacheTime: number;           // ms promedio para fetch de caché

  // Storage
  indexedDBEntries: number;
  indexedDBSizeBytes: number;
  reactQueryEntries: number;

  // Network
  totalBytesFetched: number;
  totalBytesSaved: number;        // = hits * avgSize
  failedFetches: number;
  gatewayFailoverCount: number;

  // UX
  lcpImprovement: number;         // ms reducidos en LCP
  ttiImprovement: number;         // ms reducidos en TTI
}
```

### 7.2 Tests Sugeridos

```typescript
// __tests__/hooks/useIPFSPreload.test.ts
describe('useIPFSPreload', () => {
  it('respeta límite de concurrencia', async () => {});
  it('prioriza correctamente critical > high > medium > low', async () => {});
  it('cancela precargas pendientes en unmount', async () => {});
  it('respeta saveData flag', async () => {});
});

// __tests__/lib/ipfsPrioritizer.test.ts
describe('ipfsPrioritizer', () => {
  it('clasifica avatar propio como critical', () => {});
  it('degrada prioridad si below-fold', () => {});
  it('detecta correctamente condiciones de red', () => {});
});

// __tests__/hooks/useIPFSCacheSync.test.ts
describe('useIPFSCacheSync', () => {
  it('rehidrata React Query desde IndexedDB', async () => {});
  it('pruning elimina entradas más antiguas', async () => {});
  it('respeta límite de tamaño total', async () => {});
});
```

### 7.3 Herramientas de Monitoreo

- **Chrome DevTools > Application > IndexedDB**: Ver `nodespeak-ipfs-cache`
- **React Query DevTools**: Ver cache entries con key `['ipfs', cid]`
- **Performance tab**: Medir LCP antes/después
- **Network tab**: Verificar reducción de requests IPFS

---

## 8. Notas de Compatibilidad

### 8.1 Con Sistema Actual

- **Gateway health tracking**: Se mantiene intacto en `ipfsClient.ts`
- **`useIPFSFile`**: Sigue funcionando igual, precarga es complementaria
- **`ImageWithFallback`**: Se puede migrar gradualmente a usar `IPFSImage`
- **`getImageUrl()`**: Se mantiene para casos legacy

### 8.2 Breaking Changes (Ninguno)

Esta propuesta es **100% aditiva**. No modifica APIs existentes, solo agrega nuevos módulos y hooks opcionales.

---

## Apéndice: Diagrama de Flujo de Precarga

```
                    ┌───────────────────┐
                    │  Página monta     │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ ¿Hay CIDs para    │
                    │ precargar?        │
                    └─────────┬─────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ CIDs críticos   │             │ CIDs background │
    │ (above-fold)    │             │ (below-fold)    │
    └────────┬────────┘             └────────┬────────┘
             │                               │
             ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ preloadNow()    │             │ requestIdleCallback
    │ await parallel  │             │ preloadInBackground()
    └────────┬────────┘             └────────┬────────┘
             │                               │
             ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ ¿En IndexedDB?  │             │ Verificar red   │
    └────────┬────────┘             │ shouldPreload() │
             │                       └────────┬────────┘
     ┌───────┴───────┐                        │
     ▼               ▼               ┌────────┴────────┐
   [HIT]          [MISS]             ▼                 ▼
     │               │           [PRELOAD]        [SKIP]
     ▼               ▼               │
┌─────────┐    ┌─────────┐           ▼
│ Return  │    │ Fetch   │    ┌─────────────────┐
│ cached  │    │ gateway │    │ Cola con límite │
│ blob    │    │ + store │    │ de concurrencia │
└─────────┘    └─────────┘    └─────────────────┘
```

---

**Fin del documento de diseño**
