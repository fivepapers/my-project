import {
  AppstoreOutlined,
  CopyOutlined,
  DeleteOutlined,
  DesktopOutlined,
  EyeOutlined,
  MobileOutlined,
  RedoOutlined,
  TabletOutlined,
  UndoOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons';
import { Button, Divider, Radio, Slider, Space, theme, Tooltip } from 'antd';
import {
  commitBringForward,
  commitBringToFront,
  commitPaste,
  commitRemoveComponent,
  commitSendBackward,
  commitSendToBack,
  copySelected,
  redoHistory,
  undoHistory,
} from '../store';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectCanRedo,
  selectCanUndo,
  selectDevice,
  selectEditorMode,
  selectFirstSelectedId,
  selectGridVisible,
  selectHasClipboard,
  selectZoom,
} from '../store/selectors';
import { setDevice, setEditorMode, setZoom, toggleGrid } from '../store/slices/editorSlice';
import type { DeviceType, EditorMode } from '../types';

export function Toolbar() {
  const dispatch = useAppDispatch();
  const { token } = theme.useToken();

  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);
  const selectedId = useAppSelector(selectFirstSelectedId);
  const hasSelection = Boolean(selectedId);
  const hasClipboard = useAppSelector(selectHasClipboard);
  const editorMode = useAppSelector(selectEditorMode);
  const device = useAppSelector(selectDevice);
  const zoom = useAppSelector(selectZoom);
  const gridVisible = useAppSelector(selectGridVisible);

  const isEditMode = editorMode === 'edit';

  return (
    <div
      style={{
        padding: '6px 16px',
        borderBottom: `1px solid ${token.colorBorder}`,
        background: token.colorBgContainer,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      {/* 撤销 / 重做 */}
      <Space size={4}>
        <Tooltip title="撤销 (Ctrl+Z)">
          <Button
            size="small"
            icon={<UndoOutlined />}
            disabled={!canUndo}
            onClick={() => dispatch(undoHistory())}
          >
            撤销
          </Button>
        </Tooltip>
        <Tooltip title="重做 (Ctrl+Y)">
          <Button
            size="small"
            icon={<RedoOutlined />}
            disabled={!canRedo}
            onClick={() => dispatch(redoHistory())}
          >
            重做
          </Button>
        </Tooltip>
      </Space>

      <Divider type="vertical" style={{ margin: '0 4px' }} />

      {/* 剪贴板 */}
      <Space size={4}>
        <Tooltip title="复制 (Ctrl+C)">
          <Button
            size="small"
            icon={<CopyOutlined />}
            disabled={!hasSelection || !isEditMode}
            onClick={() => dispatch(copySelected())}
          >
            复制
          </Button>
        </Tooltip>
        <Tooltip title="粘贴 (Ctrl+V)">
          <Button
            size="small"
            disabled={!hasClipboard || !isEditMode}
            onClick={() => dispatch(commitPaste())}
          >
            粘贴
          </Button>
        </Tooltip>
        <Tooltip title="删除 (Delete)">
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            disabled={!hasSelection || !isEditMode}
            onClick={() => selectedId && dispatch(commitRemoveComponent(selectedId))}
          >
            删除
          </Button>
        </Tooltip>
      </Space>

      <Divider type="vertical" style={{ margin: '0 4px' }} />

      {/* 图层管理 */}
      <Space size={4}>
        <Tooltip title="置顶图层">
          <Button
            size="small"
            icon={<VerticalAlignTopOutlined />}
            disabled={!hasSelection || !isEditMode}
            onClick={() => selectedId && dispatch(commitBringToFront(selectedId))}
          />
        </Tooltip>
        <Tooltip title="上移一层">
          <Button
            size="small"
            disabled={!hasSelection || !isEditMode}
            onClick={() => selectedId && dispatch(commitBringForward(selectedId))}
          >
            ↑层
          </Button>
        </Tooltip>
        <Tooltip title="下移一层">
          <Button
            size="small"
            disabled={!hasSelection || !isEditMode}
            onClick={() => selectedId && dispatch(commitSendBackward(selectedId))}
          >
            ↓层
          </Button>
        </Tooltip>
        <Tooltip title="置底图层">
          <Button
            size="small"
            icon={<VerticalAlignBottomOutlined />}
            disabled={!hasSelection || !isEditMode}
            onClick={() => selectedId && dispatch(commitSendToBack(selectedId))}
          />
        </Tooltip>
      </Space>

      <Divider type="vertical" style={{ margin: '0 4px' }} />

      {/* 缩放 / 网格 */}
      <Space size={4} align="center" style={{ minWidth: 140 }}>
        <Tooltip title="画布缩放">
          <span style={{ fontSize: 12, color: token.colorTextSecondary }}>缩放</span>
        </Tooltip>
        <Slider
          style={{ width: 100, margin: 0 }}
          min={0.5}
          max={2}
          step={0.05}
          value={zoom}
          onChange={(v) => dispatch(setZoom(v))}
          disabled={!isEditMode}
        />
        <Tooltip title="显示网格">
          <Button
            size="small"
            type={gridVisible ? 'primary' : 'default'}
            icon={<AppstoreOutlined />}
            disabled={!isEditMode}
            onClick={() => dispatch(toggleGrid())}
          />
        </Tooltip>
      </Space>

      <Divider type="vertical" style={{ margin: '0 4px' }} />

      {/* 设备切换 */}
      <Radio.Group
        size="small"
        value={device}
        onChange={(e) => dispatch(setDevice(e.target.value as DeviceType))}
      >
        <Tooltip title="PC (800px)">
          <Radio.Button value="pc">
            <DesktopOutlined />
          </Radio.Button>
        </Tooltip>
        <Tooltip title="平板 (768px)">
          <Radio.Button value="tablet">
            <TabletOutlined />
          </Radio.Button>
        </Tooltip>
        <Tooltip title="手机 (375px)">
          <Radio.Button value="mobile">
            <MobileOutlined />
          </Radio.Button>
        </Tooltip>
      </Radio.Group>

      <Divider type="vertical" style={{ margin: '0 4px' }} />

      {/* 编辑 / 预览模式 */}
      <Radio.Group
        size="small"
        value={editorMode}
        onChange={(e) => dispatch(setEditorMode(e.target.value as EditorMode))}
      >
        <Radio.Button value="edit">编辑</Radio.Button>
        <Radio.Button value="preview">
          <EyeOutlined /> 预览
        </Radio.Button>
      </Radio.Group>
    </div>
  );
}
