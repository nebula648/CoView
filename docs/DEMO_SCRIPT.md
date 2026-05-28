# CoView Demo Script / 演示讲解稿

This script is for a 5-8 minute public demo of CoView 共览.

## 1. 30-Second Intro / 30 秒项目简介

CoView 共览 is a Human-AI co-browsing content platform. The core idea is simple:
content is no longer read only by humans. AI agents also browse, summarize,
save, cite, recommend, and may eventually comment on content.

CoView treats AI agents as a new kind of reader while keeping Human Metrics and
AI Metrics visible, separate, and accountable. Human reading represents
attention, understanding, discussion, and community. AI reading represents
indexing, summarization, citation, recommendation, and knowledge redistribution.

一句话中文介绍：

CoView 共览是一个同时面向人类读者和 AI Agent 的内容平台，它把人类阅读和 AI
阅读拆成两条清晰的数据轨道，让创作者看见内容在人类世界和 AI 世界里的不同传播价值。

## 2. 5-8 Minute Demo Route / 5-8 分钟演示路线

| Step | Route | Time | Goal |
|---|---|---:|---|
| 1 | `/` | 45s | Introduce CoView and dual-track metrics |
| 2 | `/about` | 60s | Explain the product concept and what CoView is not |
| 3 | `/discover` | 60s | Show content cards, Human Metrics, AI Metrics, permissions |
| 4 | `/upload` | 60s | Show CoViewer identity and AI permission controls |
| 5 | `/content/seed-coview-001` | 90s | Show detail page, metrics, AI-readable entry, comments |
| 6 | `/dashboard` | 60s | Show aggregate Human / AI / Crawler / Bot analytics |
| 7 | `/admin` + `/admin/comments` + `/admin/ai-comments` | 90s | Show protected admin, comments overview, demo AI comment flow |
| 8 | `/api/contents/seed-coview-001.json` | 45s | Show AI-readable JSON endpoint |

## 3. Page-by-Page Talking Points / 每个页面要讲什么

### Homepage `/`

- CoView is not a normal blog or CMS. It is a prototype for content platforms
  where humans and AI agents are both first-class readers.
- Point out the dual-track stats: Human Views and AI Views are not mixed.
- Use the homepage as the "why now" moment: AI traffic is becoming part of
  content distribution, but most platforms do not show it clearly.

Suggested line:

> Traditional platforms only show human traffic. CoView adds a second visible
> track for AI attention.

### About `/about`

- Explain the central thesis: AI agents are a new reader category.
- Highlight the difference between human reading and AI reading.
- Mention the explicit boundaries: this is not a formal login system, not a
  hidden AI tracking system, and not a real AI generation platform yet.

Suggested line:

> CoView is trying to make AI consumption accountable instead of invisible.

### Discover `/discover`

- Show one content card.
- Point to the separate Human Metrics and AI Metrics blocks.
- Point to AI permission badges.
- Click `Read Details` for `seed-coview-001`.
- Click or mention `Open AI JSON` as the machine-readable version of the same
  content.

Suggested line:

> The same content has two audiences: people reading the HTML page and AI
> agents reading structured JSON.

### Upload `/upload`

- Show `Current identity: CoViewer-xxxx`.
- Explain that CoViewer identity is lightweight and browser-based, not formal
  login.
- Show the five AI permissions:
  - Allow AI View
  - Allow AI Save
  - Allow AI Cite
  - Allow AI Recommend
  - Allow AI Comment
- If doing a live write demo, publish a short non-sensitive test content.

Suggested line:

> The creator decides what AI agents are allowed to do before the content is
> published.

### Detail `/content/seed-coview-001`

- Show title, author, body, and tags.
- Show Human Metrics and AI Metrics.
- Show AI Permissions and AI-readable Entry.
- Show Recent Events.
- Show Discussion / 评论区 with Human Comments and AI Agent Comments separated.

Suggested line:

> This page is where CoView becomes visible: human behavior, AI behavior,
> permissions, events, and comments are all shown as separate layers.

### Dashboard `/dashboard`

- Show Traffic Overview.
- Show Human vs AI attention ratio.
- Show Event Type Distribution.
- Show Content Leaderboards.
- Explain that this is not just page views. It is behavior analytics across
  human readers, AI agents, crawlers, and bots.

Suggested line:

> The dashboard shows how content travels differently through human attention
> and AI attention.

### Admin `/admin`, `/admin/comments`, `/admin/ai-comments`

- Mention Admin Access Gate before opening admin pages.
- Do not say or display the access code in a public demo.
- Show that admin is protected, read-only, and noindexed.
- In `/admin/comments`, show all comments across content.
- In `/admin/ai-comments`, generate a Demo AI Agent comment for content that
  allows AI comments.
- Show the generated AI Agent comment on the public detail page.

Suggested line:

> Admin is protected by a lightweight demo access gate. It is still not a full
> authentication system, but it keeps the public demo from exposing admin pages
> casually.

### AI JSON `/api/contents/seed-coview-001.json`

- Show that the content is available as structured JSON.
- Point to:
  - `author`
  - `coView:author`
  - `coView:usagePolicy`
  - `coView:allowAiComment`
  - `coView:metrics`
  - `coView:aiAnalysis`
- Explain that AI agents should read permissions before taking action.

Suggested line:

> This is the same content, but expressed in a structure that AI agents can
> understand, cite, and respect.

## 4. Explaining Human Views vs AI Views

Human Views:

- Represent browser-based human reading.
- Connect to attention, comprehension, discussion, and community response.
- Should not be mixed with AI crawling or AI agent access.

AI Views:

- Represent AI agents or AI crawlers reading machine-readable or HTML content.
- Connect to indexing, summarization, citation, recommendation, and knowledge
  redistribution.
- Are useful only if they are visible and separated from human activity.

Simple explanation:

> Human Views tell us whether people are paying attention. AI Views tell us
> whether content is entering AI workflows. Both matter, but they mean different
> things.

## 5. Explaining AI Permissions

AI Permissions are creator-side controls for how AI agents may use content.

- `Allow AI View`: AI can read the content.
- `Allow AI Save`: AI can save the content for later use.
- `Allow AI Cite`: AI can cite the content.
- `Allow AI Recommend`: AI can recommend the content.
- `Allow AI Comment`: AI can leave a clearly labeled AI Agent comment.

Key point:

> CoView does not assume every AI action is allowed. AI behavior is permission-aware.

## 6. Explaining Human Comments and Demo AI Agent Comments

Human Comments:

- Written by CoViewer identities.
- Display with a `Human` badge.
- Represent human discussion and interpretation.

Demo AI Agent Comments:

- Created only through the protected admin demo flow.
- Display with an `AI Agent` badge.
- Written by `CoView AI Agent (Demo)`.
- Use a fixed template, not a real AI model.
- Respect `allow_ai_comment`.

Key point:

> The goal is not to pretend the AI is human. The goal is to make AI
> participation clearly labeled and permission-aware.

## 7. Explaining Admin Access Gate

Admin pages are protected by a lightweight demo access gate.

- Admin routes require an access code.
- The code is configured outside the codebase.
- The real code must never be shown in a public demo.
- Admin pages are still read-only.
- Admin pages keep `noindex` / `nofollow`.

Important wording:

> This is not a formal login system. It is a lightweight demo access gate. A
> production product should add full authentication, authorization, audit logs,
> and role management.

## 8. Explaining AI-Readable JSON Endpoint

The AI-readable endpoint is the machine-facing layer of CoView.

Recommended route:

```text
/api/contents/seed-coview-001.json
```

Explain these fields:

- `author`: content author for standard article metadata.
- `coView:author`: CoView-specific author identity.
- `coView:metrics`: separate human and AI metrics.
- `coView:usagePolicy`: permission rules for AI agents.
- `coView:allowAiComment`: whether AI comments are allowed.
- `coView:aiAnalysis`: structured summary, tags, scenarios, and score.

Suggested line:

> The JSON endpoint is how CoView makes content legible to AI without hiding
> permissions, metrics, or authorship.

## 9. What Not to Say / 展示时不能说什么

Do not say:

- "This is a production-ready authentication system."
- "This uses real OpenAI / Claude / DeepSeek generation."
- "AI comments are generated by a real model."
- "This protects private or sensitive data."
- "AI behavior is fully solved."
- "The admin access code is..." followed by the real code.
- "The database URL is..." or anything that reveals infrastructure secrets.

Say instead:

- "This is a public demo and research prototype."
- "AI Agent comments are simulated with a fixed template."
- "The admin gate is a lightweight demo protection layer."
- "The next step would be full authentication and stronger moderation tools."

## 10. Demo Limitations and Roadmap / 当前限制与后续方向

Current limitations:

- Lightweight CoViewer identity is not a formal account system.
- Admin Access Gate is not full authentication.
- Demo AI Agent comments use a fixed template.
- No real AI API is connected.
- Comment moderation is not fully implemented.
- Admin pages are read-only.
- Do not use the public demo for sensitive data.

Roadmap:

- Full admin authentication and role-based access.
- Comment moderation workflow.
- Richer Mock AI Agent behavior simulation.
- Optional real AI API integration after permission and safety design.
- Stronger AI-readable content standard.
- More complete user identity system.
- Better content editing and lifecycle management.

## 11. Closing Line / 结束语

CoView is a small but concrete experiment in making content platforms ready for
an AI-native web: human readers remain central, AI agents become visible, and
permissions make machine participation accountable.

中文收尾：

CoView 共览想验证的是：当 AI 也成为读者时，内容平台不应该只统计流量，而应该同时展示
人类理解、AI 读取、权限边界和引用责任。
