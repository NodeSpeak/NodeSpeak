#!/bin/bash

# =============================================================================
# Script de Limpieza de Componentes UI No Utilizados
# NodeSpeak - Diciembre 2025
# =============================================================================

set -e  # Exit on error

echo "🧹 ============================================"
echo "   Limpieza de Componentes UI No Utilizados"
echo "   ============================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para preguntar confirmación
confirm() {
    read -p "$(echo -e ${YELLOW}$1${NC}) [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Operación cancelada${NC}"
        exit 1
    fi
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Debes ejecutar este script desde la raíz del proyecto${NC}"
    exit 1
fi

echo "📍 Directorio actual: $(pwd)"
echo ""

# =============================================================================
# FASE 1: DEPENDENCIAS PESADAS
# =============================================================================

echo -e "${YELLOW}📦 FASE 1: Eliminando dependencias pesadas${NC}"
echo "   Ahorro estimado: ~350 KB bundle + ~50 MB node_modules"
echo ""

confirm "¿Deseas eliminar las dependencias pesadas no utilizadas?"

echo "Eliminando recharts (150 KB)..."
npm uninstall recharts

echo "Eliminando date-fns + react-day-picker (70 KB)..."
npm uninstall date-fns react-day-picker

echo "Eliminando embla-carousel-react (40 KB)..."
npm uninstall embla-carousel-react

echo "Eliminando cmdk (30 KB)..."
npm uninstall cmdk

echo "Eliminando vaul (20 KB)..."
npm uninstall vaul

echo "Eliminando react-resizable-panels (25 KB)..."
npm uninstall react-resizable-panels

echo "Eliminando input-otp (15 KB)..."
npm uninstall input-otp

echo -e "${GREEN}✅ Fase 1 completada${NC}"
echo ""

# =============================================================================
# FASE 2: COMPONENTES RADIX UI NO USADOS
# =============================================================================

echo -e "${YELLOW}📦 FASE 2: Eliminando componentes Radix UI no usados${NC}"
echo "   Ahorro estimado: ~200 KB bundle + ~30 MB node_modules"
echo ""

confirm "¿Deseas eliminar los componentes Radix UI no utilizados?"

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

echo -e "${GREEN}✅ Fase 2 completada${NC}"
echo ""

# =============================================================================
# FASE 3: ELIMINAR ARCHIVOS DE COMPONENTES
# =============================================================================

echo -e "${YELLOW}🗑️  FASE 3: Eliminando archivos de componentes${NC}"
echo "   34 archivos .tsx serán eliminados"
echo ""

confirm "¿Deseas eliminar los archivos de componentes no utilizados?"

cd components/ui

# Lista de componentes a eliminar
COMPONENTS_TO_DELETE=(
  "accordion.tsx"
  "alert-dialog.tsx"
  "alert.tsx"
  "aspect-ratio.tsx"
  "avatar.tsx"
  "breadcrumb.tsx"
  "calendar.tsx"
  "carousel.tsx"
  "chart.tsx"
  "checkbox.tsx"
  "collapsible.tsx"
  "command.tsx"
  "context-menu.tsx"
  "drawer.tsx"
  "dropdown-menu.tsx"
  "form.tsx"
  "hover-card.tsx"
  "input-otp.tsx"
  "menubar.tsx"
  "navigation-menu.tsx"
  "pagination.tsx"
  "popover.tsx"
  "progress.tsx"
  "radio-group.tsx"
  "resizable.tsx"
  "scroll-area.tsx"
  "select.tsx"
  "separator.tsx"
  "sheet.tsx"
  "skeleton.tsx"
  "slider.tsx"
  "sonner.tsx"
  "switch.tsx"
  "toggle-group.tsx"
)

deleted_count=0
for component in "${COMPONENTS_TO_DELETE[@]}"; do
  if [ -f "$component" ]; then
    rm -f "$component"
    echo "  ❌ Eliminado: $component"
    ((deleted_count++))
  else
    echo "  ⚠️  No encontrado: $component"
  fi
done

cd ../..

echo ""
echo -e "${GREEN}✅ Fase 3 completada: $deleted_count archivos eliminados${NC}"
echo ""

# =============================================================================
# VERIFICACIÓN FINAL
# =============================================================================

echo -e "${YELLOW}🔍 VERIFICACIÓN FINAL${NC}"
echo ""

echo "📊 Tamaño actual de node_modules:"
du -sh node_modules/

echo ""
echo "📦 Componentes UI restantes:"
ls -1 components/ui/*.tsx 2>/dev/null | wc -l | xargs echo "   Total:"

echo ""
echo -e "${GREEN}✅ ============================================${NC}"
echo -e "${GREEN}   Limpieza completada exitosamente!${NC}"
echo -e "${GREEN}   ============================================${NC}"
echo ""

echo "📝 Próximos pasos:"
echo "   1. Ejecuta: npm run build"
echo "   2. Verifica que todo funcione correctamente"
echo "   3. Revisa el archivo: docs/UI_COMPONENTS_AUDIT.md"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   - Ejecuta 'npm run build' para verificar que no hay errores"
echo "   - Prueba la aplicación en desarrollo: 'npm run dev'"
echo "   - Haz commit de los cambios si todo funciona correctamente"
echo ""
