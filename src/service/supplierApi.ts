import BaseApi from './baseApi';

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
  email: string;
  supplier_id: number;
  vehicle_number: string;
  name: string;
  lat?: string;
  lng?: string;
}

export interface VehicleResponse {
  id: number | string;
  supplier_id: number;
  vehicle_number: string;
  name: string;
  phone: string;
  email: string;
  lat: string;
  lng: string;
  created_at?: string;
  updated_at?: string;
}

export default class SupplierApi {
  static registerSupplier(payload: SupplierRegisterPayload) {
    return BaseApi.post('/auth/suppliers/register', payload, {}, {}, '');
  }

  static loginSupplier(payload: SupplierLoginPayload) {
    return BaseApi.post('/auth/suppliers/login', payload, {}, {}, '');
  }

  static requestOtp(payload: SupplierOtpRequestPayload) {
    return BaseApi.post('/auth/suppliers/request-otp', payload, {}, {}, '');
  }

  static loginWithOtp(payload: SupplierOtpLoginPayload) {
    return BaseApi.post('/auth/suppliers/login-otp', payload, {}, {}, '');
  }

  static getSupplierProfile() {
    return BaseApi.get('/suppliers/profile');
  }

  static createVehicle(payload: CreateVehiclePayload) {
    return BaseApi.post('/vehicles', payload);
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

  static deleteVehicle(vehicleId: number | string) {
    return BaseApi.delete(`/vehicles/${vehicleId}`);
  }
}
