// Protège les pages réservées : /membre, /dashboard, /sous-agents
// (avec ou sans ".html"). Il faut être connecté ET avoir un accès actif.
//   - non connecté           -> /connexion-requise.html
//   - connecté, sans accès   -> /activer-acces.html
//   - /sous-agents           -> rôle sub_agent ou admin uniquement (sinon /membre)
const SUPABASE_URL = "https://exlzfvatjonglxqsplvr.supabase.co";
const SUPABASE_KEY = "sb_publishable_lrRP0LYEwPm8C48qmw0Z_w_WrpxbHBm";

const SUB_AGENT_ROLES = ["sub_agent", "admin"];

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\.html$/, "").replace(/\/+$/, "") || "/";

  const loginUrl = new URL("/connexion-requise.html", request.url);
  loginUrl.searchParams.set("next", url.pathname);
  const activateUrl = new URL("/activer-acces.html", request.url);

  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
  const token = match ? match[1] : null;
  if (!token) return Response.redirect(loginUrl, 302);

  let rows;
  try {
    // PostgREST vérifie lui-même le jeton ; la règle RLS ne renvoie que SA ligne.
    const res = await fetch(SUPABASE_URL + "/rest/v1/members?select=role,status&limit=1", {
      headers: { Authorization: "Bearer " + token, apikey: SUPABASE_KEY },
    });
    if (res.status === 401 || res.status === 403) return Response.redirect(loginUrl, 302);
    if (!res.ok) return Response.redirect(loginUrl, 302); // en cas de doute : fermé
    rows = await res.json();
  } catch (e) {
    return Response.redirect(loginUrl, 302);
  }

  const m = Array.isArray(rows) ? rows[0] : null;
  if (!m || m.status !== "active") return Response.redirect(activateUrl, 302);

  if (path === "/sous-agents" && !SUB_AGENT_ROLES.includes(m.role)) {
    return Response.redirect(new URL("/membre", request.url), 302);
  }

  const response = await context.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
};
