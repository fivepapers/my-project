import { cloneDeep } from 'lodash';
import type { Component, ComponentsState } from '../../types';
import type { HistoryCommand } from '../../types/History';
import { CANVAS_ROOT_ID } from '../constants';

export function collectSubtreeIds(rootId: string, byId: Record<string, Component>): string[] {
  const out: string[] = [];
  function dfs(cid: string) {
    out.push(cid);
    byId[cid]?.childIds.forEach(dfs);
  }
  dfs(rootId);
  return out;
}

export function buildRemoveCommand(components: ComponentsState, id: string): HistoryCommand | null {
  if (id === CANVAS_ROOT_ID) return null;
  const node = components.byId[id];
  if (!node) return null;
  const { byId, allIds } = components;
  let orderedIds = collectSubtreeIds(id, byId);
  orderedIds = [...orderedIds].sort((a, b) => allIds.indexOf(a) - allIds.indexOf(b));
  const indices = orderedIds.map((oid) => allIds.indexOf(oid)).filter((i) => i >= 0);
  if (indices.length === 0) return null;
  const startIndexAllIds = Math.min(...indices);
  const parentId = node.parentId!;
  const insertIndex = byId[parentId]!.childIds.indexOf(id);
  const nodesById: Record<string, Component> = {};
  for (const oid of orderedIds) {
    nodesById[oid] = cloneDeep(byId[oid]!);
  }
  return {
    kind: 'remove',
    rootId: id,
    nodesById,
    orderedIds,
    parentId,
    insertIndex,
    startIndexAllIds,
  };
}

export function validateCanvasState(components: ComponentsState): boolean {
  const { byId, allIds, rootId } = components;
  const seen = new Set<string>();
  for (const id of allIds) {
    if (seen.has(id)) return false;
    seen.add(id);
  }
  for (const [id, component] of Object.entries(byId)) {
    if (component.parentId) {
      const parent = byId[component.parentId];
      if (!parent) return false;
      if (!parent.childIds.includes(id)) return false;
    }
    if (id === rootId && component.parentId !== null) return false;
  }
  return true;
}
