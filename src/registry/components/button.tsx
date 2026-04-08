import { Button } from 'antd';
import { defineComponentMeta, registerComponent } from '../componentRegistry';
import type { Component } from '../../types';

function renderButtonNode({ node }: { node: Component }) {
  return (
    <Button type="primary" style={{ width: '100%', height: '100%' }}>
      {String(node.props.children ?? '按钮')}
    </Button>
  );
}

const meta = defineComponentMeta({
  type: 'button',
  label: '按钮',
  defaultProps: { children: '按钮' },
  defaultStyle: {
    width: 100,
    height: 32,
    left: 40,
    top: 40,
    position: 'absolute',
    color: '#000000',
    fontSize: 14,
    borderRadius: 6,
  },
  propFields: [{ name: 'children', label: '按钮文案', kind: 'text', placeholder: '请输入按钮文案' }],
  render: renderButtonNode,
});

registerComponent(meta);
