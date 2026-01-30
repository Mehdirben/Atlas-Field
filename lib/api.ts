import axios from "axios";
import { getSession } from "next-auth/react";
import { mockApi } from "./mock-api";
import {
  Site,
  Analysis,
  Alert,
  ChatHistory,
  ChatMessage,
  UserProfile,
  SiteType,
  FieldTrends,
  ForestTrends,
  Field
} from "../types/api";

export {
  type Site,
  type Analysis,
  type Alert,
  type ChatHistory,
  type ChatMessage,
  type UserProfile,
  type SiteType,
  type FieldTrends,
  type ForestTrends,
  type Field
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }
  return config;
});

// Switch to control Mock vs Real API
const USE_MOCK = true;

// API functions

// Auth
export const registerUser = async (data: {
  email: string;
  password: string;
  full_name?: string;
}) => {
  if (USE_MOCK) return { message: "Success" };
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const getCurrentUser = async (): Promise<UserProfile> => {
  if (USE_MOCK) return mockApi.getCurrentUser();
  const response = await api.get("/auth/me");
  return response.data;
};

// Sites
export const getSites = async (siteType?: SiteType): Promise<Site[]> => {
  if (USE_MOCK) return mockApi.getSites(siteType);
  const params = siteType ? { site_type: siteType } : {};
  const response = await api.get("/sites", { params });
  return response.data;
};

export const getFields = getSites;

export const getSite = async (id: number): Promise<Site> => {
  if (USE_MOCK) return mockApi.getSite(id);
  const response = await api.get(`/sites/${id}`);
  return response.data;
};

export const getField = getSite;

export const createSite = async (data: any): Promise<Site> => {
  if (USE_MOCK) return mockApi.createSite(data);
  const response = await api.post("/sites", data);
  return response.data;
};

export const createField = async (data: any): Promise<Site> => {
  return createSite({ ...data, site_type: "FIELD" });
};

export const updateSite = async (id: number, data: Partial<Site>): Promise<Site> => {
  if (USE_MOCK) return mockApi.updateSite(id, data);
  const response = await api.put(`/sites/${id}`, data);
  return response.data;
};

export const updateField = updateSite;

export const deleteSite = async (id: number): Promise<void> => {
  if (USE_MOCK) return mockApi.deleteSite(id);
  await api.delete(`/sites/${id}`);
};

export const deleteField = deleteSite;

// Analysis
export const runAnalysis = async (siteId: number, analysisType: string = "NDVI"): Promise<Analysis> => {
  if (USE_MOCK) return mockApi.runAnalysis(siteId, analysisType);
  const response = await api.post(`/analysis/${siteId}`, { analysis_type: analysisType });
  return response.data;
};

export const getAnalysisHistory = async (siteId: number, analysisType?: string): Promise<Analysis[]> => {
  if (USE_MOCK) return mockApi.getAnalysisHistory(siteId, analysisType);
  const params = analysisType ? { analysis_type: analysisType } : {};
  const response = await api.get(`/analysis/${siteId}/history`, { params });
  return response.data;
};

export const getYieldPrediction = async (siteId: number) => {
  if (USE_MOCK) return mockApi.getYieldPrediction(siteId);
  const response = await api.get(`/analysis/${siteId}/yield`);
  return response.data;
};

export const getBiomassEstimate = async (siteId: number) => {
  if (USE_MOCK) return mockApi.getBiomassEstimate(siteId);
  const response = await api.get(`/analysis/${siteId}/biomass`);
  return response.data;
};

export const getForestTrends = async (siteId: number): Promise<ForestTrends> => {
  if (USE_MOCK) return mockApi.getForestTrends(siteId);
  const response = await api.get(`/analysis/${siteId}/forest-trends`);
  return response.data;
};

export const getFieldTrends = async (siteId: number): Promise<FieldTrends> => {
  if (USE_MOCK) return mockApi.getFieldTrends(siteId);
  const response = await api.get(`/analysis/${siteId}/field-trends`);
  return response.data;
};

// Chat
export const sendChatMessage = async (message: string, fieldId?: number) => {
  if (USE_MOCK) {
    // Call our internal Next.js API route even in "Mock" mode if we want real AI
    const response = await axios.post("/api/chat", { message, field_id: fieldId });
    return response.data;
  }
  const response = await api.post("/chat", { message, field_id: fieldId });
  return response.data;
};

export const getChatHistory = async (fieldId?: number): Promise<ChatHistory[]> => {
  if (USE_MOCK) return mockApi.getChatHistory(fieldId);
  const response = await api.get("/chat/history", {
    params: fieldId !== undefined ? { field_id: fieldId } : {},
  });
  return response.data;
};

export const deleteChatHistory = async (historyId: number): Promise<void> => {
  if (USE_MOCK) return mockApi.deleteChatHistory(historyId);
  await api.delete(`/chat/history/${historyId}`);
};

// Alerts
export const getAlerts = async (unreadOnly = false): Promise<Alert[]> => {
  if (USE_MOCK) return mockApi.getAlerts(unreadOnly);
  const response = await api.get("/alerts", { params: { unread_only: unreadOnly } });
  return response.data;
};

export const markAlertRead = async (alertId: number): Promise<Alert> => {
  if (USE_MOCK) return mockApi.markAlertRead(alertId);
  const response = await api.put(`/alerts/${alertId}/read`);
  return response.data;
};

export const markAllAlertsRead = async (): Promise<void> => {
  if (USE_MOCK) return; // Not implemented in mock yet
  await api.put("/alerts/read-all");
};
