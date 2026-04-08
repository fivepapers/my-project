import { Input } from 'antd';
import { defineComponentMeta, registerComponent } from '../componentRegistry';
import type { Component } from '../../types';

function renderInputNode({ node }: { node: Component }) {
  return (
    <Input
      readOnly
      placeholder={String(node.props.placeholder ?? '')}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

const meta = defineComponentMeta({
  type: 'input',
  label: '输入框',
  defaultProps: { placeholder: '输入' },
  defaultStyle: {
    width: 200,
    height: 32,
    left: 40,
    top: 40,
    position: 'absolute',
    color: '#000000',
    fontSize: 14,
    borderRadius: 4,
  },
  propFields: [{ name: 'placeholder', label: '占位符', kind: 'text', placeholder: '请输入占位提示' }],
  render: renderInputNode,
});

registerComponent(meta);
