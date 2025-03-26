'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HackMDDocumentImporter } from '@/components/hackmd/HackMDDocumentImporter';
import { HackMDAuthButton } from '@/components/hackmd/HackMDAuthButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ImportedDocument } from '@/lib/services/hackmd-service';
import { ArrowLeft, FileCheck, AlertCircle, Info } from 'lucide-react';

export default function HackMDImportPage() {
  const router = useRouter();
  const [importedDocs, setImportedDocs] = useState<ImportedDocument[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsCheckingAuth(true);
      const response = await fetch('/api/mcp/hackmd/me');
      setIsAuthenticated(response.status === 200);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleAuthStateChange = (authState: boolean) => {
    setIsAuthenticated(authState);
  };

  const handleDocumentImported = (document: ImportedDocument) => {
    setImportedDocs(prev => {
      // Check if document already exists in the list
      const exists = prev.some(doc => doc.id === document.id);
      if (exists) {
        // Replace the existing document
        return prev.map(doc => doc.id === document.id ? document : doc);
      }
      // Add the new document
      return [...prev, document];
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center mb-6 gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Importar desde HackMD</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Conexión con HackMD</span>
            <HackMDAuthButton onAuthStateChange={handleAuthStateChange} />
          </CardTitle>
          <CardDescription>
            Conecta tu cuenta de HackMD para importar tus documentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthenticated ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No conectado</AlertTitle>
              <AlertDescription>
                Debes conectarte con tu cuenta de HackMD para acceder a tus documentos.
                Haz clic en el botón "Conectar con HackMD" para iniciar sesión.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
              <Info className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Conectado correctamente</AlertTitle>
              <AlertDescription className="text-green-600">
                Ya estás conectado a tu cuenta de HackMD. Ahora puedes importar tus documentos.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-sm text-muted-foreground">
            <h3 className="font-medium text-base mb-2">¿No tienes una cuenta de HackMD?</h3>
            <p className="mb-2">HackMD es una plataforma colaborativa de edición Markdown. Si aún no tienes una cuenta, puedes:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Crear una cuenta gratuita en <a href="https://hackmd.io" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">hackmd.io</a></li>
              <li>Utilizar nuestros documentos de ejemplo para probar la funcionalidad</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => router.push('/documents/import-samples')}
            className="mr-2"
          >
            Ver documentos de ejemplo
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/documents/hackmd')}
          >
            Ver mis documentos importados
          </Button>
        </CardFooter>
      </Card>
      
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos de HackMD</CardTitle>
            <CardDescription>
              Busca, visualiza e importa tus documentos de HackMD directamente a NodeSpeak
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HackMDDocumentImporter onDocumentImported={handleDocumentImported} />
          </CardContent>
        </Card>
      )}
      
      {importedDocs.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <FileCheck className="mr-2 h-5 w-5 text-green-600" />
                Documentos Importados en esta Sesión
              </CardTitle>
              <CardDescription>
                Has importado {importedDocs.length} documento{importedDocs.length !== 1 ? 's' : ''} en esta sesión
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {importedDocs.map(doc => (
                  <li key={doc.id} className="p-3 bg-muted rounded-md flex justify-between items-center">
                    <div>
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(doc.importedAt).toLocaleString()}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => router.push(`/documents/${doc.id}`)}>
                      Ver Documento
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
