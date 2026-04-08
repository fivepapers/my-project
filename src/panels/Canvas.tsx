import { useDroppable } from '@dnd-kit/core';
import { Empty, theme, Typography } from 'antd';
import { useRef } from 'react';
import { ComponentRenderer } from '../components/ComponentRenderer';
import { pointerOnCanvas } from '../dragPointer';
import { useSelection } from '../hooks/useSelection';
import { useAppSelector } from '../store/hooks';
import {
  selectEditorMode,
  selectGridVisible,
  selectRootId,
  selectRootNode,
  selectZoom,
} from '../store/selectors';

const { Text } = Typography;

export const CANVAS_ID = 'canvas-root';

export function Canvas() {
  const { clearSelection } = useSelection();
  const { token } = theme.useToken();
  const rootId = useAppSelector(selectRootId);
  const root = useAppSelector(selectRootNode);
  const editorMode = useAppSelector(selectEditorMode);
  const zoom = useAppSelector(selectZoom);
  const gridVisible = useAppSelector(selectGridVisible);
  const canvasRef = useRef<HTMLDivElement>(null);

  const isPreview = editorMode === 'preview';

  const { setNodeRef, isOver } = useDroppable({
    id: CANVAS_ID,
    disabled: isPreview,
  });

  const setRef = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    canvasRef.current = el;
  };

  const hasChildren = root && root.childIds.length > 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {isPreview && (
        <div
          style={{
            textAlign: 'center',
            padding: '4px 0',
            background: token.colorWarningBg,
            borderBottom: `1px solid ${token.colorWarningBorder}`,
          }}
        >
          <Text type="warning" style={{ fontSize: 12 }}>
            预览模式 — 组件不可编辑，快捷键已禁用
          </Text>
        </div>
      )}
      <div
        ref={setRef}
        data-canvas-root
        style={{
          position: 'relative',
          flex: 1,
          margin: 16,
          border: `1px dashed ${
            isPreview
              ? token.colorWarningBorder
              : isOver
                ? token.colorPrimary
                : token.colorBorder
          }`,
          borderRadius: token.borderRadiusLG,
          background: token.colorFillAlter,
          overflow: 'hidden',
        }}
        onPointerMove={(e) => {
          if (!canvasRef.current || isPreview) return;
          const rect = canvasRef.current.getBoundingClientRect();
          pointerOnCanvas.x = e.clientX - rect.left;
          pointerOnCanvas.y = e.clientY - rect.top;
        }}
        onClick={() => {
          if (!isPreview) clearSelection();
        }}
      >
        {!hasChildren && !isPreview && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Empty description="拖拽左侧组件到画布" />
          </div>
        )}
        <div
          style={{
            position: 'relative',
            width: root?.style.width ?? 800,
            height: root?.style.height ?? 600,
            margin: '0 auto',
            backgroundColor: root?.style.backgroundColor ?? '#fafafa',
            boxShadow: isPreview ? token.boxShadow : undefined,
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            ...(gridVisible && !isPreview
              ? {
                  backgroundImage: `linear-gradient(${token.colorBorderSecondary} 1px, transparent 1px), linear-gradient(90deg, ${token.colorBorderSecondary} 1px, transparent 1px)`,
                  backgroundSize: '8px 8px',
                }
              : {}),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ComponentRenderer id={rootId} />
        </div>
      </div>
    </div>
  );
}
