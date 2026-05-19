import axios, { AxiosRequestConfig } from "axios";
import { loader } from "../context/LoaderContext";

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
    skipLoader?: boolean; // 👈 our custom flag
  }

const axiosInstance = axios.create({
  baseURL: 'https://water-drop-backend.onrender.com/api/v1',
});

axiosInstance.interceptors.request.use(
  (config) => {
    const customConfig = config as CustomAxiosRequestConfig;

    if (!customConfig?.skipLoader) {
      loader.showLoader();
    }
    return config;
  },
  (error) => {
    loader.hideLoader();
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    const customConfig = response.config as CustomAxiosRequestConfig;

    if (!customConfig?.skipLoader) {
      loader.hideLoader();
    }
    return response;
  },
  (error) => {
    const customConfig = error.config as CustomAxiosRequestConfig;

    if (!customConfig?.skipLoader) {
      loader.hideLoader();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

