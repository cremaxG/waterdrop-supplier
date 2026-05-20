import { getStorage } from "../utils/Storage";
import axiosInstance from "./axiosInstance";

// const apiBaseUrl = "https://water-drop-backend.onrender.com/api/v1";

const handleError = (error: any) => {
  if (error.response) {
    const status = error.response.status;
    if (status === 401) {
      // getStorage().clear();
      // window.location.href = "./signup";
    } else if (status === 403 || status === 404) {
      return error.response.data;
    }
    return error.response.data;
  }
  return error;
};

export default class BaseApi {
  // static setAccessToken(token: string) {
  //   localgetStorage().setItem("accessToken", token);
  //   window.dispatchEvent(new Event("authChanged"));
  // }

  static getHeaders(extraHeaders = {}, tokenOverride?: string) {
    const token = tokenOverride ?? getStorage().getString('authToken');
    const headers: any = {
      "Content-Type": "application/json",
      ...extraHeaders,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  static camelToSnake(str: string) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  static async get(
    endpoint: string,
    extraHeaders = {},
    config = {},
    tokenOverride?: string,
  ) {
    try {
      const res = await axiosInstance.get(`${endpoint}`, {
        headers: this.getHeaders(extraHeaders, tokenOverride),
        ...config
      });
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  }

  static async post(
    endpoint: string,
    payload: any,
    extraHeaders = {},
    config = {},
    tokenOverride?: string,
  ) {
    try {
      const res = await axiosInstance.post(`${endpoint}`, payload, {
        headers: this.getHeaders(extraHeaders, tokenOverride),
        ...config
      });
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  }

  static async put(
    endpoint: string,
    payload: any,
    extraHeaders = {},
    config = {},
    tokenOverride?: string,
  ) {
    try {
      const res = await axiosInstance.put(`${endpoint}`, payload, {
        headers: this.getHeaders(extraHeaders, tokenOverride),
        ...config
      });
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  }

    static async patch(
      endpoint: string,
      payload: any,
      extraHeaders = {},
      config = {},
      tokenOverride?: string,
    ) {
    try {
      const res = await axiosInstance.patch(`${endpoint}`, payload, {
        headers: this.getHeaders(extraHeaders, tokenOverride),
        ...config
      });
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  }

  static async delete(
    endpoint: string,
    extraHeaders = {},
    config = {},
    tokenOverride?: string,
  ) {
    try {
      const res = await axiosInstance.delete(`${endpoint}`, {
        headers: this.getHeaders(extraHeaders, tokenOverride),
        ...config
      });
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  }

  static async request(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    endpoint: string,
    payload?: any,
    extraHeaders = {},
    config = {},
    tokenOverride?: string,
  ) {
    const headers = this.getHeaders(extraHeaders, tokenOverride);
    try {
      const res = await axiosInstance.request({
        url: endpoint,
        method,
        data: payload,
        headers,
        ...config,
      });
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  }

  static async postForm(
    endpoint: string,
    formData: FormData,
    extraHeaders = {},
    config = {},
    tokenOverride?: string,
  ) {
    return this.post(
      endpoint,
      formData,
      {
        'Content-Type': 'multipart/form-data',
        ...extraHeaders,
      },
      config,
      tokenOverride,
    );
  }

  static async putForm(
    endpoint: string,
    formData: FormData,
    extraHeaders = {},
    config = {},
    tokenOverride?: string,
  ) {
    return this.put(
      endpoint,
      formData,
      {
        'Content-Type': 'multipart/form-data',
        ...extraHeaders,
      },
      config,
      tokenOverride,
    );
  }
}
