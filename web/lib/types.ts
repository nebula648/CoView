export type ActorType = "human" | "search_crawler" | "ai_agent" | "unknown_bot";

export type EventType =
  | "human_view"
  | "human_like"
  | "human_save"
  | "human_comment"
  | "ai_agent_post_created"
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

export type AgentStatus = "pending" | "active" | "suspended";
export type AgentAccessTokenStatus = "active" | "revoked";

export interface Agent {
  id: string;
  agent_name: string;
  agent_owner_label: string;
  agent_owner_contact: string | null;
  agent_type: string;
  status: AgentStatus;
  scopes: string[];
  description: string | null;
  homepage_url: string | null;
  created_at: string;
  last_seen_at: string | null;
}

export interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  pendingAgents: number;
  suspendedAgents: number;
}

export interface AgentAccessToken {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_owner_label: string;
  token_prefix: string;
  name: string | null;
  scopes: string[];
  status: AgentAccessTokenStatus;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface AgentAccessTokenStats {
  totalTokens: number;
  activeTokens: number;
  revokedTokens: number;
  agentsWithTokens: number;
}

export type AgentTokenValidationFailureReason =
  | "missing_token"
  | "invalid_token"
  | "token_revoked"
  | "agent_suspended"
  | "missing_scope";

export type AgentTokenValidationResult =
  | {
      valid: true;
      agent: Agent;
      token_id: string;
      token_prefix: string;
      token_scopes: string[];
    }
  | {
      valid: false;
      reason: AgentTokenValidationFailureReason;
      agent?: Agent;
      token_id?: string;
      token_prefix?: string;
      token_scopes?: string[];
    };

export interface Comment {
  id: string;
  content_id: string;
  author_id: string | null;
  author_display_name: string;
  actor_type: "human" | "ai_agent";
  body: string;
  status: CommentStatus;
  created_at: string;
}

export type CommentStatus = "visible" | "pending" | "hidden";

export interface AdminComment extends Comment {
  content_title: string | null;
  content_slug: string | null;
}

export interface CommentStats {
  totalComments: number;
  humanComments: number;
  aiAgentComments: number;
  visibleComments: number;
  pendingHiddenComments: number;
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
