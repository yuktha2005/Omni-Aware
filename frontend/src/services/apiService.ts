import apiClient from "./api";
import type { LoginRequest, LoginResponse, RegisterRequest, Admin, UpdateRoleRequest } from "../types/auth";
import type { RecipientsListResponse, Recipient } from "../types/recipient";
import type { MasterRecord } from "../types/master";
import type { Segment, SegmentCreate, SegmentCreateResponse, SegmentPreviewResponse } from "../types/segment";
import type { AudienceFilterRequest, AudiencePreviewResponse } from "../types/audience";
import type { ImportPreviewResponse, ImportResultResponse } from "../types/import";

export const authAPI = {
  login: (data: LoginRequest): Promise<{ data: LoginResponse }> =>
    apiClient.post<LoginResponse>("/auth/login", data),

  register: (data: RegisterRequest): Promise<{ data: LoginResponse }> =>
    apiClient.post<LoginResponse>("/auth/register", data),

  getMe: (): Promise<{ data: Admin }> =>
    apiClient.get<Admin>("/auth/me"),

  getUsers: (): Promise<{ data: Admin[] }> =>
    apiClient.get<Admin[]>("/auth/users"),

  updateUserRole: (userId: number, data: UpdateRoleRequest): Promise<{ data: Admin }> =>
    apiClient.put<Admin>(`/auth/users/${userId}/role`, data),
};

export const recipientAPI = {
  list: (params: {
    search?: string;
    status?: string;
    city?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ data: RecipientsListResponse }> =>
    apiClient.get<RecipientsListResponse>("/recipients", { params }),

  get: (id: number): Promise<{ data: Recipient }> =>
    apiClient.get<Recipient>(`/recipients/${id}`),
};

export const importAPI = {
  preview: (file: File): Promise<{ data: ImportPreviewResponse }> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<ImportPreviewResponse>(
      "/recipients/import/preview",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  },

  import: (file: File): Promise<{ data: ImportResultResponse }> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<ImportResultResponse>(
      "/recipients/import",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  },
};

export const audienceAPI = {
  preview: (data: AudienceFilterRequest): Promise<{ data: AudiencePreviewResponse }> =>
    apiClient.post<AudiencePreviewResponse>("/audiences/preview", data),
};

export const segmentAPI = {
  list: (): Promise<{ data: Segment[] }> =>
    apiClient.get<Segment[]>("/segments"),

  get: (id: number): Promise<{ data: Segment }> =>
    apiClient.get<Segment>(`/segments/${id}`),

  create: (data: SegmentCreate): Promise<{ data: SegmentCreateResponse }> =>
    apiClient.post<SegmentCreateResponse>("/segments", data),

  preview: (id: number): Promise<{ data: SegmentPreviewResponse }> =>
    apiClient.get<SegmentPreviewResponse>(`/segments/${id}/preview`),
};

export const masterAPI = {
  languages: (): Promise<{ data: MasterRecord[] }> =>
    apiClient.get<MasterRecord[]>("/master/languages"),

  states: (): Promise<{ data: MasterRecord[] }> =>
    apiClient.get<MasterRecord[]>("/master/states"),

  occupations: (): Promise<{ data: MasterRecord[] }> =>
    apiClient.get<MasterRecord[]>("/master/occupations"),

  organizations: (): Promise<{ data: MasterRecord[] }> =>
    apiClient.get<MasterRecord[]>("/master/organizations"),

  organizationUnits: (): Promise<{ data: MasterRecord[] }> =>
    apiClient.get<MasterRecord[]>("/master/organization-units"),

  getAll: async (): Promise<{ data: Record<string, MasterRecord[]> }> => {
    const [lang, states, occ, org, dept] = await Promise.all([
      masterAPI.languages(),
      masterAPI.states(),
      masterAPI.occupations(),
      masterAPI.organizations(),
      masterAPI.organizationUnits(),
    ]);
    return {
      data: {
        languages: lang.data,
        states: states.data,
        occupations: occ.data,
        organizations: org.data,
        organization_units: dept.data,
      },
    };
  },
};

export const campaignAPI = {
  list: (): Promise<{ data: any[] }> =>
    apiClient.get<any[]>("/ai/campaigns"),

  get: (id: number): Promise<{ data: any }> =>
    apiClient.get<any>(`/ai/campaigns/${id}`),

  create: (data: any): Promise<{ data: any }> =>
    apiClient.post<any>("/ai/campaigns", data),

  processPipeline: (data: any): Promise<{ data: any }> =>
    apiClient.post<any>("/ai/process", data),
};

export const distributionAPI = {
  schedule: (campaignId: number, data: any): Promise<{ data: any }> =>
    apiClient.post<any>(`/campaigns/${campaignId}/schedule`, data),

  distribute: (campaignId: number, channels?: string[]): Promise<{ data: any }> => {
    let url = `/campaigns/${campaignId}/distribute`;
    if (channels && channels.length > 0) {
      const q = channels.map((c) => `channels=${encodeURIComponent(c)}`).join("&");
      url += `?${q}`;
    }
    return apiClient.post<any>(url);
  },

  retry: (campaignId: number): Promise<{ data: any }> =>
    apiClient.post<any>(`/campaigns/${campaignId}/retry`),

  cancel: (campaignId: number): Promise<{ data: any }> =>
    apiClient.post<any>(`/campaigns/${campaignId}/cancel`),

  getDeliveries: (
    campaignId: number,
    params?: { channel?: string; status?: string; skip?: number; limit?: number }
  ): Promise<{ data: any }> =>
    apiClient.get<any>(`/campaigns/${campaignId}/deliveries`, { params }),

  getMonitoring: (campaignId: number): Promise<{ data: any }> =>
    apiClient.get<any>(`/campaigns/${campaignId}/monitoring`),

  getActiveBroadcasts: (): Promise<{ data: any[] }> =>
    apiClient.get<any[]>("/broadcasts/active"),

  recordBroadcastView: (broadcastId: number): Promise<{ data: any }> =>
    apiClient.post<any>(`/broadcasts/${broadcastId}/view`),
};

export const analyticsAPI = {
  getOverview: (): Promise<{ data: any }> =>
    apiClient.get<any>("/analytics/overview"),

  getCampaignAnalytics: (campaignId: number): Promise<{ data: any }> =>
    apiClient.get<any>(`/analytics/campaigns/${campaignId}`),

  getDeliveryAnalytics: (campaignId: number): Promise<{ data: any }> =>
    apiClient.get<any>(`/analytics/campaigns/${campaignId}/delivery`),

  getEngagementAnalytics: (campaignId: number): Promise<{ data: any }> =>
    apiClient.get<any>(`/analytics/campaigns/${campaignId}/engagement`),

  getFeedbacks: (campaignId: number, sentiment?: string): Promise<{ data: any }> =>
    apiClient.get<any>(`/analytics/campaigns/${campaignId}/feedbacks`, {
      params: sentiment ? { sentiment } : {},
    }),

  submitFeedback: (campaignId: number, data: any): Promise<{ data: any }> =>
    apiClient.post<any>(`/analytics/campaigns/${campaignId}/feedbacks`, data),

  recordEvent: (campaignId: number, data: any): Promise<{ data: any }> =>
    apiClient.post<any>(`/analytics/campaigns/${campaignId}/events`, data),
};

