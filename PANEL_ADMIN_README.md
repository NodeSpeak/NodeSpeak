# Panel de Administración - NodeSpeak

Este panel de administración permite a los usuarios administradores moderar el contenido de NodeSpeak ocultando usuarios y comunidades, así como restaurándolos cuando sea necesario.

## Características Principales

### Moderación de Usuarios
- **Ocultar usuarios** junto con toda su actividad asociada (posts, comentarios)
- **Visualizar lista completa** de usuarios ocultados con datos detallados
- **Restablecer usuarios** ocultados con un solo clic

### Moderación de Comunidades
- **Ocultar comunidades** completas y su contenido asociado
- **Visualizar lista** de comunidades ocultadas con información detallada
- **Restablecer comunidades** ocultadas para hacerlas visibles nuevamente

### Accesibilidad
- Botón de acceso directo en la página de **perfil de usuario** para administradores
- **Botón flotante** en la esquina inferior derecha del foro para acceso rápido
- Acceso directo mediante la ruta `/admin`

### Seguridad
- Solo usuarios designados como administradores pueden ver y utilizar las funciones de moderación
- Validación de permisos de administrador en todas las operaciones
- Datos persistentes almacenados localmente en el navegador

## Cómo usar

### Configuración Inicial

1. En el archivo `/contexts/AdminContext.tsx`, añade las direcciones de wallet de los administradores:

```typescript
const ADMIN_ADDRESSES: string[] = [
  "0xTU_DIRECCIÓN_DE_WALLET_AQUÍ",
  // Puedes añadir más direcciones si es necesario
];
```

2. Conecta tu wallet en la aplicación usando el botón de "Connect Wallet"

### Acceso al Panel de Administración

- **Opción 1:** Ve a tu perfil de usuario (/profile) y haz clic en el botón "Moderación"
- **Opción 2:** Haz clic en el botón flotante con icono de escudo en la esquina inferior derecha del foro
- **Opción 3:** Navega directamente a la URL `/admin`

### Ocultar/Mostrar Usuarios

1. En el panel de administración, ve a la pestaña "Usuarios Ocultados"
2. Para ocultar un usuario, busca su contenido en el foro y utiliza el botón "Ocultar Usuario"
3. Para restaurar un usuario, haz clic en "Restablecer" junto al usuario en la lista de usuarios ocultados

### Ocultar/Mostrar Comunidades

1. En el panel de administración, ve a la pestaña "Comunidades Ocultadas"
2. Para ocultar una comunidad, busca la comunidad en el foro y utiliza el botón "Ocultar Comunidad"
3. Para restaurar una comunidad, haz clic en "Restablecer" junto a la comunidad en la lista

## Estructura del Código

- **AdminContext.tsx** - Contexto que gestiona el estado de moderación y proporciona funciones para ocultar/mostrar elementos
- **app/admin/page.tsx** - Página principal del panel de administración
- **components/admin/HiddenUsersPanel.tsx** - Componente que muestra la lista de usuarios ocultados
- **components/admin/HiddenCommunitiesPanel.tsx** - Componente que muestra la lista de comunidades ocultadas
- **components/admin/UserHideButton.tsx** - Botón para ocultar usuarios desde la interfaz
- **components/admin/CommunityHideButton.tsx** - Botón para ocultar comunidades desde la interfaz
- **components/admin/AdminFloatingButton.tsx** - Botón flotante para acceder rápidamente al panel

## Comportamiento de Ocultación

Cuando un usuario o comunidad es ocultado:

1. El elemento deja de ser visible en listas y búsquedas para usuarios normales
2. Todo el contenido asociado al elemento también queda oculto (posts, comentarios, etc.)
3. Los datos permanecen intactos en la blockchain, solo se filtran a nivel de interfaz
4. Los administradores pueden ver una lista completa de elementos ocultados en el panel
5. Los elementos pueden ser restablecidos en cualquier momento sin pérdida de datos

## Implementación Técnica

- La ocultación se implementa a través de filtros en los componentes de visualización (IntegratedView)
- Los datos de elementos ocultados se almacenan en localStorage para persistencia
- El estado de administración se comprueba en tiempo real basado en la dirección de wallet conectada
- Diseño modular que permite extender las funcionalidades de moderación fácilmente

## Mejoras Futuras Sugeridas

1. **Almacenamiento centralizado** para sincronizar acciones de moderación entre administradores
2. **Niveles de permisos** para diferentes roles de moderación
3. **Historial de acciones** de moderación con registro de quién ocultó/restauró cada elemento
4. **Sistema de reportes** para que usuarios normales puedan reportar contenido inapropiado
5. **Estadísticas avanzadas** sobre la actividad de moderación
