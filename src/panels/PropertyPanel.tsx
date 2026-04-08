import { DeleteOutlined } from '@ant-design/icons';
import { Button, Form, Space, theme, Typography } from 'antd';
import { useMemo } from 'react';
import {
  getComponentMeta,
  type ComponentFieldSchema,
} from '../registry/componentRegistry';
import { commitRemoveComponent, commitUpdateProps } from '../store';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectPrimarySelectedComponent,
  selectRootId,
} from '../store/selectors';
import type { ComponentStyle } from '../types';
import { ControlledField } from './PropertyPanel/ControlledField';

const { Text } = Typography;

export function PropertyPanel() {
  const dispatch = useAppDispatch();
  const { token } = theme.useToken();
  const rootId = useAppSelector(selectRootId);
  const node = useAppSelector(selectPrimarySelectedComponent);
  const meta = node ? getComponentMeta(node.type) : undefined;
  const fields = useMemo(() => meta?.fields ?? [], [meta]);
  const propFields = useMemo(
    () => fields.filter((field) => field.scope === 'props'),
    [fields],
  );
  const styleFields = useMemo(
    () => fields.filter((field) => field.scope === 'style'),
    [fields],
  );

  const handleFieldChange = (field: ComponentFieldSchema, name: string, value: unknown) => {
    if (!node) return;
    if (field.scope === 'props') {
      if (value !== undefined) {
        dispatch(commitUpdateProps({ id: node.id, props: { [name]: value } }));
      }
      return;
    }
    if (value !== undefined && value !== '') {
      dispatch(
        commitUpdateProps({
          id: node.id,
          style: { [name]: value } as Partial<ComponentStyle>,
        }),
      );
    }
  };

  if (!node || node.id === rootId) {
    return (
      <div style={{ padding: 16 }}>
        <Text type="secondary">选中画布中的组件以编辑属性</Text>
      </div>
    );
  }

  if (!meta) {
    return (
      <div style={{ padding: 16 }}>
        <Text type="secondary">未找到该组件的 schema 定义</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, borderLeft: `1px solid ${token.colorBorder}` }}>
      <Text strong style={{ display: 'block', marginBottom: 16 }}>
        属性
      </Text>
      <Form layout="vertical" size="small">
        {propFields.length > 0 && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            组件属性
          </Text>
        )}
        {propFields.map((field) => (
          <Form.Item key={`props-${field.name}`} label={field.label}>
            <ControlledField
              field={field}
              nodeId={node.id}
              onChange={(name, value) => handleFieldChange(field, name, value)}
            />
          </Form.Item>
        ))}

        {styleFields.length > 0 && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            样式属性
          </Text>
        )}
        {styleFields.map((field) => (
          <Form.Item key={`style-${field.name}`} label={field.label}>
            <ControlledField
              field={field}
              nodeId={node.id}
              onChange={(name, value) => handleFieldChange(field, name, value)}
            />
          </Form.Item>
        ))}
      </Form>
      <Space>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => dispatch(commitRemoveComponent(node.id))}
        >
          删除
        </Button>
      </Space>
    </div>
  );
}
