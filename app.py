import json
import random
from datetime import datetime
from pathlib import Path
from uuid import uuid4

import streamlit as st


DATA_DIR = Path("data")
DATA_FILE = DATA_DIR / "contents.json"
EVENTS_FILE = DATA_DIR / "events.json"
AI_EXPORTS_DIR = DATA_DIR / "ai_exports"
AI_EXPORT_INDEX_FILE = AI_EXPORTS_DIR / "index.json"
AI_EXPORT_LLMS_FILE = AI_EXPORTS_DIR / "llms.txt"

PAGES = ["首页", "发现", "上传", "数据看板", "AI Agent 入口", "AI 可读导出", "事件日志"]
DETAIL_PAGE = "详情页"

DEFAULT_AI_SUMMARY = "尚未生成 AI Summary。"
DEFAULT_AI_REASON = "尚未生成 AI Reason。"


def ensure_data_file():
    """Create the data directory and JSON files when missing."""
    DATA_DIR.mkdir(exist_ok=True)
    AI_EXPORTS_DIR.mkdir(exist_ok=True)
    if not DATA_FILE.exists():
        DATA_FILE.write_text("[]", encoding="utf-8")
    if not EVENTS_FILE.exists():
        EVENTS_FILE.write_text("[]", encoding="utf-8")


def load_contents():
    """Load contents from the local JSON store."""
    ensure_data_file()
    try:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except json.JSONDecodeError:
        data = []

    for content in data:
        ensure_ai_fields(content)

    return data


def load_events():
    """Load event logs from the local JSON store."""
    ensure_data_file()
    try:
        with EVENTS_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except json.JSONDecodeError:
        data = []

    return data


def save_contents():
    """Persist current session contents to the local JSON store."""
    ensure_data_file()
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(
            st.session_state.contents,
            file,
            ensure_ascii=False,
            indent=2,
        )


def save_events():
    """Persist current session events to the local JSON store."""
    ensure_data_file()
    with EVENTS_FILE.open("w", encoding="utf-8") as file:
        json.dump(
            st.session_state.events,
            file,
            ensure_ascii=False,
            indent=2,
        )


def init_state():
    """Initialize all Streamlit session state used by this demo."""
    if "contents" not in st.session_state:
        st.session_state.contents = load_contents()
        save_contents()
    else:
        for content in st.session_state.contents:
            ensure_ai_fields(content)

    if "events" not in st.session_state:
        st.session_state.events = load_events()

    if "current_page" not in st.session_state:
        st.session_state.current_page = st.session_state.get("page", "首页")
    if (
        st.session_state.current_page not in PAGES
        and st.session_state.current_page != DETAIL_PAGE
    ):
        st.session_state.current_page = "首页"

    if "selected_content_id" not in st.session_state:
        st.session_state.selected_content_id = None

    if "previous_page" not in st.session_state:
        st.session_state.previous_page = "发现"

    if "last_sidebar_nav" not in st.session_state:
        if st.session_state.current_page in PAGES:
            st.session_state.last_sidebar_nav = st.session_state.current_page
        elif st.session_state.previous_page in PAGES:
            st.session_state.last_sidebar_nav = st.session_state.previous_page
        else:
            st.session_state.last_sidebar_nav = "首页"

    if "viewed_content_ids" not in st.session_state:
        st.session_state.viewed_content_ids = set()


def get_content(content_id):
    """Find a content item in session state by id."""
    for content in st.session_state.contents:
        if content["id"] == content_id:
            return content
    return None


def ensure_ai_fields(content):
    """Backfill new AI analysis fields for old content items."""
    old_analysis = content.get("ai_analysis", {})
    summary = content.get("ai_summary") or old_analysis.get(
        "summary",
        DEFAULT_AI_SUMMARY,
    )
    tags = content.get("ai_tags") or old_analysis.get("tags", [])

    content["ai_summary"] = summary
    content["ai_tags"] = tags
    content.setdefault("ai_recommended_scenarios", [])
    content.setdefault("ai_citation_suitability", "Low")
    content.setdefault("ai_value_score", 0)
    content.setdefault("ai_reason", DEFAULT_AI_REASON)
    content.setdefault("ai_recommendations", 0)
    content.setdefault("ai_decision", {})
    content.setdefault("allow_ai_view", True)
    content.setdefault("allow_ai_save", True)
    content.setdefault("allow_ai_cite", True)
    content.setdefault("allow_ai_recommend", True)
    content["ai_analysis"] = {
        "summary": content["ai_summary"],
        "tags": content["ai_tags"],
    }


def add_metric(content_id, metric_name, amount=1):
    """Update a metric in session state, then sync to JSON."""
    content = get_content(content_id)
    if content is None:
        return False

    content["metrics"][metric_name] += amount
    save_contents()
    return True


def record_event(content_id, event_type, actor_type, extra_fields=None):
    """Append a human or AI behavior event, then sync to JSON."""
    event = {
        "event_id": str(uuid4()),
        "content_id": content_id,
        "event_type": event_type,
        "actor_type": actor_type,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    if extra_fields:
        event.update(extra_fields)
    st.session_state.events.append(event)
    save_events()


def record_blocked_ai_action(content_id, blocked_action):
    """Record an AI action blocked by content permission settings."""
    record_event(
        content_id,
        "ai_action_blocked",
        "ai",
        {
            "blocked_action": blocked_action,
            "reason": "permission_denied",
        },
    )


def record_human_view_once(content_id):
    """Count one human view per content item in the current session."""
    if content_id in st.session_state.viewed_content_ids:
        return

    if add_metric(content_id, "human_views"):
        record_event(content_id, "human_view", "human")
        st.session_state.viewed_content_ids.add(content_id)


def update_ai_analysis(content, analysis):
    """Write AI analysis fields and keep old ai_analysis shape compatible."""
    content["ai_summary"] = analysis["ai_summary"]
    content["ai_tags"] = analysis["ai_tags"]
    content["ai_recommended_scenarios"] = analysis[
        "ai_recommended_scenarios"
    ]
    content["ai_citation_suitability"] = analysis[
        "ai_citation_suitability"
    ]
    content["ai_value_score"] = analysis["ai_value_score"]
    content["ai_reason"] = analysis["ai_reason"]
    content["ai_analysis"] = {
        "summary": analysis["ai_summary"],
        "tags": analysis["ai_tags"],
    }


def content_has_ai_analysis(content):
    """Return whether a content item already has generated AI analysis."""
    return (
        content.get("ai_summary") != DEFAULT_AI_SUMMARY
        and bool(content.get("ai_tags"))
        and bool(content.get("ai_recommended_scenarios"))
        and content.get("ai_reason") != DEFAULT_AI_REASON
    )


def auto_evaluate_content(content):
    """Make a local-rule AI decision and apply resulting AI actions."""
    if not content.get("allow_ai_view", True):
        record_blocked_ai_action(content["id"], "view")
        return None

    if not content_has_ai_analysis(content):
        update_ai_analysis(content, mock_ai_analysis(content))

    body_length = len(content.get("body", ""))
    value_score = content.get("ai_value_score", 0)
    suitability = content.get("ai_citation_suitability", "Low")

    should_save = value_score >= 75
    should_cite = suitability == "High"
    should_recommend = value_score >= 60
    should_reject_citation = body_length < 40 or suitability == "Low"
    should_read = True

    confidence_score = min(
        0.95,
        max(0.35, round(value_score / 100 + body_length / 1000, 2)),
    )
    blocked_notes = []
    if should_save and not content.get("allow_ai_save", True):
        blocked_notes.append("收藏被权限设置阻止")
    if should_cite and not content.get("allow_ai_cite", True):
        blocked_notes.append("引用被权限设置阻止")
    if should_recommend and not content.get("allow_ai_recommend", True):
        blocked_notes.append("推荐被权限设置阻止")

    decision_reason = (
        f"AI 评估正文长度为 {body_length} 字，价值分为 {value_score}，"
        f"引用适配度为 {suitability}。因此决定"
        f"{'收藏' if should_save else '不收藏'}、"
        f"{'引用' if should_cite else '不引用'}、"
        f"{'推荐' if should_recommend else '不推荐'}。"
    )
    if blocked_notes:
        decision_reason += " " + "；".join(blocked_notes) + "。"

    decision = {
        "should_read": should_read,
        "should_save": should_save,
        "should_cite": should_cite,
        "should_recommend": should_recommend,
        "should_reject_citation": should_reject_citation,
        "decision_reason": decision_reason,
        "confidence_score": confidence_score,
    }

    content_id = content["id"]
    if add_metric(content_id, "ai_views"):
        record_event(content_id, "ai_view", "ai")

    if should_save:
        if content.get("allow_ai_save", True):
            if add_metric(content_id, "ai_saves"):
                record_event(content_id, "ai_save", "ai")
        else:
            record_blocked_ai_action(content_id, "save")

    if should_cite:
        if content.get("allow_ai_cite", True):
            if add_metric(content_id, "ai_citations"):
                record_event(content_id, "ai_citation", "ai")
        else:
            record_blocked_ai_action(content_id, "cite")

    if should_recommend:
        if content.get("allow_ai_recommend", True):
            content["ai_recommendations"] = (
                content.get("ai_recommendations", 0) + 1
            )
            record_event(content_id, "ai_recommendation", "ai")
        else:
            record_blocked_ai_action(content_id, "recommend")

    if should_reject_citation:
        record_event(content_id, "ai_reject_citation", "ai")

    content["ai_decision"] = decision
    save_contents()
    return decision


def create_content(title, body, tags, ai_permissions):
    """Create a new text-and-image-style content item."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    content = {
        "id": str(uuid4()),
        "title": title,
        "body": body,
        "tags": tags,
        "created_at": now,
        "metrics": {
            "human_views": 0,
            "human_likes": 0,
            "human_saves": 0,
            "ai_views": 0,
            "ai_saves": 0,
            "ai_citations": 0,
        },
        "ai_analysis": {
            "summary": DEFAULT_AI_SUMMARY,
            "tags": [],
        },
        "ai_summary": DEFAULT_AI_SUMMARY,
        "ai_tags": [],
        "ai_recommended_scenarios": [],
        "ai_citation_suitability": "Low",
        "ai_value_score": 0,
        "ai_reason": DEFAULT_AI_REASON,
        "ai_recommendations": 0,
        "ai_decision": {},
        "allow_ai_view": ai_permissions["allow_ai_view"],
        "allow_ai_save": ai_permissions["allow_ai_save"],
        "allow_ai_cite": ai_permissions["allow_ai_cite"],
        "allow_ai_recommend": ai_permissions["allow_ai_recommend"],
    }
    st.session_state.contents.insert(0, content)
    st.session_state.selected_content_id = content["id"]
    save_contents()


def mock_ai_analysis(content):
    """Generate local-rule AI analysis for one content item."""
    title = content.get("title", "")
    body = content.get("body", "")
    original_tags = content.get("tags", [])
    text = f"{title} {body}"
    text_length = len(body)

    keyword_tags = {
        "AI": "AI阅读",
        "平台": "内容平台",
        "数据": "数据分析",
        "引用": "知识引用",
        "知识": "知识管理",
        "研究": "研究引用",
        "视频": "视频内容",
        "图文": "图文内容",
        "用户": "用户行为",
        "推荐": "推荐系统",
    }
    generated_tags = [
        tag for keyword, tag in keyword_tags.items() if keyword in text
    ]
    focus_tags = [
        "AI阅读",
        "内容平台",
        "知识引用",
        "观点讨论",
        "图文内容",
        "双轨数据",
    ]
    ai_tags = list(
        dict.fromkeys(
            original_tags + generated_tags + random.sample(focus_tags, 3)
        )
    )[:6]

    scenarios = []
    if any(keyword in text for keyword in ["知识", "解释", "理解", "总结"]):
        scenarios.append("知识解释")
    if any(keyword in text for keyword in ["产品", "平台", "功能", "用户"]):
        scenarios.append("产品介绍")
    if any(keyword in text for keyword in ["研究", "数据", "引用", "文档"]):
        scenarios.append("研究引用")
    if any(keyword in text for keyword in ["观点", "讨论", "机制", "价值"]):
        scenarios.append("观点讨论")
    if any(keyword in text for keyword in ["推荐", "发现", "传播"]):
        scenarios.append("内容推荐")

    for scenario in ["知识解释", "产品介绍", "观点讨论", "内容推荐"]:
        if len(scenarios) >= 2:
            break
        if scenario not in scenarios:
            scenarios.append(scenario)
    scenarios = scenarios[:4]

    score = 35
    score += min(text_length // 12, 30)
    score += min(len(original_tags) * 5, 15)
    score += min(len(generated_tags) * 4, 20)
    ai_value_score = max(0, min(score, 100))

    citation_keywords = ["平台", "AI", "数据", "引用", "知识", "研究"]
    citation_hits = sum(1 for keyword in citation_keywords if keyword in text)
    if text_length < 40:
        citation_suitability = "Low"
    elif citation_hits >= 3 and text_length >= 80:
        citation_suitability = "High"
    elif citation_hits >= 1:
        citation_suitability = "Medium"
    else:
        citation_suitability = "Low"

    if text_length < 80:
        summary = (
            f"这条内容围绕“{title}”展开，信息量较轻，适合快速了解主题。"
        )
    else:
        summary = (
            f"这条内容围绕“{title}”展开，说明了相关概念、场景或机制。"
            "AI 判断它适合用于内容理解、资料整理和后续讨论。"
        )

    reason_parts = [
        f"正文长度为 {text_length} 字",
        f"原始标签数为 {len(original_tags)} 个",
        f"命中 {citation_hits} 个引用相关关键词",
    ]
    ai_reason = (
        "AI 根据"
        + "、".join(reason_parts)
        + f"，给出 {ai_value_score} 分，并判断引用适配度为 "
        + citation_suitability
        + "。"
    )

    return {
        "ai_summary": summary,
        "ai_tags": ai_tags,
        "ai_recommended_scenarios": scenarios,
        "ai_citation_suitability": citation_suitability,
        "ai_value_score": ai_value_score,
        "ai_reason": ai_reason,
    }


def build_ai_readable_content(content):
    """Build an AI-readable JSON object for one content item."""
    metrics = content["metrics"]
    return {
        "content_id": content["id"],
        "title": content["title"],
        "body": content["body"],
        "original_tags": content.get("tags", []),
        "ai_summary": content.get("ai_summary", DEFAULT_AI_SUMMARY),
        "ai_tags": content.get("ai_tags", []),
        "ai_recommended_scenarios": content.get("ai_recommended_scenarios", []),
        "ai_citation_suitability": content.get("ai_citation_suitability", "Low"),
        "ai_value_score": content.get("ai_value_score", 0),
        "ai_reason": content.get("ai_reason", DEFAULT_AI_REASON),
        "ai_decision": content.get("ai_decision", {}),
        "allow_ai_view": content.get("allow_ai_view", True),
        "allow_ai_save": content.get("allow_ai_save", True),
        "allow_ai_cite": content.get("allow_ai_cite", True),
        "allow_ai_recommend": content.get("allow_ai_recommend", True),
        "human_metrics": {
            "human_views": metrics["human_views"],
            "human_likes": metrics["human_likes"],
            "human_saves": metrics["human_saves"],
        },
        "ai_metrics": {
            "ai_views": metrics["ai_views"],
            "ai_saves": metrics["ai_saves"],
            "ai_citations": metrics["ai_citations"],
            "ai_recommendations": content.get("ai_recommendations", 0),
        },
        "usage_policy": {
            "can_ai_view": content.get("allow_ai_view", True),
            "can_ai_save": content.get("allow_ai_save", True),
            "can_ai_cite": content.get("allow_ai_cite", True),
            "can_ai_recommend": content.get("allow_ai_recommend", True),
        },
    }


def generate_ai_exports():
    """Generate per-content JSON files and index.json for AI-accessible content."""
    AI_EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

    for old_file in AI_EXPORTS_DIR.glob("*.json"):
        old_file.unlink()

    allowed_contents = [
        c for c in st.session_state.contents if c.get("allow_ai_view", True)
    ]

    for content in allowed_contents:
        export_path = AI_EXPORTS_DIR / f"{content['id']}.json"
        payload = build_ai_readable_content(content)
        export_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    index_entries = []
    for content in allowed_contents:
        index_entries.append({
            "content_id": content["id"],
            "title": content["title"],
            "ai_summary": content.get("ai_summary", DEFAULT_AI_SUMMARY),
            "ai_tags": content.get("ai_tags", []),
            "ai_value_score": content.get("ai_value_score", 0),
            "ai_citation_suitability": content.get("ai_citation_suitability", "Low"),
            "allow_ai_cite": content.get("allow_ai_cite", True),
            "allow_ai_recommend": content.get("allow_ai_recommend", True),
            "export_file": f"{content['id']}.json",
        })

    AI_EXPORT_INDEX_FILE.write_text(
        json.dumps(index_entries, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    generate_llms_txt(allowed_contents)

    return len(allowed_contents)


def generate_llms_txt(exported_contents):
    """Generate llms.txt describing CoView's AI-readable content ecosystem."""
    lines = []
    lines.append("# CoView 共览 — AI 可读内容索引")
    lines.append("")
    lines.append("## CoView 是什么")
    lines.append("")
    lines.append(
        "CoView 是一个人类与 AI 共同浏览的内容平台。"
        "平台同时记录人类用户与 AI Agent 对内容的浏览、收藏、引用等行为，"
        "形成双轨数据统计。"
    )
    lines.append("")
    lines.append("## Human Metrics 与 AI Metrics")
    lines.append("")
    lines.append(
        "- Human Metrics：记录人类用户的浏览（human_views）、点赞（human_likes）、"
        "收藏（human_saves）行为。"
    )
    lines.append(
        "- AI Metrics：记录 AI Agent 的浏览（ai_views）、收藏（ai_saves）、"
        "引用（ai_citations）、推荐（ai_recommendations）行为。"
    )
    lines.append("- 两类指标独立统计，互不影响。")
    lines.append("")
    lines.append("## AI 可执行的行为")
    lines.append("")
    lines.append("- AI View：AI Agent 浏览内容并获取 AI Analysis 结果。")
    lines.append("- AI Save：AI Agent 将内容标记为有价值并收藏。")
    lines.append("- AI Cite：AI Agent 在生成回答时引用该内容。")
    lines.append("- AI Recommend：AI Agent 将内容推荐给其他 Agent 或人类用户。")
    lines.append(
        "- AI Auto Evaluate：AI Agent 自动评估内容价值，生成 AI Decision。"
    )
    lines.append("")
    lines.append("## AI 内容权限规则")
    lines.append("")
    lines.append("每条内容由创作者设置了以下 AI 权限：")
    lines.append("- `allow_ai_view`：是否允许 AI 浏览。")
    lines.append("- `allow_ai_save`：是否允许 AI 收藏。")
    lines.append("- `allow_ai_cite`：是否允许 AI 引用。")
    lines.append("- `allow_ai_recommend`：是否允许 AI 推荐。")
    lines.append("")
    lines.append(
        "AI Agent 在访问内容前必须检查对应的权限字段。"
        "当 `allow_ai_view` 为 false 时，该内容不会出现在任何导出文件中。"
        "被权限阻止的 AI 操作会记录为 `ai_action_blocked` 事件。"
    )
    lines.append("")
    lines.append("## 可用的 AI 可读文件")
    lines.append("")
    lines.append("### index.json")
    lines.append("")
    lines.append(
        "路径：`data/ai_exports/index.json`。"
        "包含所有允许 AI 浏览的内容的索引列表。"
        "每条记录包含 content_id、title、ai_summary、ai_tags、"
        "ai_value_score、ai_citation_suitability、权限信息和对应 JSON 文件名。"
    )
    lines.append("")
    lines.append("### 单条内容 JSON")
    lines.append("")
    lines.append(
        "路径：`data/ai_exports/{content_id}.json`。"
        "每条允许 AI 浏览的内容对应一个 JSON 文件，包含完整的内容正文、"
        "AI 分析结果、Human Metrics、AI Metrics 和 usage_policy。"
    )
    lines.append("")
    lines.append("## 内容引用规则")
    lines.append("")
    lines.append(
        "- 引用内容时必须标注 content_id 和 title。"
    )
    lines.append(
        "- `ai_citation_suitability` 为 High 的内容更适合被 AI 引用。"
    )
    lines.append(
        "- `ai_citation_suitability` 为 Low 的内容不建议作为权威来源引用。"
    )
    lines.append(
        "- 引用前应检查 `allow_ai_cite` 权限。"
    )
    lines.append("")
    lines.append(
        f"本文件由 CoView 自动生成，共包含 {len(exported_contents)} 条可导出的内容。"
    )

    AI_EXPORT_LLMS_FILE.write_text(
        "\n".join(lines),
        encoding="utf-8",
    )


def open_detail(content_id):
    """Navigate to the selected content detail page."""
    if st.session_state.current_page in PAGES:
        st.session_state.previous_page = st.session_state.current_page
    else:
        st.session_state.previous_page = "发现"

    st.session_state.selected_content_id = content_id
    st.session_state.current_page = DETAIL_PAGE
    st.rerun()


def return_from_detail(default_page="发现"):
    """Return from detail page to the recorded source page."""
    previous_page = st.session_state.get("previous_page", default_page)
    if previous_page not in PAGES:
        previous_page = default_page

    st.session_state.current_page = previous_page
    st.rerun()


def render_sidebar():
    """Render sidebar navigation."""
    st.sidebar.title("CoView 共览")
    if st.session_state.current_page in PAGES:
        selected_index = PAGES.index(st.session_state.current_page)
    elif st.session_state.previous_page in PAGES:
        selected_index = PAGES.index(st.session_state.previous_page)
    else:
        selected_index = PAGES.index("首页")

    selected_page = st.sidebar.radio(
        "页面导航",
        PAGES,
        index=selected_index,
        key="sidebar_nav",
    )

    sidebar_page_changed = (
        selected_page != st.session_state.last_sidebar_nav
    )
    if sidebar_page_changed:
        st.session_state.current_page = selected_page
        st.session_state.last_sidebar_nav = selected_page
        st.rerun()

    st.sidebar.divider()
    if st.session_state.current_page == DETAIL_PAGE:
        st.sidebar.caption("当前正在查看内容详情。")
    st.sidebar.caption("MVP: Human Views + AI Views 双轨统计")


def render_home():
    st.title("CoView 共览")
    st.subheader("人类与 AI 共同浏览的内容平台")
    st.write(
        "CoView 的第一版 Demo 聚焦图文内容，验证同一条内容被人类和 AI "
        "分别浏览、收藏与引用时，平台如何记录双轨数据。"
    )

    col_a, col_b, col_c = st.columns(3)
    col_a.metric("内容数", len(st.session_state.contents))
    col_b.metric(
        "Human Views",
        sum(item["metrics"]["human_views"] for item in st.session_state.contents),
    )
    col_c.metric(
        "AI Views",
        sum(item["metrics"]["ai_views"] for item in st.session_state.contents),
    )

    st.info("从侧边栏进入“发现”浏览内容，或进入“上传”发布一条新的图文。")


def render_discover():
    st.title("发现")

    if not st.session_state.contents:
        st.warning("还没有内容。请先到“上传”页发布第一条图文。")
        return

    st.markdown("### 搜索与筛选")

    search_query = st.text_input(
        "搜索",
        placeholder="搜索标题、正文或标签",
        key="discover_search",
    )

    filter_col_a, filter_col_b, filter_col_c = st.columns(3)
    with filter_col_a:
        citation_filter = st.selectbox(
            "Citation Suitability",
            ["全部", "High", "Medium", "Low"],
            key="discover_citation",
        )
    with filter_col_b:
        permission_filter = st.selectbox(
            "AI 权限",
            ["全部", "允许 AI 浏览", "禁止 AI 浏览", "允许 AI 引用", "禁止 AI 引用"],
            key="discover_permission",
        )
    with filter_col_c:
        min_ai_score = st.slider(
            "最低 AI Value Score",
            0, 100, 0,
            key="discover_min_score",
        )

    sort_col, _ = st.columns([1, 2])
    with sort_col:
        sort_option = st.selectbox(
            "排序方式",
            ["最新发布", "Human Views 最高", "AI Views 最高", "AI Citations 最高", "AI Value Score 最高"],
            key="discover_sort",
        )

    st.divider()

    filtered = []
    for content in st.session_state.contents:
        if search_query:
            search_text = " ".join([
                content.get("title", ""),
                content.get("body", ""),
                ", ".join(content.get("tags", [])),
                ", ".join(content.get("ai_tags", [])),
                content.get("ai_summary", ""),
            ]).lower()
            if search_query.lower() not in search_text:
                continue

        if citation_filter != "全部":
            if content.get("ai_citation_suitability", "Low") != citation_filter:
                continue

        if permission_filter == "允许 AI 浏览":
            if not content.get("allow_ai_view", True):
                continue
        elif permission_filter == "禁止 AI 浏览":
            if content.get("allow_ai_view", True):
                continue
        elif permission_filter == "允许 AI 引用":
            if not content.get("allow_ai_cite", True):
                continue
        elif permission_filter == "禁止 AI 引用":
            if content.get("allow_ai_cite", True):
                continue

        if content.get("ai_value_score", 0) < min_ai_score:
            continue

        filtered.append(content)

    if sort_option == "最新发布":
        filtered.sort(key=lambda c: c.get("created_at", ""), reverse=True)
    elif sort_option == "Human Views 最高":
        filtered.sort(key=lambda c: c["metrics"]["human_views"], reverse=True)
    elif sort_option == "AI Views 最高":
        filtered.sort(key=lambda c: c["metrics"]["ai_views"], reverse=True)
    elif sort_option == "AI Citations 最高":
        filtered.sort(key=lambda c: c["metrics"]["ai_citations"], reverse=True)
    elif sort_option == "AI Value Score 最高":
        filtered.sort(key=lambda c: c.get("ai_value_score", 0), reverse=True)

    if not filtered:
        st.info("没有找到符合条件的内容。")
        return

    st.caption(f"共 {len(filtered)} 条内容")

    for content in filtered:
        metrics = content["metrics"]
        with st.container(border=True):
            st.subheader(content["title"])
            st.caption(
                f"发布于 {content['created_at']} · 标签："
                f"{', '.join(content['tags']) or '无'}"
            )
            preview = content["body"][:160]
            if len(content["body"]) > 160:
                preview += "..."
            st.write(preview)

            col_a, col_b, col_c, col_d, col_e = st.columns([1, 1, 1, 1, 1])
            col_a.metric("Human Views", metrics["human_views"])
            col_b.metric("AI Views", metrics["ai_views"])
            col_c.metric("AI Value Score", content.get("ai_value_score", 0))
            col_d.metric(
                "Citation",
                content.get("ai_citation_suitability", "Low"),
            )
            if col_e.button("进入详情", key=f"detail_{content['id']}"):
                open_detail(content["id"])


def render_upload():
    st.title("上传")

    with st.form("upload_form", clear_on_submit=True):
        title = st.text_input("标题")
        body = st.text_area("正文", height=180)
        tags_text = st.text_input(
            "标签，用英文逗号分隔",
            placeholder="AI, 内容平台, 共创",
        )
        st.markdown("#### AI 使用权限")
        allow_ai_view = st.checkbox("允许 AI 浏览", value=True)
        allow_ai_save = st.checkbox("允许 AI 收藏", value=True)
        allow_ai_cite = st.checkbox("允许 AI 引用", value=True)
        allow_ai_recommend = st.checkbox("允许 AI 推荐", value=True)
        submitted = st.form_submit_button("发布")

    if submitted:
        tags = [
            tag.strip()
            for tag in tags_text.split(",")
            if tag.strip()
        ]

        if not title.strip() or not body.strip():
            st.error("标题和正文不能为空。")
            return

        ai_permissions = {
            "allow_ai_view": allow_ai_view,
            "allow_ai_save": allow_ai_save,
            "allow_ai_cite": allow_ai_cite,
            "allow_ai_recommend": allow_ai_recommend,
        }
        create_content(title.strip(), body.strip(), tags, ai_permissions)
        st.success("发布成功，已保存到 data/contents.json。")
        st.session_state.previous_page = "上传"
        st.session_state.current_page = DETAIL_PAGE
        st.rerun()


def render_ranking(title, contents, metric_name, key_prefix):
    """Render a top-five ranking list with detail navigation."""
    st.markdown(f"#### {title}")
    ranked_contents = sorted(
        contents,
        key=lambda item: item["metrics"].get(metric_name, 0)
        if metric_name in item["metrics"]
        else item.get(metric_name, 0),
        reverse=True,
    )[:5]

    if not ranked_contents:
        st.caption("暂无内容。")
        return

    for index, content in enumerate(ranked_contents, start=1):
        metric_value = (
            content["metrics"].get(metric_name, 0)
            if metric_name in content["metrics"]
            else content.get(metric_name, 0)
        )
        cols = st.columns([0.5, 3, 1, 1])
        cols[0].write(f"{index}")
        cols[1].write(content["title"])
        cols[2].metric("数值", metric_value)
        if cols[3].button(
            "进入详情",
            key=f"{key_prefix}_{content['id']}",
        ):
            open_detail(content["id"])


def render_content_type_groups(contents):
    """Classify content by human and AI view levels."""
    st.subheader("Human vs AI 内容类型判断")
    if not contents:
        st.caption("暂无内容。")
        return

    avg_human_views = (
        sum(item["metrics"]["human_views"] for item in contents) / len(contents)
    )
    avg_ai_views = (
        sum(item["metrics"]["ai_views"] for item in contents) / len(contents)
    )
    groups = {
        "双高内容": [],
        "人类热门内容": [],
        "AI 价值内容": [],
        "低活跃内容": [],
    }

    for content in contents:
        metrics = content["metrics"]
        human_high = metrics["human_views"] >= avg_human_views
        ai_high = metrics["ai_views"] >= avg_ai_views

        if human_high and ai_high:
            groups["双高内容"].append(content)
        elif human_high:
            groups["人类热门内容"].append(content)
        elif ai_high:
            groups["AI 价值内容"].append(content)
        else:
            groups["低活跃内容"].append(content)

    st.caption(
        f"当前平均 Human Views: {avg_human_views:.1f}；"
        f"平均 AI Views: {avg_ai_views:.1f}"
    )

    cols = st.columns(2)
    for index, (group_name, group_contents) in enumerate(groups.items()):
        with cols[index % 2]:
            st.markdown(f"#### {group_name}")
            if not group_contents:
                st.caption("暂无内容。")
                continue

            for content in group_contents:
                metrics = content["metrics"]
                st.write(
                    f"{content['title']}｜"
                    f"Human {metrics['human_views']}｜"
                    f"AI {metrics['ai_views']}"
                )


def render_dashboard():
    """Render the overall CoView data dashboard."""
    contents = st.session_state.contents
    events = st.session_state.events

    st.title("数据看板")
    st.write(
        "CoView 不只统计人类浏览，也记录 AI Agent 的浏览、收藏、引用和"
        "价值判断。数据看板用于展示内容在人类受众和 AI 受众之间的不同"
        "传播价值。"
    )

    total_human_views = sum(
        item["metrics"]["human_views"] for item in contents
    )
    total_ai_views = sum(item["metrics"]["ai_views"] for item in contents)
    total_ai_saves = sum(item["metrics"]["ai_saves"] for item in contents)
    total_ai_citations = sum(
        item["metrics"]["ai_citations"] for item in contents
    )

    metric_cols = st.columns(3)
    metric_cols[0].metric("Total Contents", len(contents))
    metric_cols[1].metric("Total Human Views", total_human_views)
    metric_cols[2].metric("Total AI Views", total_ai_views)

    metric_cols = st.columns(3)
    metric_cols[0].metric("Total AI Saves", total_ai_saves)
    metric_cols[1].metric("Total AI Citations", total_ai_citations)
    metric_cols[2].metric("Total Events", len(events))

    st.divider()
    st.subheader("排行榜")
    rank_col_a, rank_col_b = st.columns(2)
    with rank_col_a:
        render_ranking(
            "Human 热度榜",
            contents,
            "human_views",
            "dashboard_human_rank",
        )
        render_ranking(
            "AI 引用榜",
            contents,
            "ai_citations",
            "dashboard_ai_cite_rank",
        )
    with rank_col_b:
        render_ranking(
            "AI 浏览榜",
            contents,
            "ai_views",
            "dashboard_ai_view_rank",
        )
        render_ranking(
            "AI 价值榜",
            contents,
            "ai_value_score",
            "dashboard_ai_value_rank",
        )

    st.divider()
    render_content_type_groups(contents)
    st.divider()
    st.subheader("AI Permission Overview")
    permission_cols = st.columns(4)
    permission_cols[0].metric(
        "允许 AI 浏览",
        sum(1 for item in contents if item.get("allow_ai_view", True)),
    )
    permission_cols[1].metric(
        "允许 AI 引用",
        sum(1 for item in contents if item.get("allow_ai_cite", True)),
    )
    permission_cols[2].metric(
        "禁止 AI 引用",
        sum(1 for item in contents if not item.get("allow_ai_cite", True)),
    )
    permission_cols[3].metric(
        "禁止 AI 推荐",
        sum(
            1
            for item in contents
            if not item.get("allow_ai_recommend", True)
        ),
    )


def build_ai_response_preview(content):
    """Build JSON-style data an AI agent can read from CoView."""
    return {
        "content_id": content.get("id"),
        "title": content.get("title"),
        "summary": content.get("ai_summary", DEFAULT_AI_SUMMARY),
        "tags": content.get("ai_tags", []),
        "citation_suitability": content.get(
            "ai_citation_suitability",
            "Low",
        ),
        "value_score": content.get("ai_value_score", 0),
        "recommended_scenarios": content.get(
            "ai_recommended_scenarios",
            [],
        ),
        "recommendations": content.get("ai_recommendations", 0),
    }


def render_ai_agent_portal():
    """Render a dedicated local AI Agent access portal."""
    contents = st.session_state.contents

    st.title("AI Agent 入口")
    st.write(
        "这里模拟 AI Agent 通过专门入口浏览、保存和引用 CoView 内容。"
        "AI 行为会与人类行为分开统计。"
    )

    if not contents:
        st.warning("还没有内容。请先到“上传”页发布一条图文。")
        return

    content_options = {content["title"]: content["id"] for content in contents}
    selected_title = st.selectbox(
        "选择内容",
        list(content_options.keys()),
        key="ai_agent_selected_title",
    )
    content = get_content(content_options[selected_title])
    if content is None:
        st.warning("当前选择的内容不存在。")
        return

    ensure_ai_fields(content)

    st.subheader("AI 可读版本")
    ai_readable_payload = {
        "content_id": content.get("id"),
        "title": content.get("title", ""),
        "description/body": content.get("body", ""),
        "original_tags": content.get("tags", []),
        "ai_summary": content.get("ai_summary", DEFAULT_AI_SUMMARY),
        "ai_tags": content.get("ai_tags", []),
        "ai_recommended_scenarios": content.get(
            "ai_recommended_scenarios",
            [],
        ),
        "ai_citation_suitability": content.get(
            "ai_citation_suitability",
            "Low",
        ),
        "ai_value_score": content.get("ai_value_score", 0),
        "ai_reason": content.get("ai_reason", DEFAULT_AI_REASON),
        "ai_recommendations": content.get("ai_recommendations", 0),
        "ai_decision": content.get("ai_decision", {}),
        "allow_ai_view": content.get("allow_ai_view", True),
        "allow_ai_save": content.get("allow_ai_save", True),
        "allow_ai_cite": content.get("allow_ai_cite", True),
        "allow_ai_recommend": content.get("allow_ai_recommend", True),
    }
    st.json(ai_readable_payload)

    action_cols = st.columns(4)
    if action_cols[0].button(
        "AI Read Content",
        key=f"agent_read_{content['id']}",
    ):
        if not content.get("allow_ai_view", True):
            record_blocked_ai_action(content["id"], "view")
            st.warning("该内容不允许 AI 浏览")
        elif add_metric(content["id"], "ai_views"):
            record_event(content["id"], "ai_view", "ai")
            if not content_has_ai_analysis(content):
                update_ai_analysis(content, mock_ai_analysis(content))
                save_contents()
            st.rerun()

    if action_cols[1].button(
        "AI Save Content",
        key=f"agent_save_{content['id']}",
    ):
        if not content.get("allow_ai_save", True):
            record_blocked_ai_action(content["id"], "save")
            st.warning("该内容不允许 AI 收藏")
        elif add_metric(content["id"], "ai_saves"):
            record_event(content["id"], "ai_save", "ai")
            st.rerun()

    if action_cols[2].button(
        "AI Cite Content",
        key=f"agent_cite_{content['id']}",
    ):
        if not content.get("allow_ai_cite", True):
            record_blocked_ai_action(content["id"], "cite")
            st.warning("该内容不允许 AI 引用")
        elif add_metric(content["id"], "ai_citations"):
            record_event(content["id"], "ai_citation", "ai")
            st.rerun()

    if action_cols[3].button(
        "AI Auto Evaluate",
        key=f"agent_auto_{content['id']}",
    ):
        if not content.get("allow_ai_view", True):
            record_blocked_ai_action(content["id"], "view")
            st.warning("该内容不允许 AI 浏览")
        else:
            auto_evaluate_content(content)
            st.rerun()

    st.subheader("AI Decision Result")
    decision = content.get("ai_decision", {})
    if decision:
        decision_cols = st.columns(5)
        decision_cols[0].metric("是否收藏", str(decision["should_save"]))
        decision_cols[1].metric("是否引用", str(decision["should_cite"]))
        decision_cols[2].metric(
            "是否推荐",
            str(decision["should_recommend"]),
        )
        decision_cols[3].metric(
            "是否拒绝引用",
            str(decision["should_reject_citation"]),
        )
        decision_cols[4].metric(
            "Confidence Score",
            decision["confidence_score"],
        )
        st.write(f"**Decision Reason:** {decision['decision_reason']}")
    else:
        st.caption("暂无 AI Decision。点击 AI Auto Evaluate 生成。")

    st.subheader("AI Response Preview")
    st.json(build_ai_response_preview(content))


def render_ai_exports():
    """Render the AI-readable export management page."""
    st.title("AI 可读导出")
    st.write(
        "该页面用于生成面向 AI Agent 的结构化内容文件。"
        "导出的文件包括每条内容的独立 JSON、内容索引 index.json 和 "
        "AI 可读说明 llms.txt。"
    )

    contents = st.session_state.contents
    allowed_contents = [
        c for c in contents if c.get("allow_ai_view", True)
    ]
    excluded_count = len(contents) - len(allowed_contents)

    col_a, col_b = st.columns(2)
    col_a.metric("允许 AI 浏览的内容数量", len(allowed_contents))
    col_b.metric("禁止 AI 浏览的内容数量", excluded_count)

    existing_json_count = 0
    index_exists = AI_EXPORT_INDEX_FILE.exists()
    llms_exists = AI_EXPORT_LLMS_FILE.exists()

    if AI_EXPORTS_DIR.exists():
        existing_json_count = len([
            p for p in AI_EXPORTS_DIR.glob("*.json")
            if p.name != "index.json"
        ])

    status_cols = st.columns(3)
    status_cols[0].metric("已生成内容 JSON 文件", existing_json_count)
    status_cols[1].metric("index.json", "存在" if index_exists else "不存在")
    status_cols[2].metric("llms.txt", "存在" if llms_exists else "不存在")

    if st.button("重新生成 AI 可读导出文件", type="primary"):
        count = generate_ai_exports()
        st.success(f"导出完成！共生成 {count} 个内容 JSON 文件。")
        st.info(f"index.json → {AI_EXPORT_INDEX_FILE}")
        st.info(f"llms.txt → {AI_EXPORT_LLMS_FILE}")
        st.rerun()

    st.divider()
    st.subheader("预览")

    preview_tab_a, preview_tab_b = st.tabs(["index.json", "llms.txt"])

    with preview_tab_a:
        if index_exists:
            try:
                index_data = json.loads(
                    AI_EXPORT_INDEX_FILE.read_text(encoding="utf-8")
                )
                st.caption(f"共 {len(index_data)} 条索引记录，以下展示前 5 条：")
                st.json(index_data[:5])
            except (json.JSONDecodeError, FileNotFoundError):
                st.caption("index.json 解析失败，请重新生成。")
        else:
            st.caption("index.json 尚未生成。请点击上方按钮生成。")

    with preview_tab_b:
        if llms_exists:
            try:
                llms_text = AI_EXPORT_LLMS_FILE.read_text(encoding="utf-8")
                preview_lines = llms_text.split("\n")[:40]
                st.code("\n".join(preview_lines), language="markdown")
                total_lines = len(llms_text.split("\n"))
                if total_lines > 40:
                    st.caption(f"以上为前 40 行，共 {total_lines} 行。")
            except FileNotFoundError:
                st.caption("llms.txt 读取失败，请重新生成。")
        else:
            st.caption("llms.txt 尚未生成。请点击上方按钮生成。")


def render_event_log():
    """Render the event log viewer for human and AI behavior tracking."""
    st.title("事件日志")
    st.write(
        "该页面展示 CoView 中所有人类行为和 AI 行为的完整日志。"
        "通过筛选和排序，可以追踪每条内容的双轨数据来源。"
    )

    events = st.session_state.events
    contents = st.session_state.contents

    content_id_to_title = {}
    content_id_to_exists = {}
    for c in contents:
        content_id_to_title[c["id"]] = c["title"]
        content_id_to_exists[c["id"]] = True

    total_events = len(events)
    human_events = sum(1 for e in events if e["actor_type"] == "human")
    ai_events = sum(1 for e in events if e["actor_type"] == "ai")
    blocked_events = sum(1 for e in events if e["event_type"] == "ai_action_blocked")
    citation_events = sum(1 for e in events if e["event_type"] == "ai_citation")
    recommendation_events = sum(
        1 for e in events if e["event_type"] == "ai_recommendation"
    )

    stats_cols = st.columns(6)
    stats_cols[0].metric("Total Events", total_events)
    stats_cols[1].metric("Human Events", human_events)
    stats_cols[2].metric("AI Events", ai_events)
    stats_cols[3].metric("AI Blocked", blocked_events)
    stats_cols[4].metric("AI Citations", citation_events)
    stats_cols[5].metric("AI Recs", recommendation_events)

    st.divider()
    st.subheader("筛选")

    filter_cols = st.columns(4)
    with filter_cols[0]:
        actor_filter = st.selectbox(
            "Actor Type",
            ["全部", "human", "ai"],
            key="event_log_actor",
        )
    with filter_cols[1]:
        event_type_options = [
            "全部",
            "human_view",
            "human_like",
            "human_save",
            "ai_view",
            "ai_save",
            "ai_citation",
            "ai_recommendation",
            "ai_reject_citation",
            "ai_action_blocked",
        ]
        event_type_filter = st.selectbox(
            "Event Type",
            event_type_options,
            key="event_log_type",
        )
    with filter_cols[2]:
        content_ids_in_events = sorted(
            {e["content_id"] for e in events},
            key=lambda cid: content_id_to_title.get(cid, cid),
        )
        content_options = ["全部"] + [
            f"{content_id_to_title.get(cid, '内容已不存在')} ({cid[:8]}...)"
            for cid in content_ids_in_events
        ]
        content_filter = st.selectbox(
            "Content",
            content_options,
            key="event_log_content",
        )
    with filter_cols[3]:
        limit_filter = st.selectbox(
            "显示条数",
            ["最近 10", "最近 20", "最近 50", "全部"],
            key="event_log_limit",
        )

    filtered = list(events)

    if actor_filter != "全部":
        filtered = [e for e in filtered if e["actor_type"] == actor_filter]
    if event_type_filter != "全部":
        filtered = [e for e in filtered if e["event_type"] == event_type_filter]
    if content_filter != "全部":
        selected_cid = content_ids_in_events[content_options.index(content_filter) - 1]
        filtered = [e for e in filtered if e["content_id"] == selected_cid]

    filtered.sort(key=lambda e: e["timestamp"], reverse=True)

    limit_map = {"最近 10": 10, "最近 20": 20, "最近 50": 50, "全部": len(filtered)}
    display_limit = limit_map[limit_filter]
    displayed = filtered[:display_limit]

    st.divider()
    st.subheader(f"事件列表（共 {len(filtered)} 条，显示 {len(displayed)} 条）")

    if not displayed:
        st.info("没有符合条件的事件。")
    else:
        for event in displayed:
            cid = event["content_id"]
            title = content_id_to_title.get(cid)
            exists = content_id_to_exists.get(cid, False)

            actor_icon = "H" if event["actor_type"] == "human" else "AI"
            actor_label = "Human" if event["actor_type"] == "human" else "AI"

            with st.container(border=True):
                header_cols = st.columns([3, 1, 1, 1])
                header_cols[0].write(
                    f"`{event['timestamp']}`  **{actor_label}**  "
                    f"`{event['event_type']}`"
                )
                header_cols[1].caption(f"ID: {cid[:12]}...")
                if exists:
                    header_cols[2].write(f"**{title}**")
                    if header_cols[3].button(
                        "进入详情",
                        key=f"event_detail_{event['event_id']}",
                    ):
                        open_detail(cid)
                else:
                    header_cols[2].caption("内容已不存在")

                extra_fields = {
                    k: v
                    for k, v in event.items()
                    if k not in ("event_id", "content_id", "event_type", "actor_type", "timestamp")
                }
                if extra_fields:
                    with st.expander("查看详情"):
                        st.json(extra_fields)

    st.divider()
    st.subheader("事件类型说明")
    with st.expander("点击展开事件解释"):
        st.markdown(
            """
| 事件类型 | 说明 |
|---------|------|
| `human_view` | 人类进入详情页浏览内容 |
| `human_like` | 人类对内容点赞 |
| `human_save` | 人类收藏该内容 |
| `ai_view` | AI 读取该内容 |
| `ai_save` | AI 判断内容值得保存 |
| `ai_citation` | AI 判断内容适合引用 |
| `ai_recommendation` | AI 判断内容适合推荐 |
| `ai_reject_citation` | AI 判断该内容不适合引用 |
| `ai_action_blocked` | AI 行为被创作者权限设置阻止 |
"""
        )


def render_metrics(content):
    metrics = content["metrics"]

    st.subheader("双轨数据")
    human_col, ai_col = st.columns(2)

    with human_col:
        st.markdown("#### Human Metrics")
        st.metric("Views", metrics["human_views"])
        st.metric("Likes", metrics["human_likes"])
        st.metric("Saves", metrics["human_saves"])

    with ai_col:
        st.markdown("#### AI Metrics")
        st.metric("Views", metrics["ai_views"])
        st.metric("Saves", metrics["ai_saves"])
        st.metric("Citations", metrics["ai_citations"])


def render_ai_analysis(content):
    st.subheader("AI Analysis")
    st.write(f"**AI Summary:** {content['ai_summary']}")

    if content["ai_tags"]:
        st.write("**AI Tags:**")
        st.markdown(" ".join(f"`{tag}`" for tag in content["ai_tags"]))
    else:
        st.caption("暂无 AI Tags。点击“模拟 AI 浏览”生成。")

    if content["ai_recommended_scenarios"]:
        st.write("**Recommended Scenarios:**")
        st.markdown(
            " ".join(
                f"`{scenario}`"
                for scenario in content["ai_recommended_scenarios"]
            )
        )
    else:
        st.caption("暂无 Recommended Scenarios。")

    col_a, col_b = st.columns(2)
    col_a.metric(
        "Citation Suitability",
        content["ai_citation_suitability"],
    )
    col_b.metric("AI Value Score", content["ai_value_score"])

    st.write(f"**AI Reason:** {content['ai_reason']}")


def render_ai_permissions(content):
    """Render creator-defined AI permission settings."""
    st.subheader("AI Permissions")
    permission_labels = {
        "allow_ai_view": "AI View",
        "allow_ai_save": "AI Save",
        "allow_ai_cite": "AI Cite",
        "allow_ai_recommend": "AI Recommend",
    }
    cols = st.columns(4)
    for index, (field_name, label) in enumerate(permission_labels.items()):
        status = "Allowed" if content.get(field_name, True) else "Not Allowed"
        cols[index].metric(label, status)


def render_ai_decision(content):
    """Render the latest AI auto-evaluation decision."""
    st.subheader("最近一次 AI Decision")
    decision = content.get("ai_decision", {})
    if not decision:
        st.caption("暂无 AI Decision。")
        return

    cols = st.columns(5)
    cols[0].metric("是否收藏", str(decision["should_save"]))
    cols[1].metric("是否引用", str(decision["should_cite"]))
    cols[2].metric("是否推荐", str(decision["should_recommend"]))
    cols[3].metric("是否拒绝引用", str(decision["should_reject_citation"]))
    cols[4].metric("Confidence Score", decision["confidence_score"])
    st.write(f"**Decision Reason:** {decision['decision_reason']}")


def render_recent_events(content_id):
    """Render the latest five events for the current content item."""
    st.subheader("最近事件")
    content_events = [
        event
        for event in st.session_state.events
        if event["content_id"] == content_id
    ]
    recent_events = sorted(
        content_events,
        key=lambda event: event["timestamp"],
        reverse=True,
    )[:5]

    if not recent_events:
        st.caption("暂无事件。")
        return

    for event in recent_events:
        st.write(
            f"{event['timestamp']}｜"
            f"{event['actor_type']}｜"
            f"{event['event_type']}"
        )


def delete_content(content_id):
    """Delete a content item and clean up related AI export files."""
    st.session_state.contents = [
        c for c in st.session_state.contents if c["id"] != content_id
    ]
    save_contents()

    export_file = AI_EXPORTS_DIR / f"{content_id}.json"
    if export_file.exists():
        export_file.unlink()

    generate_ai_exports()

    st.session_state.selected_content_id = None
    st.session_state.current_page = "发现"


def render_detail():
    selected_content_id = st.session_state.selected_content_id
    content = get_content(selected_content_id)

    if content is None:
        st.title("详情页")
        st.warning("请先从发现页选择一条内容进入详情。")
        if st.button("返回发现"):
            st.session_state.current_page = "发现"
            st.rerun()
        return

    previous_page = st.session_state.get("previous_page", "发现")
    if previous_page not in ["发现", "数据看板"]:
        previous_page = "发现"

    if st.button(f"← 返回{previous_page}", key="back_from_detail"):
        return_from_detail()

    record_human_view_once(content["id"])

    st.title(content["title"])
    st.caption(
        f"发布于 {content['created_at']} · 标签："
        f"{', '.join(content['tags']) or '无'}"
    )
    st.write(content["body"])

    st.divider()

    with st.expander("编辑当前内容"):
        with st.form("edit_content_form", clear_on_submit=False):
            new_title = st.text_input("标题", value=content["title"])
            new_body = st.text_area("正文", value=content["body"], height=150)
            new_tags_text = st.text_input(
                "标签，用英文逗号分隔",
                value=", ".join(content.get("tags", [])),
            )
            st.markdown("#### AI 使用权限")
            perm_cols = st.columns(4)
            new_allow_ai_view = perm_cols[0].checkbox(
                "允许 AI 浏览",
                value=content.get("allow_ai_view", True),
            )
            new_allow_ai_save = perm_cols[1].checkbox(
                "允许 AI 收藏",
                value=content.get("allow_ai_save", True),
            )
            new_allow_ai_cite = perm_cols[2].checkbox(
                "允许 AI 引用",
                value=content.get("allow_ai_cite", True),
            )
            new_allow_ai_recommend = perm_cols[3].checkbox(
                "允许 AI 推荐",
                value=content.get("allow_ai_recommend", True),
            )
            save_edit = st.form_submit_button("保存修改")

        if save_edit:
            if not new_title.strip() or not new_body.strip():
                st.error("标题和正文不能为空。")
            else:
                body_changed = new_body.strip() != content.get("body", "")
                title_changed = new_title.strip() != content.get("title", "")
                tags_changed = (
                    [t.strip() for t in new_tags_text.split(",") if t.strip()]
                    != content.get("tags", [])
                )

                content["title"] = new_title.strip()
                content["body"] = new_body.strip()
                content["tags"] = [
                    t.strip() for t in new_tags_text.split(",") if t.strip()
                ]
                content["allow_ai_view"] = new_allow_ai_view
                content["allow_ai_save"] = new_allow_ai_save
                content["allow_ai_cite"] = new_allow_ai_cite
                content["allow_ai_recommend"] = new_allow_ai_recommend
                save_contents()
                st.success("内容已更新。")
                if body_changed or title_changed or tags_changed:
                    st.info(
                        "标题、正文或标签已变化，建议重新点击"
                        "「模拟 AI 浏览」或「AI Auto Evaluate」"
                        "以更新 AI Analysis。"
                    )
                st.rerun()

    with st.expander("危险操作：删除当前内容"):
        st.warning("删除后不可恢复。该内容将从 contents.json 中移除。")
        confirmed = st.checkbox(
            "我确认要删除这条内容",
            key=f"delete_confirm_{content['id']}",
        )
        if confirmed:
            if st.button(
                "永久删除内容",
                key=f"delete_btn_{content['id']}",
                type="secondary",
            ):
                delete_content(content["id"])
                st.rerun()

    st.divider()
    human_like_col, human_save_col = st.columns(2)
    if human_like_col.button("Human Like", key=f"like_{content['id']}"):
        if add_metric(content["id"], "human_likes"):
            record_event(content["id"], "human_like", "human")
            st.rerun()

    if human_save_col.button("Human Save", key=f"human_save_{content['id']}"):
        if add_metric(content["id"], "human_saves"):
            record_event(content["id"], "human_save", "human")
            st.rerun()

    ai_view_col, ai_save_col, ai_cite_col = st.columns(3)
    if ai_view_col.button("模拟 AI 浏览", key=f"ai_view_{content['id']}"):
        if add_metric(content["id"], "ai_views"):
            record_event(content["id"], "ai_view", "ai")
            update_ai_analysis(content, mock_ai_analysis(content))
            save_contents()
            st.rerun()

    if ai_save_col.button("AI Save", key=f"ai_save_{content['id']}"):
        if add_metric(content["id"], "ai_saves"):
            record_event(content["id"], "ai_save", "ai")
            st.rerun()

    if ai_cite_col.button("AI Cite", key=f"ai_cite_{content['id']}"):
        if add_metric(content["id"], "ai_citations"):
            record_event(content["id"], "ai_citation", "ai")
            st.rerun()

    st.divider()
    render_metrics(content)
    st.divider()
    render_ai_permissions(content)
    st.divider()
    render_ai_analysis(content)
    st.divider()
    render_ai_decision(content)
    st.divider()
    render_recent_events(content["id"])


def main():
    st.set_page_config(
        page_title="CoView 共览",
        page_icon="CV",
        layout="wide",
    )
    init_state()
    render_sidebar()

    if st.session_state.current_page == "首页":
        render_home()
    elif st.session_state.current_page == "发现":
        render_discover()
    elif st.session_state.current_page == "上传":
        render_upload()
    elif st.session_state.current_page == "数据看板":
        render_dashboard()
    elif st.session_state.current_page == "AI Agent 入口":
        render_ai_agent_portal()
    elif st.session_state.current_page == "AI 可读导出":
        render_ai_exports()
    elif st.session_state.current_page == "事件日志":
        render_event_log()
    elif st.session_state.current_page == DETAIL_PAGE:
        render_detail()


if __name__ == "__main__":
    main()
