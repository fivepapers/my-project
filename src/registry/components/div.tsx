import { defineComponentMeta, registerComponent } from '../componentRegistry';
import type { Component } from '../../types';

function renderDivNode({ node }: { node: Component }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: node.style.backgroundColor ?? '#f5f5f5',
        borderRadius: node.style.borderRadius,
      }}
    />
  );
}

const meta = defineComponentMeta({
  type: 'div',
  label: '容器',
  defaultProps: {},
  defaultStyle: {
    width: 200,
    height: 120,
    left: 40,
    top: 40,
    position: 'absolute',
    backgroundColor: '#f0f0f0',
    color: '#000000',
    fontSize: 14,
    borderRadius: 4,
  },
  render: renderDivNode,
});

registerComponent(meta);
