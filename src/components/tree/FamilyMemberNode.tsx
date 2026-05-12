'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { User } from 'lucide-react';
import type { FamilyNode } from '@/types';
import { cn, getInitials } from '@/lib/utils';

const FamilyMemberNode = memo(function FamilyMemberNode({
  data,
}: NodeProps<FamilyNode>) {
  const { member, isSelected, isHighlighted } = data;
  const isMale = member.gender === 'male';

  return (
    <>
      {/* Target handles */}
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-3 !h-3" />

      <div
        className={cn(
          'group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer',
          'bg-[var(--color-bg-card)] border hover:shadow-lg',
          isSelected
            ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/20 scale-105'
            : isHighlighted
              ? 'border-indigo-500/40 shadow-md shadow-indigo-500/10'
              : 'border-white/10 hover:border-white/20 hover:scale-[1.02]',
          !member.is_alive && 'opacity-75'
        )}
        style={{ minWidth: 180, maxWidth: 220 }}
      >
        {/* Avatar */}
        <div
          className={cn(
            'relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2',
            isMale ? 'border-indigo-500/50 bg-indigo-500/15' : 'border-pink-500/50 bg-pink-500/15'
          )}
        >
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={member.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className={cn(
                'text-xs font-bold',
                isMale ? 'text-indigo-300' : 'text-pink-300'
              )}
            >
              {getInitials(member.full_name)}
            </span>
          )}

          {/* Alive/Dead indicator */}
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--color-bg-card)]',
              member.is_alive ? 'bg-emerald-400' : 'bg-red-400'
            )}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate leading-tight">
            {member.full_name}
          </p>
          {member.nickname && (
            <p className="text-xs text-slate-500 truncate">
              &quot;{member.nickname}&quot;
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                isMale
                  ? 'bg-indigo-500/15 text-indigo-300'
                  : 'bg-pink-500/15 text-pink-300'
              )}
            >
              Gen {member.generation}
            </span>
            {!member.is_alive && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/15 text-red-300">
                Almarhum
              </span>
            )}
          </div>
        </div>

        {/* Hover glow */}
        <div
          className={cn(
            'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
            isMale
              ? 'bg-gradient-to-r from-indigo-500/5 to-transparent'
              : 'bg-gradient-to-r from-pink-500/5 to-transparent'
          )}
        />
      </div>

      {/* Source handle */}
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-3 !h-3" />
    </>
  );
});

export default FamilyMemberNode;
