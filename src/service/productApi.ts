import BaseApi from './baseApi';

export interface CreateProductPayload {
  supplier_id: number;
  name: string;
  price: string | number;
  uom: string;
  stock_qty: number;
  category?: string;
  type?: string;
  brand?: string;
  tax_code?: string;
  discount?: string;
  including_gst?: boolean;
  description?: string;
}

export interface ProductResponse {
  id: number | string;
  supplier_id: number;
  name: string;
  price: string;
  uom: string;
  stock_qty: number;
  category?: string;
  type?: string;
  brand?: string;
  tax_code?: string;
  discount?: string;
  including_gst?: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export default class ProductApi {
  static listProducts(params?: Record<string, any>) {
    return BaseApi.get('/products', {}, { params });
  }

  static createProduct(payload: CreateProductPayload) {
    return BaseApi.post('/products', payload);
  }

  static getProduct(productId: number | string) {
    return BaseApi.get(`/products/${productId}`);
  }

  static updateProduct(productId: number | string, payload: Partial<CreateProductPayload>) {
    return BaseApi.put(`/products/${productId}`, payload);
  }

  static deleteProduct(productId: number | string) {
    return BaseApi.delete(`/products/${productId}`);
  }
}
