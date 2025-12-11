# 📊 Auditoría de Componentes UI - NodeSpeak

**Fecha:** 11 de Diciembre, 2025  
**Total de componentes:** 47  
**Componentes en `/components/ui/`**

---

## ✅ COMPONENTES UTILIZADOS (13/47 = 28%)

### Componentes Principales (Uso Alto)

| Componente | Archivos | Ubicaciones Principales |
|------------|----------|------------------------|
| **button** | 14+ | app/admin, app/profile, components/admin/*, IntegratedView, WalletConnect, theme-toggle |
| **input** | 5 | app/profile/edit, components/admin/* |
| **card** | 5 | app/admin, components/admin/* |
| **table** | 4 | components/admin/HiddenUsersPanel, HiddenCommunitiesPanel, UserCommunitiesPanel |
| **badge** | 2 | components/admin/UserCommunitiesPanel |
| **dialog** | 3 | components/admin/UserHideButton, CommunityHideButton |
| **tabs** | 2 | app/admin/page.tsx |
| **label** | 2 | app/profile/edit |
| **textarea** | 2 | app/profile/edit |
| **tooltip** | 2 | components/admin/AdminFloatingButton |
| **toast** | 1 | components/ui/toaster.tsx |
| **toaster** | 1 | app/layout.tsx |
| **toggle** | 1 | Uso indirecto |

---

## ❌ COMPONENTES NO UTILIZADOS (34/47 = 72%)

### Categoría: Formularios (8 componentes)

```
❌ checkbox          - @radix-ui/react-checkbox
❌ radio-group       - @radix-ui/react-radio-group
❌ select            - @radix-ui/react-select
❌ slider            - @radix-ui/react-slider
❌ switch            - @radix-ui/react-switch
❌ calendar          - react-day-picker + date-fns
❌ input-otp         - input-otp
❌ form              - react-hook-form
```

**Dependencias asociadas:**
- `@radix-ui/react-checkbox`
- `@radix-ui/react-radio-group`
- `@radix-ui/react-select`
- `@radix-ui/react-slider`
- `@radix-ui/react-switch`
- `react-day-picker`
- `date-fns`
- `input-otp`

**Tamaño estimado:** ~200 KB

---

### Categoría: Navegación (5 componentes)

```
❌ breadcrumb        - Sin dependencia Radix
❌ menubar           - @radix-ui/react-menubar
❌ navigation-menu   - @radix-ui/react-navigation-menu
❌ pagination        - Usa buttonVariants
❌ command           - cmdk
```

**Dependencias asociadas:**
- `@radix-ui/react-menubar`
- `@radix-ui/react-navigation-menu`
- `cmdk` (~30 KB)

**Tamaño estimado:** ~80 KB

---

### Categoría: Overlays/Modales (5 componentes)

```
❌ alert-dialog      - @radix-ui/react-alert-dialog
❌ drawer            - vaul
❌ hover-card        - @radix-ui/react-hover-card
❌ popover           - @radix-ui/react-popover
❌ sheet             - @radix-ui/react-dialog
```

**Dependencias asociadas:**
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-hover-card`
- `@radix-ui/react-popover`
- `vaul` (~20 KB)

**Tamaño estimado:** ~70 KB

---

### Categoría: Contenedores (6 componentes)

```
❌ accordion         - @radix-ui/react-accordion
❌ collapsible       - @radix-ui/react-collapsible
❌ scroll-area       - @radix-ui/react-scroll-area
❌ resizable         - react-resizable-panels
❌ carousel          - embla-carousel-react
❌ aspect-ratio      - @radix-ui/react-aspect-ratio
```

**Dependencias asociadas:**
- `@radix-ui/react-accordion`
- `@radix-ui/react-collapsible`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-aspect-ratio`
- `react-resizable-panels` (~25 KB)
- `embla-carousel-react` (~40 KB)

**Tamaño estimado:** ~120 KB

---

### Categoría: Feedback (5 componentes)

```
❌ alert             - class-variance-authority
❌ progress          - @radix-ui/react-progress
❌ skeleton          - Sin dependencia Radix
❌ sonner            - Wrapper de sonner (librería SÍ usada)
❌ context-menu      - @radix-ui/react-context-menu
```

**Dependencias asociadas:**
- `@radix-ui/react-progress`
- `@radix-ui/react-context-menu`

**Nota:** `sonner` (la librería) SÍ se usa directamente en el código, pero el componente wrapper `sonner.tsx` NO.

**Tamaño estimado:** ~40 KB

---

### Categoría: Display (3 componentes)

```
❌ avatar            - @radix-ui/react-avatar
❌ separator         - @radix-ui/react-separator
❌ chart             - recharts (~150 KB)
```

**Dependencias asociadas:**
- `@radix-ui/react-avatar`
- `@radix-ui/react-separator`
- `recharts` (~150 KB) ⚠️ **MUY PESADO**

**Tamaño estimado:** ~170 KB

---

### Categoría: Otros (2 componentes)

```
❌ toggle-group      - @radix-ui/react-toggle-group
❌ dropdown-menu     - @radix-ui/react-dropdown-menu
```

**Dependencias asociadas:**
- `@radix-ui/react-toggle-group`
- `@radix-ui/react-dropdown-menu`

**Tamaño estimado:** ~30 KB

---

## 📊 RESUMEN DE IMPACTO

### Por Tamaño de Bundle

| Categoría | Componentes | Tamaño Estimado | Prioridad Eliminación |
|-----------|-------------|-----------------|----------------------|
| **Display** | 3 | ~170 KB | 🔴 ALTA (recharts) |
| **Formularios** | 8 | ~200 KB | 🟡 MEDIA |
| **Contenedores** | 6 | ~120 KB | 🟡 MEDIA |
| **Navegación** | 5 | ~80 KB | 🟢 BAJA |
| **Overlays** | 5 | ~70 KB | 🟢 BAJA |
| **Feedback** | 5 | ~40 KB | 🟢 BAJA |
| **Otros** | 2 | ~30 KB | 🟢 BAJA |
| **TOTAL** | **34** | **~710 KB** | |

---

## 🎯 RECOMENDACIONES DE LIMPIEZA

### Fase 1: Eliminación Crítica (Ahorro: ~200 KB)

**Componentes con dependencias pesadas:**

```bash
# 1. Eliminar recharts (150 KB) - NO SE USA
rm components/ui/chart.tsx
npm uninstall recharts

# 2. Eliminar date-fns + calendar (70 KB) - NO SE USA
rm components/ui/calendar.tsx
npm uninstall date-fns react-day-picker

# 3. Eliminar embla-carousel (40 KB) - NO SE USA
rm components/ui/carousel.tsx
npm uninstall embla-carousel-react

# 4. Eliminar cmdk (30 KB) - NO SE USA
rm components/ui/command.tsx
npm uninstall cmdk

# 5. Eliminar vaul (20 KB) - NO SE USA
rm components/ui/drawer.tsx
npm uninstall vaul

# 6. Eliminar react-resizable-panels (25 KB) - NO SE USA
rm components/ui/resizable.tsx
npm uninstall react-resizable-panels

# 7. Eliminar input-otp (15 KB) - NO SE USA
rm components/ui/input-otp.tsx
npm uninstall input-otp
```

**Ahorro total Fase 1:** ~350 KB en bundle + ~50 MB en node_modules

---

### Fase 2: Limpieza de Radix UI (Ahorro: ~200 KB)

**Componentes Radix no utilizados:**

```bash
# Eliminar componentes
rm components/ui/accordion.tsx
rm components/ui/alert-dialog.tsx
rm components/ui/aspect-ratio.tsx
rm components/ui/avatar.tsx
rm components/ui/checkbox.tsx
rm components/ui/collapsible.tsx
rm components/ui/context-menu.tsx
rm components/ui/dropdown-menu.tsx
rm components/ui/hover-card.tsx
rm components/ui/menubar.tsx
rm components/ui/navigation-menu.tsx
rm components/ui/popover.tsx
rm components/ui/progress.tsx
rm components/ui/radio-group.tsx
rm components/ui/scroll-area.tsx
rm components/ui/select.tsx
rm components/ui/separator.tsx
rm components/ui/sheet.tsx
rm components/ui/slider.tsx
rm components/ui/switch.tsx
rm components/ui/toggle-group.tsx

# Desinstalar dependencias Radix
npm uninstall \
  @radix-ui/react-accordion \
  @radix-ui/react-alert-dialog \
  @radix-ui/react-aspect-ratio \
  @radix-ui/react-avatar \
  @radix-ui/react-checkbox \
  @radix-ui/react-collapsible \
  @radix-ui/react-context-menu \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-hover-card \
  @radix-ui/react-menubar \
  @radix-ui/react-navigation-menu \
  @radix-ui/react-popover \
  @radix-ui/react-progress \
  @radix-ui/react-radio-group \
  @radix-ui/react-scroll-area \
  @radix-ui/react-select \
  @radix-ui/react-separator \
  @radix-ui/react-slider \
  @radix-ui/react-switch \
  @radix-ui/react-toggle-group
```

**Ahorro total Fase 2:** ~200 KB en bundle + ~30 MB en node_modules

---

### Fase 3: Componentes Simples (Ahorro: ~160 KB)

**Componentes sin dependencias externas pesadas:**

```bash
# Estos son más seguros de eliminar
rm components/ui/alert.tsx
rm components/ui/breadcrumb.tsx
rm components/ui/pagination.tsx
rm components/ui/skeleton.tsx
rm components/ui/sonner.tsx  # Wrapper no usado (librería sonner SÍ se usa)
rm components/ui/form.tsx     # Si no se usa react-hook-form con formularios
```

---

## ⚠️ COMPONENTES A MANTENER

**Estos 13 componentes SÍ están en uso:**

```
✅ button.tsx         - Usado en 14+ archivos
✅ input.tsx          - Usado en 5 archivos
✅ label.tsx          - Usado en 2 archivos
✅ textarea.tsx       - Usado en 2 archivos
✅ card.tsx           - Usado en 5 archivos
✅ table.tsx          - Usado en 4 archivos
✅ badge.tsx          - Usado en 2 archivos
✅ dialog.tsx         - Usado en 3 archivos
✅ tabs.tsx           - Usado en 2 archivos
✅ tooltip.tsx        - Usado en 2 archivos
✅ toast.tsx          - Usado en 1 archivo
✅ toaster.tsx        - Usado en layout
✅ toggle.tsx         - Usado indirectamente
```

**Dependencias Radix a mantener:**
- `@radix-ui/react-dialog`
- `@radix-ui/react-label`
- `@radix-ui/react-slot`
- `@radix-ui/react-tabs`
- `@radix-ui/react-toast`
- `@radix-ui/react-toggle`
- `@radix-ui/react-tooltip`

---

## 📈 IMPACTO TOTAL ESTIMADO

### Antes de la limpieza:
```
Componentes UI: 47
Bundle UI estimado: ~1.2 MB
node_modules UI: ~150 MB
```

### Después de la limpieza completa:
```
Componentes UI: 13 (-72%)
Bundle UI estimado: ~490 KB (-59%)
node_modules UI: ~70 MB (-53%)
```

**Beneficios:**
- ✅ Bundle ~710 KB más pequeño
- ✅ ~80 MB menos en node_modules
- ✅ Código más mantenible
- ✅ Menos superficie de ataque
- ✅ Build más rápido

---

## 🔍 CASOS ESPECIALES

### 1. sonner.tsx vs librería sonner

- **Componente `sonner.tsx`:** ❌ NO usado
- **Librería `sonner`:** ✅ SÍ usada directamente con `import { toast } from 'sonner'`

**Acción:** Eliminar `components/ui/sonner.tsx` pero **mantener** la librería `sonner`.

### 2. form.tsx y react-hook-form

- **Componente `form.tsx`:** ❌ NO usado
- **Librería `react-hook-form`:** ⚠️ Instalada pero no detectada en uso

**Acción:** Verificar si `react-hook-form` se usa. Si no, eliminar ambos.

### 3. Componentes que referencian button

Algunos componentes no usados importan `buttonVariants` de `button.tsx`:
- `alert-dialog.tsx`
- `calendar.tsx`
- `pagination.tsx`

**Acción:** Eliminar sin problema, no afecta a `button.tsx`.

---

## 📝 SCRIPT DE LIMPIEZA AUTOMATIZADO

```bash
#!/bin/bash
# Script de limpieza de componentes UI no utilizados

echo "🧹 Limpiando componentes UI no utilizados..."

# Fase 1: Dependencias pesadas
echo "📦 Fase 1: Eliminando dependencias pesadas..."
npm uninstall recharts date-fns react-day-picker embla-carousel-react cmdk vaul react-resizable-panels input-otp

# Fase 2: Componentes Radix no usados
echo "📦 Fase 2: Eliminando componentes Radix no usados..."
npm uninstall \
  @radix-ui/react-accordion \
  @radix-ui/react-alert-dialog \
  @radix-ui/react-aspect-ratio \
  @radix-ui/react-avatar \
  @radix-ui/react-checkbox \
  @radix-ui/react-collapsible \
  @radix-ui/react-context-menu \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-hover-card \
  @radix-ui/react-menubar \
  @radix-ui/react-navigation-menu \
  @radix-ui/react-popover \
  @radix-ui/react-progress \
  @radix-ui/react-radio-group \
  @radix-ui/react-scroll-area \
  @radix-ui/react-select \
  @radix-ui/react-separator \
  @radix-ui/react-slider \
  @radix-ui/react-switch \
  @radix-ui/react-toggle-group

# Fase 3: Eliminar archivos de componentes
echo "🗑️  Fase 3: Eliminando archivos de componentes..."
cd components/ui
rm -f accordion.tsx alert-dialog.tsx alert.tsx aspect-ratio.tsx avatar.tsx \
      breadcrumb.tsx calendar.tsx carousel.tsx chart.tsx checkbox.tsx \
      collapsible.tsx command.tsx context-menu.tsx drawer.tsx dropdown-menu.tsx \
      form.tsx hover-card.tsx input-otp.tsx menubar.tsx navigation-menu.tsx \
      pagination.tsx popover.tsx progress.tsx radio-group.tsx resizable.tsx \
      scroll-area.tsx select.tsx separator.tsx sheet.tsx skeleton.tsx \
      slider.tsx sonner.tsx switch.tsx toggle-group.tsx

cd ../..

echo "✅ Limpieza completada!"
echo "📊 Ejecuta 'npm run build' para verificar que todo funciona correctamente"
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] Dependencias de testing agregadas (@testing-library/react)
- [ ] Ejecutar script de limpieza Fase 1 (dependencias pesadas)
- [ ] Verificar build exitoso
- [ ] Ejecutar script de limpieza Fase 2 (Radix UI)
- [ ] Verificar build exitoso
- [ ] Ejecutar script de limpieza Fase 3 (componentes simples)
- [ ] Verificar build final
- [ ] Ejecutar `npm run build` y verificar tamaños
- [ ] Documentar componentes mantenidos en README

---

**Generado:** 11 de Diciembre, 2025  
**Próxima auditoría recomendada:** Cada 3 meses
