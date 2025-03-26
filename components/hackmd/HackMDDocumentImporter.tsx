'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { HackMDNote, HackMDTeam, ImportedDocument, hackmdService, HackMDFilter } from '@/lib/services/hackmd-service';
import { Search, FileText, Import, Check, Clock, CalendarIcon, Tag, Users, User } from 'lucide-react';

interface HackMDDocumentImporterProps {
  onDocumentImported?: (document: ImportedDocument) => void;
}

export const HackMDDocumentImporter: React.FC<HackMDDocumentImporterProps> = ({ 
  onDocumentImported 
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notes, setNotes] = useState<HackMDNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<HackMDNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [teams, setTeams] = useState<HackMDTeam[]>([]);
  const [currentTeam, setCurrentTeam] = useState<string>('');
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('lastChange');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const { toast } = useToast();
  
  // Load already imported documents
  useEffect(() => {
    const importedDocs = hackmdService.getImportedDocuments();
    const ids = new Set(importedDocs.map(doc => doc.sourceId));
    setImportedIds(ids);
  }, []);

  // Load notes and teams
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Cargar notas
        const filter: HackMDFilter = {
          search: searchQuery,
          sortBy: sortBy as any,
          sortOrder: sortOrder as any
        };
        
        if (currentTab === 'personal') {
          filter.type = 'personal';
        } else if (currentTab === 'team' && currentTeam) {
          filter.type = 'team';
          filter.teamId = currentTeam;
        }
        
        const notesList = await hackmdService.filterNotes(filter);
        setNotes(notesList);
        setFilteredNotes(notesList);
      } catch (error) {
        console.error('Error loading HackMD data:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar tus documentos de HackMD",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [searchQuery, currentTab, currentTeam, sortBy, sortOrder, toast]);

  const handleImport = async (note: HackMDNote) => {
    try {
      const importedDoc = await hackmdService.importDocumentFromHackMD(note.id);
      setImportedIds(prev => new Set(prev).add(note.id));
      
      toast({
        title: "Documento importado",
        description: `"${note.title}" se ha importado correctamente.`,
        duration: 3000,
      });
      
      if (onDocumentImported) {
        onDocumentImported(importedDoc);
      }
    } catch (error) {
      console.error('Error importing document:', error);
      toast({
        title: "Error al importar",
        description: "No se pudo importar el documento",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  const handleTeamChange = (value: string) => {
    setCurrentTeam(value);
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-');
    setSortBy(field);
    setSortOrder(order);
  };

  const renderTabs = () => (
    <Tabs defaultValue="all" value={currentTab} onValueChange={handleTabChange}>
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="all">Todos</TabsTrigger>
        <TabsTrigger value="personal">Personales</TabsTrigger>
        <TabsTrigger value="team">Equipos</TabsTrigger>
      </TabsList>
    </Tabs>
  );

  const renderNotesList = () => {
    if (loading) {
      return Array(5).fill(0).map((_, i) => (
        <div key={i} className="mb-4">
          <Skeleton className="h-20 w-full" />
        </div>
      ));
    }

    if (filteredNotes.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="mx-auto h-12 w-12 opacity-20 mb-2" />
          <p>No se encontraron documentos</p>
          <p className="text-sm">Intenta con otra búsqueda o cambia los filtros</p>
        </div>
      );
    }

    return filteredNotes.map((note) => (
      <Card key={note.id} className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h3 className="font-medium text-lg mb-1 line-clamp-1">{note.title}</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {new Date(note.lastChangedAt || note.createdAt).toLocaleDateString()}
                </span>
                {note.teamPath && (
                  <>
                    <Users className="h-3.5 w-3.5 ml-2" />
                    <span>{note.teamPath}</span>
                  </>
                )}
                {!note.teamPath && (
                  <>
                    <User className="h-3.5 w-3.5 ml-2" />
                    <span>Personal</span>
                  </>
                )}
              </div>
              {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {note.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              {importedIds.has(note.id) ? (
                <Button variant="ghost" size="sm" disabled>
                  <Check className="h-4 w-4 mr-1" />
                  Importado
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => handleImport(note)}>
                  <Import className="h-4 w-4 mr-1" />
                  Importar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <Select defaultValue="lastChange-desc" onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastChange-desc">Más recientes</SelectItem>
              <SelectItem value="lastChange-asc">Más antiguos</SelectItem>
              <SelectItem value="title-asc">Título (A-Z)</SelectItem>
              <SelectItem value="title-desc">Título (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {renderTabs()}
        
        <ScrollArea className="h-[400px]">
          {renderNotesList()}
        </ScrollArea>
      </div>
    </div>
  );
};
