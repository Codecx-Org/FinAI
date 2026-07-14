import axios, { AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";

const DEFAULT_API_PORT = 3000;

/**
 * LAN / dev troubleshooting (manual checks):
 * - VPN (e.g. NordVPN): can block LAN access from phone — disable VPN on PC and device and retry.
 * - Guest / IoT Wi‑Fi and router "AP isolation": devices cannot reach each other — use main LAN or disable isolation for dev.
 * - Same subnet: phone IP should match PC LAN (e.g. 192.168.x.x /24); mismatched VLANs block routing.
 * - Windows Firewall: allow inbound TCP on the API port for Private networks (or allow Node/bun when prompted).
 */
function parseHostFromHostUri(hostUri: string | undefined): string | null {
  if (!hostUri?.trim()) return null;
  const host = hostUri.split(":")[0];
  return host || null;
}

/** Metro bundler host in Expo dev (`hostUri` is e.g. `192.168.100.50:8081`). */
function getExpoDevHost(): string | null {
  return parseHostFromHostUri(Constants.expoConfig?.hostUri);
}

/**
 * Base URL for API calls.
 * - Set `EXPO_PUBLIC_API_URL` for production or fixed LAN IP (e.g. `http://192.168.1.10:3000`).
 * - In Expo Go / dev, prefers the same machine IP Metro uses so it tracks DHCP changes.
 * - Android emulator uses `10.0.2.2` (host loopback). iOS Simulator uses `localhost`.
 */
export function getApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  if (Platform.OS === "web") {
    return `http://localhost:${DEFAULT_API_PORT}`;
  }

  const expoHost = getExpoDevHost();

  if (Platform.OS === "android") {
    if (!Device.isDevice) {
      return `http://10.0.2.2:${DEFAULT_API_PORT}`;
    }
    if (expoHost) {
      return `http://${expoHost}:${DEFAULT_API_PORT}`;
    }
  }

  if (Platform.OS === "ios") {
    if (!Device.isDevice) {
      return `http://localhost:${DEFAULT_API_PORT}`;
    }
    if (expoHost) {
      return `http://${expoHost}:${DEFAULT_API_PORT}`;
    }
  }

  if (expoHost) {
    return `http://${expoHost}:${DEFAULT_API_PORT}`;
  }

  if (__DEV__) {
    console.warn(
      "[api] EXPO_PUBLIC_API_URL is unset and Expo hostUri is missing; API calls may fail. Set EXPO_PUBLIC_API_URL or open the app from Expo dev so hostUri is populated.",
    );
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
}

/** Express mounts all REST routes under `/api` (see backend main.ts). */
function withApiPrefix(hostRoot: string): string {
  const trimmed = hostRoot.replace(/\/+$/, "");
  if (trimmed.endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
}

const apiRoot = withApiPrefix(getApiUrl());

export const api = axios.create({
  baseURL: apiRoot,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("bizsawa_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      "API Request:",
      config.method?.toUpperCase(),
      config.url,
      config.baseURL,
    );
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

/**
 * Custom error type that includes our standardized friendly message.
 */
export interface ApiError extends AxiosError {
  friendlyMessage?: string;
}

/**
 * Standardizes API error messages for the UI.
 * Implements "Information Hiding" by concealing technical details (like Prisma errors)
 * from the end user while logging them for developers.
 */
export function standardizeApiError(error: any): string {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Handle specific status codes with friendly abstractions
    if (status === 401) return "Session expired. Please log in again.";
    if (status === 403) return "You don't have permission to do this.";
    if (status === 404) return "The requested information was not found.";
    
    // Hide technical details for 500 errors (Information Hiding)
    if (status >= 500) {
      return "Something went wrong on our end. Please try again in a moment.";
    }

    // Return the message from the server if it exists and isn't technical
    const message = data?.message || data?.error;
    if (message && typeof message === "string") {
      // Basic check to see if it looks like a code/system error
      if (message.includes("Prisma") || message.includes("database") || message.includes("invocation")) {
        return "A database error occurred. Please try again.";
      }
      return message;
    }
  } else if (error.request) {
    // Network errors
    return "Connection failed. Please check your internet and try again.";
  }

  return "An unexpected error occurred. Please try again.";
}

// Response interceptor to handle auth errors and sanitize messages
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.config.url);
    // If the response is wrapped in standard API envelope { success: true, data: ... }
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: ApiError) => {
    const friendlyMessage = standardizeApiError(error);
    
    // Log the actual error for debugging
    console.error(`[API ERROR] ${error.config?.url}:`, {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("bizsawa_token");
      await AsyncStorage.removeItem("bizsawa_userdata");
    }

    // Wrap the error with our friendly message
    error.friendlyMessage = friendlyMessage;
    
    return Promise.reject(error);
  },
);
