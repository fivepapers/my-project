import type { ReactNode } from 'react';
import type { Component, ComponentStyle, ComponentType } from '../types';

export type ComponentFieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'color'
  | 'select'
  | 'switch';

export type ComponentFieldScope = 'props' | 'style';

export interface ComponentFieldOption {
  label: string;
  value: string | number | boolean;
}

export interface ComponentFieldSchema {
  name: string;
  label: string;
  kind: ComponentFieldKind;
  scope: ComponentFieldScope;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: ComponentFieldOption[];
}

export interface ComponentMeta {
  type: ComponentType;
  label: string;
  defaultProps: Record<string, unknown>;
  defaultStyle: ComponentStyle;
  fields: ComponentFieldSchema[];
  render: (props: { node: Component }) => ReactNode;
}

type FieldInput = Omit<ComponentFieldSchema, 'scope'>;

interface ComponentMetaInput extends Omit<ComponentMeta, 'fields'> {
  propFields?: FieldInput[];
  styleFields?: FieldInput[];
}

const componentRegistry = new Map<ComponentType, ComponentMeta>();

const sharedStyleFields: FieldInput[] = [
  { name: 'width', label: '宽度', kind: 'number', min: 1 },
  { name: 'height', label: '高度', kind: 'number', min: 1 },
  { name: 'left', label: 'X', kind: 'number' },
  { name: 'top', label: 'Y', kind: 'number' },
  { name: 'backgroundColor', label: '背景色', kind: 'color' },
  { name: 'color', label: '文字色', kind: 'color' },
  { name: 'fontSize', label: '字号', kind: 'number', min: 8 },
  { name: 'borderRadius', label: '圆角', kind: 'number', min: 0 },
];

function attachScope(scope: ComponentFieldScope, fields: FieldInput[]): ComponentFieldSchema[] {
  return fields.map((field) => ({ ...field, scope }));
}

export function defineComponentMeta(meta: ComponentMetaInput): ComponentMeta {
  const { propFields = [], styleFields, ...rest } = meta;
  return {
    ...rest,
    fields: [
      ...attachScope('props', propFields),
      ...attachScope('style', styleFields ?? sharedStyleFields),
    ],
  };
}

export function registerComponent(meta: ComponentMeta): void {
  componentRegistry.set(meta.type, meta);
}

export function getComponentMeta(type: ComponentType): ComponentMeta | undefined {
  return componentRegistry.get(type);
}

export function getAllComponentMetas(): ComponentMeta[] {
  return Array.from(componentRegistry.values());
}
