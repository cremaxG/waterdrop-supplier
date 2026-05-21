import { NativeModules, Platform } from 'react-native';

interface AppShortcutsBridgeModule {
  updateSummary?: (
    vehicles: number,
    products: number,
    pendingReviews: number,
  ) => void | Promise<void>;
}

const bridge =
  NativeModules.AppShortcutsBridge as AppShortcutsBridgeModule | undefined;

export function syncAppShortcutsSummary(summary: {
  vehicles: number;
  products: number;
  pendingReviews: number;
}) {
  if (!bridge?.updateSummary) {
    return;
  }

  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return;
  }

  bridge.updateSummary(
    summary.vehicles,
    summary.products,
    summary.pendingReviews,
  );
}
