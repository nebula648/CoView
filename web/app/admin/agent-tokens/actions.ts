"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAgentAccessToken,
  getAgents,
  revokeAgentAccessToken,
} from "@/lib/repository";

export interface CreateAgentTokenState {
  type: "idle" | "success" | "error";
  message: string;
  token?: string;
  tokenPrefix?: string;
}

export async function createAgentTokenAction(
  _previousState: CreateAgentTokenState,
  formData: FormData,
): Promise<CreateAgentTokenState> {
  const agentId = String(formData.get("agent_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const scopes = formData
    .getAll("scopes")
    .map((scope) => String(scope).trim())
    .filter(Boolean);

  if (!agentId) {
    return {
      type: "error",
      message: "Please select an Agent before creating a token.",
    };
  }

  try {
    const agents = await getAgents();
    const selectedAgent = agents.find((agent) => agent.id === agentId);
    if (!selectedAgent) {
      return { type: "error", message: "Selected Agent was not found." };
    }

    const created = await createAgentAccessToken({
      agentId,
      name,
      scopes: scopes.length > 0 ? scopes : selectedAgent.scopes,
    });

    revalidatePath("/admin/agent-tokens");
    return {
      type: "success",
      message: "Agent token created. Copy it now; it will not be shown again.",
      token: created.token,
      tokenPrefix: created.record.token_prefix,
    };
  } catch (error) {
    return {
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create Agent token.",
    };
  }
}

export async function revokeAgentTokenAction(formData: FormData) {
  const tokenId = String(formData.get("token_id") ?? "").trim();
  if (!tokenId) {
    redirect("/admin/agent-tokens?type=error&message=Missing%20token%20id.");
  }

  try {
    await revokeAgentAccessToken(tokenId);
    revalidatePath("/admin/agent-tokens");
    redirect(
      "/admin/agent-tokens?type=success&message=Agent%20token%20revoked.",
    );
  } catch {
    redirect(
      "/admin/agent-tokens?type=error&message=Failed%20to%20revoke%20Agent%20token.",
    );
  }
}
