import { type Node, type Edge } from '@xyflow/react';
import type { FamilyMember } from './family';

// Custom node data for React Flow
export interface FamilyNodeData extends Record<string, unknown> {
  member: FamilyMember;
  isSelected: boolean;
  isHighlighted: boolean;
}

export type FamilyNode = Node<FamilyNodeData, 'familyMember'>;

export interface FamilyEdgeData extends Record<string, unknown> {
  relationshipType: 'parent-child' | 'spouse';
}

export type FamilyEdge = Edge<FamilyEdgeData>;
