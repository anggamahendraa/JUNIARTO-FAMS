import dagre from 'dagre';
import type { FamilyMember, FamilyNode, FamilyEdge } from '@/types';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;

/**
 * Transforms family member data into React Flow nodes and edges
 * Uses dagre for automatic hierarchical layout
 */
export function buildFamilyTree(
  members: FamilyMember[],
  selectedId: string | null = null,
  highlightedIds: string[] = []
): { nodes: FamilyNode[]; edges: FamilyEdge[] } {
  if (members.length === 0) return { nodes: [], edges: [] };

  const nodes: FamilyNode[] = [];
  const edges: FamilyEdge[] = [];
  const memberMap = new Map(members.map((m) => [m.id, m]));

  // Create nodes
  members.forEach((member) => {
    nodes.push({
      id: member.id,
      type: 'familyMember',
      position: { x: 0, y: 0 }, // Will be set by dagre
      data: {
        member,
        isSelected: member.id === selectedId,
        isHighlighted: highlightedIds.includes(member.id),
      },
    });
  });

  // Create edges
  const addedSpouseEdges = new Set<string>();
  
  members.forEach((member) => {
    // Parent-child edges
    if (member.father_id && memberMap.has(member.father_id)) {
      edges.push({
        id: `e-father-${member.father_id}-${member.id}`,
        source: member.father_id,
        target: member.id,
        type: 'smoothstep',
        data: { relationshipType: 'parent-child' as const },
        style: { stroke: '#6366f1', strokeWidth: 2 },
        animated: false,
      });
    }

    if (member.mother_id && memberMap.has(member.mother_id)) {
      edges.push({
        id: `e-mother-${member.mother_id}-${member.id}`,
        source: member.mother_id,
        target: member.id,
        type: 'smoothstep',
        data: { relationshipType: 'parent-child' as const },
        style: { stroke: '#ec4899', strokeWidth: 2 },
        animated: false,
      });
    }

    // Spouse edges (bidirectional, only add once)
    if (member.spouse_id && memberMap.has(member.spouse_id)) {
      const edgeKey = [member.id, member.spouse_id].sort().join('-');
      if (!addedSpouseEdges.has(edgeKey)) {
        addedSpouseEdges.add(edgeKey);
        edges.push({
          id: `e-spouse-${edgeKey}`,
          source: member.id,
          target: member.spouse_id,
          type: 'spouse',
          data: { relationshipType: 'spouse' as const },
          style: { stroke: '#f59e0b', strokeWidth: 2 },
          animated: false,
        });
      }
    }
  });

  // Apply dagre layout
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: 'TB', 
    nodesep: 150, // Increased to allow space for spouse edges and radial menus
    ranksep: 180, // Increased for clearer generational separation
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Apply all edges to layout (Dagre handles them well enough if configured)
  // But we need spouses to be on the same rank, so we don't add spouse edges to Dagre,
  // we just let them render based on the nodes' calculated positions.
  edges
    .filter((e) => e.data?.relationshipType === 'parent-child')
    .forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

  dagre.layout(dagreGraph);

  // Apply positions from dagre
  nodes.forEach((node) => {
    const dagreNode = dagreGraph.node(node.id);
    if (dagreNode) {
      node.position = {
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      };
    }
  });

  return { nodes, edges };
}
