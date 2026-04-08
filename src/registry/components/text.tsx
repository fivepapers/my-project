import { Typography } from 'antd';
import { defineComponentMeta, registerComponent } from '../componentRegistry';
import type { Component } from '../../types';

const { Text } = Typography;

function renderTextNode({ node }: { node: Component }) {
  return (
    <Text style={{ color: 'inherit', fontSize: 'inherit' }}>{String(node.props.text ?? '')}</Text>
  );
}

const meta = defineComponentMeta({
  type: 'text',
  label: '文本',
  defaultProps: { text: '文本' },
  defaultStyle: {
    width: 120,
    height: 24,
    left: 40,
    top: 40,
    position: 'absolute',
    color: '#000000',
    fontSize: 14,
    borderRadius: 4,
  },
  propFields: [{ name: 'text', label: '文本', kind: 'text', placeholder: '请输入文本内容' }],
  render: renderTextNode,
});

registerComponent(meta);
