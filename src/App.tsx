import { closestCenter, DndContext } from '@dnd-kit/core';
import { Layout, theme, Typography } from 'antd';
import { Provider } from 'react-redux';
import { Canvas } from './panels/Canvas';
import { ComponentLibrary } from './panels/ComponentLibrary';
import { PropertyPanel } from './panels/PropertyPanel';
import { Toolbar } from './panels/Toolbar';
import { store } from './store';
import { useDragDrop } from './hooks/useDragDrop';
import { useHotkeys } from './hooks/useHotkeys';
import {
  commitPaste,
  commitRemoveComponent,
  copySelected,
  redoHistory,
  undoHistory,
} from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { selectEditorMode, selectFirstSelectedId } from './store/selectors';
const { Header, Sider, Content } = Layout;
const { Title } = Typography;

function EditorShell() {
  const dispatch = useAppDispatch();
  const { token } = theme.useToken();

  const editorMode = useAppSelector(selectEditorMode);
  const selectedId = useAppSelector(selectFirstSelectedId);
  const isEditMode = editorMode === 'edit';

  const { sensors, handleDragEnd } = useDragDrop();

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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
