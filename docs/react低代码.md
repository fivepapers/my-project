## 项目整体介绍

## 5.技术难点与创新点

### 5.1 技术难点总览

| 序号 | 技术难点                         | 技术深度维度                        |
| ---- | -------------------------------- | ----------------------------------- |
| 1    | **低代码平台调研与物料体系设计** | 架构设计、协议定义、性能优化        |
| 2    | **画布状态管理与组件交互实现**   | 状态设计、dnd-kit 原理、性能优化    |
| 3    | **编辑器历史记录机制优化**       | Command Pattern、性能优化、边界处理 |
| 4    | **编辑器核心逻辑封装与代码复用** | Hooks 设计、模块化、性能优化        |
| 5    | **后端服务对接与数据一致性保障** | 数据模型、设计模式、异常处理        |

### 5.2 难点一：低代码平台调研与物料体系设计

#### 5.2.1 使用场景和目的

**业务场景**：运营人员需要在可视化编辑器中，通过拖拽组件的方式快速搭建营销页面。

**解决的实际问题**：

- 组件多样化：不同业务线有不同组件（商品卡片、优惠券、倒计时等），需要统一管理
- 技术一致性：组件需要跨页面、跨业务线复用，保持渲染一致性
- 动态渲染：编辑器和预览/线上环境需要渲染同一套组件配置

#### 5.2.2 底层实现原理

**动态渲染核心原理**：

```typescript
// 组件渲染配置
interface ComponentConfig {
  type: string;           // 组件类型标识
  props: Record<string, any>;  // 组件属性
  children?: ComponentConfig[];  // 子组件
  condition?: boolean;    // 渲染条件
}

// 渲染引擎核心
class RenderEngine {
  private componentRegistry: Map<string, React.ComponentType>;

  register(type: string, Component: React.ComponentType) {
    this.componentRegistry.set(type, Component);
  }

  render(config: ComponentConfig, context: RenderContext): React.ReactNode {
    const { type, props, children, condition } = config;

    // 条件渲染判断
    if (condition === false) return null;

    // 获取组件
    const Component = this.componentRegistry.get(type);
    if (!Component) {
      console.warn(`Component ${type} not found`);
      return null;
    }

    // 渲染组件
    return (
      <Component {...props} context={context}>
        {children?.map(child => this.render(child, context))}
      </Component>
    );
  }
}
```

**跨环境渲染原理**：

```plain
┌──────────────────────────────────────────────────────────────────┐
│                    跨环境渲染流程                                 │
└──────────────────────────────────────────────────────────────────┘

  编辑器环境                          线上环境
       │                                   │
       ▼                                   ▼
  ┌─────────────┐                   ┌─────────────┐
  │  画布渲染   │                   │  SSR/CSR    │
  │  (实时编辑) │                   │  (高性能)   │
  └──────┬──────┘                   └──────┬──────┘
         │                                 │
         ▼                                 ▼
  ┌─────────────┐                   ┌─────────────┐
  │  状态同步   │                   │  配置下发   │
  │  (Redux)   │                   │  (JSON)    │
  └─────────────┘                   └─────────────┘
         │                                 │
         └───────────────┬─────────────────┘
                         ▼
                  ┌─────────────┐
                  │  统一渲染   │
                  │  (同一配置) │
                  └─────────────┘
```

#### 5.2.3 使用方式和实现细节

**组件协议设计**：

```typescript
// 组件 Schema 定义
interface ComponentSchema {
  type: string;                    // 组件唯一标识
  version: string;                  // 组件版本
  name: string;                    // 展示名称
  icon: string;                    // 图标
  category: ComponentCategory;      // 分类
  defaultProps: PropsDefinition;   // 默认属性
  propsSchema: JSONSchema;         // 属性 Schema
  lifecycle?: LifecycleHooks;       // 生命周期钩子
  // 渲染条件配置
  conditions?: {
    showIn: ('editor' | 'preview' | 'production')[];
    requiresAuth?: boolean;
  };
}

// 组件分类
type ComponentCategory =
  | 'basic'      // 基础组件（图片、文本、按钮）
  | 'container'  // 容器组件（轮播、Tab）
  | 'business'   // 业务组件（商品、优惠券）
  | 'data'       // 数据组件（排行榜、数据卡片）;
```

**错误处理和边界情况**：

```typescript
// 渲染错误边界
class RenderErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 上报错误
    reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 降级渲染
      return <FallbackComponent error={this.state.error} />;
    }
    return this.props.children;
  }
}

// 组件加载错误处理
async function safeRender(Component: React.ComponentType, props: any) {
  try {
    return <Component {...props} />;
  } catch (error) {
    if (error instanceof ComponentLoadError) {
      return <LoadErrorFallback type={props.type} />;
    }
    throw error;
  }
}
```

#### 5.2.4 竞对方案对比

| 平台         | 优点               | 缺点                 | 本项目优势         |
| ------------ | ------------------ | -------------------- | ------------------ |
| **阿里飞冰** | 组件丰富、模板多   | 定制化复杂、性能一般 | 性能优化深度更好   |
| 腾讯微视     | 与微信生态集成好   | 只能微信内使用       | 跨平台支持         |
| **自助研发** | 完全可控、深度定制 | 投入大               | 投入可控、深度定制 |

#### 5.2.5 技术栈延伸

**相关知识点**：

- **JSON Schema**：用于描述组件属性结构，支持校验和 IDE 提示
- **React Server Components**：服务端组件渲染，减少客户端体积
- **Web Components**：组件封装标准，支持跨框架使用
- **Binary Schema**：二进制序列化方案，用于配置压缩

#### 5.2.6 独立实现方案

如果从零实现动态渲染引擎：

```typescript
// 1. 创建虚拟 DOM 实现
class VirtualDOM {
  createElement(type, props, ...children) {
    return { type, props, children };
  }

  render(vnode, container) {
    const element = this.createDOM(vnode);
    container.appendChild(element);
  }

  createDOM(vnode) {
    if (typeof vnode === 'string') {
      return document.createTextNode(vnode);
    }

    const element = document.createElement(vnode.type);

    Object.entries(vnode.props || {}).forEach(([key, value]) => {
      if (key.startsWith('on')) {
        element.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        element.setAttribute(key, value);
      }
    });

    vnode.children?.forEach(child => {
      element.appendChild(this.createDOM(child));
    });

    return element;
  }
}

// 2. 实现 diff 算法
function diff(oldVNode, newVNode) {
  const patches = [];

  if (oldVNode.type !== newVNode.type) {
    patches.push({ type: 'REPLACE', node: newVNode });
  } else if (typeof newVNode === 'string') {
    if (oldVNode !== newVNode) {
      patches.push({ type: 'TEXT', content: newVNode });
    }
  } else {
    // 比较 props
    const propsDiff = diffProps(oldVNode.props, newVNode.props);
    if (propsDiff.length) {
      patches.push({ type: 'PROPS', props: propsDiff });
    }

    // 比较 children
    diffChildren(oldVNode.children, newVNode.children, patches);
  }

  return patches;
}
```

#### 5.2.7 优化方向

| 优化方向       | 具体措施                         | 预期收益         |
| -------------- | -------------------------------- | ---------------- |
| **懒加载优化** | 组件按需加载，非首屏组件延迟加载 | 首屏体积减少 30% |
| **虚拟列表**   | 长列表组件使用虚拟滚动           | 内存占用减少 70% |
| **预加载**     | 鼠标悬停时预加载组件资源         | 操作响应提升 50% |
| **SSR 渲染**   | 线上环境使用 SSR，提升首屏速度   | LCP 减少 40%     |

### 5.3 难点二：画布状态管理与组件交互实现

#### 5.3.1 使用场景和目的

**业务场景**：用户在可视化编辑器中，通过拖拽、点击等操作来编排页面布局。

**解决的实际问题**：

- 组件状态同步：拖拽位置、属性修改需要实时同步到画布展示
- 操作Undo/Redo：编辑操作需要支持撤销恢复
- 选中状态管理：多组件选中、部分选中等复杂场景

#### 5.3.2 底层实现原理

**Redux 状态设计**：

```typescript
// 画布状态结构设计
interface CanvasState {
  // 组件树
  components: {
    byId: Record<string, Component>;
    allIds: string[];  // 保持顺序
    rootId: string;
  };

  // 选中状态
  selection: {
    selectedIds: string[];
    hoveredId: string | null;
    editingId: string | null;  // 正在编辑文本的组件
  };

  // 剪贴板
  clipboard: {
    type: 'copy' | 'cut';
    componentIds: string[];
  };

  // 历史记录
  history: {
    past: HistoryState[];
    future: HistoryState[];
  };

  // 编辑器状态
  editor: {
    mode: 'edit' | 'preview' | 'code';
    device: 'pc' | 'mobile' | 'tablet';
    zoom: number;
    gridVisible: boolean;
  };
}
```

**数据流向**：

```plain
┌──────────────────────────────────────────────────────────────────┐
│                    Redux 数据流向图                               │
└──────────────────────────────────────────────────────────────────┘

  用户操作 (拖拽/点击)
         │
         ▼
  ┌──────────────┐
  │   dispatch   │
  │   action     │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   reducers   │  ◄── Pure functions，根据 action 更新 state
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │    store     │  ◄── 单一数据源
  └──────┬───────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │  画布组件    │   │  属性面板    │   │  组件面板    │
  │ (Canvas)    │   │(Properties) │   │ (Component) │
  └──────────────┘   └──────────────┘   └──────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │  组件渲染    │   │  属性编辑   │   │  组件列表   │
  │  位置更新    │   │  实时预览   │   │  状态同步   │
  └──────────────┘   └──────────────┘   └──────────────┘
```

#### 5.3.3 使用方式和实现细节

**dnd-kit 拖拽实现**：

```typescript
// DndContext 包装画布
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  <SortableContext items={sortedIds} strategy={rectSortingStrategy}>
    {sortedIds.map(id => (
      <SortableComponent key={id} id={id} />
    ))}
  </SortableContext>
</DndContext>
// 拖拽处理器实现
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over) return;

  // 同位置拖拽 - 排序
  if (active.id !== over.id) {
    dispatch(changeComponentOrder({
      activeId: active.id as string,
      overId: over.id as string,
    }));
  }
};

// 拖拽状态转换
interface DragState {
  isDragging: boolean;
  dragSource: string | null;
  dragOver: string | null;
  dragOffset: { x: number; y: number };
}
```

**层级管理实现**：

```typescript
// 层级操作
type LayerAction =
  | { type: 'BRING_TO_FRONT'; id: string }
  | { type: 'SEND_TO_BACK'; id: string }
  | { type: 'BRING_FORWARD'; id: string }
  | { type: 'SEND_BACKWARD'; id: string };

// 层级 reducer
function layerReducer(state: CanvasState, action: LayerAction): CanvasState {
  switch (action.type) {
    case 'BRING_TO_FRONT': {
      const { id } = action;
      const allIds = [...state.components.allIds];
      const index = allIds.indexOf(id);

      // 移除并添加到末尾
      allIds.splice(index, 1);
      allIds.push(id);

      return updateComponentOrder(state, allIds);
    }

    case 'SEND_TO_BACK': {
      const { id } = action;
      const allIds = [...state.components.allIds];
      const index = allIds.indexOf(id);

      // 移除并添加到开头
      allIds.splice(index, 1);
      allIds.unshift(id);

      return updateComponentOrder(state, allIds);
    }

    case 'BRING_FORWARD': {
      const { id } = action;
      const allIds = [...state.components.allIds];
      const index = allIds.indexOf(id);

      if (index < allIds.length - 1) {
        [allIds[index], allIds[index + 1]] = [allIds[index + 1], allIds[index]];
      }

      return updateComponentOrder(state, allIds);
    }

    case 'SEND_BACKWARD': {
      const { id } = action;
      const allIds = [...state.components.allIds];
      const index = allIds.indexOf(id);

      if (index > 0) {
        [allIds[index], allIds[index - 1]] = [allIds[index - 1], allIds[index]];
      }

      return updateComponentOrder(state, allIds);
    }
  }
}
```

#### 5.3.4 竞对方案对比

| 方案        | 优点              | 缺点           | 本项目选择 |
| ----------- | ----------------- | -------------- | ---------- |
| **Redux**   | 成熟、DevTools 好 | 模板代码多     | ✅ 选中     |
| **MobX**    | 响应式、自动追踪  | 调试困难       | ❌          |
| **Zustand** | 轻量              | 生态较弱       | ❌          |
| **Context** | 简单              | 不适合复杂状态 | ❌          |

#### 5.3.5 技术栈延伸

- **Immer**：不可变数据结构，简化 Redux 更新
- **Reselect**：计算属性缓存，减少不必要的渲染
- **Redux Toolkit**：简化 Redux 模板代码
- **Redux DevTools Extension**：时间旅行调试

#### 5.3.6 独立实现方案

从零实现状态管理：

```typescript
// 简单实现 - 发布订阅模式
class Store<T> {
  private state: T;
  private listeners: Set<(state: T) => void> = new Set();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    return this.state;
  }

  dispatch(action: Action): void {
    this.state = this.reduce(this.state, action);
    this.notify();
  }

  subscribe(listener: (state: T) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  private reduce(state: T, action: Action): T {
    // 子类实现
    return state;
  }
}
```

#### 5.3.7 优化方向

| 优化方向       | 具体措施                   | 预期收益       |
| -------------- | -------------------------- | -------------- |
| **选择器优化** | 使用 Reselect 缓存计算属性 | 减少 50% 渲染  |
| **批量更新**   | 拖拽中使用 batch 批量更新  | 减少卡顿       |
| **虚拟列表**   | 组件列表使用虚拟滚动       | 支持 500+ 组件 |

### 5.4 难点三：编辑器历史记录机制优化

#### 5.4.1 问题分析

**原历史记录机制缺陷**：

| 问题类型       | 具体表现                           |
| -------------- | ---------------------------------- |
| **内存占用高** | 每次操作保存完整快照，内存线性增长 |
| **操作延迟**   | 快照保存和恢复耗时长，大文档卡顿   |
| **合并困难**   | 连续相同类型操作无法合并           |
| **边界情况**   | 复杂嵌套组件回退不稳定             |

```plain
优化前状态：
┌──────────────────────────────────────────────────────────────────┐
│  操作序列: [A] → [B] → [C] → [D] → [E] → [F] → [G]            │
│                                                                   │
│  内存占用: ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (持续增长)       │
│                                                                   │
│  问题:                                                           │
│  • 每次操作保存完整快照                                           │
│  • 内存占用 O(n)，n 为操作次数                                    │
│  • 大文档（如 100 个组件）时卡顿                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### 5.4.2 设计模式应用

**Command Pattern 实现**：

```typescript
// 命令接口
interface Command {
  execute(): void;      // 执行命令
  undo(): void;        // 撤销命令
  redo(): void;        // 重做命令
  getDescription(): string;
  merge?(other: Command): Command | null;  // 合并其他命令
}

// 添加组件命令
class AddComponentCommand implements Command {
  private component: Component;
  private parentId: string;
  private index: number;

  constructor(component: Component, parentId: string, index: number) {
    this.component = cloneDeep(component);
    this.parentId = parentId;
    this.index = index;
  }

  execute(): void {
    dispatch(addComponent({
      component: this.component,
      parentId: this.parentId,
      index: this.index,
    }));
  }

  undo(): void {
    dispatch(removeComponent(this.component.id));
  }

  getDescription(): string {
    return `添加组件 ${this.component.name}`;
  }

  // 可合并：连续的添加操作合并为一次
  merge(other: Command): AddComponentCommand | null {
    if (other instanceof AddComponentCommand) {
      // 如果是连续的快速添加，合并
      if (other.component.type === this.component.type) {
        return null;  // 不合并，保持各自独立
      }
    }
    return null;
  }
}

// 修改属性命令
class UpdatePropsCommand implements Command {
  private componentId: string;
  private oldProps: Record<string, any>;
  private newProps: Record<string, any>;

  constructor(componentId: string, oldProps: Record<string, any>, newProps: Record<string, any>) {
    this.componentId = componentId;
    this.oldProps = cloneDeep(oldProps);
    this.newProps = cloneDeep(newProps);
  }

  execute(): void {
    dispatch(updateComponentProps({
      id: this.componentId,
      props: this.newProps,
    }));
  }

  undo(): void {
    dispatch(updateComponentProps({
      id: this.componentId,
      props: this.oldProps,
    }));
  }

  getDescription(): string {
    return `修改属性`;
  }

  // 可合并：连续的属性修改合并为一次
  merge(other: Command): UpdatePropsCommand | null {
    if (other instanceof UpdatePropsCommand &&
        other.componentId === this.componentId) {
      // 合并为最新的属性值
      return new UpdatePropsCommand(
        this.componentId,
        this.oldProps,
        other.newProps
      );
    }
    return null;
  }
}
```

**命令管理器**：

```typescript
class HistoryManager {
  private past: Command[] = [];
  private future: Command[] = [];
  private maxSize: number = 50;
  private lastCommandTime: number = 0;
  private mergeWindow: number = 300;  // 300ms 内的同类操作可合并

  execute(command: Command): void {
    const now = Date.now();
    const lastCommand = this.past[this.past.length - 1];

    // 检查是否可合并
    if (
      lastCommand &&
      now - this.lastCommandTime < this.mergeWindow &&
      lastCommand.merge
    ) {
      const merged = lastCommand.merge(command);
      if (merged) {
        this.past[this.past.length - 1] = merged;
        this.lastCommandTime = now;
        return;
      }
    }

    // 执行新命令
    command.execute();
    this.past.push(command);
    this.future = [];  // 清空重做栈

    // 限制历史记录数量
    if (this.past.length > this.maxSize) {
      this.past.shift();
    }

    this.lastCommandTime = now;
  }

  undo(): boolean {
    const command = this.past.pop();
    if (command) {
      command.undo();
      this.future.push(command);
      return true;
    }
    return false;
  }

  redo(): boolean {
    const command = this.future.pop();
    if (command) {
      command.redo();
      this.past.push(command);
      return true;
    }
    return false;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }
}
```

#### 5.4.3 性能对比

| 指标           | 优化前（快照模式） | 优化后（Command 模式） | 提升    |
| -------------- | ------------------ | ---------------------- | ------- |
| 内存占用       | O(n) 完整快照      | O(1) 差异命令          | **80%** |
| 100 次操作耗时 | 1200ms             | 150ms                  | **87%** |
| Undo 响应时间  | 200ms              | 5ms                    | **97%** |
| 支持操作合并   | 不支持             | 支持                   | ✅       |

### 5.5 难点四：编辑器核心逻辑封装与代码复用

#### 5.5.1 Hook 应用实践

**核心自定义 Hook**：

```typescript
// useDragState - 拖拽状态管理
function useDragState(componentId: string) {
  const dispatch = useDispatch();

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleDragStart = useCallback((e: DragEvent) => {
    setIsDragging(true);
    dispatch(setDragSource(componentId));
  }, [componentId, dispatch]);

  const handleDrag = useCallback((e: DragEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleDragEnd = useCallback((e: DragEvent) => {
    setIsDragging(false);
    dispatch(clearDragSource());
  }, [dispatch]);

  return {
    isDragging,
    position,
    handlers: { onDragStart: handleDragStart, onDrag: handleDrag, onDragEnd: handleDragEnd }
  };
}

// useSelection - 选中状态管理
function useSelection() {
  const selectedIds = useSelector((state: RootState) => state.canvas.selection.selectedIds);

  const select = useCallback((id: string, additive: boolean = false) => {
    if (additive) {
      dispatch(toggleSelect(id));
    } else {
      dispatch(setSelect([id]));
    }
  }, [dispatch]);

  const selectMultiple = useCallback((ids: string[]) => {
    dispatch(setSelect(ids));
  }, [dispatch]);

  const clearSelection = useCallback(() => {
    dispatch(clearSelect());
  }, [dispatch]);

  return {
    selectedIds,
    select,
    selectMultiple,
    clearSelection,
    isSingleSelected: selectedIds.length === 1,
    isMultiSelected: selectedIds.length > 1,
  };
}

// useHotkeys - 快捷键系统
function useHotkeys(keyMap: Record<string, () => void>, deps: any[] = []) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = [
        e.ctrlKey && 'ctrl',
        e.shiftKey && 'shift',
        e.altKey && 'alt',
        e.key.toLowerCase(),
      ].filter(Boolean).join('+');

      if (keyMap[key]) {
        e.preventDefault();
        keyMap[key]();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, deps);
}
```

#### 5.5.2 性能优化策略

```typescript
// 使用 useMemo 缓存计算属性
const visibleComponents = useMemo(() => {
  return components.allIds
    .map(id => components.byId[id])
    .filter(c => c.condition !== false);
}, [components.allIds, components.byId]);

// 使用 React.memo 优化组件
const CanvasComponent = React.memo(
  ({ component, isSelected }: ComponentProps) => {
    // 组件实现
  },
  (prev, next) => {
    // 自定义比较函数
    return (
      prev.component === next.component &&
      prev.isSelected === next.isSelected
    );
  }
);

// 使用 useCallback 缓存回调
const handleComponentClick = useCallback(
  (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    select(id, e.shiftKey);
  },
  [select]
);
```

### 5.6 难点五：后端服务对接与数据一致性保障

#### 5.6.1 数据模型设计

**MongoDB 数据模型**：

```typescript
// 页面配置 Schema
interface PageSchema {
  _id: ObjectId;
  name: string;                    // 页面名称
  slug: string;                    // URL 标识
  status: 'draft' | 'published' | 'archived';

  // 组件树配置
  components: {
    version: string;                // 组件版本
    tree: ComponentConfig;         // 组件树根节点
  };

  // 元信息
  meta: {
    title: string;                  // SEO 标题
    description: string;           // SEO 描述
    thumbnail?: string;             // 缩略图
  };

  // 权限
  permissions: {
    owner: string;                  // 创建者
    editors: string[];             // 编辑者
  };

  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}
```

#### 5.6.2 数据一致性保障

```typescript
// 乐观更新 + 失败回滚
async function savePage(components: ComponentConfig): Promise<void> {
  const previousState = store.getState().canvas.components;

  // 1. 乐观更新本地状态
  dispatch(saveComponents(components));

  try {
    // 2. 发送请求
    await api.savePage(pageId, components);

    // 3. 成功：更新版本号
    dispatch(updateVersion());
  } catch (error) {
    // 4. 失败：回滚本地状态
    dispatch(restoreComponents(previousState));
    showError('保存失败，请重试');
    throw error;
  }
}

// 发布稳定性保障
async function publishPage(): Promise<void> {
  // 1. 验证页面配置
  await validatePage();

  // 2. 生成静态资源
  const assets = await generateAssets();

  // 3. 原子性发布
  await withTransaction(async (session) => {
    // 更新页面状态
    await PageModel.updateOne(
      { _id: pageId },
      {
        $set: {
          status: 'published',
          publishedAt: new Date(),
          assets,
        }
      },
      { session }
    );

    // 更新发布索引
    await PublishIndexModel.create(
      { pageId, slug, version },
      { session }
    );
  });
}
```

