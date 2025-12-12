/**
 * Utilidades para formatear direcciones Ethereum y textos largos
 * con soporte responsive y middle ellipsis
 */

/**
 * Formatea una dirección Ethereum con middle ellipsis
 *
 * @param address - Dirección Ethereum completa
 * @param startChars - Número de caracteres al inicio (default: 6 incluye 0x)
 * @param endChars - Número de caracteres al final (default: 4)
 * @returns Dirección formateada con ellipsis en el medio
 *
 * @example
 * formatAddress("0x1234567890abcdef1234567890abcdef12345678")
 * // => "0x1234...5678"
 *
 * formatAddress("0x1234567890abcdef1234567890abcdef12345678", 8, 6)
 * // => "0x123456...345678"
 */
export function formatAddress(
  address: string | null | undefined,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return '';

  // Si la dirección es muy corta, devolverla completa
  if (address.length <= startChars + endChars) {
    return address;
  }

  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Formatea una dirección de manera responsive según el breakpoint
 *
 * Breakpoints de Tailwind:
 * - mobile: < 640px (sm)
 * - tablet: 640px - 1024px (sm - lg)
 * - desktop: >= 1024px (lg)
 *
 * @param address - Dirección Ethereum completa
 * @param breakpoint - Tamaño de pantalla ('mobile' | 'tablet' | 'desktop')
 * @returns Dirección formateada según el breakpoint
 */
export function formatAddressResponsive(
  address: string | null | undefined,
  breakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop'
): string {
  if (!address) return '';

  switch (breakpoint) {
    case 'mobile':
      // Mobile: muy compacto (0x12...34)
      return formatAddress(address, 4, 2);
    case 'tablet':
      // Tablet: medio (0x1234...5678)
      return formatAddress(address, 6, 4);
    case 'desktop':
      // Desktop: más caracteres (0x123456...345678)
      return formatAddress(address, 8, 6);
    default:
      return formatAddress(address);
  }
}

/**
 * Formatea un ID genérico (CID, hash, etc.)
 * Similar a formatAddress pero sin asumir prefijo 0x
 *
 * @param id - ID o hash a formatear
 * @param startChars - Número de caracteres al inicio (default: 6)
 * @param endChars - Número de caracteres al final (default: 4)
 * @returns ID formateado con ellipsis
 */
export function formatId(
  id: string | null | undefined,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!id) return '';

  if (id.length <= startChars + endChars + 3) { // +3 para los "..."
    return id;
  }

  return `${id.slice(0, startChars)}...${id.slice(-endChars)}`;
}

/**
 * Formatea un ID de manera responsive
 */
export function formatIdResponsive(
  id: string | null | undefined,
  breakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop'
): string {
  if (!id) return '';

  switch (breakpoint) {
    case 'mobile':
      return formatId(id, 4, 2);
    case 'tablet':
      return formatId(id, 6, 4);
    case 'desktop':
      return formatId(id, 8, 6);
    default:
      return formatId(id);
  }
}

/**
 * Copia texto al portapapeles
 *
 * @param text - Texto a copiar
 * @returns Promise que resuelve true si fue exitoso
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Método moderno (Clipboard API)
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback para navegadores antiguos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    textArea.remove();

    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Valida si una cadena es una dirección Ethereum válida
 */
export function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Obtiene el breakpoint actual del navegador
 * Útil para determinar el formato responsive
 */
export function getCurrentBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;

  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}
