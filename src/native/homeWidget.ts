import { NativeModules, Platform } from 'react-native';

interface HomeWidgetBridgeModule {
  updateSummary?: (
    vehicles: number,
    products: number,
    pendingReviews: number,
  ) => void | Promise<void>;
}

const bridge = NativeModules.HomeWidgetBridge as HomeWidgetBridgeModule | undefined;

export function syncHomeWidgetSummary(summary: {
  vehicles: number;
  products: number;
  pendingReviews: number;
}) {
  if (Platform.OS !== 'android' || !bridge?.updateSummary) {
    return;
  }

  bridge.updateSummary(
    summary.vehicles,
    summary.products,
    summary.pendingReviews,
  );
}
