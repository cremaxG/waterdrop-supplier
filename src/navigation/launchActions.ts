import type { SupplierResourceKey } from '../screens/profile/SupplierResourceScreen';
import type { AppTabKey } from './types';

export type AppLaunchAction =
  | 'dashboard'
  | 'vehicles'
  | 'addVehicle'
  | 'products'
  | 'addProduct'
  | 'shareApp'
  | 'profile'
  | 'orders'
  | 'reviews'
  | 'discounts'
  | 'images'
  | 'addresses';

export interface AppLaunchRequest {
  action: AppLaunchAction;
  id: number;
  source: 'deeplink' | 'shortcut' | 'widget';
  url: string;
}

const APP_SCHEME = 'watersupplier';

function normalizeLaunchPath(url: string) {
  const normalizedUrl = url.trim();
  if (!normalizedUrl.toLowerCase().startsWith(`${APP_SCHEME}://`)) {
    return null;
  }

  const withoutScheme = normalizedUrl.slice(`${APP_SCHEME}://`.length);
  const pathOnly = withoutScheme.split('?')[0]?.split('#')[0] ?? '';

  return pathOnly
    .split('/')
    .map(segment => segment.trim().toLowerCase())
    .filter(Boolean);
}

function inferLaunchSource(segments: string[]) {
  if (segments[0] === 'widget') {
    return 'widget' as const;
  }

  if (segments[0] === 'shortcut') {
    return 'shortcut' as const;
  }

  return 'deeplink' as const;
}

export function parseLaunchRequest(url: string): AppLaunchRequest | null {
  const segments = normalizeLaunchPath(url);
  if (!segments || segments.length === 0) {
    return null;
  }

  const source = inferLaunchSource(segments);
  const pathSegments =
    segments[0] === 'widget' || segments[0] === 'shortcut'
      ? segments.slice(1)
      : segments;
  const [section, action] = pathSegments;

  let launchAction: AppLaunchAction | null = null;

  if (section === 'dashboard') {
    launchAction = 'dashboard';
  } else if (section === 'share') {
    launchAction = 'shareApp';
  } else if (section === 'vehicles' && action === 'add') {
    launchAction = 'addVehicle';
  } else if (section === 'vehicles') {
    launchAction = 'vehicles';
  } else if (section === 'products' && action === 'add') {
    launchAction = 'addProduct';
  } else if (section === 'products') {
    launchAction = 'products';
  } else if (section === 'profile' && action === 'orders') {
    launchAction = 'orders';
  } else if (section === 'profile' && action === 'reviews') {
    launchAction = 'reviews';
  } else if (section === 'profile' && action === 'discounts') {
    launchAction = 'discounts';
  } else if (section === 'profile' && action === 'images') {
    launchAction = 'images';
  } else if (section === 'profile' && action === 'addresses') {
    launchAction = 'addresses';
  } else if (section === 'profile') {
    launchAction = 'profile';
  }

  if (!launchAction) {
    return null;
  }

  return {
    action: launchAction,
    id: Date.now() + Math.floor(Math.random() * 1000),
    source,
    url,
  };
}

export function getTabForLaunchAction(action: AppLaunchAction): AppTabKey {
  if (action === 'vehicles' || action === 'addVehicle') {
    return 'vehicles';
  }

  if (action === 'products' || action === 'addProduct') {
    return 'products';
  }

  if (
    action === 'profile' ||
    action === 'orders' ||
    action === 'reviews' ||
    action === 'discounts' ||
    action === 'images' ||
    action === 'addresses'
  ) {
    return 'profile';
  }

  return 'dashboard';
}

export function getProfileResourceForLaunchAction(
  action: AppLaunchAction,
): SupplierResourceKey | null {
  if (action === 'orders') {
    return 'orders';
  }

  if (action === 'reviews') {
    return 'reviews';
  }

  if (action === 'discounts') {
    return 'discounts';
  }

  if (action === 'images') {
    return 'images';
  }

  if (action === 'addresses') {
    return 'addresses';
  }

  return null;
}
