"use client";

import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAddress, formatId, copyToClipboard, getCurrentBreakpoint } from '@/lib/addressUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AddressDisplayProps {
  /** Dirección o ID a mostrar */
  value: string | null | undefined;
  /** Tipo de valor para formateo apropiado */
  type?: 'address' | 'id';
  /** Mostrar botón de copiado */
  showCopy?: boolean;
  /** Mostrar tooltip con valor completo */
  showTooltip?: boolean;
  /** Clase CSS personalizada para el contenedor */
  className?: string;
  /** Clase CSS personalizada para el texto */
  textClassName?: string;
  /** Formatos responsive personalizados por breakpoint */
  responsive?: {
    mobile?: { start: number; end: number };
    tablet?: { start: number; end: number };
    desktop?: { start: number; end: number };
  };
  /** Usar breakpoints de Tailwind automáticamente */
  autoResponsive?: boolean;
}

/**
 * Componente para mostrar direcciones Ethereum o IDs con:
 * - Truncado middle ellipsis responsive
 * - Tooltip con valor completo
 * - Botón de copiado
 * - Adaptación automática a tamaño de pantalla
 *
 * @example
 * // Uso básico
 * <AddressDisplay value="0x1234...5678" />
 *
 * // Con copiado y tooltip
 * <AddressDisplay
 *   value={address}
 *   showCopy
 *   showTooltip
 * />
 *
 * // Responsive automático
 * <AddressDisplay
 *   value={address}
 *   autoResponsive
 *   showCopy
 * />
 *
 * // Formatos personalizados
 * <AddressDisplay
 *   value={id}
 *   type="id"
 *   responsive={{
 *     mobile: { start: 3, end: 2 },
 *     tablet: { start: 5, end: 3 },
 *     desktop: { start: 10, end: 8 }
 *   }}
 * />
 */
export function AddressDisplay({
  value,
  type = 'address',
  showCopy = false,
  showTooltip = true,
  className,
  textClassName,
  responsive,
  autoResponsive = true,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  // Formatear valor según breakpoint
  useEffect(() => {
    if (!value) {
      setDisplayValue('');
      return;
    }

    const updateDisplay = () => {
      if (!autoResponsive && !responsive) {
        // Sin responsive: usar formato default
        const formatted = type === 'address' ? formatAddress(value) : formatId(value);
        setDisplayValue(formatted);
        return;
      }

      const breakpoint = getCurrentBreakpoint();

      if (responsive) {
        // Formatos personalizados
        const config = responsive[breakpoint];
        if (config) {
          const formatted = type === 'address'
            ? formatAddress(value, config.start, config.end)
            : formatId(value, config.start, config.end);
          setDisplayValue(formatted);
        } else {
          setDisplayValue(value);
        }
      } else {
        // Auto responsive con defaults
        let formatted: string;
        switch (breakpoint) {
          case 'mobile':
            formatted = type === 'address'
              ? formatAddress(value, 4, 2)
              : formatId(value, 4, 2);
            break;
          case 'tablet':
            formatted = type === 'address'
              ? formatAddress(value, 6, 4)
              : formatId(value, 6, 4);
            break;
          case 'desktop':
            formatted = type === 'address'
              ? formatAddress(value, 8, 6)
              : formatId(value, 8, 6);
            break;
          default:
            formatted = type === 'address' ? formatAddress(value) : formatId(value);
        }
        setDisplayValue(formatted);
      }
    };

    updateDisplay();

    // Re-formatear en resize
    if (autoResponsive || responsive) {
      window.addEventListener('resize', updateDisplay);
      return () => window.removeEventListener('resize', updateDisplay);
    }
  }, [value, type, autoResponsive, responsive]);

  const handleCopy = async () => {
    if (!value) return;

    const success = await copyToClipboard(value);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!value) return null;

  const content = (
    <div className={cn('inline-flex items-center gap-1.5 group', className)}>
      <code
        className={cn(
          'text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded',
          'max-w-full truncate',
          textClassName
        )}
      >
        {displayValue}
      </code>

      {showCopy && (
        <button
          onClick={handleCopy}
          className={cn(
            'p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800',
            'transition-colors opacity-0 group-hover:opacity-100',
            'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
          )}
          title={copied ? 'Copiado!' : 'Copiar'}
          aria-label={copied ? 'Copiado' : 'Copiar al portapapeles'}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-slate-500" />
          )}
        </button>
      )}
    </div>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs sm:max-w-sm md:max-w-md break-all"
          >
            <p className="text-xs font-mono">{value}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

/**
 * Variante compacta sin estilos, solo texto formateado
 * Útil cuando solo necesitas el texto formateado sin UI adicional
 */
export function AddressText({
  value,
  type = 'address',
  className,
  autoResponsive = true,
}: Pick<AddressDisplayProps, 'value' | 'type' | 'className' | 'autoResponsive'>) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (!value) {
      setDisplayValue('');
      return;
    }

    const updateDisplay = () => {
      if (!autoResponsive) {
        const formatted = type === 'address' ? formatAddress(value) : formatId(value);
        setDisplayValue(formatted);
        return;
      }

      const breakpoint = getCurrentBreakpoint();
      let formatted: string;

      switch (breakpoint) {
        case 'mobile':
          formatted = type === 'address'
            ? formatAddress(value, 4, 2)
            : formatId(value, 4, 2);
          break;
        case 'tablet':
          formatted = type === 'address'
            ? formatAddress(value, 6, 4)
            : formatId(value, 6, 4);
          break;
        case 'desktop':
          formatted = type === 'address'
            ? formatAddress(value, 8, 6)
            : formatId(value, 8, 6);
          break;
        default:
          formatted = type === 'address' ? formatAddress(value) : formatId(value);
      }
      setDisplayValue(formatted);
    };

    updateDisplay();

    if (autoResponsive) {
      window.addEventListener('resize', updateDisplay);
      return () => window.removeEventListener('resize', updateDisplay);
    }
  }, [value, type, autoResponsive]);

  if (!value) return null;

  return <span className={className}>{displayValue}</span>;
}
