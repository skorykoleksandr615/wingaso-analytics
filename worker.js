const enc = new TextEncoder();
const COOKIE = "wa_session";
const TTL = 60 * 60 * 24 * 14;
const PUBLIC = [
  /^\/login$/,
  /^\/login\.html$/,
  /^\/assets\//,
  /^\/css\/style\.css$/,
  /^\/favicon/,
  /^\/site\.webmanifest$/
];

function isPublic(path) {
  return PUBLIC.some((re) => re.test(path));
}

function parseCookie(header) {
  const out = {};
  String(header || "").split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function b64url(bytes) {
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(text));
  return b64url(new Uint8Array(sig));
}

async function shaHex(text) {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function same(a, b) {
  return (await shaHex(String(a))) === (await shaHex(String(b)));
}

async function makeToken(env, user) {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const payload = `${user}.${exp}`;
  const sig = await hmac(env.SESSION_SECRET, payload);
  return `${payload}.${sig}`;
}

async function validSession(request, env) {
  if (!env.SESSION_SECRET) return false;
  const token = parseCookie(request.headers.get("Cookie"))[COOKIE];
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length < 3) return false;
  const sig = parts.pop();
  const payload = parts.join(".");
  const exp = Number(payload.split(".").pop());
  if (!exp || exp < Math.floor(Date.now() / 1000)) return false;
  const expect = await hmac(env.SESSION_SECRET, payload);
  return await same(sig, expect);
}

function cookieHeader(value, maxAge) {
  return `${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function redirect(url, headers) {
  return new Response(null, { status: 302, headers: { Location: url, ...headers } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }

    const authed = await validSession(request, env);

    if ((url.pathname === "/login" || url.pathname === "/login.html") && request.method === "POST") {
      const form = await request.formData();
      const user = String(form.get("username") || "");
      const pass = String(form.get("password") || "");
      const ok = env.ADMIN_USER && env.ADMIN_PASS && env.SESSION_SECRET
        && await same(user, env.ADMIN_USER)
        && await same(pass, env.ADMIN_PASS);
      if (!ok) return redirect("/login?e=1");
      const token = await makeToken(env, user);
      return redirect("/", { "Set-Cookie": cookieHeader(token, TTL) });
    }

    if (url.pathname === "/logout") {
      return redirect("/login", { "Set-Cookie": cookieHeader("", 0) });
    }

    if ((url.pathname === "/login" || url.pathname === "/login.html") && authed) {
      return redirect("/");
    }

    if (!isPublic(url.pathname) && !authed) {
      if (url.pathname.startsWith("/data/") || url.pathname.endsWith(".json") || url.pathname.startsWith("/js/")) {
        return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
      }
      return redirect("/login");
    }

    if (url.pathname === "/login") {
      url.pathname = "/login.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "no-store");
    return new Response(res.body, { status: res.status, headers });
  }
};
