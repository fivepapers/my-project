import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectSelectedIds } from '../store/selectors';
import { selectComponent } from '../store/slices/selectionSlice';

/**
 * 封装选中状态管理，对应文档难点四「编辑器核心逻辑封装」中的 useSelection Hook
 */
export function useSelection() {
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector(selectSelectedIds);

  const select = useCallback(
    (id: string, additive = false) => {
      if (additive) {
        dispatch(
          selectComponent(
            selectedIds.includes(id)
              ? selectedIds.filter((x) => x !== id)
              : [...selectedIds, id],
          ),
        );
      } else {
        dispatch(selectComponent([id]));
      }
    },
    [dispatch, selectedIds],
  );

  const selectMultiple = useCallback(
    (ids: string[]) => {
      dispatch(selectComponent(ids));
    },
    [dispatch],
  );

  const clearSelection = useCallback(() => {
    dispatch(selectComponent([]));
  }, [dispatch]);

  return {
    selectedIds,
    select,
    selectMultiple,
    clearSelection,
    isSingleSelected: selectedIds.length === 1,
    isMultiSelected: selectedIds.length > 1,
    hasSelection: selectedIds.length > 0,
  };
}
