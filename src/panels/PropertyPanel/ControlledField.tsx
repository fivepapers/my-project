import { ColorPicker, Input, InputNumber, Select, Switch } from 'antd';
import type { ComponentFieldSchema } from '../../registry/componentRegistry';
import { useAppSelector } from '../../store/hooks';
import type { ComponentStyle } from '../../types';

export interface ControlledFieldProps {
  field: ComponentFieldSchema;
  nodeId: string;
  onChange: (name: string, value: unknown) => void;
}

function colorFromEvent(c: unknown): string {
  if (c && typeof c === 'object' && 'toRgbString' in c) {
    return (c as { toRgbString: () => string }).toRgbString();
  }
  return c as string;
}

function renderControl(
  field: ComponentFieldSchema,
  value: unknown,
  onInnerChange: (v: unknown) => void,
) {
  switch (field.kind) {
    case 'textarea':
      return (
        <Input.TextArea
          placeholder={field.placeholder}
          autoSize={{ minRows: 3, maxRows: 6 }}
          value={value as string | undefined}
          onChange={(e) => onInnerChange(e.target.value)}
        />
      );
    case 'number':
      return (
        <InputNumber
          min={field.min}
          max={field.max}
          step={field.step}
          style={{ width: '100%' }}
          value={value as number | null | undefined}
          onChange={(v) => onInnerChange(v)}
        />
      );
    case 'color':
      return (
        <ColorPicker
          showText
          format="rgb"
          value={typeof value === 'string' ? value : undefined}
          onChange={(c) => onInnerChange(colorFromEvent(c))}
        />
      );
    case 'select':
      return (
        <Select
          options={field.options}
          placeholder={field.placeholder}
          value={value as string | number | boolean | undefined}
          onChange={(v) => onInnerChange(v)}
        />
      );
    case 'switch':
      return <Switch checked={Boolean(value)} onChange={(checked) => onInnerChange(checked)} />;
    case 'text':
    default:
      return (
        <Input
          placeholder={field.placeholder}
          value={value as string | undefined}
          onChange={(e) => onInnerChange(e.target.value)}
        />
      );
  }
}

export function ControlledField({ field, nodeId, onChange }: ControlledFieldProps) {
  const value = useAppSelector((s) => {
    const node = s.components.byId[nodeId];
    if (!node) return undefined;
    return field.scope === 'props'
      ? node.props[field.name]
      : node.style[field.name as keyof ComponentStyle];
  });

  const onInnerChange = (v: unknown) => {
    onChange(field.name, v);
  };

  return renderControl(field, value, onInnerChange);
}
