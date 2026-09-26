import { spawn } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { resolve } from "node:path";

export function which(cmd) {
  const safe = String(cmd || "").replace(/[^a-zA-Z0-9._+-]/g, "");
  if (!safe) return Promise.resolve("");
  return new Promise((r) => {
    const child = spawn("bash", ["-lc", `command -v ${safe}`], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("close", (c) => r(c === 0 ? out.trim() : ""));
  });
}

export function resolveDir(dir, allowRoots = []) {
  const abs = resolve(String(dir || ".").trim() || ".");
  const real = existsSync(abs) ? realpathSync(abs) : abs;
  if (allowRoots.length) {
    const roots = allowRoots.map((r) => {
      const a = resolve(r);
      return existsSync(a) ? realpathSync(a) : a;
    });
    const ok = roots.some((root) => {
      const x = root.replace(/[/\\]+$/, "");
      return real === x || real.startsWith(x + "/") || real.startsWith(x + "\\");
    });
    if (!ok) throw new Error(`dir outside allowRoots: ${real}`);
  }
  return real;
}

export function run(bin, args, { cwd, timeoutMs = 60_000, maxOut = 40_000 } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(bin, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const t = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("timeout"));
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      stdout += d;
      if (stdout.length > maxOut * 2) child.kill("SIGKILL");
    });
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code) => {
      clearTimeout(t);
      resolvePromise({
        code,
        stdout: stdout.slice(0, maxOut),
        stderr: stderr.slice(0, 4000),
        truncated: stdout.length > maxOut,
      });
    });
    child.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export async function pkgStatus() {
  const npm = (await which("npm")) || null;
  const pip = (await which("pip")) || (await which("pip3")) || null;
  const cargo = (await which("cargo")) || null;
  let npmVersion = null;
  if (npm) {
    try {
      const r = await run(npm, ["--version"], { timeoutMs: 8_000, maxOut: 200 });
      npmVersion = (r.stdout || "").trim() || null;
    } catch {
      /* ignore */
    }
  }
  return { ok: true, npm, npmVersion, pip, cargo };
}

export async function npmOutdated({ dir, allowRoots, timeoutMs, maxOut = 40_000 } = {}) {
  const cwd = resolveDir(dir, allowRoots);
  const bin = (await which("npm")) || "npm";
  const r = await run(bin, ["outdated", "--json"], { cwd, timeoutMs, maxOut });
  // npm outdated exits 1 when updates exist
  let json = {};
  try {
    json = JSON.parse(r.stdout || "{}");
  } catch {
    return { ok: true, dir: cwd, exitCode: r.code, output: r.stdout.slice(0, maxOut), truncated: r.truncated };
  }
  const names = Object.keys(json || {}).slice(0, 80);
  const packages = names.map((name) => ({
    name,
    current: json[name].current,
    wanted: json[name].wanted,
    latest: json[name].latest,
    type: json[name].type,
  }));
  return {
    ok: true,
    dir: cwd,
    count: packages.length,
    exitCode: r.code,
    truncated: r.truncated || Object.keys(json || {}).length > 80,
    packages,
  };
}

export async function npmLs({ dir, depth = 0, allowRoots, timeoutMs } = {}) {
  const cwd = resolveDir(dir, allowRoots);
  const d = Math.min(3, Math.max(0, Number(depth) || 0));
  const bin = (await which("npm")) || "npm";
  const r = await run(bin, ["ls", "--all", `--depth=${d}`, "--json"], { cwd, timeoutMs, maxOut: 40_000 });
  // npm ls exits 1 on peer issues — still parse
  let json;
  try {
    json = JSON.parse(r.stdout || "{}");
  } catch {
    return { ok: true, dir: cwd, output: r.stdout, truncated: r.truncated };
  }
  return {
    ok: true,
    dir: cwd,
    name: json.name,
    version: json.version,
    problems: json.problems || null,
    truncated: r.truncated,
    tree: summarizeNpm(json, d),
  };
}

function summarizeNpm(node, depthLeft) {
  if (!node || typeof node !== "object") return null;
  const deps = node.dependencies || {};
  const keys = Object.keys(deps).slice(0, 80);
  const out = {};
  for (const k of keys) {
    const child = deps[k];
    out[k] = {
      version: child.version,
      ...(depthLeft > 0 ? { dependencies: summarizeNpm(child, depthLeft - 1) } : {}),
    };
  }
  return out;
}

export async function pipList({ timeoutMs } = {}) {
  const bin = (await which("pip")) || (await which("pip3")) || "pip";
  const r = await run(bin, ["list", "--format=json"], { timeoutMs, maxOut: 40_000 });
  if (r.code !== 0) throw new Error(`pip list failed: ${r.stderr || r.code}`);
  let items;
  try {
    items = JSON.parse(r.stdout || "[]");
  } catch {
    return { ok: true, output: r.stdout };
  }
  const list = (Array.isArray(items) ? items : []).slice(0, 200).map((p) => ({ name: p.name, version: p.version }));
  return { ok: true, count: list.length, packages: list };
}

export async function cargoTree({ dir, allowRoots, timeoutMs } = {}) {
  const cwd = resolveDir(dir, allowRoots);
  const bin = (await which("cargo")) || "cargo";
  const r = await run(bin, ["tree", "-d", "1"], { cwd, timeoutMs, maxOut: 40_000 });
  if (r.code !== 0) throw new Error(`cargo tree failed: ${r.stderr || r.code}`);
  return { ok: true, dir: cwd, truncated: r.truncated, output: r.stdout };
}
