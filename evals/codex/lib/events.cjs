"use strict";

// Reads the JSONL that `codex exec --json` prints and turns it into one ordered
// list of steps. The documented shape is thread.started / turn.* / item.* with
// an `item` carrying `type`; field names inside items are not fully documented,
// so every accessor below accepts the variants seen in Codex releases and SDKs
// (snake_case or camelCase, item_type, content arrays, the older `msg` stream).

function snake(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[.\s-]+/g, "_")
    .toLowerCase();
}

function textOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join("\n");
  if (typeof value === "object") {
    for (const key of ["text", "message", "content", "value", "summary"]) {
      if (key in value) return textOf(value[key]);
    }
  }
  return "";
}

function commandOf(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(String).join(" ");
  return String(value);
}

function kindOf(type) {
  const t = snake(type);
  if (/^(agent_message|assistant_message|message)$/.test(t)) return "message";
  if (/reasoning/.test(t)) return "reasoning";
  if (/command|exec|shell/.test(t)) return "command";
  if (/file_change|patch/.test(t)) return "file_change";
  if (/collab|sub_?agent|spawn/.test(t)) return "subagent";
  if (/mcp|tool_call|function_call|custom_tool/.test(t)) return "tool";
  if (/web_search/.test(t)) return "web_search";
  if (/todo|plan_update/.test(t)) return "todo";
  if (/error/.test(t)) return "error";
  return "other";
}

function pathsOf(item) {
  const out = [];
  const changes = item.changes ?? item.files ?? null;
  if (Array.isArray(changes)) {
    for (const change of changes) {
      if (typeof change === "string") out.push(change);
      else if (change && (change.path || change.file || change.filename)) out.push(change.path || change.file || change.filename);
    }
  } else if (changes && typeof changes === "object") {
    out.push(...Object.keys(changes));
  }
  if (item.path) out.push(item.path);
  return out;
}

function fill(step, item) {
  step.type = snake(item.type ?? item.item_type ?? item.itemType ?? step.type);
  step.kind = kindOf(step.type);
  if (step.kind === "message" || step.kind === "reasoning" || step.kind === "error") {
    const text = textOf(item.text ?? item.message ?? item.content ?? item.summary);
    if (text) step.text = text;
  }
  if (step.kind === "command") {
    const command = commandOf(item.command ?? item.cmd ?? item.argv ?? item.parsed_cmd);
    if (command) step.command = command;
    const output = textOf(item.aggregated_output ?? item.aggregatedOutput ?? item.formatted_output ?? item.output)
      || [textOf(item.stdout), textOf(item.stderr)].filter(Boolean).join("\n");
    if (output) step.output = output;
    const exit = item.exit_code ?? item.exitCode;
    if (exit !== undefined && exit !== null) step.exitCode = exit;
  }
  if (step.kind === "file_change") {
    const paths = pathsOf(item);
    if (paths.length) step.paths = paths;
  }
  if (step.kind === "tool" || step.kind === "subagent") {
    step.tool = [item.server, item.tool ?? item.name ?? item.tool_name].filter(Boolean).join(".");
    step.args = typeof item.arguments === "string" ? item.arguments : JSON.stringify(item.arguments ?? item.args ?? item.input ?? item.prompt ?? "");
    const result = textOf(item.result ?? item.output);
    if (result) step.output = result;
  }
  if (step.kind === "web_search") step.query = textOf(item.query);
  if (item.status) step.status = snake(item.status);
}

// Older `codex exec --json` releases printed {id, msg:{type,...}} events.
function legacy(msg, steps, byId, usage, state) {
  const t = snake(msg.type);
  const id = msg.call_id ?? msg.callId;
  const at = (key, init) => {
    if (key && byId.has(key)) return byId.get(key);
    const step = init;
    steps.push(step);
    if (key) byId.set(key, step);
    return step;
  };
  if (t === "agent_message") steps.push({ kind: "message", type: t, text: textOf(msg.message ?? msg.text) });
  else if (t === "agent_reasoning") steps.push({ kind: "reasoning", type: t, text: textOf(msg.text) });
  else if (t === "exec_command_begin") at(id, { kind: "command", type: t, command: commandOf(msg.command) });
  else if (t === "exec_command_end") {
    const step = at(id, { kind: "command", type: t, command: commandOf(msg.command) });
    step.output = textOf(msg.aggregated_output ?? msg.formatted_output) || [textOf(msg.stdout), textOf(msg.stderr)].filter(Boolean).join("\n");
    step.exitCode = msg.exit_code;
  } else if (t === "patch_apply_begin") at(id, { kind: "file_change", type: t, paths: pathsOf(msg) });
  else if (/^mcp_tool_call_begin$/.test(t)) at(id, { kind: "tool", type: t, tool: textOf(msg.invocation?.tool), args: JSON.stringify(msg.invocation?.arguments ?? "") });
  else if (t === "web_search_begin" || t === "web_search_end") at(id, { kind: "web_search", type: t, query: textOf(msg.query) });
  else if (t === "token_count") {
    const u = msg.info?.total_token_usage;
    if (u) Object.assign(usage, { input: u.input_tokens ?? 0, cached: u.cached_input_tokens ?? 0, output: u.output_tokens ?? 0, reasoning: u.reasoning_output_tokens ?? 0 });
  } else if (t === "task_complete" && msg.last_agent_message) state.final = textOf(msg.last_agent_message);
  else if (t === "error" || t === "stream_error") steps.push({ kind: "error", type: t, text: textOf(msg.message) });
}

function parse(jsonl) {
  const steps = [];
  const byId = new Map();
  const usage = { input: 0, cached: 0, output: 0, reasoning: 0 };
  const state = { final: "", threadId: "", turnFailed: false, parseErrors: 0, events: 0 };
  for (const line of String(jsonl).split(/\r?\n/)) {
    if (!line.trim()) continue;
    let event;
    try { event = JSON.parse(line); } catch { state.parseErrors += 1; continue; }
    state.events += 1;
    if (event && event.msg && typeof event.msg === "object" && !event.type) { legacy(event.msg, steps, byId, usage, state); continue; }
    const type = snake(event.type ?? event.event ?? "");
    if (type === "thread_started") state.threadId = event.thread_id ?? event.threadId ?? "";
    else if (type === "turn_completed") {
      const u = event.usage ?? {};
      usage.input += u.input_tokens ?? u.inputTokens ?? 0;
      usage.cached += u.cached_input_tokens ?? u.cachedInputTokens ?? 0;
      usage.output += u.output_tokens ?? u.outputTokens ?? 0;
      usage.reasoning += u.reasoning_output_tokens ?? u.reasoningOutputTokens ?? 0;
    } else if (type === "turn_failed") {
      state.turnFailed = true;
      steps.push({ kind: "error", type, text: textOf(event.error ?? event.message) });
    } else if (type === "error") steps.push({ kind: "error", type, text: textOf(event.message ?? event.error) });
    else if (type.startsWith("item_")) {
      const item = event.item ?? event.data ?? event;
      const id = item.id ?? item.item_id ?? item.itemId ?? event.item_id;
      let step = id != null ? byId.get(id) : undefined;
      if (!step) {
        step = { kind: "other", type: "" };
        steps.push(step);
        if (id != null) byId.set(id, step);
      }
      fill(step, item);
    }
  }
  const messages = steps.filter((s) => s.kind === "message" && s.text);
  const final = state.final || (messages.length ? messages[messages.length - 1].text : "");
  return { steps, final, usage, threadId: state.threadId, turnFailed: state.turnFailed, parseErrors: state.parseErrors, events: state.events };
}

module.exports = { parse, snake, kindOf };
