import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const AmbientBackground: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#fafafa]">
      {/* 1. Subtle 24px Engineering Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.9) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.9) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* 2. Top-Center Ambient Soft Vignette */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] opacity-30 blur-[100px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* 3. Subtle Interactive Cursor Parallax */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-15 pointer-events-none"
        animate={{
          x: mousePosition.x - 200,
          y: mousePosition.y - 200,
        }}
        transition={{
          type: 'spring',
          damping: 40,
          stiffness: 200,
          mass: 0.8,
        }}
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};
