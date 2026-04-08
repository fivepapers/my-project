import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import type { Component, ComponentStyle, ComponentType, ComponentsState } from '../../types';
import { getComponentMeta } from '../../registry/componentRegistry';
import { CANVAS_ROOT_ID, DEVICE_CANVAS_WIDTH } from '../constants';
import { setDevice } from './editorSlice';

function createRootComponent(): Component {
  return {
    id: CANVAS_ROOT_ID,
    type: 'div',
    props: {},
    style: {
      width: DEVICE_CANVAS_WIDTH.pc,
      height: 600,
      left: 0,
      top: 0,
      position: 'relative',
      backgroundColor: '#fafafa',
    },
    childIds: [],
    parentId: null,
    zIndex: 0,
  };
}

/** 根据 allIds 顺序重新计算每个组件的 zIndex */
function rebuildZIndex(byId: Record<string, Component>, allIds: string[]): void {
  allIds.forEach((id, idx) => {
    if (byId[id]) byId[id]!.zIndex = idx;
  });
}

const initialState: ComponentsState = {
  byId: { [CANVAS_ROOT_ID]: createRootComponent() },
  allIds: [CANVAS_ROOT_ID],
  rootId: CANVAS_ROOT_ID,
};

export const componentsSlice = createSlice({
  name: 'components',
  initialState,
  reducers: {
    addComponent: {
      prepare(payload: {
        type: ComponentType;
        parentId?: string;
        position?: { left: number; top: number };
        id?: string;
      }) {
        const id = payload.id ?? nanoid();
        return { payload: { ...payload, id } };
      },
      reducer(
        state,
        action: PayloadAction<{
          type: ComponentType;
          parentId?: string;
          position?: { left: number; top: number };
          id: string;
        }>,
      ) {
        const { type, parentId = CANVAS_ROOT_ID, position, id } = action.payload;
        const parent = state.byId[parentId];
        if (!parent) return;

        const meta = getComponentMeta(type);
        if (!meta) return;

        const style: ComponentStyle = { ...meta.defaultStyle };
        if (position) {
          style.left = position.left;
          style.top = position.top;
        }

        const node: Component = {
          id,
          type,
          props: { ...meta.defaultProps },
          style,
          childIds: [],
          parentId,
          zIndex: state.allIds.length,
        };

        state.byId[id] = node;
        state.allIds.push(id);
        parent.childIds.push(id);
      },
    },

    addComponentFromSerialized: (state, action: PayloadAction<{ component: Component }>) => {
      const { component } = action.payload;
      const parentId = component.parentId ?? CANVAS_ROOT_ID;
      const parent = state.byId[parentId];
      if (!parent) return;
      state.byId[component.id] = component;
      state.allIds.push(component.id);
      parent.childIds.push(component.id);
    },

    removeComponent: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (id === CANVAS_ROOT_ID) return;
      const node = state.byId[id];
      if (!node) return;

      const removeRecursive = (cid: string) => {
        const c = state.byId[cid];
        if (!c) return;
        for (const childId of [...c.childIds]) {
          removeRecursive(childId);
        }
        if (c.parentId) {
          const p = state.byId[c.parentId];
          if (p) p.childIds = p.childIds.filter((x) => x !== cid);
        }
        delete state.byId[cid];
        state.allIds = state.allIds.filter((x) => x !== cid);
      };

      removeRecursive(id);
    },

    updateProps: (
      state,
      action: PayloadAction<{
        id: string;
        props?: Record<string, unknown>;
        style?: Partial<ComponentStyle>;
      }>,
    ) => {
      const { id, props, style } = action.payload;
      const node = state.byId[id];
      if (!node || id === CANVAS_ROOT_ID) return;
      if (props) node.props = { ...node.props, ...props };
      if (style) node.style = { ...node.style, ...style };
    },

    replaceComponent: (
      state,
      action: PayloadAction<{
        id: string;
        props: Record<string, unknown>;
        style: ComponentStyle;
      }>,
    ) => {
      const { id, props, style } = action.payload;
      const node = state.byId[id];
      if (!node || id === CANVAS_ROOT_ID) return;
      node.props = props;
      node.style = style;
    },

    restoreSubtree: (
      state,
      action: PayloadAction<{
        nodesById: Record<string, Component>;
        orderedIds: string[];
        parentId: string;
        insertIndex: number;
        startIndexAllIds: number;
      }>,
    ) => {
      const { nodesById, orderedIds, parentId, insertIndex, startIndexAllIds } = action.payload;
      for (const cid of orderedIds) {
        state.byId[cid] = nodesById[cid]!;
      }
      const parent = state.byId[parentId];
      if (parent && orderedIds[0]) {
        parent.childIds.splice(insertIndex, 0, orderedIds[0]);
      }
      state.allIds.splice(startIndexAllIds, 0, ...orderedIds);
    },

    pasteComponents: (
      state,
      action: PayloadAction<{ components: Component[]; parentId: string }>,
    ) => {
      const { components, parentId } = action.payload;
      const parent = state.byId[parentId];
      if (!parent) return;
      for (const comp of components) {
        state.byId[comp.id] = comp;
        state.allIds.push(comp.id);
        parent.childIds.push(comp.id);
      }
      rebuildZIndex(state.byId, state.allIds);
    },

    removePastedComponents: (state, action: PayloadAction<string[]>) => {
      for (const id of action.payload) {
        if (id === CANVAS_ROOT_ID) continue;
        const node = state.byId[id];
        if (!node) continue;
        if (node.parentId) {
          const p = state.byId[node.parentId];
          if (p) p.childIds = p.childIds.filter((x) => x !== id);
        }
        delete state.byId[id];
        state.allIds = state.allIds.filter((x) => x !== id);
      }
      rebuildZIndex(state.byId, state.allIds);
    },

    bringToFront: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (id === CANVAS_ROOT_ID) return;
      const allIds = state.allIds;
      const index = allIds.indexOf(id);
      if (index < 0 || index === allIds.length - 1) return;
      allIds.splice(index, 1);
      allIds.push(id);
      rebuildZIndex(state.byId, allIds);
    },

    sendToBack: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (id === CANVAS_ROOT_ID) return;
      const allIds = state.allIds;
      const index = allIds.indexOf(id);
      if (index <= 1) return;
      allIds.splice(index, 1);
      allIds.splice(1, 0, id);
      rebuildZIndex(state.byId, allIds);
    },

    bringForward: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (id === CANVAS_ROOT_ID) return;
      const allIds = state.allIds;
      const index = allIds.indexOf(id);
      if (index < 0 || index === allIds.length - 1) return;
      [allIds[index], allIds[index + 1]] = [allIds[index + 1]!, allIds[index]!];
      rebuildZIndex(state.byId, allIds);
    },

    sendBackward: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (id === CANVAS_ROOT_ID) return;
      const allIds = state.allIds;
      const index = allIds.indexOf(id);
      if (index <= 1) return;
      [allIds[index], allIds[index - 1]] = [allIds[index - 1]!, allIds[index]!];
      rebuildZIndex(state.byId, allIds);
    },

    restoreLayerOrder: (
      state,
      action: PayloadAction<{ allIds: string[]; zIndexMap: Record<string, number> }>,
    ) => {
      state.allIds = action.payload.allIds;
      for (const [id, z] of Object.entries(action.payload.zIndexMap)) {
        if (state.byId[id]) state.byId[id]!.zIndex = z;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setDevice, (state, action) => {
      const root = state.byId[CANVAS_ROOT_ID];
      if (root) root.style.width = DEVICE_CANVAS_WIDTH[action.payload];
    });
  },
});

export const {
  addComponent,
  addComponentFromSerialized,
  removeComponent,
  updateProps,
  replaceComponent,
  restoreSubtree,
  pasteComponents,
  removePastedComponents,
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
  restoreLayerOrder,
} = componentsSlice.actions;
