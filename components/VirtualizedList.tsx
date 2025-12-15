"use client";

import React, { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps<T> {
    items: T[];
    estimateSize: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    className?: string;
    overscan?: number;
    gap?: number;
}

export function VirtualizedList<T>({
    items,
    estimateSize,
    renderItem,
    className = '',
    overscan = 5,
    gap = 24,
}: VirtualizedListProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimateSize,
        overscan,
        gap,
    });

    const virtualItems = virtualizer.getVirtualItems();

    if (items.length === 0) {
        return null;
    }

    return (
        <div
            ref={parentRef}
            className={`overflow-auto ${className}`}
            style={{ contain: 'strict' }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualItem) => (
                    <div
                        key={virtualItem.key}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualItem.start}px)`,
                        }}
                        data-index={virtualItem.index}
                    >
                        {renderItem(items[virtualItem.index], virtualItem.index)}
                    </div>
                ))}
            </div>
        </div>
    );
}

interface VirtualizedWindowListProps<T> {
    items: T[];
    estimateSize: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    className?: string;
    overscan?: number;
    gap?: number;
}

export function VirtualizedWindowList<T>({
    items,
    estimateSize,
    renderItem,
    className = '',
    overscan = 5,
    gap = 24,
}: VirtualizedWindowListProps<T>) {
    const listRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => (typeof window !== 'undefined' ? window : null) as any,
        estimateSize: () => estimateSize,
        overscan,
        gap,
        scrollMargin: listRef.current?.offsetTop ?? 0,
    });

    const virtualItems = virtualizer.getVirtualItems();

    if (items.length === 0) {
        return null;
    }

    return (
        <div ref={listRef} className={className}>
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualItem) => (
                    <div
                        key={virtualItem.key}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualItem.start - (listRef.current?.offsetTop ?? 0)}px)`,
                        }}
                        data-index={virtualItem.index}
                    >
                        {renderItem(items[virtualItem.index], virtualItem.index)}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function useVirtualList<T>(
    items: T[],
    options: {
        estimateSize: number;
        overscan?: number;
        gap?: number;
        parentRef: React.RefObject<HTMLElement>;
    }
) {
    const { estimateSize, overscan = 5, gap = 24, parentRef } = options;

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimateSize,
        overscan,
        gap,
    });

    const virtualItems = virtualizer.getVirtualItems();

    const getVirtualItemProps = useCallback(
        (index: number) => ({
            style: {
                position: 'absolute' as const,
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItems.find(v => v.index === index)?.start ?? 0}px)`,
            },
        }),
        [virtualItems]
    );

    return {
        virtualizer,
        virtualItems,
        totalSize: virtualizer.getTotalSize(),
        getVirtualItemProps,
    };
}
