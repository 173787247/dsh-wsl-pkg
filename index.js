import { pkgStatus, npmLs, pipList, cargoTree, npmOutdated } from "./lib/pkg.js";

export const name = "dsh-wsl-pkg";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  if (config.enabled === false) {
    console.log("[dsh-wsl-pkg] disabled");
    return;
  }
  const timeoutMs = positive(config.timeoutMs, 60_000);
  const allowRoots = Array.isArray(config.allowRoots) ? config.allowRoots.map(String) : [];

  ctx.systemPrompt.section({
    name: "tool:pkg",
    order: 141,
    text: "dsh-wsl-pkg summarizes dependency trees (npm ls / npm outdated / pip list / cargo tree). Prefer shallow depth. Does not install/uninstall packages.",
  });

  ctx.tools.register({
    name: "pkg_status",
    description: "Whether npm / pip / cargo are on PATH; npm version.",
    parameters: { type: "object", additionalProperties: false, properties: {} },
    output: { schema: { type: "object", additionalProperties: true }, render: (_a, v) => [{ type: "text", text: JSON.stringify(v, null, 2) }] },
    timeoutMs: 8_000,
    isConcurrencySafe: () => true,
    async execute() {
      return pkgStatus();
    },
    presentCall: () => ({ card: "generic", title: "pkg status" }),
    presentResult: (_a, r) => ({ card: "generic", title: "pkg status", content: r.content }),
  });

  ctx.tools.register({
    name: "pkg_npm_outdated",
    description: "npm outdated --json summary for a project dir (read-only; does not upgrade).",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["dir"],
      properties: { dir: { type: "string" } },
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_a, v) => [
        {
          type: "text",
          text:
            v.ok === false
              ? v.error
              : (v.packages || [])
                  .map((p) => `${p.name}\tcurrent=${p.current}\twanted=${p.wanted}\tlatest=${p.latest}`)
                  .join("\n") ||
                v.output ||
                "(none outdated)",
        },
      ],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      try {
        return await npmOutdated({ dir: args.dir, allowRoots, timeoutMs });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "npm outdated" }),
    presentResult: (_a, r) => ({ card: "generic", title: "npm outdated", content: r.content }),
  });

  ctx.tools.register({
    name: "pkg_npm_ls",
    description: "npm ls --json shallow summary for a project dir (depth 0–3).",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["dir"],
      properties: { dir: { type: "string" }, depth: { type: "number" } },
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_a, v) => [{ type: "text", text: v.ok === false ? v.error : JSON.stringify(v.tree || v, null, 2) }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      try {
        return await npmLs({ dir: args.dir, depth: args.depth, allowRoots, timeoutMs });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "npm ls" }),
    presentResult: (_a, r) => ({ card: "generic", title: "npm ls", content: r.content }),
  });

  ctx.tools.register({
    name: "pkg_pip_list",
    description: "pip list --format=json (capped names).",
    parameters: { type: "object", additionalProperties: false, properties: {} },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_a, v) => [
        {
          type: "text",
          text: v.ok === false ? v.error : (v.packages || []).map((p) => `${p.name}==${p.version}`).join("\n"),
        },
      ],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute() {
      try {
        return await pipList({ timeoutMs });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "pip list" }),
    presentResult: (_a, r) => ({ card: "generic", title: "pip list", content: r.content }),
  });

  ctx.tools.register({
    name: "pkg_cargo_tree",
    description: "cargo tree -d 1 in a Rust project dir.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["dir"],
      properties: { dir: { type: "string" } },
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_a, v) => [{ type: "text", text: v.ok === false ? v.error : v.output }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      try {
        return await cargoTree({ dir: args.dir, allowRoots, timeoutMs });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "cargo tree" }),
    presentResult: (_a, r) => ({ card: "generic", title: "cargo tree", content: r.content }),
  });
}

function positive(v, fb) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fb;
}
