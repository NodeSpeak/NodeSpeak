// Sample documents for demonstration
export const sampleHackMDDocuments = [
  {
    id: 'sample-doc-1',
    title: 'Introducción a NodeSpeak',
    content: `# Introducción a NodeSpeak

NodeSpeak es una plataforma avanzada de gestión de conocimiento que integra múltiples fuentes de información.

## Características principales

- **Integración con HackMD**: Importación sencilla de documentos
- **Markdown completo**: Soporte para todas las características de Markdown
- **Organización por carpetas**: Mantén tus documentos organizados

## Ejemplo de código

\`\`\`typescript
// Importar documentos desde HackMD
const docs = await hackmdService.getNotes();
const importedDoc = await hackmdService.importDocumentFromHackMD(docs[0].id);
\`\`\`

## Lista de tareas pendientes

- [x] Implementar importación desde HackMD
- [ ] Añadir sincronización bidireccional
- [ ] Mejorar el editor de texto
`,
    source: 'hackmd',
    sourceId: 'sample-hackmd-id-1',
    sourceUrl: 'https://hackmd.io/sample-note-1',
    importedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sample-doc-2',
    title: 'Guía de Markdown',
    content: `# Guía completa de Markdown

Esta guía te ayudará a dominar la sintaxis de Markdown para tus documentos.

## Formateo básico

**Texto en negrita** y *texto en cursiva*

## Listas

### Ordenadas
1. Primer elemento
2. Segundo elemento

### No ordenadas
- Elemento 1
- Elemento 2
  - Sub-elemento 2.1

## Tablas

| Nombre | Descripción |
|--------|-------------|
| HackMD | Plataforma colaborativa de edición Markdown |
| NodeSpeak | Aplicación de gestión de conocimiento |

## Imágenes

![Ejemplo de imagen](https://via.placeholder.com/150)

## Enlaces

[Enlace a NodeSpeak](https://nodespeak.example.com)
`,
    source: 'hackmd',
    sourceId: 'sample-hackmd-id-2',
    sourceUrl: 'https://hackmd.io/sample-note-2',
    importedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sample-doc-3',
    title: 'Diseño de arquitectura',
    content: `# Arquitectura de NodeSpeak

Este documento describe la arquitectura técnica de NodeSpeak.

## Componentes principales

### Frontend
- Next.js con TypeScript
- Componentes UI reutilizables
- Sistema de routing

### Backend
- API Routes de Next.js
- Servicio MCP para integraciones externas
- Almacenamiento local y en la nube

## Diagrama de flujo

\`\`\`
Usuario -> UI -> API Routes -> Servicios externos
                            -> Almacenamiento local
\`\`\`

## Consideraciones de seguridad

- Autenticación OAuth para servicios de terceros
- Almacenamiento seguro de tokens
- Sanitización de contenido importado
`,
    source: 'hackmd',
    sourceId: 'sample-hackmd-id-3',
    sourceUrl: 'https://hackmd.io/sample-note-3',
    importedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sample-doc-4',
    title: 'Notas de reunión - Planificación Q2',
    content: `# Notas de reunión: Planificación Q2

Fecha: ${new Date().toLocaleDateString()}
Participantes: Equipo de desarrollo

## Agenda

1. Revisión de objetivos Q1
2. Definición de prioridades Q2
3. Asignación de tareas

## Resumen

Hemos decidido enfocarnos en las siguientes áreas para Q2:

- Mejora de integraciones con servicios externos
- Optimización de rendimiento
- Implementación de nuevas características solicitadas por usuarios

## Próximos pasos

- Crear tareas en el sistema de gestión de proyectos
- Programar revisiones semanales
- Preparar demo para stakeholders

## Decisiones pendientes

- Definir fechas específicas de lanzamiento
- Evaluar necesidades de recursos adicionales
`,
    source: 'hackmd',
    sourceId: 'sample-hackmd-id-4',
    sourceUrl: 'https://hackmd.io/sample-note-4',
    importedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sample-doc-5',
    title: 'Referencias de API',
    content: `# Referencias de API

Este documento contiene referencias útiles para las APIs utilizadas en NodeSpeak.

## HackMD API

### Endpoints principales

- \`GET /api/v1/notes\`: Lista todas las notas
- \`GET /api/v1/notes/{id}\`: Obtiene una nota específica
- \`POST /api/v1/notes\`: Crea una nueva nota

### Ejemplo de respuesta

\`\`\`json
{
  "id": "abc123",
  "title": "Mi nota",
  "content": "# Contenido",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-02T00:00:00Z"
}
\`\`\`

## Límites y consideraciones

- Máximo 100 requests por minuto
- Tamaño máximo de contenido: 1MB
- Se requiere autenticación OAuth2
`,
    source: 'hackmd',
    sourceId: 'sample-hackmd-id-5',
    sourceUrl: 'https://hackmd.io/sample-note-5',
    importedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
