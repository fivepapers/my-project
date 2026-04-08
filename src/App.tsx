import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Layout, theme, Typography } from 'antd';
import { Provider } from 'react-redux';
import { pointerOnCanvas } from './dragPointer';
import { CANVAS_ID, Canvas } from './panels/Canvas';
import { ComponentLibrary } from './panels/ComponentLibrary';
import { PropertyPanel } from './panels/PropertyPanel';
import { Toolbar } from './panels/Toolbar';
import { store } from './store';
import { useHotkeys } from './hooks/useHotkeys';
import {
  commitAddComponent,
  commitMoveStyle,
  commitPaste,
  commitRemoveComponent,
  copySelected,
  redoHistory,
  undoHistory,
} from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { selectEditorMode, selectFirstSelectedId } from './store/selectors';
import type { ComponentType } from './types';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

function EditorShell() {
  const dispatch = useAppDispatch();
  const { token } = theme.useToken();

  const editorMode = useAppSelector(selectEditorMode);
  const selectedId = useAppSelector(selectFirstSelectedId);
  const isEditMode = editorMode === 'edit';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  useHotkeys(
    {
      'ctrl+z': () => isEditMode && dispatch(undoHistory()),
      'ctrl+y': () => isEditMode && dispatch(redoHistory()),
      'ctrl+shift+z': () => isEditMode && dispatch(redoHistory()),
      'ctrl+c': () => isEditMode && dispatch(copySelected()),
      'ctrl+v': () => isEditMode && dispatch(commitPaste()),
      delete: () => isEditMode && selectedId && dispatch(commitRemoveComponent(selectedId)),
      backspace: () => isEditMode && selectedId && dispatch(commitRemoveComponent(selectedId)),
    },
    [dispatch, isEditMode, selectedId],
  );

  const onDragEnd = (event: DragEndEvent) => {
    if (!isEditMode) return;
    const { active, over, delta } = event;
    const data = active.data.current as
      | { fromLibrary?: boolean; type?: ComponentType; fromCanvas?: boolean; id?: string }
      | undefined;

    if (data?.fromCanvas && data.id) {
      dispatch(commitMoveStyle({ id: data.id, delta }));
      return;
    }

    if (!over || over.id !== CANVAS_ID) return;
    if (!data?.fromLibrary || !data.type) return;
    const left = Math.max(0, pointerOnCanvas.x - 40);
    const top = Math.max(0, pointerOnCanvas.y - 16);
    dispatch(
      commitAddComponent({
        type: data.type,
        position: { left, top },
      }),
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingInline: 16,
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorder}`,
        }}
      >
        <Title level={4} style={{ margin: 0, flex: 1 }}>
          低代码编辑器
        </Title>
      </Header>
      <Toolbar />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <Layout>
          <Sider
            width={220}
            style={{
              background: token.colorBgContainer,
              borderRight: `1px solid ${token.colorBorder}`,
            }}
          >
            <ComponentLibrary />
          </Sider>
          <Content style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Canvas />
          </Content>
          <Sider
            width={300}
            theme="light"
            style={{
              background: token.colorBgContainer,
            }}
          >
            <PropertyPanel />
          </Sider>
        </Layout>
      </DndContext>
    </Layout>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <EditorShell />
    </Provider>
  );
}
