'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useToast } from '@/components/ui/use-toast';
import { sampleHackMDDocuments } from '@/lib/services/sample-documents';
import { ImportedDocument } from '@/lib/services/hackmd-service';
import { Home, FileText, ArrowLeft, Download, CheckCircle2 } from 'lucide-react';

export default function ImportSamplesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [importCompleted, setImportCompleted] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleImportSamples = () => {
    setImporting(true);

    try {
      // Obtener documentos ya existentes
      const existingDocsJSON = localStorage.getItem('nodespeak_imported_documents');
      let existingDocs: ImportedDocument[] = existingDocsJSON ? JSON.parse(existingDocsJSON) : [];
      
      // Filtrar los documentos de ejemplo que ya existen (por sourceId)
      const existingSourceIds = new Set(existingDocs.map(doc => doc.sourceId));
      const newDocs = sampleHackMDDocuments.filter(doc => !existingSourceIds.has(doc.sourceId));
      
      // Combinar los documentos existentes con los nuevos
      const combinedDocs = [...existingDocs, ...newDocs];
      
      // Guardar en localStorage
      localStorage.setItem('nodespeak_imported_documents', JSON.stringify(combinedDocs));
      
      setImportedCount(newDocs.length);
      setImportCompleted(true);
      
      toast({
        title: "Documentos importados",
        description: `Se han importado ${newDocs.length} documentos de ejemplo correctamente.`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error al importar documentos:', error);
      toast({
        title: "Error al importar",
        description: "No se pudieron importar los documentos de ejemplo.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <Home className="h-3.5 w-3.5 mr-1" />
              Inicio
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/documents">Documentos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Importar Ejemplos</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center mb-6 gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Importar Documentos de Ejemplo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentos de Ejemplo</CardTitle>
          <CardDescription>
            Importa documentos de ejemplo para probar las funcionalidades de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="mb-2">Se importarán los siguientes documentos de ejemplo:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              {sampleHackMDDocuments.map(doc => (
                <li key={doc.id} className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  {doc.title}
                </li>
              ))}
            </ul>
          </div>
          
          {importCompleted ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900">Importación completada</h3>
                <p className="text-green-700">
                  {importedCount === 0 
                    ? "No se importaron documentos nuevos. Es posible que ya existieran en la aplicación."
                    : `Se importaron ${importedCount} documentos correctamente.`}
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push('/documents/hackmd')}
          >
            Ver mis documentos
          </Button>
          <Button 
            onClick={handleImportSamples} 
            disabled={importing || importCompleted}
          >
            {importing ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-2"></div>
                Importando...
              </>
            ) : importCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Importación completada
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Importar documentos de ejemplo
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {importCompleted && (
        <div className="mt-6 flex justify-center">
          <Button 
            size="lg" 
            onClick={() => router.push('/documents/hackmd')}
          >
            Ver mis documentos importados
          </Button>
        </div>
      )}
    </div>
  );
}
