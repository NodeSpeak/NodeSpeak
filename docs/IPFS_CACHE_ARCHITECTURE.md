# IPFS Cache Architecture

Sistema de carga y cache local de archivos IPFS para NodeSpeak.

## Resumen

Este sistema proporciona:
- **Carga rápida**: Cache persistente en IndexedDB
- **Fallback robusto**: Múltiples gateways IPFS con timeout
- **Integración React Query**: Cache en memoria + sincronización
- **SSR-safe**: Compatible con Next.js server-side rendering

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Components                          │
│  (IPFSImage, IPFSVideo, IPFSFileDownload)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         useIPFSFile                              │
│  React Query hook (staleTime: ∞, gcTime: ∞)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   fetchIPFSFileWithCache                         │
│  1. Check IndexedDB cache                                        │
│  2. If miss → Try gateways in order (8s timeout each)           │
│  3. Store in IndexedDB on success                               │
└─────────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
┌───────────────────────────┐  ┌───────────────────────────────────┐
│      IndexedDB Cache      │  │         IPFS Gateways              │
│  DB: nodespeak-ipfs-cache │  │  1. w3s.link                       │
│  Store: files             │  │  2. cloudflare-ipfs.com            │
│  Key: CID                 │  │  3. gateway.pinata.cloud           │
│  Value: Blob              │  │  4. ipfs.io                        │
└───────────────────────────┘  └───────────────────────────────────┘
```

## Módulos

### 1. lib/ipfsCache.ts

Cache IndexedDB con CRUD simple.

```typescript
// Verificar disponibilidad (SSR-safe)
isIndexedDBAvailable(): boolean

// Operaciones CRUD
getCachedFile(cid: string): Promise<Blob | null>
setCachedFile(cid: string, blob: Blob): Promise<void>
deleteCachedFile(cid: string): Promise<void>
hasCachedFile(cid: string): Promise<boolean>

// Utilidades
getAllCachedCIDs(): Promise<string[]>
clearAllCachedFiles(): Promise<void>
getCacheStats(): Promise<{ count, cids }>
```

### 2. lib/ipfsClient.ts

Fetch con cache y fallback de gateways.

```typescript
// Fetch con cache persistente
fetchIPFSFileWithCache(cid: string): Promise<Blob | null>

// Fetch múltiple en paralelo
fetchIPFSFilesWithCache(cids: string[]): Promise<Map<string, Blob | null>>
```

**Comportamiento:**
1. Buscar primero en IndexedDB
2. Si no está, intentar gateways en orden:
   - `w3s.link/ipfs/`
   - `cloudflare-ipfs.com/ipfs/`
   - `gateway.pinata.cloud/ipfs/`
   - `ipfs.io/ipfs/`
3. Timeout por gateway: 8 segundos
4. Guardar Blob en IndexedDB al éxito
5. Retornar Blob

### 3. hooks/queries/useIPFSFile.ts

React Query hook para consumir archivos IPFS.

```typescript
const { blob, isLoading, isError, error, refetch } = useIPFSFile(cid);
```

**Configuración React Query:**
- `queryKey`: `["ipfs", cid]`
- `staleTime`: `Infinity` (archivos IPFS son inmutables)
- `gcTime`: `Infinity`
- `refetchOnWindowFocus`: `false`

**Prefetch:**
```typescript
// Hook para prefetch
const { prefetchFile, prefetchFiles } = useIPFSPrefetch();

// Funciones standalone
prefetchIPFSFile(queryClient, cid)
prefetchIPFSFiles(queryClient, cids)
```

### 4. lib/ipfsPrefetch.ts

Utilidades de precacheo para vistas.

```typescript
// Prefetch básico
prefetchIPFSFile(queryClient, cid)
prefetchIPFSFiles(queryClient, cids, { concurrency: 5 })

// Entity-specific
prefetchPostImages(queryClient, posts)
prefetchProfileImages(queryClient, profiles)
prefetchCommunityImages(queryClient, communities)

// Combinado para feeds
prefetchFeedImages(queryClient, { posts, profiles, communities })
```

### 5. Componentes

#### IPFSImage

```tsx
<IPFSImage
  cid="QmXxx..."
  alt="Descripción"
  className="w-full h-48 object-cover"
  fallback={<Placeholder />}
  onLoad={() => console.log('Loaded')}
  onError={() => console.log('Failed')}
/>
```

#### IPFSVideo

```tsx
<IPFSVideo
  cid="QmXxx..."
  className="w-full"
  controls
  autoPlay={false}
  muted
  fallback={<VideoPlaceholder />}
/>
```

#### IPFSFileDownload

```tsx
<IPFSFileDownload
  cid="QmXxx..."
  filename="document.pdf"
  className="btn btn-primary"
>
  Descargar PDF
</IPFSFileDownload>
```

## Uso en Páginas

### Ejemplo: Feed con Precacheo

```tsx
// app/foro/page.tsx
"use client";

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAllPosts } from '@/hooks/queries';
import { prefetchPostImages } from '@/lib/ipfsPrefetch';
import { IPFSImage } from '@/components/IPFSImage';

export default function ForoPage() {
  const queryClient = useQueryClient();
  const { data: posts } = useAllPosts();

  // Precachear imágenes cuando los posts cargan
  useEffect(() => {
    if (posts?.length) {
      prefetchPostImages(queryClient, posts);
    }
  }, [posts, queryClient]);

  return (
    <div>
      {posts?.map(post => (
        <article key={post.id}>
          {post.imageUrl && (
            <IPFSImage
              cid={post.cid}
              alt={post.title}
              className="w-full h-48 object-cover rounded"
            />
          )}
          <h2>{post.title}</h2>
        </article>
      ))}
    </div>
  );
}
```

### Ejemplo: Perfil con Avatar

```tsx
import { IPFSImage } from '@/components/IPFSImage';

function UserProfile({ profile }) {
  return (
    <div className="flex items-center gap-4">
      <IPFSImage
        cid={profile.avatarCID}
        alt={profile.username}
        className="w-16 h-16 rounded-full"
        fallback={<DefaultAvatar />}
      />
      <span>{profile.username}</span>
    </div>
  );
}
```

## Flujo de Datos

```
Usuario ve componente
        │
        ▼
┌───────────────────┐
│   useIPFSFile     │
│   (React Query)   │
└───────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  ¿Está en React Query cache?          │
│  (staleTime: Infinity)                │
└───────────────────────────────────────┘
        │ No          │ Sí
        ▼             ▼
┌───────────────┐   Retornar Blob
│ queryFn       │
└───────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  ¿Está en IndexedDB?                  │
└───────────────────────────────────────┘
        │ No          │ Sí
        ▼             ▼
┌───────────────┐   Retornar Blob
│ Fetch gateway │
│ (con fallback)│
└───────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Guardar en IndexedDB (async)         │
│  Actualizar React Query cache         │
└───────────────────────────────────────┘
        │
        ▼
    Retornar Blob
```

## SSR Considerations

Todos los módulos son SSR-safe:

1. **ipfsCache.ts**: Verifica `typeof window !== 'undefined'` antes de usar IndexedDB
2. **fetchIPFSFileWithCache**: Funciona en server pero no cachea en IndexedDB
3. **useIPFSFile**: Hook de React Query, solo ejecuta en cliente
4. **Componentes**: Usan `"use client"` directive

## Tests

Ubicación: `__tests__/`

```bash
# Ejecutar tests (requiere Jest configurado)
npm test

# Tests incluidos:
# - __tests__/lib/ipfsCache.test.ts
# - __tests__/lib/ipfsClient.test.ts
# - __tests__/hooks/useIPFSFile.test.tsx
```

**Casos de test:**
1. Si CID está en IndexedDB → no fetch de red
2. Si falla un gateway → usar siguiente
3. Blob guardado correctamente por CID
4. SSR safety (no errores en server)

## Configuración de Test

Para ejecutar tests, necesitas:

```bash
npm install -D jest @testing-library/react @testing-library/react-hooks fake-indexeddb
```

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['fake-indexeddb/auto'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

## Performance

- **Primera carga**: ~1-8s (dependiendo del gateway)
- **Cargas subsecuentes**: <50ms (IndexedDB)
- **Memory footprint**: Mínimo (Blobs en IndexedDB, no en memoria)
- **Concurrencia de prefetch**: Configurable (default: 5 paralelos)

## Limitaciones

1. **Tamaño de IndexedDB**: Varía por browser (~50MB-unlimited)
2. **Sin expiración automática**: Los archivos permanecen hasta limpieza manual
3. **Sin sincronización entre tabs**: Cada tab lee de IndexedDB independientemente

## Limpieza de Cache

```typescript
import { clearAllCachedFiles, getCacheStats } from '@/lib/ipfsCache';

// Ver estadísticas
const stats = await getCacheStats();
console.log(`Cached: ${stats.count} files`);

// Limpiar todo
await clearAllCachedFiles();
```

## Migración desde ImageWithFallback

El componente existente `ImageWithFallback` sigue funcionando. Para migrar:

```tsx
// Antes
<ImageWithFallback cid={imageCID} alt="Image" />

// Después (con cache persistente)
<IPFSImage cid={imageCID} alt="Image" />
```

La diferencia principal es que `IPFSImage` usa IndexedDB para persistir entre sesiones, mientras que `ImageWithFallback` solo usa gateway URLs directamente.
