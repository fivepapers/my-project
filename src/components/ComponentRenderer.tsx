import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { theme } from 'antd';
import type { CSSProperties } from 'react';
import { getComponentRenderer } from '../registry/componentRegistry';
import { useSelection } from '../hooks/useSelection';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectComponentById,
  selectHoveredId,
  selectIsPreview,
  selectRootId,
  selectSelectedIds,
} from '../store/selectors';
import { setHovered } from '../store/slices/selectionSlice';
import type { Component as CanvasComponent } from '../types';

function toCss(style: CanvasComponent['style'], zIndex: number): CSSProperties {
  return {
    position: style.position,
    width: style.width,
    height: style.height,
    left: style.left,
    top: style.top,
    zIndex,
    backgroundColor: style.backgroundColor,
    color: style.color,
    fontSize: style.fontSize,
    borderRadius: style.borderRadius,
    boxSizing: 'border-box',
  };
}

interface Props {
  id: string;
}

export function ComponentRenderer({ id }: Props) {
  const dispatch = useAppDispatch();
  const { select } = useSelection();
  const { token } = theme.useToken();
  const rootId = useAppSelector(selectRootId);
  const node = useAppSelector((s) => selectComponentById(s, id));
  const selectedIds = useAppSelector(selectSelectedIds);
  const hoveredId = useAppSelector(selectHoveredId);
  const isPreview = useAppSelector(selectIsPreview);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `canvas-${id}`,
    data: { fromCanvas: true, id },
    disabled: id === rootId || isPreview,
  });

  if (!node) return null;

  if (id === rootId) {
    return (
      <>
        {node.childIds.map((cid) => (
          <ComponentRenderer key={cid} id={cid} />
        ))}
      </>
    );
  }

  const selected = !isPreview && selectedIds.includes(id);
  const hovered = !isPreview && hoveredId === id;
  const outline =
    selected || hovered
      ? `2px solid ${selected ? token.colorPrimary : token.colorPrimaryBorder}`
      : '2px solid transparent';

  const dndTransform = transform ? CSS.Translate.toString(transform) : undefined;

  const css = toCss(node.style, node.zIndex);
  const wrapStyle: CSSProperties = {
    ...css,
    outline: isPreview ? 'none' : outline,
    outlineOffset: 0,
    cursor: isPreview ? 'default' : isDragging ? 'grabbing' : 'pointer',
    transform: dndTransform,
    touchAction: 'none',
  };

  const onClick = (e: React.MouseEvent) => {
    if (isPreview) return;
    e.stopPropagation();
    select(id, e.shiftKey);
  };

  const onMouseEnter = () => {
    if (!isPreview) dispatch(setHovered(id));
  };
  const onMouseLeave = () => {
    if (!isPreview) dispatch(setHovered(null));
  };

  const renderer = getComponentRenderer(node.type);
  const inner = renderer ? renderer.render({ node }) : null;

  return (
    <div
      ref={setNodeRef}
      style={wrapStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...listeners}
      {...attributes}
      role="presentation"
    >
      {inner}
      {node.childIds.map((cid) => (
        <ComponentRenderer key={cid} id={cid} />
      ))}
    </div>
  );
}
