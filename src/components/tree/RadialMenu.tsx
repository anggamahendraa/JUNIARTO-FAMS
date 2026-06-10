'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, Link as LinkIcon, Unlink, UserPlus, Heart, Baby } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type RadialAction = 'edit' | 'delete' | 'add_parent' | 'add_spouse' | 'add_child' | 'link' | 'unlink';

interface RadialMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: RadialAction) => void;
}

export default function RadialMenu({ isOpen, onClose, onAction }: RadialMenuProps) {
  // 7 menu items as requested
  const menuItems: { id: RadialAction; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'edit', label: 'Edit', icon: Edit2, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { id: 'add_parent', label: 'Orangtua', icon: UserPlus, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { id: 'add_spouse', label: 'Pasangan', icon: Heart, color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
    { id: 'add_child', label: 'Anak', icon: Baby, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    { id: 'link', label: 'Hubungkan', icon: LinkIcon, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { id: 'unlink', label: 'Putuskan', icon: Unlink, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
    { id: 'delete', label: 'Hapus', icon: Trash2, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  ];

  // Calculate position for each item in a circle
  const radius = 80; // Distance from center
  const totalItems = menuItems.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible backdrop to detect clicks outside */}
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); onClose(); }} />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            {menuItems.map((item, index) => {
              // Calculate angle (starting from top, going clockwise)
              const angle = (index * (360 / totalItems) - 90) * (Math.PI / 180);
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              const Icon = item.icon;

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  animate={{ opacity: 1, x, y, scale: 1 }}
                  exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.03 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(item.id);
                    onClose();
                  }}
                  className={cn(
                    'absolute -ml-6 -mt-6 w-12 h-12 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center shadow-xl group hover:scale-110 transition-transform cursor-pointer',
                    item.color
                  )}
                  title={item.label}
                  style={{ minHeight: 'unset', minWidth: 'unset' }}
                >
                  <Icon className="w-5 h-5" style={{ minHeight: 'unset', minWidth: 'unset' }} />
                  
                  {/* Tooltip on hover */}
                  <span className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] whitespace-nowrap bg-black/80 text-white px-2 py-0.5 rounded">
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
