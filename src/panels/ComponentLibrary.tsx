import { useDraggable } from '@dnd-kit/core';
import { theme, Typography } from 'antd';
import { getAllComponentMetas } from '../registry/componentRegistry';
import type { ComponentType } from '../types';

const { Text } = Typography;

function LibraryItem({ type, label }: { type: ComponentType; label: string }) {
  const { token } = theme.useToken();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${type}`,
    data: { fromLibrary: true, type },
  });

  const style: React.CSSProperties = {
    padding: '8px 12px',
    marginBottom: 8,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadius,
    background: token.colorBgContainer,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Text>{label}</Text>
    </div>
  );
}

export function ComponentLibrary() {
  const { token } = theme.useToken();
  const items = getAllComponentMetas();

  return (
    <div style={{ padding: 12 }}>
      <Text strong style={{ display: 'block', marginBottom: 12, color: token.colorText }}>
        组件库
      </Text>
      {items.map((item) => (
        <LibraryItem key={item.type} type={item.type} label={item.label} />
      ))}
    </div>
  );
}
