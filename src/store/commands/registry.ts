import type { Dispatch } from '@reduxjs/toolkit';
import type { HistoryCommand } from '../../types';
import type { RootState } from '../../types';

export type CommandKind = HistoryCommand['kind'];

export interface CommandHandler<T extends HistoryCommand = HistoryCommand> {
  execute: (command: T, dispatch: Dispatch, getState: () => RootState) => void;
  undo: (command: T, dispatch: Dispatch, getState: () => RootState) => void;
}

const commandHandlers = new Map<CommandKind, CommandHandler>();

export function registerCommandHandler<T extends HistoryCommand>(
  kind: T['kind'],
  handler: CommandHandler<T>,
): void {
  commandHandlers.set(kind, handler as CommandHandler);
}

export function executeCommand(
  command: HistoryCommand,
  dispatch: Dispatch,
  getState: () => RootState,
): void {
  const handler = commandHandlers.get(command.kind);
  if (handler) {
    handler.execute(command, dispatch, getState);
  } else {
    console.warn(`No handler registered for command kind: ${command.kind}`);
  }
}

export function undoCommand(
  command: HistoryCommand,
  dispatch: Dispatch,
  getState: () => RootState,
): void {
  const handler = commandHandlers.get(command.kind);
  if (handler) {
    handler.undo(command, dispatch, getState);
  } else {
    console.warn(`No handler registered for command kind: ${command.kind}`);
  }
}
