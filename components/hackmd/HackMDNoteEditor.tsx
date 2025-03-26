import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hackmdService, HackMDNote } from '@/lib/services/hackmd-service';
import { Loader2, ChevronLeft, Save, ExternalLink, Trash } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface HackMDNoteEditorProps {
  noteId: string;
  onBack: () => void;
}

export const HackMDNoteEditor: React.FC<HackMDNoteEditorProps> = ({ noteId, onBack }) => {
  const [note, setNote] = useState<HackMDNote | null>(null);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Fetch note on component mount
  useEffect(() => {
    fetchNote();
  }, [noteId]);
  
  // Fetch note details
  const fetchNote = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedNote = await hackmdService.getNote(noteId);
      setNote(fetchedNote);
      setTitle(fetchedNote.title);
      setContent(fetchedNote.content || '');
    } catch (err) {
      setError('Failed to load note. Please try again.');
      console.error('Error fetching note:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle note update
  const handleSaveNote = async () => {
    if (!title.trim()) return;
    
    try {
      setSaving(true);
      setError(null);
      await hackmdService.updateNote(noteId, title, content);
      toast({
        title: "Note saved",
        description: "Your changes have been saved to HackMD",
      });
    } catch (err) {
      setError('Failed to save note. Please try again.');
      console.error('Error saving note:', err);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle note deletion
  const handleDeleteNote = async () => {
    try {
      setDeleting(true);
      await hackmdService.deleteNote(noteId);
      toast({
        title: "Note deleted",
        description: "The note has been permanently deleted",
      });
      onBack();
    } catch (err) {
      setError('Failed to delete note. Please try again.');
      console.error('Error deleting note:', err);
    } finally {
      setDeleting(false);
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Loading note...</p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        <h3 className="font-medium">Error</h3>
        <p>{error}</p>
        <Button variant="outline" className="mt-2" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>
      </div>
    );
  }
  
  return (
    <div className="note-editor">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>
        
        <div className="flex gap-2">
          {note?.url && (
            <Button
              variant="outline"
              onClick={() => window.open(note.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in HackMD
            </Button>
          )}
          
          <Button
            variant="default"
            onClick={handleSaveNote}
            disabled={saving || !title.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your note 
                  from your HackMD account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteNote} className="bg-red-600 hover:bg-red-700">
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="text-xl font-semibold"
          />
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note content here in Markdown..."
            className="min-h-[400px] font-mono resize-y"
          />
        </CardContent>
      </Card>
    </div>
  );
};
