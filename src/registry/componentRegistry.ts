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

/** 纯数据，可序列化 */
export interface ComponentMeta {
  type: ComponentType;
  label: string;
  defaultProps: Record<string, unknown>;
  defaultStyle: ComponentStyle;
  fields: ComponentFieldSchema[];
}

/** 渲染实现，不可序列化 */
export interface ComponentRenderer {
  type: ComponentType;
  render: (props: { node: Component }) => ReactNode;
}

type FieldInput = Omit<ComponentFieldSchema, 'scope'>;

interface ComponentMetaInput extends Omit<ComponentMeta, 'fields'> {
  propFields?: FieldInput[];
  styleFields?: FieldInput[];
  render: (props: { node: Component }) => ReactNode;
}

const metaRegistry = new Map<ComponentType, ComponentMeta>();
const rendererRegistry = new Map<ComponentType, ComponentRenderer>();

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

export function registerMeta(meta: ComponentMeta): void {
  metaRegistry.set(meta.type, meta);
}

export function registerRenderer(renderer: ComponentRenderer): void {
  rendererRegistry.set(renderer.type, renderer);
}

export function getComponentMeta(type: ComponentType): ComponentMeta | undefined {
  return metaRegistry.get(type);
}

export function getComponentRenderer(type: ComponentType): ComponentRenderer | undefined {
  return rendererRegistry.get(type);
}

export function defineComponentMeta(input: ComponentMetaInput): ComponentMeta {
  const { propFields = [], styleFields, render, ...rest } = input;
  const meta: ComponentMeta = {
    ...rest,
    fields: [
      ...attachScope('props', propFields),
      ...attachScope('style', styleFields ?? sharedStyleFields),
    ],
  };
  registerMeta(meta);
  registerRenderer({ type: meta.type, render });
  return meta;
}

export function registerComponent(meta: ComponentMeta): void {
  registerMeta(meta);
}

export function getAllComponentMetas(): ComponentMeta[] {
  return Array.from(metaRegistry.values());
}
