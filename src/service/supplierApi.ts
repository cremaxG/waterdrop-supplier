import BaseApi from './baseApi';

function sanitizeOtpCandidate(value: unknown) {
  if (value == null) {
    return null;
  }

  const otpString = String(value).replace(/\D/g, '');
  if (otpString.length < 4 || otpString.length > 8) {
    return null;
  }

  return otpString;
}

function extractOtpFromText(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const patterns = [
    /\botp(?:\s*(?:is|code|:|=|-))?\s*(\d{4,8})\b/i,
    /\bverification(?:\s*code)?(?:\s*(?:is|:|=|-))?\s*(\d{4,8})\b/i,
    /\bcode(?:\s*(?:is|:|=|-))?\s*(\d{4,8})\b/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    const otp = sanitizeOtpCandidate(match?.[1]);
    if (otp) {
      return otp;
    }
  }

  return null;
}

export function extractOtpFromResponse(response: unknown) {
  const stringifiedResponse =
    response && typeof response === 'object'
      ? JSON.stringify(response)
      : typeof response === 'string'
        ? response
        : '';

  const directCandidates = [
    (response as any)?.otp,
    (response as any)?.data?.otp,
    (response as any)?.data?.data?.otp,
    (response as any)?.verification_code,
    (response as any)?.verificationCode,
    (response as any)?.data?.verification_code,
    (response as any)?.data?.verificationCode,
    (response as any)?.data?.code,
    (response as any)?.code,
  ];

  for (const candidate of directCandidates) {
    const otp = sanitizeOtpCandidate(candidate);
    if (otp) {
      return otp;
    }
  }

  if (!response || typeof response !== 'object') {
    const directTextOtp = extractOtpFromText(response);
    if (directTextOtp) {
      return directTextOtp;
    }

    const genericTextOtp = sanitizeOtpCandidate(
      stringifiedResponse.match(/\b(\d{4,8})\b/)?.[1],
    );
    return genericTextOtp ?? null;
  }

  const visited = new WeakSet<object>();
  const queue: unknown[] = [response];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const fromText = extractOtpFromText(current);
    if (fromText) {
      return fromText;
    }

    if (typeof current !== 'object') {
      continue;
    }

    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    for (const [key, value] of Object.entries(current)) {
      const normalizedKey = key.toLowerCase();

      if (
        normalizedKey.includes('otp') ||
        normalizedKey.includes('code') ||
        normalizedKey.includes('message')
      ) {
        const directOtp =
          sanitizeOtpCandidate(value) ?? extractOtpFromText(value);
        if (directOtp) {
          return directOtp;
        }
      }

      if (value && typeof value === 'object') {
        queue.push(value);
      } else if (typeof value === 'string') {
        queue.push(value);
      }
    }
  }

  const fallbackOtpPatterns = [
    /"otp"\s*:\s*"?(\d{4,8})"?/i,
    /"verification[_\s-]?code"\s*:\s*"?(\d{4,8})"?/i,
    /"code"\s*:\s*"?(\d{4,8})"?/i,
  ];

  for (const pattern of fallbackOtpPatterns) {
    const otp = sanitizeOtpCandidate(stringifiedResponse.match(pattern)?.[1]);
    if (otp) {
      return otp;
    }
  }

  const genericOtp = sanitizeOtpCandidate(
    stringifiedResponse.match(/\b(\d{4,8})\b/)?.[1],
  );
  if (genericOtp) {
    return genericOtp;
  }

  return null;
}

function withExtractedOtp<T>(response: T): T {
  if (!response || typeof response !== 'object') {
    return response;
  }

  const existingOtp = sanitizeOtpCandidate((response as any).otp);
  if (existingOtp) {
    return response;
  }

  const extractedOtp = extractOtpFromResponse(response);
  if (!extractedOtp) {
    return response;
  }

  return {
    ...(response as Record<string, unknown>),
    otp: extractedOtp,
  } as T;
}

export interface SupplierRegisterPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  gstin?: string;
  cin?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postal_code?: string;
  state?: string;
  country?: string;
  lat?: string;
  lng?: string;
  status?: string;
  online?: boolean;
  ratings?: string;
  verified?: boolean;
}

export interface SupplierLoginPayload {
  phone: string;
  password: string;
}

export interface SupplierOtpRequestPayload {
  phone: string;
}

export interface SupplierOtpLoginPayload {
  phone: string;
  otp: string;
}

export interface SupplierResetPasswordPayload {
  phone: string;
  otp: string;
  password: string;
}

export interface SupplierProfile {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  cin?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postal_code?: string;
  state?: string;
  country?: string;
  lat?: string;
  lng?: string;
  status?: string;
  online?: boolean;
  ratings?: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVehiclePayload {
  phone: string;
  email?: string;
  supplier_id: number;
  vehicle_number: string;
  load_capacity?: string;
  driver_licence_no?: string;
  name: string;
  lat?: string;
  lng?: string;
  status?: 'pending_review' | 'active' | 'approved' | 'blocked' | 'deactive' | 'rejected';
  online?: boolean;
}

export interface VehicleResponse {
  id: number | string;
  supplier_id: number;
  vehicle_number: string;
  name: string;
  phone: string;
  email?: string;
  load_capacity?: string;
  driver_licence_no?: string;
  lat?: string;
  lng?: string;
  status?: string;
  online?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierVehiclesQuery {
  filter?: 'all' | 'online' | 'offline' | 'pending_review';
}

export interface VehicleLocationUpdatePayload {
  lat: string;
  lng: string;
  orderId?: number;
}

export interface VehicleProductPayload {
  product_id: number;
  qty: number;
}

export interface SupplierResourceQuery {
  limit?: number;
  cursor?: number | string;
  page?: number;
  search?: string;
  type?: string;
  active?: boolean;
}

export interface ReviewPayload {
  user_id: string;
  supplier_id: string;
  ratings: number;
  comment: string;
}

export interface ReviewRecord extends ReviewPayload {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface FavouriteToggleResponse {
  message: string;
}

export interface FavouriteSupplierItem {
  id: number;
  user_id: number;
  supplier_id: number;
  supplier?: Partial<SupplierProfile> & {
    id?: number;
    name?: string;
  };
}

export interface FavouriteProductItem {
  id: number;
  user_id: number;
  product_id: number;
  product?: {
    id?: number;
    name?: string;
    price?: string;
    category?: string;
    type?: string;
    uom?: string;
  };
}

export interface SupplierDiscountPayload {
  title?: string;
  description?: string;
  type?: 'percentage' | 'flat' | 'bogo' | 'cashback';
  value?: number;
  min_amount?: number;
  max_discount?: number;
  priority?: number;
  active?: boolean;
  start_date?: string;
  end_date?: string;
  meta?: Record<string, any>;
}

export default class SupplierApi {
  static registerSupplier(payload: SupplierRegisterPayload) {
    return BaseApi.post('/auth/suppliers/register', payload, {}, {}, '').then(withExtractedOtp);
  }

  static loginSupplier(payload: SupplierLoginPayload) {
    return BaseApi.post('/auth/suppliers/login', payload, {}, {}, '').then(withExtractedOtp);
  }

  static requestOtp(payload: SupplierOtpRequestPayload) {
    return BaseApi.post('/auth/suppliers/request-otp', payload, {}, {}, '').then(withExtractedOtp);
  }

  static loginWithOtp(payload: SupplierOtpLoginPayload) {
    return BaseApi.post('/auth/suppliers/login-otp', payload, {}, {}, '').then(withExtractedOtp);
  }

  static resetPassword(payload: SupplierResetPasswordPayload) {
    return BaseApi.post('/auth/suppliers/reset-password', payload, {}, {}, '').then(withExtractedOtp);
  }

  static getSupplierProfile() {
    return BaseApi.get('/suppliers/profile');
  }

  static createVehicle(payload: CreateVehiclePayload) {
    return BaseApi.post('/vehicles', payload);
  }

  static listSupplierVehicles(
    supplierId: number | string = 'me',
    params?: SupplierVehiclesQuery,
  ) {
    return BaseApi.get(`/vehicles/supplier/${supplierId}`, {}, { params });
  }

  static listVehicles(params?: Record<string, any>) {
    return BaseApi.get('/vehicles', {}, { params });
  }

  static getVehicle(vehicleId: number | string) {
    return BaseApi.get(`/vehicles/${vehicleId}`);
  }

  static updateVehicle(vehicleId: number | string, payload: Partial<CreateVehiclePayload>) {
    return BaseApi.put(`/vehicles/${vehicleId}`, payload);
  }

  static getVehicleDetails(vehicleId: number | string) {
    return BaseApi.get(`/vehicles/${vehicleId}/details`);
  }

  static listVehicleOrders(
    vehicleId: number | string,
    params?: { status?: 'all' | 'delivered' | 'cancelled' | 'confirmed' | 'out_for_delivery' },
  ) {
    return BaseApi.get(`/vehicles/${vehicleId}/orders`, {}, { params });
  }

  static getVehicleOrderDetails(vehicleId: number | string, orderId: number | string) {
    return BaseApi.get(`/vehicles/${vehicleId}/orders/${orderId}`);
  }

  static setVehicleAvailability(vehicleId: number | string, online: boolean) {
    return BaseApi.patch(`/vehicles/${vehicleId}/availability`, { online });
  }

  static updateVehicleLocation(
    vehicleId: number | string,
    payload: VehicleLocationUpdatePayload,
  ) {
    return BaseApi.patch(`/vehicles/${vehicleId}/location`, payload);
  }

  static upsertVehicleProduct(
    vehicleId: number | string,
    payload: VehicleProductPayload,
  ) {
    return BaseApi.post(`/vehicles/${vehicleId}/products`, payload);
  }

  static deleteVehicle(vehicleId: number | string) {
    return BaseApi.delete(`/vehicles/${vehicleId}`);
  }

  static listSupplierOrderProducts(supplierId: number | string) {
    return BaseApi.get(`/orders/products/supplier/${supplierId}`);
  }

  static listOrderHistoryProducts() {
    return BaseApi.get('/orders/products/history');
  }

  static createReview(payload: ReviewPayload) {
    return BaseApi.post('/reviews', payload);
  }

  static listSupplierReviews(supplierId: number | string) {
    return BaseApi.get(`/reviews/supplier/${supplierId}`);
  }

  static getReview(reviewId: number | string) {
    return BaseApi.get(`/reviews/${reviewId}`);
  }

  static updateReview(reviewId: number | string, payload: ReviewPayload) {
    return BaseApi.put(`/reviews/${reviewId}`, payload);
  }

  static deleteReview(reviewId: number | string) {
    return BaseApi.delete(`/reviews/${reviewId}`);
  }

  static toggleFavouriteSupplier(supplierId: number | string) {
    return BaseApi.post(`/favourites/supplier/${supplierId}`, {});
  }

  static listFavouriteSuppliers() {
    return BaseApi.get('/favourites/suppliers');
  }

  static toggleFavouriteProduct(productId: number | string) {
    return BaseApi.post(`/favourites/product/${productId}`, {});
  }

  static listFavouriteProducts() {
    return BaseApi.get('/favourites/products');
  }

  static createSupplierDiscount(
    supplierId: number | string,
    payload: SupplierDiscountPayload,
  ) {
    return BaseApi.post(`/supplier-discounts/${supplierId}/discounts`, payload);
  }

  static listSupplierDiscounts(
    supplierId: number | string,
    params?: SupplierResourceQuery,
  ) {
    return BaseApi.get(
      `/supplier-discounts/${supplierId}/discounts`,
      {},
      { params },
    );
  }

  static listActiveSupplierDiscounts(
    supplierId: number | string,
    params?: SupplierResourceQuery,
  ) {
    return BaseApi.get(
      `/supplier-discounts/${supplierId}/discounts/active`,
      {},
      { params },
    );
  }

  static listAllSupplierDiscounts(params?: SupplierResourceQuery) {
    return BaseApi.get('/supplier-discounts', {}, { params });
  }

  static getSupplierDiscount(discountId: number | string) {
    return BaseApi.get(`/supplier-discounts/${discountId}`);
  }

  static updateSupplierDiscount(
    discountId: number | string,
    payload: SupplierDiscountPayload,
  ) {
    return BaseApi.put(`/supplier-discounts/${discountId}`, payload);
  }

  static deleteSupplierDiscount(discountId: number | string) {
    return BaseApi.delete(`/supplier-discounts/${discountId}`);
  }

  static listSupplierImages(
    supplierId: number | string,
    params?: SupplierResourceQuery,
  ) {
    return BaseApi.get(
      `/supplier-images/supplier/${supplierId}`,
      {},
      { params },
    );
  }
}
