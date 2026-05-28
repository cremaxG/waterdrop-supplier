import { Region } from 'react-native-maps';

export type SupplierLoginMethod = 'password' | 'otp';
export type LoginField = 'phone' | 'password' | 'otp';
export type ForgotPasswordField = 'phone' | 'otp' | 'password' | 'confirmPassword';
export type RegisterField =
  | 'name'
  | 'phone'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'gstin'
  | 'cin'
  | 'address1'
  | 'address2'
  | 'city'
  | 'postalCode'
  | 'state';

export type SubmitAction =
  | 'password-login'
  | 'login-request-otp'
  | 'login-otp'
  | 'supplier-register'
  | 'forgot-request-otp'
  | 'forgot-reset'
  | null;

export interface LocationValue {
  lat: string;
  lng: string;
}

export interface SupplierResolvedAddress {
  displayName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  state: string;
}

export interface LocationSearchResult extends LocationValue, SupplierResolvedAddress {
  id: string;
  title: string;
  subtitle: string;
}

export const OTP_RESEND_COOLDOWN_SECONDS = 45;
export const OTP_AUTOFILL_DELAY_MS = 450;

export const DEFAULT_MAP_REGION: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 12,
  longitudeDelta: 12,
};

export function isEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

export function isValidPhone(value: string) {
  return value.replace(/\D/g, '').length === 10;
}

export function getResponseMessage(response: any, fallback: string) {
  return response?.message ?? response?.error?.message ?? response?.data?.message ?? fallback;
}

export function getThrownMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function hasResponseError(response: any) {
  if (!response) {
    return true;
  }

  if (response?.error || response?.success === false || response?.ok === false) {
    return true;
  }

  if (typeof response?.status === 'number' && response.status >= 400) {
    return true;
  }

  if (typeof response?.statusCode === 'number' && response.statusCode >= 400) {
    return true;
  }

  return false;
}

export function formatPhoneWithCountry(phone: string, countryDialCode: string) {
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  return `${countryDialCode}${digits}`;
}

export function maskPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) {
    return value;
  }

  const tail = digits.slice(-4);
  const maskedPrefix = digits
    .slice(0, -4)
    .replace(/\d/g, '•')
    .replace(/(.{3})/g, '$1 ')
    .trim();

  return `${maskedPrefix} ${tail}`.trim();
}

export function isValidCoordinate(value: string, min: number, max: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= min && numeric <= max;
}

export function normalizeLocationValue(
  lat?: string | null,
  lng?: string | null,
): LocationValue | null {
  const normalizedLat = String(lat ?? '').trim();
  const normalizedLng = String(lng ?? '').trim();

  if (!normalizedLat || !normalizedLng) {
    return null;
  }

  if (
    !isValidCoordinate(normalizedLat, -90, 90) ||
    !isValidCoordinate(normalizedLng, -180, 180)
  ) {
    return null;
  }

  return {
    lat: normalizedLat,
    lng: normalizedLng,
  };
}

export function getMapRegion(location: LocationValue | null): Region {
  if (!location) {
    return DEFAULT_MAP_REGION;
  }

  return {
    latitude: Number(location.lat),
    longitude: Number(location.lng),
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };
}

export function formatLocationValue(location: LocationValue | null) {
  if (!location) {
    return '';
  }

  return `${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}`;
}

export function getSupplierResolvedAddress(
  result: any,
  fallbackTitle = 'Selected location',
): SupplierResolvedAddress {
  const address = result?.address ?? {};
  const city =
    address.city ??
    address.town ??
    address.village ??
    address.hamlet ??
    address.municipality ??
    address.county ??
    '';
  const road =
    address.road ??
    address.pedestrian ??
    address.neighbourhood ??
    address.suburb ??
    '';
  const addressLine1Parts = [address.house_number, road].filter(Boolean);
  const addressLine1 =
    addressLine1Parts.join(' ').trim() ||
    road ||
    city ||
    fallbackTitle;

  const addressLine2Candidates = [
    address.neighbourhood,
    address.suburb,
    address.city_district,
    address.county,
  ]
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .filter(value => value !== city && value !== road);

  return {
    displayName: result?.display_name ?? '',
    addressLine1,
    addressLine2: addressLine2Candidates.join(', '),
    city,
    postalCode: String(address.postcode ?? '').trim(),
    state: String(address.state ?? address.state_district ?? '').trim(),
  };
}

export function formatAddressParts(result: any, fallbackTitle = 'Selected location') {
  const address = result?.address ?? {};
  const title =
    address.road ??
    address.neighbourhood ??
    address.suburb ??
    address.village ??
    address.town ??
    address.city ??
    address.county ??
    fallbackTitle;

  const subtitleParts = [
    address.suburb,
    address.city ?? address.town ?? address.village,
    address.state,
    address.postcode,
    address.country,
  ].filter(Boolean);

  return {
    title,
    subtitle: subtitleParts.join(', '),
  };
}

export async function searchLocations(
  query: string,
  searchErrorMessage: string,
  selectedLocationFallbackTitle: string,
): Promise<LocationSearchResult[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&countrycodes=in&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(searchErrorMessage);
  }

  const results = await response.json();
  return Array.isArray(results)
    ? results
        .map((item: any) => {
          const location = normalizeLocationValue(item.lat, item.lon);
          if (!location) {
            return null;
          }

          const address = formatAddressParts(item, selectedLocationFallbackTitle);
          const resolvedAddress = getSupplierResolvedAddress(
            item,
            selectedLocationFallbackTitle,
          );

          return {
            id: String(item.place_id ?? `${location.lat}-${location.lng}`),
            lat: location.lat,
            lng: location.lng,
            title: address.title,
            subtitle: item.display_name ?? address.subtitle,
            ...resolvedAddress,
          };
        })
        .filter((item): item is LocationSearchResult => Boolean(item))
    : [];
}

export async function reverseGeocodeSupplierLocation(
  location: LocationValue,
  reverseErrorMessage: string,
  selectedLocationFallbackTitle: string,
): Promise<SupplierResolvedAddress> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(location.lat)}&lon=${encodeURIComponent(location.lng)}&zoom=18&addressdetails=1`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(reverseErrorMessage);
  }

  const result = await response.json();
  return getSupplierResolvedAddress(result, selectedLocationFallbackTitle);
}

export function buildSupplierAddressSummary({
  addressLine1,
  addressLine2,
  city,
  postalCode,
  state,
}: {
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  state: string;
}) {
  return [addressLine1, addressLine2, city, state, postalCode]
    .map(part => part.trim())
    .filter(Boolean)
    .join(', ');
}
