import type { DeviceType } from '../types';

export const CANVAS_ROOT_ID = 'root';

export const DEVICE_CANVAS_WIDTH: Record<DeviceType, number> = {
  pc: 800,
  mobile: 375,
  tablet: 768,
};
