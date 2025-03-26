/**
 * Storage Service - Proporciona una capa de abstracción sobre localStorage
 * para facilitar el manejo de almacenamiento persistente en el navegador
 */

export class StorageService {
  /**
   * Obtiene un elemento del almacenamiento
   * @param key - Clave del elemento a obtener
   * @returns El valor almacenado o null si no existe
   */
  getItem(key: string): string | null {
    if (typeof window === 'undefined') {
      return null; // Si estamos en SSR, no hay localStorage
    }
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error al obtener el elemento ${key} de localStorage:`, error);
      return null;
    }
  }

  /**
   * Guarda un elemento en el almacenamiento
   * @param key - Clave bajo la cual guardar el elemento
   * @param value - Valor a guardar
   * @returns true si se guardó correctamente, false en caso contrario
   */
  setItem(key: string, value: string): boolean {
    if (typeof window === 'undefined') {
      return false; // Si estamos en SSR, no hay localStorage
    }
    
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error al guardar el elemento ${key} en localStorage:`, error);
      return false;
    }
  }

  /**
   * Elimina un elemento del almacenamiento
   * @param key - Clave del elemento a eliminar
   * @returns true si se eliminó correctamente, false en caso contrario
   */
  removeItem(key: string): boolean {
    if (typeof window === 'undefined') {
      return false; // Si estamos en SSR, no hay localStorage
    }
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error al eliminar el elemento ${key} de localStorage:`, error);
      return false;
    }
  }

  /**
   * Verifica si existe un elemento en el almacenamiento
   * @param key - Clave a verificar
   * @returns true si el elemento existe, false en caso contrario
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * Limpia todo el almacenamiento
   * @returns true si se limpió correctamente, false en caso contrario
   */
  clear(): boolean {
    if (typeof window === 'undefined') {
      return false; // Si estamos en SSR, no hay localStorage
    }
    
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
      return false;
    }
  }
}
