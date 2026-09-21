(function () {
  var SUPABASE_URL = "https://exlzfvatjonglxqsplvr.supabase.co";
  var SUPABASE_KEY = "sb_publishable_lrRP0LYEwPm8C48qmw0Z_w_WrpxbHBm";
  var COOKIE_NAME = "sb-access-token";

  function setCookie(token, maxAge) {
    document.cookie = COOKIE_NAME + "=" + token + "; path=/; max-age=" + (maxAge || 3600) + "; SameSite=Lax";
  }
  function clearCookie() {
    document.cookie = COOKIE_NAME + "=; path=/; max-age=0";
  }

  function renderNav(user) {
    var slot = document.getElementById("nav-auth");
    if (!slot) return;
    if (user) {
      var label = user.email || "Mon compte";
      if (label.length > 20) label = label.slice(0, 18) + "…";
      slot.innerHTML =
        '<span style="font-size:13px;color:var(--muted);margin-right:6px;">' + label + "</span>" +
        '<button id="nav-logout-btn" class="nav-cta" style="background:none;color:var(--muted);border:1px solid var(--line);padding:8px 14px;">Déconnexion</button>';
      document.getElementById("nav-logout-btn").addEventListener("click", function () {
        window.sbClient.auth.signOut().then(function () {
          clearCookie();
          window.location.href = "/index.html";
        });
      });
    } else {
      slot.innerHTML = '<button id="nav-login-btn" class="nav-cta" style="background:none;color:var(--ink);border:1px solid var(--line);">Connexion</button>';
      document.getElementById("nav-login-btn").addEventListener("click", openAuthModal);
    }
  }

  function openAuthModal() {
    if (document.getElementById("sb-auth-modal")) return;
    var overlay = document.createElement("div");
    overlay.id = "sb-auth-modal";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(36,27,47,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;";
    overlay.innerHTML =
      '<div style="background:var(--card,#fff);border-radius:16px;max-width:380px;width:100%;padding:28px;font-family:Inter,sans-serif;position:relative;">' +
        '<button id="sb-modal-close" style="position:absolute;top:14px;right:14px;background:none;border:none;font-size:20px;color:var(--muted,#6E6379);cursor:pointer;line-height:1;">×</button>' +
        '<div style="font-family:Fraunces,serif;font-weight:700;font-size:19px;color:var(--ink,#241B2F);margin-bottom:18px;">Connexion / Inscription</div>' +
        '<div id="sb-modal-error" style="display:none;background:#FAECE7;color:#B93F2E;font-size:13px;padding:10px 12px;border-radius:8px;margin-bottom:14px;"></div>' +
        '<input id="sb-email" type="email" placeholder="Email" autocomplete="email" style="width:100%;padding:11px 14px;margin-bottom:10px;border:1px solid var(--line,#E4D9CC);border-radius:10px;font-size:14px;">' +
        '<input id="sb-password" type="password" placeholder="Mot de passe" autocomplete="current-password" style="width:100%;padding:11px 14px;margin-bottom:16px;border:1px solid var(--line,#E4D9CC);border-radius:10px;font-size:14px;">' +
        '<button id="sb-login-btn" style="width:100%;background:var(--coral-deep,#B93F2E);color:#fff;border:none;padding:12px;border-radius:24px;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:10px;">Se connecter</button>' +
        '<button id="sb-signup-btn" style="width:100%;background:none;color:var(--ink,#241B2F);border:1px solid var(--line,#E4D9CC);padding:12px;border-radius:24px;font-size:14px;font-weight:500;cursor:pointer;">Créer un compte</button>' +
        '<div id="sb-modal-info" style="display:none;color:var(--muted,#6E6379);font-size:12px;margin-top:12px;text-align:center;"></div>' +
      "</div>";
    document.body.appendChild(overlay);

    function showError(msg) {
      var e = document.getElementById("sb-modal-error");
      e.textContent = msg;
      e.style.display = "block";
    }
    function showInfo(msg) {
      var i = document.getElementById("sb-modal-info");
      i.textContent = msg;
      i.style.display = "block";
    }

    document.getElementById("sb-modal-close").addEventListener("click", function () {
      overlay.remove();
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.remove();
    });

    document.getElementById("sb-login-btn").addEventListener("click", function () {
      var email = document.getElementById("sb-email").value.trim();
      var password = document.getElementById("sb-password").value;
      if (!email || !password) return showError("Renseigne ton email et ton mot de passe.");
      window.sbClient.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
        if (res.error) return showError(res.error.message);
        overlay.remove();
        window.location.reload();
      });
    });

    document.getElementById("sb-signup-btn").addEventListener("click", function () {
      var email = document.getElementById("sb-email").value.trim();
      var password = document.getElementById("sb-password").value;
      if (!email || !password) return showError("Renseigne un email et un mot de passe.");
      if (password.length < 6) return showError("Le mot de passe doit faire au moins 6 caractères.");
      window.sbClient.auth.signUp({ email: email, password: password }).then(function (res) {
        if (res.error) return showError(res.error.message);
        if (res.data.session) {
          overlay.remove();
          window.location.reload();
        } else {
          showInfo("Compte créé. Vérifie ta boîte mail pour confirmer ton adresse avant de te connecter.");
        }
      });
    });
  }
  window.openAuthModal = openAuthModal;

  function boot() {
    if (!window.supabase) {
      setTimeout(boot, 150);
      return;
    }
    var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    window.sbClient = client;

    client.auth.onAuthStateChange(function (event, session) {
      if (session) setCookie(session.access_token, session.expires_in);
      else clearCookie();
      renderNav(session ? session.user : null);
    });

    client.auth.getSession().then(function (res) {
      var session = res.data.session;
      if (session) setCookie(session.access_token, session.expires_in);
      renderNav(session ? session.user : null);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
