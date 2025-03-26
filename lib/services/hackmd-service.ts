/**
 * HackMD Service - Client-side service for interacting with HackMD MCP server
 */

import { StorageService } from './storage-service';

// Base API endpoint
export const API_BASE = '/api/hackmd';

// Interface for Note data
export interface HackMDNote {
  id: string;
  title: string;
  tags?: string[];
  createdAt: string;
  publishType: string;
  publishedAt?: string;
  publishLink?: string;
  lastChangedAt?: string;
  lastChangeUser?: {
    id: string;
    name: string;
    photo?: string;
  };
  permalink?: string;
  readPermission: string;
  writePermission: string;
  userPath?: string;
  teamPath?: string;
  content?: string;
  url?: string;
}

// Interface for Team data
export interface HackMDTeam {
  id: string;
  name: string;
  path: string;
  logo?: string; // Agregamos esta propiedad opcional
}

// Interface for User data
export interface HackMDUser {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

// Interface for imported document
export interface ImportedDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceId: string;
  sourceUrl?: string;
  importedAt: string;
  lastEditedAt?: string;
  tags?: string[];
}

// Interface for filter
export interface HackMDFilter {
  search?: string;
  type?: 'all' | 'personal' | 'team';
  teamId?: string;
  sortBy?: 'lastChange' | 'title' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

class HackMDService {
  private _storage: StorageService;
  private static readonly DOCUMENTS_STORAGE_KEY = 'nodespeak_imported_documents';

  constructor() {
    this._storage = new StorageService();
  }

  // Verifica si el usuario está autenticado
  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/me`);
      return response.status === 200;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  // Obtiene la información del usuario actual
  async getCurrentUser(): Promise<HackMDUser | null> {
    try {
      const response = await fetch(`${API_BASE}/me`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Obtiene todas las notas del usuario
  async getNotes(): Promise<HackMDNote[]> {
    try {
      const response = await fetch(`${API_BASE}/notes`);
      if (!response.ok) {
        throw new Error('Failed to get notes');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  }

  // Obtiene una nota específica por su ID
  async getNote(noteId: string): Promise<HackMDNote> {
    try {
      const response = await fetch(`${API_BASE}/notes/${noteId}`);
      if (!response.ok) {
        throw new Error(`Failed to get note with ID: ${noteId}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error getting note ${noteId}:`, error);
      throw error;
    }
  }

  // Filtra notas según criterios
  async filterNotes(filter: HackMDFilter): Promise<HackMDNote[]> {
    try {
      const notes = await this.getNotes();
      
      return notes.filter(note => {
        // Filtro por búsqueda
        if (filter.search && !note.title.toLowerCase().includes(filter.search.toLowerCase())) {
          return false;
        }
        
        // Filtro por tipo (personal o equipo)
        if (filter.type === 'personal' && note.teamPath) {
          return false;
        }
        
        if (filter.type === 'team' && !note.teamPath) {
          return false;
        }
        
        // Filtro por equipo específico
        if (filter.teamId && (!note.teamPath || !note.teamPath.includes(filter.teamId))) {
          return false;
        }
        
        return true;
      }).sort((a, b) => {
        if (!filter.sortBy || filter.sortBy === 'lastChange') {
          const dateA = new Date(a.lastChangedAt || a.createdAt).getTime();
          const dateB = new Date(b.lastChangedAt || b.createdAt).getTime();
          return filter.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (filter.sortBy === 'title') {
          return filter.sortOrder === 'asc' 
            ? a.title.localeCompare(b.title) 
            : b.title.localeCompare(a.title);
        } else { // createdAt
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return filter.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
      });
    } catch (error) {
      console.error('Error filtering notes:', error);
      return [];
    }
  }

  // Importa un documento desde HackMD a la aplicación
  async importDocumentFromHackMD(noteId: string): Promise<ImportedDocument> {
    try {
      const note = await this.getNote(noteId);
      const importedDoc: ImportedDocument = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        title: note.title,
        content: note.content || '',
        source: 'hackmd',
        sourceId: note.id,
        sourceUrl: note.publishLink || note.permalink,
        importedAt: new Date().toISOString(),
        tags: note.tags
      };
      
      // Guardar en localStorage
      this.saveImportedDocument(importedDoc);
      
      return importedDoc;
    } catch (error) {
      console.error('Error importing document from HackMD:', error);
      throw error;
    }
  }

  // Guarda un documento importado en localStorage
  private saveImportedDocument(document: ImportedDocument): void {
    const existingDocs = this.getImportedDocuments();
    
    // Comprobar si el documento ya existe (por ID)
    const existingIndex = existingDocs.findIndex(doc => doc.id === document.id);
    
    if (existingIndex !== -1) {
      // Actualizar documento existente
      existingDocs[existingIndex] = document;
    } else {
      // Agregar nuevo documento
      existingDocs.push(document);
    }
    
    this._storage.setItem('nodespeak_imported_documents', JSON.stringify(existingDocs));
  }

  // Obtiene todos los documentos importados
  getImportedDocuments(): ImportedDocument[] {
    const docsJson = this._storage.getItem('nodespeak_imported_documents');
    return docsJson ? JSON.parse(docsJson) : [];
  }

  // Obtiene un documento importado por su ID
  getImportedDocumentById(id: string): ImportedDocument | null {
    const docs = this.getImportedDocuments();
    return docs.find(doc => doc.id === id) || null;
  }

  // Actualiza un documento importado
  updateImportedDocument(id: string, updates: Partial<ImportedDocument>): ImportedDocument | null {
    const docs = this.getImportedDocuments();
    const index = docs.findIndex(doc => doc.id === id);
    
    if (index === -1) return null;
    
    const updatedDoc = { 
      ...docs[index], 
      ...updates, 
      lastEditedAt: new Date().toISOString() 
    };
    
    docs[index] = updatedDoc;
    this._storage.setItem('nodespeak_imported_documents', JSON.stringify(docs));
    
    return updatedDoc;
  }

  // Elimina un documento importado
  deleteImportedDocument(id: string): boolean {
    const docs = this.getImportedDocuments();
    const filteredDocs = docs.filter(doc => doc.id !== id);
    
    if (filteredDocs.length === docs.length) {
      return false; // No se encontró el documento
    }
    
    this._storage.setItem('nodespeak_imported_documents', JSON.stringify(filteredDocs));
    return true;
  }

  // Busca documentos importados por título
  searchImportedDocuments(query: string): ImportedDocument[] {
    if (!query) return this.getImportedDocuments();
    
    const docs = this.getImportedDocuments();
    
    return docs.filter(doc => 
      doc.title.toLowerCase().includes(query.toLowerCase()) || 
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
    );
  }

  // Métodos de autenticación
  async login(): Promise<boolean> {
    try {
      window.location.href = `${API_BASE}/auth`;
      return true;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
    }
  }

  async logout(): Promise<boolean> {
    try {
      await fetch(`${API_BASE}/logout`, { method: 'POST' });
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  }

  async getProfile(): Promise<HackMDUser | null> {
    try {
      const response = await fetch(`${API_BASE}/me`);
      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error('Failed to get user profile');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  // Métodos para gestionar notas
  async createNote(title: string, content: string, teamId?: string): Promise<HackMDNote> {
    const response = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        teamId
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create note');
    }
    
    return await response.json();
  }

  async updateNote(noteId: string, title: string, content: string): Promise<HackMDNote> {
    const response = await fetch(`${API_BASE}/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update note with ID ${noteId}`);
    }
    
    return await response.json();
  }

  async deleteNote(noteId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/notes/${noteId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete note with ID ${noteId}`);
    }
    
    return true;
  }

  // Métodos para equipos
  async getTeams(): Promise<HackMDTeam[]> {
    const response = await fetch(`${API_BASE}/teams`);
    if (!response.ok) {
      throw new Error('Failed to get teams');
    }
    return await response.json();
  }

  async getTeamNotes(teamId: string): Promise<HackMDNote[]> {
    const response = await fetch(`${API_BASE}/teams/${teamId}/notes`);
    if (!response.ok) {
      throw new Error(`Failed to get notes for team ${teamId}`);
    }
    return await response.json();
  }

  // Para compatibilidad con código existente
  getSavedDocuments(): ImportedDocument[] {
    return this.getImportedDocuments();
  }

  searchNotes(query: string): Promise<HackMDNote[]> {
    return this.filterNotes({ search: query });
  }
}

// Export singleton instance
export const hackmdService = new HackMDService();
