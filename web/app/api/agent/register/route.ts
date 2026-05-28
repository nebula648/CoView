import { NextRequest, NextResponse } from "next/server";
import { createAgent } from "@/lib/repository";

const VALID_AGENT_TYPES = ["assistant", "research", "crawler", "workflow"];
const MAX_AGENT_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_HOMEPAGE_LENGTH = 500;

interface AgentRegisterBody {
  agent_name?: unknown;
  agent_type?: unknown;
  description?: unknown;
  homepage_url?: unknown;
}

export async function POST(request: NextRequest) {
  const body: AgentRegisterBody | null = await request
    .json()
    .catch(() => null);

  if (!body) {
    return NextResponse.json(
      { success: false, error: "Invalid JSON." },
      { status: 400 },
    );
  }

  const agentName =
    typeof body.agent_name === "string" ? body.agent_name.trim() : "";

  if (!agentName) {
    return NextResponse.json(
      { success: false, error: "agent_name is required." },
      { status: 400 },
    );
  }

  if (agentName.length > MAX_AGENT_NAME_LENGTH) {
    return NextResponse.json(
      { success: false, error: `agent_name must be ${MAX_AGENT_NAME_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  const agentType =
    typeof body.agent_type === "string" ? body.agent_type.trim() : "assistant";

  if (!VALID_AGENT_TYPES.includes(agentType)) {
    return NextResponse.json(
      {
        success: false,
        error: `agent_type must be one of: ${VALID_AGENT_TYPES.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const description =
    typeof body.description === "string"
      ? body.description.trim().slice(0, MAX_DESCRIPTION_LENGTH)
      : null;

  const homepageUrl =
    typeof body.homepage_url === "string"
      ? body.homepage_url.trim().slice(0, MAX_HOMEPAGE_LENGTH)
      : null;

  try {
    const { agent, token } = await createAgent({
      agentName,
      agentType,
      description,
      homepageUrl,
    });

    return NextResponse.json({
      success: true,
      agent_id: agent.id,
      agent_name: agent.agent_name,
      status: agent.status,
      scopes: agent.scopes,
      token,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Agent registration failed.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
