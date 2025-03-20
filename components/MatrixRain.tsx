"use client"

import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export const MatrixRain: React.FC<MatrixRainProps> = ({ intensity = 'high', className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "PUTOELQUELEE>_";
    const fontSize = intensity === 'low' ? 16 : 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];
    
    // Configure animation speed and density based on intensity
    const fadeOpacity = {
      'low': 0.08,
      'medium': 0.05,
      'high': 0.03
    }[intensity];
    
    const dropChance = {
      'low': 0.985,
      'medium': 0.975,
      'high': 0.965
    }[intensity];
    
    const frameRate = {
      'low': 66,
      'medium': 50,
      'high': 33
    }[intensity];
    
    // Initialize fewer drops for low intensity
    const dropDensity = intensity === 'low' ? 2 : 1;
    for (let i = 0; i < columns; i += dropDensity) {
      drops[i] = 1;
    }

    const draw = () => {
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00ff41';
      ctx.font = `${fontSize}px 'Source Code Pro'`;

      for (let i = 0; i < drops.length; i++) {
        if (drops[i] === undefined) continue;
        
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > dropChance) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    const interval = setInterval(draw, frameRate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} className={`matrix-rain ${className}`} />;
};