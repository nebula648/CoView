"use client";

import { useEffect, useRef } from "react";

const SESSION_KEY = "coview_session_id";

function getSessionId(): string {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

export function HumanViewTracker({ contentId }: { contentId: string }) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;

    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "human_view",
        content_id: contentId,
        session_id: getSessionId(),
      }),
    }).catch(() => {
      // View tracking should never block content reading.
    });
  }, [contentId]);

  return null;
}
