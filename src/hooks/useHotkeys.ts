import { useEffect } from 'react';

type KeyMap = Record<string, (e: KeyboardEvent) => void>;

/** 焦点在可编辑控件内时不应拦截全局快捷键（避免删组件、抢 Undo 等） */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const el = target.closest('input, textarea, select, [contenteditable="true"]');
  if (!el) return false;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.disabled || el.readOnly) return false;
  }
  if (el instanceof HTMLSelectElement && el.disabled) return false;
  return true;
}

/**
 * 快捷键系统，对应文档难点四「编辑器核心逻辑封装」中的 useHotkeys Hook。
 * keyMap 的 key 格式为 modifier 组合加按键名，例如：
 *   'ctrl+z'、'ctrl+shift+z'、'delete'、'backspace'
 */
export function useHotkeys(keyMap: KeyMap, deps: unknown[] = []) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      parts.push(e.key.toLowerCase());
      const key = parts.join('+');

      if (keyMap[key]) {
        e.preventDefault();
        keyMap[key]!(e);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
