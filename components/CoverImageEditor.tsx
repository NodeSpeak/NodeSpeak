"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, Check, X, RotateCcw } from 'lucide-react';

interface CoverImageEditorProps {
  imageUrl: string;
  onSave: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // width / height
  title?: string; // Custom title for the editor
}

export const CoverImageEditor: React.FC<CoverImageEditorProps> = ({
  imageUrl,
  onSave,
  onCancel,
  aspectRatio = 16 / 9,
  title
}) => {
  const isSquare = aspectRatio === 1;
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Calculate initial scale to fit image in container
  const calculateInitialScale = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return 1;
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const imgWidth = imageRef.current.naturalWidth;
    const imgHeight = imageRef.current.naturalHeight;
    
    // Scale to cover the container
    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;
    
    return Math.max(scaleX, scaleY);
  }, []);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
      const initialScale = calculateInitialScale();
      setScale(initialScale);
      setImageLoaded(true);
    }
  };

  // Mouse/Touch handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const newX = e.touches[0].clientX - dragStart.x;
    const newY = e.touches[0].clientY - dragStart.y;
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Zoom handlers
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    const minScale = calculateInitialScale();
    setScale(prev => Math.max(prev / 1.2, minScale * 0.5));
  };

  const handleReset = () => {
    const initialScale = calculateInitialScale();
    setScale(initialScale);
    setPosition({ x: 0, y: 0 });
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const minScale = calculateInitialScale() * 0.5;
    setScale(prev => Math.max(Math.min(prev * delta, 5), minScale));
  };

  // Save cropped image
  const handleSave = async () => {
    if (!containerRef.current || !imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const outputWidth = aspectRatio === 1 ? 400 : 1200; // Logo: 400x400, Cover: 1200x675
    const outputHeight = aspectRatio === 1 ? 400 : outputWidth / aspectRatio;
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Calculate the visible portion of the image
    const img = imageRef.current;
    const scaledWidth = imageDimensions.width * scale;
    const scaledHeight = imageDimensions.height * scale;
    
    // Calculate source coordinates
    const sourceX = (-position.x) / scale;
    const sourceY = (-position.y) / scale;
    const sourceWidth = containerRect.width / scale;
    const sourceHeight = containerRect.height / scale;

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  // Determine the title based on aspect ratio or custom title
  const editorTitle = title || (isSquare ? 'Adjust Logo' : 'Adjust Cover Image');
  const outputSize = isSquare ? 400 : 1200; // Logo: 400x400, Cover: 1200x675

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden my-auto ${isSquare ? 'max-w-md w-full' : 'max-w-2xl w-full'}`}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{editorTitle}</h3>
            <p className="text-xs text-slate-500">
              {isSquare ? 'Output: 400×400px (square)' : 'Output: 1200×675px (16:9)'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Move className="w-3 h-3" />
            <span>Drag to reposition</span>
          </div>
        </div>

        {/* Editor Area */}
        <div className="p-4">
          <div className={`flex ${isSquare ? 'flex-col items-center gap-4' : 'flex-col'}`}>
            {/* Main editing container */}
            <div 
              ref={containerRef}
              className={`relative bg-slate-900 rounded-lg overflow-hidden cursor-move ${isSquare ? 'w-64 h-64' : 'w-full'}`}
              style={isSquare ? {} : { aspectRatio: `${aspectRatio}`, maxHeight: '280px' }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onWheel={handleWheel}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt={isSquare ? 'Logo' : 'Cover'}
                className="absolute select-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'top left',
                  maxWidth: 'none'
                }}
                onLoad={handleImageLoad}
                draggable={false}
              />
              
              {/* Overlay grid for alignment help */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/10" />
                  ))}
                </div>
              </div>

              {/* Center crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`border-2 border-white/30 ${isSquare ? 'w-12 h-12 rounded-xl' : 'w-8 h-8 rounded-full'}`} />
              </div>
            </div>

            {/* Preview for square/logo */}
            {isSquare && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-medium text-slate-600">Preview</p>
                <div className="flex items-center gap-4">
                  {/* Large preview */}
                  <div className="flex flex-col items-center gap-1">
                    <div 
                      className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden border-2 border-slate-300 shadow-sm"
                    >
                      <div className="w-full h-full relative overflow-hidden">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="absolute select-none"
                          style={{
                            transform: `translate(${position.x * (64/256)}px, ${position.y * (64/256)}px) scale(${scale * (64/256)})`,
                            transformOrigin: 'top left',
                            maxWidth: 'none'
                          }}
                          draggable={false}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">64px</span>
                  </div>
                  {/* Medium preview */}
                  <div className="flex flex-col items-center gap-1">
                    <div 
                      className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden border-2 border-slate-300 shadow-sm"
                    >
                      <div className="w-full h-full relative overflow-hidden">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="absolute select-none"
                          style={{
                            transform: `translate(${position.x * (40/256)}px, ${position.y * (40/256)}px) scale(${scale * (40/256)})`,
                            transformOrigin: 'top left',
                            maxWidth: 'none'
                          }}
                          draggable={false}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">40px</span>
                  </div>
                  {/* Small preview */}
                  <div className="flex flex-col items-center gap-1">
                    <div 
                      className="w-6 h-6 rounded-md bg-slate-200 overflow-hidden border border-slate-300 shadow-sm"
                    >
                      <div className="w-full h-full relative overflow-hidden">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="absolute select-none"
                          style={{
                            transform: `translate(${position.x * (24/256)}px, ${position.y * (24/256)}px) scale(${scale * (24/256)})`,
                            transformOrigin: 'top left',
                            maxWidth: 'none'
                          }}
                          draggable={false}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">24px</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={calculateInitialScale() * 50}
                max={500}
                value={scale * 100}
                onChange={(e) => setScale(Number(e.target.value) / 100)}
                className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <span className="text-xs text-slate-600 w-10 text-center">
                {Math.round(scale * 100)}%
              </span>
            </div>
            
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleReset}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors ml-1"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex justify-end items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:bg-white transition-colors flex items-center gap-1.5 text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 transition-all flex items-center gap-1.5 text-sm font-semibold shadow-md shadow-emerald-200"
          >
            <Check className="w-4 h-4" />
            Save Cover
          </button>
        </div>
      </div>
    </div>
  );
};
