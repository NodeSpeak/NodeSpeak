import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { hackmdService, HackMDNote } from '@/lib/services/hackmd-service';
import { Loader2, FileText, Plus, Trash, Edit, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface HackMDNotesListProps {
  onNoteSelect: (noteId: string) => void;
  onNoteCreated?: (note: HackMDNote) => void;
}

export const HackMDNotesList: React.FC<HackMDNotesListProps> = ({ onNoteSelect, onNoteCreated }) => {
  const [notes, setNotes] = useState<HackMDNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showNewNoteDialog, setShowNewNoteDialog] = useState<boolean>(false);
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  
  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);
  
  // Fetch notes from HackMD
  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedNotes = await hackmdService.getNotes();
      setNotes(fetchedNotes);
    } catch (err) {
      setError('Failed to load notes. Please try again later.');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle creating a new note
  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) {
      toast({
        title: "Error",
        description: "El título no puede estar vacío",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    try {
      setCreating(true);
      // Corregir la llamada a createNote pasando al menos title y content (vacío)
      const newNote = await hackmdService.createNote(newNoteTitle, '');
      
      toast({
        title: "Nota creada",
        description: `"${newNoteTitle}" ha sido creada correctamente`,
        duration: 3000,
      });
      
      setNewNoteTitle('');
      setShowNewNoteDialog(false);
      
      if (onNoteCreated) {
        onNoteCreated(newNote);
      }
      
      // Recargar la lista
      fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la nota",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setCreating(false);
    }
  };
  
  // Filter notes based on search term
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Show loading state
  if (loading && notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Loading your HackMD notes...</p>
      </div>
    );
  }
  
  return (
    <div className="notes-list-container">
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchNotes}
            title="Refresh notes"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={showNewNoteDialog} onOpenChange={setShowNewNoteDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
                <DialogDescription>
                  Enter a title for your new HackMD note.
                </DialogDescription>
              </DialogHeader>
              <Input
                placeholder="Note title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="my-4"
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowNewNoteDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateNote}
                  disabled={creating || !newNoteTitle.trim()}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Note'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {filteredNotes.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-lg font-medium">No notes found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try a different search term' : 'Create your first note to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNoteSelect(note.id)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                <CardDescription>
                  {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <div className="text-xs text-muted-foreground">
                  Última edición: {new Date(note.lastChangedAt || note.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Edit className="h-3 w-3 mr-1" />
                  <span>{note.writePermission}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
