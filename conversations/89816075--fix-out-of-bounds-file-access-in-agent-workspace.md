# Fix out-of-bounds file access in agent workspace

_Session `89816075-8468-401c-9c3e-110930b9fb62` · 2026-04-26 19:44:09Z → 2026-04-26 20:00:18Z · 12 turns · workspace: `worktree:xenodochial-proskuriakova-37a944` · branch: `claude/xenodochial-proskuriakova-37a944`_

---

## User · 19:44:09

https://github.com/anthropics/claude-code/issues/27134 Please read this issue. I already encountered this issue a long time ago, and I recall that we did something like hooks to block every time that it was trying to read outside of the work tree. We used to tell the agent to give context to the agent to search the internet. Probably they already know how to fix this, but search and take into consideration the current date, please.

## Assistant · 19:44:13

**Tool: ToolSearch** — `select:WebFetch,WebSearch,AskUserQuestion,ExitPlanMode`

<details><summary>output (3 B)</summary>

```




```

</details>

**Tool: Bash** — `gh issue view 27134 --repo anthropics/claude-code --comments`

<details><summary>output (6.0 KB)</summary>

```
author:	codemile
association:	none
edited:	false
status:	none
--
Yup, this is pretty frustrating when you want to explore different approaches on a feature branch
--
author:	shrektan
association:	none
edited:	false
status:	none
--
Yes, I vote for this feature. 

This is very frustrating: whenever you are developing a feature branch and you want to develop a different approach for this branch, you surprisingly find out after a while that you are working on the main branch instead of the HEAD feature branch, which is extremely frustrating.
--
author:	viktorius007
association:	none
edited:	false
status:	none
--
## Also affects `Agent` tool with `isolation: "worktree"` — not just `EnterWorktree`

This bug propagates through the Agent tool's `isolation: "worktree"` parameter, meaning subagents launched in parallel all silently operate on the wrong branch.

### Reproduction

```
# On branch: dev-env (diverged from main with ~50 file changes)
# Launch 5 parallel agents, each modifying disjoint files:

Agent(isolation: "worktree", prompt: "Add tests to src/core/set.rs ...")
Agent(isolation: "worktree", prompt: "Add tests to src/email/mod.rs ...")
# ... 3 more agents
```

All 5 agents complete successfully. But inspecting the worktree branches:

```
$ git log --oneline -1 worktree-agent-aba950d6
6562976 v0.4.0    # ← this is main's HEAD

$ git log --oneline -1 dev-env
1461c7f Add tests to kill surviving mutants and boost coverage  # ← this is where I actually am
```

Every worktree was based on `origin/main` (`6562976`), not `dev-env` (`1461c7f`).

### Impact

- **`git apply` fails for all patches** — diffs are relative to `main`, not the working branch. All 5 patches fail to apply to the files on `dev-env`.
- **Agents write tests against stale code** — `dev-env` had existing `#[cfg(test)]` modules in every file. Agents didn't see them because they were working against `main` which lacked those modules. Agent 3 created `tests/core_tests.rs` from scratch instead of extending 
… [truncated 4140 chars]
```

</details>

**Tool: Bash** — `gh issue view 27134 --repo anthropics/claude-code --json title,body,state,createdAt,updatedAt,closedAt`

<details><summary>output (4.8 KB)</summary>

```
{"body":"**Bug Description**\nBug: EnterWorktree creates worktree from default branch instead of HEAD\n\n The EnterWorktree tool description says \"Creates a new git worktree branched from HEAD\",\n but the actual implementation creates the worktree from `origin/<defaultBranch>` (e.g., origin/main).\n\n The internal function fetches the default branch and uses it as the base:\n   1. getDefaultBranch() → \"main\" or \"master\"\n   2. git fetch origin main\n   3. If fetch succeeds → base = origin/main (NOT HEAD)\n   4. Only falls back to HEAD if fetch fails\n\n This means if you're on a feature branch and use EnterWorktree, the worktree\n starts from origin/main instead of your current branch's HEAD.\n\n Expected: Worktree should be based on the current HEAD as documented.\n\n**Environment Info**\n- Platform: darwin\n- Terminal: iTerm.app\n- Version: 2.1.49\n- Feedback ID: 9763749b-9256-44c9-bc28-1713e78d63b6\n\n**Errors**\n```json\n[{\"error\":\"Error: ENOENT: no such file or directory, open '/Users/kamitsukasa/.claude/remote-settings.json'\\n    at openSync (unknown)\\n    at readSync (/$bunfs/root/claude:12:1441)\\n    at I2 (/$bunfs/root/claude:6070:113)\\n    at k5 (/$bunfs/root/claude:6072:226)\\n    at dZA (/$bunfs/root/claude:2058:49788)\\n    at aLR (/$bunfs/root/claude:2058:49951)\\n    at AY8 (/$bunfs/root/claude:6057:1234)\\n    at Z$T (/$bunfs/root/claude:6057:2112)\\n    at IB (/$bunfs/root/claude:6057:2039)\\n    at xT0 (/$bunfs/root/claude:6089:5361)\",\"timestamp\":\"2026-02-20T12:15:21.404Z\"},{\"error\":\"Error: ENOENT: no such file or directory, open '/Users/kamitsukasa/.claude/remote-settings.json'\\n    at openSync (unknown)\\n    at readSync (/$bunfs/root/claude:12:1441)\\n    at I2 (/$bunfs/root/claude:6070:113)\\n    at k5 (/$bunfs/root/claude:6072:226)\\n    at dZA (/$bunfs/root/claude:2058:49788)\\n    at rZA (/$bunfs/root/claude:2058:53056)\\n    at jAB (/$bunfs/root/claude:2058:53961)\\n    at <anonymous> (/$bunfs/root/claude:11359:510)\\n
… [truncated 2965 chars]
```

</details>

**Tool: WebSearch** — `claude code EnterWorktree creates worktree from default branch instead of HEAD fix 2026`

<details><summary>output (2.9 KB)</summary>

```
Web search results for query: "claude code EnterWorktree creates worktree from default branch instead of HEAD fix 2026"

Links: [{"title":"[Bug] EnterWorktree creates worktree from default branch instead of HEAD · Issue #27134 · anthropics/claude-code","url":"https://github.com/anthropics/claude-code/issues/27134"},{"title":"EnterWorktree creates branch from main instead of current branch HEAD (macOS) · Issue #44965 · anthropics/claude-code","url":"https://github.com/anthropics/claude-code/issues/44965"},{"title":"[FEATURE] --worktree / EnterWorktree should respect git submodule boundaries · Issue #27201 · anthropics/claude-code","url":"https://github.com/anthropics/claude-code/issues/27201"},{"title":"Common workflows - Claude Code Docs","url":"https://code.claude.com/docs/en/common-workflows"},{"title":"[FEATURE] Allow --worktree to branch from current HEAD instead of default remote branch · Issue #27876 · anthropics/claude-code","url":"https://github.com/anthropics/claude-code/issues/27876"},{"title":"Claude Code Worktree Explained: Setup & Parallel Agents - Verdent Guides","url":"https://www.verdent.ai/guides/claude-code-worktree-setup-guide"},{"title":"Worktree subagents branch from `origin/main` rather than current HEAD — intentional? · Issue #50850 · anthropics/claude-code","url":"https://github.com/anthropics/claude-code/issues/50850"},{"title":"Claude Code - Worktrees and configuration | BloggingAbout.NET","url":"https://bloggingabout.net/2026/02/20/claude-code-worktrees-and-configuration/"},{"title":"Worktree branch created from wrong base branch and stale commit · Issue #45316 · anthropics/claude-code","url":"https://github.com/anthropics/claude-code/issues/45316"},{"title":"Allow configuring default base branch for --worktree · Issue #35730 · anthropics/claude-code","url":"https://github.com/anthropics/claude-code/issues/35730"}]

Based on the search results, I found information about the bug you're asking about:

The bug in Claude Code is that the Enter
… [truncated 1002 chars]
```

</details>

**Tool: Bash** — `gh issue list --repo anthropics/claude-code --search "worktree HEAD base branch" --state all --limit 10 --json number,title,state,closedAt,u`

<details><summary>output (1.7 KB)</summary>

```
[{"closedAt":null,"number":53025,"state":"OPEN","title":"[BUG] claude -w creates worktree from stale local branch without fetching remote HEAD","updatedAt":"2026-04-24T22:09:17Z"},{"closedAt":null,"number":51496,"state":"OPEN","title":"[BUG] Worktree status bar shows diff against default branch instead of selected parent branch","updatedAt":"2026-04-21T09:23:10Z"},{"closedAt":null,"number":48095,"state":"OPEN","title":"isolation: \"worktree\" branches from origin/HEAD instead of current HEAD","updatedAt":"2026-04-16T14:02:55Z"},{"closedAt":null,"number":49169,"state":"OPEN","title":"[BUG] Subagents / Explore use stale isolated worktree instead of parent repo HEAD","updatedAt":"2026-04-16T14:00:47Z"},{"closedAt":null,"number":50343,"state":"OPEN","title":"[BUG] `/ultrareview` fails in bare-repo + worktree container directory","updatedAt":"2026-04-18T10:09:16Z"},{"closedAt":null,"number":23622,"state":"OPEN","title":"[Feature Request] Support selecting base branch when creating git worktree","updatedAt":"2026-04-23T17:22:33Z"},{"closedAt":null,"number":27134,"state":"OPEN","title":"[Bug] EnterWorktree creates worktree from default branch instead of HEAD","updatedAt":"2026-04-21T01:18:00Z"},{"closedAt":null,"number":42034,"state":"OPEN","title":"[BUG] SDK sessions escape `cwd` and modify parent repository when running in git worktrees","updatedAt":"2026-04-24T22:17:32Z"},{"closedAt":null,"number":49954,"state":"OPEN","title":"[FEATURE] Add \"Fork into worktree\" option to \"Fork from here\" in Claude Desktop (Code mode)","updatedAt":"2026-04-17T14:22:59Z"},{"closedAt":null,"number":50077,"state":"OPEN","title":"[FEATURE] Allow creating a new branch directly from the branch selector when no matches are found","updatedAt":"2026-04-17T18:55:54Z"}]
```

</details>

Read the issue and the surrounding cluster. Status as of today (2026-04-26):

**Issue [#27134](https://github.com/anthropics/claude-code/issues/27134) is still OPEN.** Last activity 2026-04-21. No fix shipped yet, despite ~2 months of duplicates piling on (see [#44965](https://github.com/anthropics/claude-code/issues/44965), [#48095](https://github.com/anthropics/claude-code/issues/48095), [#49169](https://github.com/anthropics/claude-code/issues/49169), [#50850](https://github.com/anthropics/claude-code/issues/50850), [#53025](https://github.com/anthropics/claude-code/issues/53025), and the older feature requests [#27876](https://github.com/anthropics/claude-code/issues/27876) / [#23622](https://github.com/anthropics/claude-code/issues/23622) / [#35730](https://github.com/anthropics/claude-code/issues/35730)).

**What the thread now confirms beyond the original bug:**
- Same defect propagates to the `Agent` tool's `isolation: "worktree"` parameter — every parallel subagent silently rebases off `origin/<defaultBranch>` instead of the parent's HEAD.
- Forensic confirmation in `.git/worktrees/<id>/CLAUDE_BASE` and the worktree reflog: `Created from origin/main`.
- Likely related to [#36182](https://github.com/anthropics/claude-code/issues/36182) (subagent path resolver leaking back to main repo) — same divergence root cause.

**About your recall — the "hook to block reads outside the worktree":** that workaround addresses a *different* failure mode (path leakage / [#42034](https://github.com/anthropics/claude-code/issues/42034), [#36182](https://github.com/anthropics/claude-code/issues/36182)), not this base-branch bug. A PreToolUse hook denying Read/Edit/Bash paths outside `$CLAUDE_PROJECT_DIR` will catch agents reading the wrong tree, but it won't fix a worktree that was *created* from the wrong base — by then the files inside the worktree are already wrong.

**Practical workarounds today (2026-04-26):**
1. **Don't use `isolation: "worktree"` on non-default branches** (Nubaeon's recommendation in-thread) — use foreground agents instead.
2. If you must, create the worktree manually first (`git worktree add` from your branch) and `cd` into it before invoking Claude — bypasses `getDefaultBranch()` entirely.
3. The hook-based read guard is still worth keeping as defense-in-depth for [#36182](https://github.com/anthropics/claude-code/issues/36182)/[#42034](https://github.com/anthropics/claude-code/issues/42034), separate concern.

**No upstream fix in flight that I can see.** The community consensus (per [#50850](https://github.com/anthropics/claude-code/issues/50850)'s last comment) is asking for both: default → HEAD, plus a `worktree.baseRef` setting. Anthropic hasn't responded on the threads.

Want me to propose a hook config for this repo as defense-in-depth, or leave it?

Sources:
- [#27134 — original bug](https://github.com/anthropics/claude-code/issues/27134)
- [#48095 — Agent isolation variant](https://github.com/anthropics/claude-code/issues/48095)
- [#50850 — most recent forensics + baseRef proposal](https://github.com/anthropics/claude-code/issues/50850)
- [#53025 — latest dup, 2026-04-24](https://github.com/anthropics/claude-code/issues/53025)
- [#42034 — SDK escapes cwd, related path-leak failure mode](https://github.com/anthropics/claude-code/issues/42034)

## User · 19:46:28

Understand that I'm using the Claude code desktop app. I'm not using Claude code directly, so think how can I fix that?

## Assistant · 19:47:00

You're right that the hook idea doesn't apply cleanly here — the bug happens at *creation*, before any hook the desktop app would let you wire up. By the time a `PreToolUse`/`PostToolUse` fires, the worktree already exists rooted at `origin/main`. So three realistic options from inside Desktop:

**1. Stop letting Desktop create the worktree.** This is the cleanest fix and the one I'd pick.
   - In your terminal: `git worktree add ../myrepo-feature -b feat/x HEAD` (from the branch you actually want as the base).
   - In Desktop: **Open folder…** → point at `../myrepo-feature`.
   - Desktop will treat it as a normal project. You skip the buggy `EnterWorktree` codepath entirely. You lose the one-click "Run in worktree" button; you keep correctness.

**2. Block the buggy paths with hooks, force a manual setup.** Desktop reads `~/.claude/settings.json` and `<repo>/.claude/settings.json` the same way the CLI does, so hooks work. A `PreToolUse` matcher on `EnterWorktree` (and on `Agent` when its input contains `"isolation":"worktree"`) that exits non-zero with a message like *"Worktree creation is disabled in this repo due to anthropics/claude-code#27134 — create the worktree manually with `git worktree add … HEAD` and re-open it"* will stop the agent from silently doing the wrong thing. Downside: you also lose the Desktop button, and the agent will sometimes need a nudge to follow the instruction.

**3. Auto-correct after the fact.** A `SessionStart` hook (fires when Desktop opens a session in the worktree) that checks the worktree's base commit, compares it to the intended parent branch, and either rebases or aborts with a loud message. More machinery, more failure modes (rebase conflicts on session open are a bad UX), but it preserves the Desktop button. I'd only do this if option 1 is somehow unworkable.

**Re: your memory of "hook to block reads outside the worktree"** — keep that one independently if you had it. It addresses [#42034](https://github.com/anthropics/claude-code/issues/42034) / [#36182](https://github.com/anthropics/claude-code/issues/36182) (subagents leaking writes back to the parent repo), which is a *separate* defect and still unfixed. It's good defense-in-depth but it does not help with the base-branch bug.

My recommendation: **option 1** as the daily workflow, **option 2** as a guardrail in this repo's `.claude/settings.json` so future-you (or a teammate) can't fall back into the trap by clicking the button. Want me to draft the settings.json hook block for option 2?

## User · 19:48:29

What do you mean by desktop? Are you referring to that Claude desktop app?

## Assistant · 19:48:35

No — I meant **Claude Code Desktop** (the Mac/Windows app for Claude Code, the same tool you're talking to me through right now). Not the **Claude desktop app** (claude.ai chat client), which is a separate product and doesn't have worktrees, hooks, or `EnterWorktree` at all.

I picked up "desktop app" from your previous message and assumed you meant Claude Code's desktop build. If you actually meant the claude.ai chat app, then none of this applies — that app can't create worktrees in the first place, so the bug isn't reachable from there. Can you confirm which one you're using?

## User · 19:56:10

No, I mean Claude code desktop.

## Assistant · 19:56:16

Got it — then everything in my previous answer stands. Claude Code Desktop reads the same `~/.claude/settings.json` and `<repo>/.claude/settings.json` as the CLI, so hooks work identically; the `EnterWorktree` bug is the same codepath; and the "open a manually-created worktree via **Open folder…**" workaround is the cleanest fix.

Want me to draft the `settings.json` hook block (option 2) so you can drop it into this repo?

## User · 19:58:08

fix it please

## Assistant · 19:58:12

**Tool: Bash** — `ls -la .claude/ 2>/dev/null; echo "---"; cat .claude/settings.json 2>/dev/null; echo "---"; cat .claude/settings.local.json 2>/dev/null`

<details><summary>output (382 B)</summary>

```
total 8
drwxr-xr-x@  3 kisshot  staff   96 Apr 26 14:44 .
drwxr-xr-x@ 12 kisshot  staff  384 Apr 26 14:44 ..
-rw-r--r--@  1 kisshot  staff  198 Apr 26 14:44 settings.local.json
---
---
{
  "permissions": {
    "allow": [
      "Read(//Users/kisshot/.claude/skills/commit/**)",
      "Bash(rm -rf ~/.claude/skills/commit)",
      "Read(//Users/kisshot/.claude/skills/**)"
    ]
  }
}
```

</details>

**Tool: Write** — `/Users/kisshot/Desktop/projects/revelstreet/.claude/worktrees/xenodochial-proskuriakova-37a944/.claude/settings.json`

<details><summary>input</summary>

```json
{
  "file_path": "/Users/kisshot/Desktop/projects/revelstreet/.claude/worktrees/xenodochial-proskuriakova-37a944/.claude/settings.json",
  "content": "{\n  \"hooks\": {\n    \"PreToolUse\": [\n      {\n        \"matcher\": \"EnterWorktree\",\n        \"hooks\": [\n          {\n            \"type\": \"command\",\n            \"command\": \"printf '%s\\\\n' 'EnterWorktree is disabled in this repo (anthropics/claude-code#27134: worktrees are silently created from origin/main instead of HEAD). Create the worktree manually with: git worktree add <path> -b <branch> HEAD  — then open it with File > Open folder.' >&2; exit 2\"\n          }\n        ]\n      },\n      {\n        \"matcher\": \"Agent\",\n        \"hooks\": [\n          {\n            \"type\": \"command\",\n            \"command\": \"input=$(cat); echo \\\"$input\\\" | grep -q '\\\"isolation\\\"[[:space:]]*:[[:space:]]*\\\"worktree\\\"' && { printf '%s\\\\n' 'Agent isolation=\\\"worktree\\\" is disabled in this repo (anthropics/claude-code#27134: subagent worktrees are silently created from origin/main instead of HEAD). Re-run the Agent without the isolation parameter, or pre-create a worktree with: git worktree add <path> -b <branch> HEAD' >&2; exit 2; } || exit 0\"\n          }\n        ]\n      }\n    ]\n  }\n}\n"
}
```

</details>

<details><summary>output (212 B)</summary>

```
File created successfully at: /Users/kisshot/Desktop/projects/revelstreet/.claude/worktrees/xenodochial-proskuriakova-37a944/.claude/settings.json (file state is current in your context — no need to Read it back)
```

</details>

**Tool: Bash** — `echo '{"tool_input":{"isolation":"worktree","prompt":"x"}}' | sh -c 'input=$(cat); echo "$input" | grep -q "\"isolation\"[[:space:]]*:[[:spa`

<details><summary>input</summary>

```json
{
  "command": "echo '{\"tool_input\":{\"isolation\":\"worktree\",\"prompt\":\"x\"}}' | sh -c 'input=$(cat); echo \"$input\" | grep -q \"\\\"isolation\\\"[[:space:]]*:[[:space:]]*\\\"worktree\\\"\" && { printf \"%s\\n\" \"BLOCKED\" >&2; exit 2; } || exit 0'; echo \"exit=$?\"; echo \"---\"; echo '{\"tool_input\":{\"prompt\":\"x\"}}' | sh -c 'input=$(cat); echo \"$input\" | grep -q \"\\\"isolation\\\"[[:space:]]*:[[:space:]]*\\\"worktree\\\"\" && { printf \"%s\\n\" \"BLOCKED\" >&2; exit 2; } || exit 0'; echo \"exit=$?\"",
  "description": "Verify hook logic blocks isolation=worktree but allows others"
}
```

</details>

<details><summary>output (25 B)</summary>

```
BLOCKED
exit=2
---
exit=0
```

</details>

Done. Wrote [.claude/settings.json](.claude/settings.json) with two `PreToolUse` hooks:

- **`EnterWorktree`** → blocked unconditionally with a message pointing at issue #27134 and the manual `git worktree add … HEAD` workaround.
- **`Agent`** → blocked only when the input contains `"isolation":"worktree"`; normal Agent calls pass through (verified above: exit 2 vs exit 0).

Both exit with code 2, which is how Claude Code hooks signal "deny and surface stderr to the model" — so when something tries to call either path, the agent sees the explanation and the suggested workaround instead of silently getting a wrong-base worktree.

Project-level (checked into the repo via `.claude/settings.json`), so the protection travels with the repo for any future agent session or teammate.

## User · 19:59:17

<create-pr-command>
## Overview

Create a pull request for the changes in this session.

## Steps

1. Check for uncommitted changes. If any exist, stage and commit them with a message that describes what changed and why.
2. Push the branch to the remote.
3. Open a PR with `gh pr create`. Write a title that summarizes the change and a body that covers what changed, why, and anything a reviewer should know. If the repo has a PR template, follow it.
4. Report the PR URL when done. Wrap the URL in a `<pr-created>` tag on its own line so the UI can render a live status card, like this: `<pr-created>https://github.com/owner/repo/pull/123</pr-created>`

If a PR already exists for this branch, push any new commits and report the existing URL wrapped in the same `<pr-created>` tag instead of creating a duplicate.

## Target

Repository: gadidgc/revelstreet
Branch: claude/xenodochial-proskuriakova-37a944
Working directory: /Users/kisshot/Desktop/projects/revelstreet/.claude/worktrees/xenodochial-proskuriakova-37a944
</create-pr-command>

## Assistant · 19:59:26

**Tool: Bash** — `git status; echo "---"; git diff; echo "---"; git log --oneline -5; echo "---"; git log --oneline origin/main..HEAD 2>/dev/null`

<details><summary>output (612 B)</summary>

```
On branch claude/xenodochial-proskuriakova-37a944
Your branch is up to date with 'origin/main'.

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	.claude/

nothing added to commit but untracked files present (use "git add" to track)
---
---
9335f9b ci: fail fast when ANTHROPIC_API_KEY secret is missing (#7)
42ff952 docs: add CLAUDE.md for future agent sessions (#6)
122fdd6 feat: animated drone + always-on drone camera (demo simulation) (#5)
aee55de ci: make PR QA agent workflow actually run (#4)
6f1c093 feat: drone delivery operator console (Revelstreet exercise) (#3)
---
```

</details>

**Tool: Bash** — `cat .gitignore 2>/dev/null; echo "---"; ls .claude/`

<details><summary>output (125 B)</summary>

```
.DS_Store
node_modules/
dist/
test-results/
playwright-report/
playwright/.cache/
*.log
---
settings.json
settings.local.json
```

</details>

**Tool: Edit** — `/Users/kisshot/Desktop/projects/revelstreet/.claude/worktrees/xenodochial-proskuriakova-37a944/.gitignore`

<details><summary>error (96 B)</summary>

```
<tool_use_error>File has not been read yet. Read it first before writing to it.</tool_use_error>
```

</details>

**Tool: Read** — `/Users/kisshot/Desktop/projects/revelstreet/.claude/worktrees/xenodochial-proskuriakova-37a944/.gitignore`

<details><summary>output (104 B)</summary>

```
1	.DS_Store
2	node_modules/
3	dist/
4	test-results/
5	playwright-report/
6	playwright/.cache/
7	*.log
8	
```

</details>

**Tool: Edit** — `/Users/kisshot/Desktop/projects/revelstreet/.claude/worktrees/xenodochial-proskuriakova-37a944/.gitignore`

<details><summary>output (211 B)</summary>

```
The file /Users/kisshot/Desktop/projects/revelstreet/.claude/worktrees/xenodochial-proskuriakova-37a944/.gitignore has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**Tool: Bash** — `git add .gitignore .claude/settings.json && git status`

<details><summary>output (232 B)</summary>

```
On branch claude/xenodochial-proskuriakova-37a944
Your branch is up to date with 'origin/main'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	new file:   .claude/settings.json
	modified:   .gitignore
```

</details>

**Tool: Bash** — `git commit -m "$(cat <<'EOF'`

<details><summary>input</summary>

```json
{
  "command": "git commit -m \"$(cat <<'EOF'\nchore: block buggy worktree creation paths via PreToolUse hooks\n\nanthropics/claude-code#27134 — EnterWorktree and Agent isolation=\"worktree\"\nsilently base new worktrees on origin/<defaultBranch> instead of HEAD, so\nagents launched on a feature branch end up working against stale main and\ntheir patches fail to apply. Issue is still open as of 2026-04-26.\n\nAdds project-level .claude/settings.json with two PreToolUse hooks that deny\nboth paths and surface the manual `git worktree add ... HEAD` workaround\nto the agent. Also gitignores .claude/settings.local.json (user-local\npermissions, was untracked).\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>\nEOF\n)\" && git push -u origin claude/xenodochial-proskuriakova-37a944",
  "description": "Commit and push branch"
}
```

</details>

<details><summary>output (681 B)</summary>

```
[claude/xenodochial-proskuriakova-37a944 d8a5960] chore: block buggy worktree creation paths via PreToolUse hooks
 2 files changed, 25 insertions(+)
 create mode 100644 .claude/settings.json
remote: 
remote: Create a pull request for 'claude/xenodochial-proskuriakova-37a944' on GitHub by visiting:        
remote:      https://github.com/gadidgc/revelstreet/pull/new/claude/xenodochial-proskuriakova-37a944        
remote: 
To github.com:gadidgc/revelstreet.git
 * [new branch]      claude/xenodochial-proskuriakova-37a944 -> claude/xenodochial-proskuriakova-37a944
branch 'claude/xenodochial-proskuriakova-37a944' set up to track 'origin/claude/xenodochial-proskuriakova-37a944'.
```

</details>

**Tool: Bash** — `gh pr create --base main --title "chore: block buggy worktree creation paths via PreToolUse hooks" --body "$(cat <<'EOF'`

<details><summary>input</summary>

```json
{
  "command": "gh pr create --base main --title \"chore: block buggy worktree creation paths via PreToolUse hooks\" --body \"$(cat <<'EOF'\n## Summary\n\n- Adds `.claude/settings.json` with two `PreToolUse` hooks that deny `EnterWorktree` and `Agent` calls with `isolation: \\\"worktree\\\"`, both of which silently base new worktrees on `origin/<defaultBranch>` instead of `HEAD` (anthropics/claude-code#27134, still open as of 2026-04-26).\n- The hooks exit with code 2 so the agent receives the explanation on stderr and the suggested manual workaround (`git worktree add <path> -b <branch> HEAD`, then **File → Open folder**).\n- Gitignores `.claude/settings.local.json` (user-local permissions; was previously untracked).\n\n## Why\n\nWhen this bug fires, every parallel subagent works against a stale `main`, patches fail to apply on the actual feature branch, and reconciling the divergence by hand wipes out the time the agents were supposed to save. Blocking the buggy paths in-repo means future sessions (and teammates) can't fall into the trap by clicking the Desktop button.\n\n## Test plan\n\n- [x] Verified the `Agent` hook denies input containing `\\\"isolation\\\":\\\"worktree\\\"` (exit 2) and passes through normal Agent input (exit 0).\n- [ ] On next session: trigger `EnterWorktree` from Claude Code Desktop and confirm the deny message surfaces.\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\nEOF\n)\"",
  "description": "Open PR"
}
```

</details>

<details><summary>output (46 B)</summary>

```
https://github.com/gadidgc/revelstreet/pull/10
```

</details>

<pr-created>https://github.com/gadidgc/revelstreet/pull/10</pr-created>

