'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hackmdService, ImportedDocument } from '@/lib/services/hackmd-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HackMDImportButton } from '@/components/hackmd/HackMDImportButton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { format } from 'date-fns';
import { 
  FileText, Search, Home, Folder, ExternalLink, Edit, Trash2, 
  Download, RefreshCw, List, Grid3X3, Clock, Calendar 
} from 'lucide-react';

export default function HackMDDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<ImportedDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<ImportedDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedDoc, setSelectedDoc] = useState<ImportedDocument | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [searchQuery, documents, sortBy, sortDirection]);

  const loadDocuments = () => {
    const docs = hackmdService.getSavedDocuments();
    setDocuments(docs);
  };

  const filterDocuments = () => {
    let filtered = [...documents];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.importedAt).getTime();
        const dateB = new Date(b.importedAt).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return sortDirection === 'asc' 
          ? a.title.localeCompare(b.title) 
          : b.title.localeCompare(a.title);
      }
    });
    
    setFilteredDocuments(filtered);
  };

  const handleDelete = (docId: string) => {
    hackmdService.deleteImportedDocument(docId);
    loadDocuments();
    setIsDeleteDialogOpen(false);
  };

  const handleOpenDeleteDialog = (doc: ImportedDocument) => {
    setSelectedDoc(doc);
    setIsDeleteDialogOpen(true);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const renderListView = () => (
    <div className="space-y-3">
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No hay documentos importados</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            Importa documentos desde HackMD para verlos aquí
          </p>
          <HackMDImportButton />
        </div>
      ) : (
        filteredDocuments.map(doc => (
          <Card key={doc.id} className="transition-all hover:shadow-md">
            <div className="flex items-start p-4">
              <div className="flex-shrink-0 mr-4">
                <FileText className="h-10 w-10 text-blue-500" />
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-medium text-lg truncate">{doc.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>Importado: {format(new Date(doc.importedAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/documents/view/${doc.id}`)}>
                  <FileText className="h-4 w-4" />
                </Button>
                {doc.sourceUrl && (
                  <Button variant="ghost" size="icon" onClick={() => window.open(doc.sourceUrl, '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => router.push(`/documents/edit/${doc.id}`)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(doc)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredDocuments.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No hay documentos importados</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            Importa documentos desde HackMD para verlos aquí
          </p>
          <HackMDImportButton />
        </div>
      ) : (
        filteredDocuments.map(doc => (
          <Card key={doc.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base truncate">{doc.title}</CardTitle>
              <CardDescription className="text-xs">
                Importado: {format(new Date(doc.importedAt), 'dd/MM/yyyy')}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-2 pb-4">
              <div className="flex justify-between w-full">
                <Button variant="outline" size="sm" onClick={() => router.push(`/documents/view/${doc.id}`)}>
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Ver
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleOpenDeleteDialog(doc)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Eliminar
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-8 max-w-5xl">
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
            <BreadcrumbLink>HackMD</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Folder className="h-6 w-6 mr-2" />
          Documentos de HackMD
        </h1>
        <HackMDImportButton />
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-3">
              <Tabs defaultValue="date" className="w-[260px]" onValueChange={(value) => setSortBy(value as 'date' | 'name')}>
                <TabsList>
                  <TabsTrigger value="date" className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Fecha
                  </TabsTrigger>
                  <TabsTrigger value="name" className="flex items-center">
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Nombre
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" size="icon" onClick={toggleSortDirection}>
                {sortDirection === 'asc' ? '↑' : '↓'}
              </Button>
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="icon" onClick={loadDocuments}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[calc(100vh-270px)]">
        {viewMode === 'list' ? renderListView() : renderGridView()}
      </ScrollArea>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar "{selectedDoc?.title}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedDoc && handleDelete(selectedDoc.id)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
