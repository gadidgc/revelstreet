#!/usr/bin/env node
// Export Claude Code conversation transcripts (JSONL) to readable Markdown.
// Default source: this repo's project transcripts dir under ~/.claude/projects/.
// Default output: <repo-root>/conversations/

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (name) => args.includes(name);

const REPO_ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const PROJECTS_ROOT = path.join(os.homedir(), ".claude/projects");
const PROJECT_PREFIX = "-Users-kisshot-Desktop-projects-revelstreet";
const SRC = flag("--src"); // optional: a single dir override
const OUT = flag("--out") ?? path.join(REPO_ROOT, "conversations");

function discoverSources() {
  if (SRC) return [SRC];
  if (!fs.existsSync(PROJECTS_ROOT)) return [];
  return fs
    .readdirSync(PROJECTS_ROOT)
    .filter((name) => name === PROJECT_PREFIX || name.startsWith(PROJECT_PREFIX + "-"))
    .map((name) => path.join(PROJECTS_ROOT, name));
}

function workspaceLabel(srcDir) {
  const name = path.basename(srcDir);
  if (name === PROJECT_PREFIX) return "main";
  const m = name.match(/--claude-worktrees-(.+)$/);
  return m ? `worktree:${m[1]}` : name;
}
const INCLUDE_THINKING = has("--include-thinking");

const TOOL_INPUT_LIMIT = 500;
const TOOL_RESULT_LIMIT = 2000;
const TITLE_MAX = 80;

const HARNESS_PREFIXES = ["<system-reminder>", "<command-name>", "<local-command-stdout>", "<command-message>"];

// Redact common secret shapes so committed transcripts can't leak credentials.
const SECRET_PATTERNS = [
  { name: "openai", re: /sk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}/g },
  { name: "anthropic", re: /sk-ant-[A-Za-z0-9_-]{20,}/g },
  { name: "github", re: /gh[pousr]_[A-Za-z0-9]{30,}/g },
  { name: "aws-access", re: /AKIA[0-9A-Z]{16}/g },
  { name: "google", re: /AIza[0-9A-Za-z_-]{35}/g },
  { name: "slack", re: /xox[abprs]-[A-Za-z0-9-]{10,}/g },
  { name: "private-key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
];

function redactSecrets(text) {
  if (typeof text !== "string") return text;
  let out = text;
  for (const { name, re } of SECRET_PATTERNS) {
    out = out.replace(re, `[REDACTED ${name} secret]`);
  }
  return out;
}

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "session";

const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
};

const fmtClock = (iso) => {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(11, 19);
};

const truncate = (s, n) => {
  if (typeof s !== "string") s = String(s ?? "");
  if (s.length <= n) return s;
  return s.slice(0, n) + `\n… [truncated ${s.length - n} chars]`;
};

const stringifyInput = (input) => {
  if (input == null) return "";
  if (typeof input === "string") return input;
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
};

const summarizeToolInput = (name, input) => {
  if (!input || typeof input !== "object") return "";
  const priority = ["command", "file_path", "path", "pattern", "query", "url", "description", "prompt"];
  for (const key of priority) {
    if (typeof input[key] === "string" && input[key].length > 0) {
      return input[key].split("\n")[0].slice(0, 140);
    }
  }
  return "";
};

const isHarnessUserText = (text) => {
  if (typeof text !== "string") return false;
  const t = text.trimStart();
  return HARNESS_PREFIXES.some((p) => t.startsWith(p));
};

const stripHarnessFromUserText = (text) => {
  // User messages sometimes have real content followed by appended <system-reminder> blocks.
  // Strip those tags and their contents; keep the human prose.
  return text
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
    .replace(/<command-name>[\s\S]*?<\/command-name>/g, "")
    .replace(/<command-message>[\s\S]*?<\/command-message>/g, "")
    .replace(/<command-args>[\s\S]*?<\/command-args>/g, "")
    .replace(/<local-command-stdout>[\s\S]*?<\/local-command-stdout>/g, "")
    .trim();
};

function parseSession(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
  const events = lines
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  let aiTitle = null;
  let sessionId = path.basename(filePath, ".jsonl");
  let cwd = null;
  let gitBranch = null;
  const turns = []; // ordered list of {kind, ts, ...}
  const toolResults = new Map(); // tool_use_id -> {content, isError}

  // First pass: collect tool results by id (they live in user messages but belong to prior tool_use).
  for (const e of events) {
    if (e.type === "user" && e.message && Array.isArray(e.message.content)) {
      for (const b of e.message.content) {
        if (b.type === "tool_result" && b.tool_use_id) {
          let content = b.content;
          if (Array.isArray(content)) {
            content = content
              .map((x) => (typeof x === "string" ? x : x?.text ?? ""))
              .join("\n");
          }
          if (typeof content !== "string") content = stringifyInput(content);
          toolResults.set(b.tool_use_id, { content, isError: !!b.is_error });
        }
      }
    }
  }

  for (const e of events) {
    if (e.type === "ai-title" && e.aiTitle) aiTitle = e.aiTitle;
    if (e.cwd) cwd = e.cwd;
    if (e.gitBranch) gitBranch = e.gitBranch;
    if (e.sessionId) sessionId = e.sessionId;

    if (e.isSidechain) continue;

    if (e.type === "user" && e.message) {
      const ts = e.timestamp;
      const c = e.message.content;
      if (typeof c === "string") {
        if (isHarnessUserText(c)) continue;
        const cleaned = stripHarnessFromUserText(c);
        if (cleaned) turns.push({ kind: "user", ts, text: cleaned });
      } else if (Array.isArray(c)) {
        const textParts = c
          .filter((b) => b.type === "text" && typeof b.text === "string")
          .map((b) => b.text)
          .filter((t) => !isHarnessUserText(t))
          .map(stripHarnessFromUserText)
          .filter(Boolean);
        if (textParts.length) turns.push({ kind: "user", ts, text: textParts.join("\n\n") });
        // tool_result blocks already collected; skip here.
      }
    }

    if (e.type === "assistant" && e.message && Array.isArray(e.message.content)) {
      const ts = e.timestamp;
      const blocks = [];
      for (const b of e.message.content) {
        if (b.type === "text" && b.text) {
          blocks.push({ kind: "text", text: b.text });
        } else if (b.type === "thinking" && INCLUDE_THINKING && b.thinking) {
          blocks.push({ kind: "thinking", text: b.thinking });
        } else if (b.type === "tool_use") {
          const tr = toolResults.get(b.id);
          blocks.push({
            kind: "tool",
            name: b.name,
            input: b.input,
            result: tr?.content ?? null,
            isError: tr?.isError ?? false,
          });
        }
      }
      if (blocks.length) turns.push({ kind: "assistant", ts, blocks });
    }
  }

  // Merge consecutive assistant turns that share no user turn between them.
  const merged = [];
  for (const t of turns) {
    const last = merged[merged.length - 1];
    if (last && last.kind === "assistant" && t.kind === "assistant") {
      last.blocks.push(...t.blocks);
    } else {
      merged.push(t);
    }
  }

  const firstTs = events.find((e) => e.timestamp)?.timestamp ?? null;
  const lastTs = [...events].reverse().find((e) => e.timestamp)?.timestamp ?? null;

  let title = aiTitle;
  if (!title) {
    const firstUser = merged.find((t) => t.kind === "user");
    title = firstUser ? firstUser.text.split("\n")[0].slice(0, TITLE_MAX) : "Untitled session";
  }

  return { sessionId, title, cwd, gitBranch, firstTs, lastTs, turns: merged };
}

function renderToolBlock(b) {
  const summary = summarizeToolInput(b.name, b.input);
  const inputStr = stringifyInput(b.input);
  const showInput = inputStr.length > TOOL_INPUT_LIMIT || (!summary && inputStr.length > 0);

  let md = `**Tool: ${b.name}**`;
  if (summary) md += ` — \`${summary.replace(/`/g, "ʼ")}\``;
  md += "\n\n";

  if (showInput) {
    md += `<details><summary>input</summary>\n\n\`\`\`json\n${truncate(inputStr, 4000)}\n\`\`\`\n\n</details>\n\n`;
  }

  if (b.result != null) {
    const r = b.result;
    const size = r.length;
    const sizeStr = size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`;
    const label = b.isError ? "error" : "output";
    md += `<details><summary>${label} (${sizeStr})</summary>\n\n\`\`\`\n${truncate(r, TOOL_RESULT_LIMIT)}\n\`\`\`\n\n</details>\n\n`;
  }
  return md;
}

function renderSession(s) {
  let md = `# ${s.title}\n\n`;
  const meta = [
    `Session \`${s.sessionId}\``,
    s.firstTs ? `${fmtTime(s.firstTs)} → ${fmtTime(s.lastTs)}` : null,
    `${s.turns.length} turns`,
    s.workspace ? `workspace: \`${s.workspace}\`` : null,
    s.gitBranch ? `branch: \`${s.gitBranch}\`` : null,
  ].filter(Boolean);
  md += `_${meta.join(" · ")}_\n\n---\n\n`;

  for (const t of s.turns) {
    if (t.kind === "user") {
      md += `## User · ${fmtClock(t.ts)}\n\n${t.text}\n\n`;
    } else if (t.kind === "assistant") {
      md += `## Assistant · ${fmtClock(t.ts)}\n\n`;
      for (const b of t.blocks) {
        if (b.kind === "text") md += `${b.text}\n\n`;
        else if (b.kind === "thinking") md += `<details><summary>thinking</summary>\n\n${b.text}\n\n</details>\n\n`;
        else if (b.kind === "tool") md += renderToolBlock(b);
      }
    }
  }
  return md;
}

function renderIndex(sessions) {
  let md = `# Conversation transcripts\n\n`;
  md += `Rendered Markdown of every Claude Code session run in this project — main workspace and every parallel worktree.\n`;
  md += `Source: \`~/.claude/projects/-Users-kisshot-Desktop-projects-revelstreet*\`.\n\n`;
  md += `## Regenerate\n\n\`\`\`bash\nnode scripts/export-conversations.mjs\n\`\`\`\n\n`;
  md += `Flags: \`--include-thinking\`, \`--src <dir>\`, \`--out <dir>\`.\n\n`;
  if (!sessions.length) {
    md += `## Sessions\n\n_No sessions found._\n`;
    return md;
  }
  const byWorkspace = new Map();
  for (const s of sessions) {
    if (!byWorkspace.has(s.workspace)) byWorkspace.set(s.workspace, []);
    byWorkspace.get(s.workspace).push(s);
  }
  const orderedWorkspaces = [...byWorkspace.keys()].sort((a, b) => {
    if (a === "main") return -1;
    if (b === "main") return 1;
    return a.localeCompare(b);
  });
  md += `## Summary\n\n`;
  md += `${sessions.length} session(s) across ${orderedWorkspaces.length} workspace(s).\n\n`;
  for (const ws of orderedWorkspaces) {
    md += `### ${ws}\n\n`;
    const list = byWorkspace.get(ws).sort((a, b) => (a.firstTs || "").localeCompare(b.firstTs || ""));
    for (const s of list) {
      md += `- [${s.title}](${s.fileName}) — ${fmtTime(s.firstTs)} · ${s.turns.length} turns\n`;
    }
    md += `\n`;
  }
  return md;
}

function main() {
  const sources = discoverSources();
  if (!sources.length) {
    console.error(`No source dirs found under ${PROJECTS_ROOT} matching ${PROJECT_PREFIX}*`);
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });
  // Wipe stale exports so renamed/removed sessions don't linger.
  for (const f of fs.readdirSync(OUT)) {
    if (f.endsWith(".md")) fs.unlinkSync(path.join(OUT, f));
  }

  const sessions = [];
  const seen = new Set();
  for (const src of sources) {
    const workspace = workspaceLabel(src);
    const files = fs
      .readdirSync(src)
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => path.join(src, f));
    for (const f of files) {
      const s = parseSession(f);
      if (seen.has(s.sessionId)) continue; // same session can show up in multiple project dirs
      seen.add(s.sessionId);
      s.workspace = workspace;
      const fileName = `${s.sessionId.slice(0, 8)}--${slugify(s.title)}.md`;
      const outPath = path.join(OUT, fileName);
      fs.writeFileSync(outPath, redactSecrets(renderSession(s)));
      sessions.push({ ...s, fileName });
      console.log(`wrote ${path.relative(REPO_ROOT, outPath)}  (${workspace})`);
    }
  }

  const indexPath = path.join(OUT, "README.md");
  fs.writeFileSync(indexPath, renderIndex(sessions));
  console.log(`wrote ${path.relative(REPO_ROOT, indexPath)}`);
  console.log(`\nExported ${sessions.length} session(s) from ${sources.length} workspace(s) to ${path.relative(REPO_ROOT, OUT)}/`);
}

main();
