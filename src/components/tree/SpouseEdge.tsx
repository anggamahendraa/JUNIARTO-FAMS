'use client';

import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getStraightPath, type EdgeProps } from '@xyflow/react';
import { Heart } from 'lucide-react';

export default function SpouseEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="bg-[var(--color-bg-primary)] border border-amber-500/30 p-1.5 rounded-full shadow-md z-20 pointer-events-none"
        >
          <Heart className="w-3.5 h-3.5 text-amber-500" style={{ minHeight: 'unset', minWidth: 'unset' }} />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
