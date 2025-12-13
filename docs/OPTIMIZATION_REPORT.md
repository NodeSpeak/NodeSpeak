# Informe de Optimización de Carga de Contenido

**Fecha:** Diciembre 2024  
**Proyecto:** NodeSpeak  
**Stack:** Next.js 13.5 + React Query + ethers.js + IPFS

---

## 📊 Estado Actual

### ✅ Implementado Correctamente

| Área | Implementación | Archivo |
|------|----------------|---------|
| **React Query** | Configuración centralizada con staleTime/gcTime | `lib/queryClient.tsx` |
| **Query Keys** | Factory pattern centralizado | `lib/queryClient.tsx` |
| **Optimistic Updates** | Join/Leave community, Like post, Comments | `hooks/queries/*.ts` |
| **IPFS Cache** | IndexedDB persistente para blobs | `lib/ipfsCache.ts` |
| **IPFS Prefetch** | Sistema de prefetch con concurrencia | `lib/ipfsPrefetch.ts` |
| **Gateway Fallback** | Multi-gateway con health tracking | `lib/ipfsClient.ts` |
| **Image Fallback** | Componente con retry automático | `components/ImageWithFallback.tsx` |
| **Loading Skeletons** | 4 variantes (Post, Forum, Profile, Admin) | `components/skeletons/` |
| **Parallel Fetching** | Promise.all en activity page | `app/activity/page.tsx` |
| **Toast Notifications** | Sonner en lugar de alert() | Múltiples archivos |
| **Virtualización** | Componentes creados (no integrados) | `components/forum/Virtualized*.tsx` |

### ⚙️ Configuración de Cache Actual

```typescript
// Global (queryClient.tsx)
staleTime: 5 * 60 * 1000   // 5 minutos
gcTime: 10 * 60 * 1000     // 10 minutos

// Por tipo de datos:
- IPFS Files: staleTime: Infinity, gcTime: Infinity ✅
- Communities: staleTime: 2 min
- Posts: staleTime: 1 min
- Comments: staleTime: 30 seg
- Profiles: staleTime: 5 min
- User Likes: staleTime: 30 seg
```

---

## 🔴 Problemas Identificados

### 1. **No hay Infinite Scroll / Paginación**
- `activity/page.tsx` carga TODOS los posts de TODAS las comunidades
- Sin límite de items renderizados
- Impacto: Alto consumo de memoria y tiempo de carga inicial

### 2. **No hay React Suspense / Streaming**
- Sin `loading.tsx` en rutas
- Sin Suspense boundaries para streaming SSR
- Impacto: Bloqueo de UI durante carga

### 3. **Virtualización No Integrada**
- Componentes `VirtualizedPostList` y `VirtualizedCommunityList` creados
- No están siendo usados en las páginas
- Impacto: DOM pesado con muchos posts

### 4. **Imágenes sin Optimización Next.js**
- Solo 1 uso de `next/image` en todo el proyecto
- `ImageWithFallback` usa `<img>` nativo
- Impacto: Sin lazy loading nativo, sin optimización de formato

### 5. **Fetching Duplicado en activity/page.tsx**
- `fetchActivity()` hace fetching manual con `useEffect`
- No usa los hooks de React Query existentes (`useCommunities`, `usePosts`)
- Impacto: No aprovecha cache de React Query

### 6. **Sin Service Worker / Offline Support**
- No hay PWA configurado
- Sin cache de assets estáticos
- Impacto: Sin soporte offline

### 7. **Bundle Size sin Analizar**
- `IntegratedView.tsx` tiene 2515 líneas
- Sin code splitting efectivo (dynamic import creado pero no usado)
- Impacto: Bundle inicial grande

---

## 🟡 Recomendaciones de Mejora

### Alta Prioridad

#### 1. Implementar Infinite Scroll con `useInfiniteQuery`
```typescript
// hooks/queries/usePosts.ts
export function useInfiniteCommunityPosts(communityId: string) {
  return useInfiniteQuery({
    queryKey: ['posts', 'infinite', communityId],
    queryFn: ({ pageParam = 0 }) => fetchPostsPage(communityId, pageParam, 20),
    getNextPageParam: (lastPage, pages) => 
      lastPage.length === 20 ? pages.length : undefined,
    initialPageParam: 0,
  });
}
```

#### 2. Integrar Virtualización en Páginas
```typescript
// app/foro/page.tsx
import { VirtualizedPostList } from '@/components/forum';

// Reemplazar map de posts con:
<VirtualizedPostList
  posts={posts}
  containerHeight="calc(100vh - 200px)"
  estimatedItemHeight={350}
  // ... otras props
/>
```

#### 3. Agregar loading.tsx para Streaming
```typescript
// app/activity/loading.tsx
export default function Loading() {
  return <ActivityLoadingSkeleton />;
}

// app/foro/loading.tsx
export default function Loading() {
  return <ForumSkeleton />;
}
```

#### 4. Refactorizar activity/page.tsx para usar React Query
```typescript
// Cambiar de useEffect + fetch manual a:
const { data: communities } = useCommunities();
const { data: posts } = useAllPosts();

// Esto aprovecha el cache existente
```

### Media Prioridad

#### 5. Optimizar ImageWithFallback con next/image
```typescript
import Image from 'next/image';

// En ImageWithFallback.tsx, usar:
<Image
  src={currentUrl}
  alt={alt}
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy"
  placeholder="blur"
  blurDataURL={BLUR_DATA_URL}
/>
```

#### 6. Implementar Suspense Boundaries
```typescript
// app/foro/page.tsx
import { Suspense } from 'react';

<Suspense fallback={<PostSkeleton />}>
  <PostList communityId={selectedCommunityId} />
</Suspense>
```

#### 7. Activar Dynamic Import de IntegratedView
```typescript
// Ya creado en foro/page.tsx, verificar que esté activo:
const IntegratedView = dynamic(
  () => import('@/components/IntegratedView'),
  { 
    loading: () => <ForumSkeleton />,
    ssr: false 
  }
);
```

### Baja Prioridad

#### 8. Agregar PWA / Service Worker
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  // config existente
});
```

#### 9. Analizar Bundle Size
```bash
npm install @next/bundle-analyzer
# Agregar a next.config.js
```

#### 10. Implementar Stale-While-Revalidate para IPFS
```typescript
// Para contenido IPFS texto/JSON que puede cambiar:
{
  staleTime: 30 * 60 * 1000,  // 30 min
  gcTime: 60 * 60 * 1000,     // 1 hora
  refetchOnMount: 'always',   // SWR pattern
}
```

---

## 📈 Métricas de Impacto Esperado

| Mejora | Métrica | Impacto Estimado |
|--------|---------|------------------|
| Infinite Scroll | Tiempo de carga inicial | -60% |
| Virtualización | Uso de memoria | -70% |
| loading.tsx | Time to First Paint | -40% |
| next/image | Tamaño de imágenes | -50% |
| React Query en activity | Requests duplicados | -80% |
| Code Splitting | Bundle inicial | -30% |

---

## 🛠️ Plan de Implementación Sugerido

### Fase 1 (Inmediato - Alto Impacto)
1. ✅ Crear `loading.tsx` para rutas principales
2. ✅ Integrar `VirtualizedPostList` en foro/page.tsx
3. ✅ Refactorizar activity/page.tsx para usar hooks existentes

### Fase 2 (Corto Plazo)
4. Implementar `useInfiniteQuery` para posts
5. Optimizar `ImageWithFallback` con next/image
6. Activar dynamic import de IntegratedView

### Fase 3 (Mediano Plazo)
7. Agregar Suspense boundaries
8. Configurar PWA
9. Analizar y optimizar bundle

---

## 📁 Archivos Clave para Modificar

```
app/
├── activity/
│   ├── page.tsx          # Refactorizar fetching
│   └── loading.tsx       # CREAR
├── foro/
│   ├── page.tsx          # Integrar virtualización
│   └── loading.tsx       # CREAR
└── profile/
    └── loading.tsx       # CREAR

components/
├── ImageWithFallback.tsx # Migrar a next/image
└── forum/
    ├── VirtualizedPostList.tsx      # INTEGRAR
    └── VirtualizedCommunityList.tsx # INTEGRAR

hooks/queries/
└── usePosts.ts           # Agregar useInfiniteQuery
```

---

## Conclusión

El proyecto tiene una **base sólida** con React Query, sistema de cache IPFS, y optimistic updates. Las principales oportunidades de mejora están en:

1. **Paginación/Infinite scroll** - Mayor impacto en UX
2. **Virtualización** - Ya creada, solo falta integrar
3. **Streaming SSR** - Agregar loading.tsx
4. **Optimización de imágenes** - Migrar a next/image

Implementar las mejoras de Fase 1 debería reducir el tiempo de carga inicial en ~50% y el uso de memoria en ~60%.
