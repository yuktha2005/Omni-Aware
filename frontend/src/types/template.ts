export type ChannelType = "sms" | "whatsapp" | "email" | "voice";

export type TemplateCategory =
  | "health"
  | "disaster"
  | "civic"
  | "education"
  | "agriculture"
  | "welfare";

export interface MultilingualTranslation {
  languageCode: string;
  languageName: string;
  content: string;
  subject?: string;
  isVerified?: boolean;
}

export interface MessageTemplate {
  id: string;
  code: string;
  title: string;
  description: string;
  channel: ChannelType;
  category: TemplateCategory;
  primaryLanguage: string;
  variables: string[];
  translations: Record<string, MultilingualTranslation>;
  status: "active" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}
