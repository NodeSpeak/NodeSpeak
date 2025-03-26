'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hackmdService, ImportedDocument } from '@/lib/services/hackmd-service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ArrowLeft, ExternalLink, Edit, FileText, Home, Folder, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import MarkdownPreview from '@uiw/react-markdown-preview';

interface DocumentViewPageProps {
  params: {
    id: string;
  };
}

export default function DocumentViewPage({ params }: DocumentViewPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [document, setDocument] = useState<ImportedDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocument();
  }, [params.id]);

  const loadDocument = () => {
    setLoading(true);
    try {
      const docs = hackmdService.getSavedDocuments();
      const doc = docs.find(d => d.id === params.id);
      
      if (doc) {
        setDocument(doc);
      } else {
        toast({
          title: "Documento no encontrado",
          description: "El documento solicitado no existe o ha sido eliminado",
          variant: "destructive"
        });
        router.push('/documents/hackmd');
      }
    } catch (error) {
      console.error('Error loading document:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el documento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Cargando documento...</p>
        </div>
      </div>
    );
  }

  if (!document) return null;

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
            <BreadcrumbLink href="/documents/hackmd">HackMD</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{document.title}</BreadcrumbLink>
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
        <h1 className="text-2xl font-bold truncate flex-grow">{document.title}</h1>
        <div className="flex gap-2">
          {document.sourceUrl && (
            <Button 
              variant="outline"
              onClick={() => window.open(document.sourceUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver original
            </Button>
          )}
          <Button onClick={() => router.push(`/documents/edit/${document.id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-1" />
          <span>Origen: HackMD</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          <span>Importado: {format(new Date(document.importedAt), 'dd/MM/yyyy HH:mm')}</span>
        </div>
        {document.updatedAt && (
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Actualizado: {format(new Date(document.updatedAt), 'dd/MM/yyyy HH:mm')}</span>
          </div>
        )}
      </div>

      <Card className="overflow-hidden">
        <Tabs defaultValue="preview" className="w-full">
          <div className="border-b px-4">
            <TabsList className="h-12">
              <TabsTrigger value="preview" className="px-4">Vista previa</TabsTrigger>
              <TabsTrigger value="source" className="px-4">Código fuente</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="preview" className="p-0 m-0">
            <div className="p-6">
              <MarkdownPreview source={document.content} />
            </div>
          </TabsContent>
          
          <TabsContent value="source" className="p-0 m-0">
            <div className="p-6 font-mono text-sm whitespace-pre-wrap bg-slate-50 dark:bg-slate-900">
              {document.content}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
