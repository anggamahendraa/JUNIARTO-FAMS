'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FamilyMemberNode from './FamilyMemberNode';
import SpouseEdge from './SpouseEdge';
import { useTreeStore } from '@/stores/tree-store';
import { useUIStore } from '@/stores/ui-store';
import type { FamilyNode, FamilyEdge } from '@/types';

const nodeTypes = {
  familyMember: FamilyMemberNode,
};

const edgeTypes = {
  spouse: SpouseEdge,
};

export default function FamilyTreeCanvas() {
  const { nodes: storeNodes, edges: storeEdges, selectMember, focusedNodeId } = useTreeStore();
  const { openProfile } = useUIStore();
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyNode>(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FamilyEdge>(storeEdges);

  // Sync store → local state
  React.useEffect(() => {
    setNodes(storeNodes);
    setEdges(storeEdges);
  }, [storeNodes, storeEdges, setNodes, setEdges]);

  // Handle programmatic panning when search is used
  React.useEffect(() => {
    if (focusedNodeId) {
      const node = nodes.find(n => n.id === focusedNodeId);
      if (node) {
        // Zoom and center on the node
        reactFlowInstance.setCenter(
          node.position.x + 100, // half of width (200)
          node.position.y + 50,  // half of height (100)
          { zoom: 1.5, duration: 800 }
        );
      }
    }
  }, [focusedNodeId, nodes, reactFlowInstance]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: FamilyNode) => {
      // openProfile(); is now handled inside RadialMenu.
      // selectMember(node.id); is fine if we just want to track selection
    },
    []
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      style: { strokeWidth: 2 },
    }),
    []
  );

  return (
    <div ref={reactFlowRef} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(148, 163, 184, 0.08)"
        />
        <Controls
          showInteractive={false}
          className="!bottom-4 !left-4"
        />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            const data = node.data as { member?: { gender: string } };
            return data?.member?.gender === 'male' ? '#6366f1' : '#ec4899';
          }}
          className="!bottom-4 !right-4"
          maskColor="rgba(0, 0, 0, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
