'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hackmdService, ImportedDocument } from '@/lib/services/hackmd-service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Eye, ExternalLink, Home, Folder, Loader2 } from 'lucide-react';

interface DocumentEditPageProps {
  params: {
    id: string;
  };
}

export default function DocumentEditPage({ params }: DocumentEditPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [document, setDocument] = useState<ImportedDocument | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        setTitle(doc.title);
        setContent(doc.content);
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

  const handleSave = () => {
    if (!document) return;
    
    setSaving(true);
    try {
      const updatedDoc = {
        ...document,
        title,
        content,
        updatedAt: new Date().toISOString()
      };
      
      // Find and update document in local storage
      const docs = hackmdService.getSavedDocuments();
      const updatedDocs = docs.map(d => d.id === updatedDoc.id ? updatedDoc : d);
      localStorage.setItem('nodespeak_imported_documents', JSON.stringify(updatedDocs));
      
      toast({
        title: "Documento guardado",
        description: "Los cambios se han guardado correctamente"
      });
      
      // Update current document state
      setDocument(updatedDoc);
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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
            <BreadcrumbLink href={`/documents/view/${document.id}`}>{document.title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Editar</BreadcrumbLink>
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
        <h1 className="text-2xl font-bold">Editar Documento</h1>
        <div className="flex-grow"></div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/documents/view/${document.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver
          </Button>
          {document.sourceUrl && (
            <Button 
              variant="outline"
              onClick={() => window.open(document.sourceUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Original
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="mb-6 p-4">
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium mb-1">Título</label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del documento"
            className="w-full"
          />
        </div>
      </Card>

      <Card className="p-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1">Contenido (Markdown)</label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contenido del documento en formato Markdown"
            className="min-h-[500px] font-mono w-full"
          />
        </div>
      </Card>
    </div>
  );
}
