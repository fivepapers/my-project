import { DeleteOutlined } from '@ant-design/icons';
import { Button, ColorPicker, Form, Input, InputNumber, Select, Space, Switch, theme, Typography } from 'antd';
import { useEffect, useMemo } from 'react';
import {
  getComponentMeta,
  type ComponentFieldSchema,
} from '../registry/componentRegistry';
import { commitRemoveComponent, commitUpdateProps } from '../store';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectPrimarySelectedComponent,
  selectRootId,
  selectSelectedIds,
} from '../store/selectors';
import type { Component, ComponentStyle } from '../types';

const { Text } = Typography;

function getFieldValue(node: Component, field: ComponentFieldSchema): unknown {
  return field.scope === 'props' ? node.props[field.name] : node.style[field.name as keyof ComponentStyle];
}

function buildFormValues(node: Component, fields: ComponentFieldSchema[]): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    acc[field.name] = getFieldValue(node, field);
    return acc;
  }, {});
}

function buildUpdatePayload(
  fields: ComponentFieldSchema[],
  values: Record<string, unknown>,
): { props: Record<string, unknown>; style: Partial<ComponentStyle> } {
  const props: Record<string, unknown> = {};
  const style: Partial<ComponentStyle> = {};

  for (const field of fields) {
    const value = values[field.name];
    if (field.scope === 'props') {
      if (value !== undefined) {
        props[field.name] = value;
      }
      continue;
    }
    if (value !== undefined && value !== '') {
      (style as Record<string, unknown>)[field.name] = value;
    }
  }

  return { props, style };
}

function renderField(field: ComponentFieldSchema) {
  switch (field.kind) {
    case 'textarea':
      return <Input.TextArea placeholder={field.placeholder} autoSize={{ minRows: 3, maxRows: 6 }} />;
    case 'number':
      return (
        <InputNumber
          min={field.min}
          max={field.max}
          step={field.step}
          style={{ width: '100%' }}
        />
      );
    case 'color':
      return <ColorPicker showText format="rgb" />;
    case 'select':
      return <Select options={field.options} placeholder={field.placeholder} />;
    case 'switch':
      return <Switch />;
    case 'text':
    default:
      return <Input placeholder={field.placeholder} />;
  }
}

export function PropertyPanel() {
  const dispatch = useAppDispatch();
  const { token } = theme.useToken();
  const rootId = useAppSelector(selectRootId);
  const selectedIds = useAppSelector(selectSelectedIds);
  const selectedId = selectedIds[0];
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

  const [form] = Form.useForm();

  // 仅在切换选中项或 schema 变化时从 store 同步表单；勿依赖 `node`（每次改属性引用都会变，会导致每敲一键 reset、失焦）
  useEffect(() => {
    if (!selectedId || selectedId === rootId || !meta) {
      form.resetFields();
      return;
    }
    if (!node || node.id !== selectedId) {
      form.resetFields();
      return;
    }
    form.resetFields();
    form.setFieldsValue(buildFormValues(node, fields));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 故意不在每次 store 中 node 更新时同步
  }, [fields, form, meta, selectedId, rootId]);

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
      <Form
        form={form}
        layout="vertical"
        size="small"
        onValuesChange={(_, all) => {
          const { props, style } = buildUpdatePayload(fields, all);
          dispatch(
            commitUpdateProps({
              id: node.id,
              props,
              style,
            }),
          );
        }}
      >
        {propFields.length > 0 && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            组件属性
          </Text>
        )}
        {propFields.map((field) => (
          <Form.Item
            key={`props-${field.name}`}
            label={field.label}
            name={field.name}
            valuePropName={field.kind === 'switch' ? 'checked' : 'value'}
            getValueFromEvent={
              field.kind === 'color'
                ? (c) =>
                    c && typeof c === 'object' && 'toRgbString' in c
                      ? (c as { toRgbString: () => string }).toRgbString()
                      : c
                : undefined
            }
          >
            {renderField(field)}
          </Form.Item>
        ))}

        {styleFields.length > 0 && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            样式属性
          </Text>
        )}
        {styleFields.map((field) => (
          <Form.Item
            key={`style-${field.name}`}
            label={field.label}
            name={field.name}
            valuePropName={field.kind === 'switch' ? 'checked' : 'value'}
            getValueFromEvent={
              field.kind === 'color'
                ? (c) =>
                    c && typeof c === 'object' && 'toRgbString' in c
                      ? (c as { toRgbString: () => string }).toRgbString()
                      : c
                : undefined
            }
          >
            {renderField(field)}
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
