import { create } from 'zustand';
import type { FamilyMember, Family, FamilyNode, FamilyEdge } from '@/types';
import { buildFamilyTree } from '@/lib/tree-layout';

interface TreeState {
  // Data
  families: Family[];
  currentFamily: Family | null;
  members: FamilyMember[];
  nodes: FamilyNode[];
  edges: FamilyEdge[];

  // Filters
  minGeneration: number | null;
  maxGeneration: number | null;
  generationRange: [number, number]; // [min available, max available]

  // Selection
  selectedMemberId: string | null;
  highlightedMemberIds: string[];

  // Actions
  setFamilies: (families: Family[]) => void;
  setCurrentFamily: (family: Family | null) => void;
  setMembers: (members: FamilyMember[]) => void;
  setGenerationFilter: (min: number | null, max: number | null) => void;
  selectMember: (id: string | null) => void;
  highlightMembers: (ids: string[]) => void;
  rebuildTree: () => void;
}

export const useTreeStore = create<TreeState>((set, get) => ({
  // Data
  families: [],
  currentFamily: null,
  members: [],
  nodes: [],
  edges: [],

  // Filters
  minGeneration: null,
  maxGeneration: null,
  generationRange: [1, 1],

  // Selection
  selectedMemberId: null,
  highlightedMemberIds: [],

  // Actions
  setFamilies: (families) => set({ families }),

  setCurrentFamily: (family) => set({ currentFamily: family }),

  setMembers: (members) => {
    const generations = members.map((m) => m.generation);
    const minGen = Math.min(...generations, 1);
    const maxGen = Math.max(...generations, 1);

    set({
      members,
      generationRange: [minGen, maxGen],
    });

    // Rebuild tree with new members
    get().rebuildTree();
  },

  setGenerationFilter: (min, max) => {
    set({ minGeneration: min, maxGeneration: max });
    get().rebuildTree();
  },

  selectMember: (id) => {
    set({ selectedMemberId: id });
    get().rebuildTree();
  },

  highlightMembers: (ids) => {
    set({ highlightedMemberIds: ids });
    get().rebuildTree();
  },

  rebuildTree: () => {
    const { members, minGeneration, maxGeneration, selectedMemberId, highlightedMemberIds } = get();

    // Filter by generation
    let filtered = members;
    if (minGeneration !== null) {
      filtered = filtered.filter((m) => m.generation >= minGeneration);
    }
    if (maxGeneration !== null) {
      filtered = filtered.filter((m) => m.generation <= maxGeneration);
    }

    const { nodes, edges } = buildFamilyTree(filtered, selectedMemberId, highlightedMemberIds);
    set({ nodes, edges });
  },
}));
