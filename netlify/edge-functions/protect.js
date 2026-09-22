// S'exécute avant de servir /sous-agents.html et /dashboard.html (voir netlify.toml).
// Vérifie le cookie de session auprès de Supabase ; si absent ou invalide,
// redirige vers /connexion-requise.html au lieu de laisser passer la page.

const SUPABASE_URL = "https://exlzfvatjonglxqsplvr.supabase.co";
const SUPABASE_KEY = "sb_publishable_lrRP0LYEwPm8C48qmw0Z_w_WrpxbHBm";

export default async (request, context) => {
  const url = new URL(request.url);
  const loginUrl = new URL("/connexion-requise.html", request.url);
  loginUrl.searchParams.set("next", url.pathname);

  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/sb-access-token=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    return Response.redirect(loginUrl, 302);
  }

  try {
    const res = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: {
        Authorization: "Bearer " + token,
        apikey: SUPABASE_KEY,
      },
    });
    if (!res.ok) {
      return Response.redirect(loginUrl, 302);
    }
  } catch (e) {
    return Response.redirect(loginUrl, 302);
  }

  // Token valide : on laisse la page se servir normalement.
  return context.next();
};
