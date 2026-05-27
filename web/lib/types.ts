export type ActorType = "human" | "search_crawler" | "ai_agent" | "unknown_bot";

export type EventType =
  | "human_view"
  | "human_like"
  | "human_save"
  | "human_comment"
  | "ai_agent_comment"
  | "ai_agent_view"
  | "ai_agent_save"
  | "ai_agent_cite"
  | "ai_recommendation"
  | "ai_reject_citation"
  | "ai_action_blocked"
  | "search_crawler_view"
  | "unknown_bot_view";

export type CitationSuitability = "Low" | "Medium" | "High";

export interface Comment {
  id: string;
  content_id: string;
  author_id: string | null;
  author_display_name: string;
  actor_type: "human" | "ai_agent";
  body: string;
  status: "visible";
  created_at: string;
}

export interface AiReadableContent {
  "@context": Record<string, string>;
  "@type": "Article";
  headline: string;
  datePublished: string;
  author: { "@type": "Person"; name: string };
  "coView:contentId": string;
  "coView:author": {
    displayName: string;
    profileId?: string;
  };
  "coView:title": string;
  "coView:body": string;
  "coView:originalTags": string[];
  "coView:allowAiComment": boolean;
  "coView:aiAnalysis": {
    summary: string | null;
    tags: string[];
    recommendedScenarios: string[];
    citationSuitability: CitationSuitability;
    valueScore: number;
  };
  "coView:metrics": {
    human: { views: number; likes: number; saves: number };
    ai: { views: number; saves: number; citations: number; recommendations: number };
  };
  "coView:usagePolicy": {
    canAiView: boolean;
    canAiSave: boolean;
    canAiCite: boolean;
    canAiRecommend: boolean;
    canAiComment: boolean;
  };
}

export interface AiIndexEntry {
  contentId: string;
  slug: string;
  title: string;
  aiSummary: string | null;
  aiTags: string[];
  aiValueScore: number;
  citationSuitability: CitationSuitability;
  allowAiCite: boolean;
  allowAiRecommend: boolean;
  jsonUrl: string;
}
