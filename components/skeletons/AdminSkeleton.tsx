"use client";

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton para fila de tabla en paneles de admin
 */
export function TableRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 p-4 border-b border-slate-200 dark:border-slate-700", className)}>
      <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />

      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>

      <div className="flex gap-2">
        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Skeleton para panel de admin con tabla
 */
export function AdminPanelSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fadeIn", className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
        </div>

        {/* Search bar */}
        <div className="h-10 w-full max-w-md bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>

      {/* Table rows */}
      <div>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para stat card en admin dashboard
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Skeleton para dashboard de admin completo
 */
export function AdminDashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-fadeIn", className)}>
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminPanelSkeleton rows={3} />
        <AdminPanelSkeleton rows={3} />
      </div>
    </div>
  );
}
