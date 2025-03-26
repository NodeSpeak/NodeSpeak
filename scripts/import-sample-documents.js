// Este script importa documentos de ejemplo a la aplicación

// Importamos los documentos de ejemplo
const { sampleHackMDDocuments } = require('../lib/services/sample-documents');

// Función para importar documentos
function importSampleDocuments() {
  // Si estamos en un entorno de navegador, guardamos los documentos en localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    console.log('Importando documentos de ejemplo a localStorage...');
    window.localStorage.setItem('nodespeak_imported_documents', JSON.stringify(sampleHackMDDocuments));
    console.log(`${sampleHackMDDocuments.length} documentos importados correctamente.`);
    return true;
  } else {
    console.log('Este script debe ejecutarse en un entorno de navegador.');
    return false;
  }
}

// Si el script se ejecuta directamente en el navegador
if (typeof window !== 'undefined') {
  const result = importSampleDocuments();
  console.log(`Resultado de la importación: ${result ? 'Éxito' : 'Fallido'}`);
}

// Exportamos la función para poder usarla desde otros archivos
module.exports = { importSampleDocuments };
