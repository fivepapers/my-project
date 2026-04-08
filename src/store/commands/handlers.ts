import { cloneDeep } from 'lodash';
import { registerCommandHandler } from './registry';
import {
  addComponentFromSerialized,
  pasteComponents,
  removeComponent,
  removePastedComponents,
  replaceComponent,
  restoreLayerOrder,
  restoreSubtree,
  updateProps,
} from '../slices/componentsSlice';
import { selectComponent, setHovered } from '../slices/selectionSlice';
import { syncSelectionToGraph } from '../syncSelection';
import { CANVAS_ROOT_ID } from '../constants';
import type { HistoryCommand } from '../../types';

registerCommandHandler<Extract<HistoryCommand, { kind: 'add' }>>('add', {
  execute: (command, dispatch) => {
    const { component } = command;
    dispatch(addComponentFromSerialized({ component: cloneDeep(component) }));
    dispatch(selectComponent([component.id]));
    dispatch(setHovered(null));
  },
  undo: (command, dispatch, getState) => {
    dispatch(removeComponent(command.component.id));
    syncSelectionToGraph(dispatch, getState);
  },
});

registerCommandHandler<Extract<HistoryCommand, { kind: 'remove' }>>('remove', {
  execute: (command, dispatch, getState) => {
    dispatch(removeComponent(command.rootId));
    syncSelectionToGraph(dispatch, getState);
  },
  undo: (command, dispatch, getState) => {
    dispatch(
      restoreSubtree({
        nodesById: command.nodesById,
        orderedIds: command.orderedIds,
        parentId: command.parentId,
        insertIndex: command.insertIndex,
        startIndexAllIds: command.startIndexAllIds,
      }),
    );
    syncSelectionToGraph(dispatch, getState);
  },
});

registerCommandHandler<Extract<HistoryCommand, { kind: 'update' }>>('update', {
  execute: (command, dispatch) => {
    dispatch(
      replaceComponent({
        id: command.id,
        props: cloneDeep(command.nextProps),
        style: cloneDeep(command.nextStyle),
      }),
    );
  },
  undo: (command, dispatch) => {
    dispatch(
      replaceComponent({
        id: command.id,
        props: cloneDeep(command.prevProps),
        style: cloneDeep(command.prevStyle),
      }),
    );
  },
});

registerCommandHandler<Extract<HistoryCommand, { kind: 'moveStyle' }>>('moveStyle', {
  execute: (command, dispatch) => {
    dispatch(
      updateProps({
        id: command.id,
        style: { left: command.nextLeft, top: command.nextTop },
      }),
    );
  },
  undo: (command, dispatch) => {
    dispatch(
      updateProps({
        id: command.id,
        style: { left: command.prevLeft, top: command.prevTop },
      }),
    );
  },
});

registerCommandHandler<Extract<HistoryCommand, { kind: 'paste' }>>('paste', {
  execute: (command, dispatch) => {
    const nodes = command.components.map((c) => cloneDeep(c));
    dispatch(
      pasteComponents({
        components: nodes,
        parentId: command.components[0]?.parentId ?? CANVAS_ROOT_ID,
      }),
    );
    dispatch(selectComponent(nodes.map((n) => n.id)));
    dispatch(setHovered(null));
  },
  undo: (command, dispatch, getState) => {
    dispatch(removePastedComponents(command.components.map((c) => c.id)));
    syncSelectionToGraph(dispatch, getState);
  },
});

registerCommandHandler<Extract<HistoryCommand, { kind: 'layer' }>>('layer', {
  execute: (command, dispatch) => {
    dispatch(restoreLayerOrder({ allIds: command.nextAllIds, zIndexMap: command.nextZIndexMap }));
  },
  undo: (command, dispatch) => {
    dispatch(restoreLayerOrder({ allIds: command.prevAllIds, zIndexMap: command.prevZIndexMap }));
  },
});
