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

  var overlay = null;
  var viewEl = null;

  function ensureModal() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.id = "sb-auth-modal";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(36,27,47,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;";
    overlay.innerHTML =
      '<div style="background:var(--card,#fff);border-radius:16px;max-width:400px;width:100%;padding:28px;font-family:Inter,sans-serif;position:relative;max-height:90vh;overflow-y:auto;">' +
        '<button id="sb-modal-close" style="position:absolute;top:14px;right:14px;background:none;border:none;font-size:20px;color:var(--muted,#6E6379);cursor:pointer;line-height:1;">×</button>' +
        '<div id="sb-view"></div>' +
      "</div>";
    document.body.appendChild(overlay);
    viewEl = overlay.querySelector("#sb-view");
    overlay.querySelector("#sb-modal-close").addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
  }
  function closeModal() {
    if (overlay) {
      overlay.remove();
      overlay = null;
      viewEl = null;
    }
  }

  function inputStyle() {
    return "width:100%;padding:11px 14px;margin-bottom:10px;border:1px solid var(--line,#E4D9CC);border-radius:10px;font-size:14px;box-sizing:border-box;";
  }
  function btnPrimaryStyle() {
    return "width:100%;background:var(--coral-deep,#B93F2E);color:#fff;border:none;padding:12px;border-radius:24px;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:10px;";
  }
  function btnGhostStyle() {
    return "width:100%;background:none;color:var(--ink,#241B2F);border:1px solid var(--line,#E4D9CC);padding:12px;border-radius:24px;font-size:14px;font-weight:500;cursor:pointer;";
  }

  function showError(msg) {
    var e = viewEl.querySelector("#sb-err");
    if (e) {
      e.textContent = msg;
      e.style.display = "block";
    }
  }

  var AUTH_ERROR_MAP = {
    "invalid login credentials": "Email ou mot de passe incorrect.",
    "email not confirmed": "Adresse email non confirmée. Vérifie ta boîte mail (et les spams).",
    "user already registered": "Un compte existe déjà avec cette adresse email.",
    "signup requires a valid password": "Mot de passe invalide.",
    "unable to validate email address: invalid format": "Adresse email invalide.",
    "email rate limit exceeded": "Trop d'emails envoyés. Réessaie dans quelques minutes.",
    "token has expired or is invalid": "Le code a expiré ou est invalide. Réessaie.",
    "invalid refresh token: refresh token not found": "Session expirée. Reconnecte-toi.",
    "mfa factor not found": "Méthode de vérification introuvable. Reconnecte-toi.",
    "too many requests": "Trop de tentatives. Réessaie dans un instant.",
    "enrolled factors exceed allowed limit, unenroll to continue": "Trop de méthodes de sécurité enregistrées. Contacte l'agence."
  };

  function translateAuthError(message) {
    if (!message) return "Une erreur est survenue. Réessaie.";
    var m = message.toLowerCase().trim();
    if (AUTH_ERROR_MAP[m]) return AUTH_ERROR_MAP[m];
    if (m.indexOf("password should be at least") !== -1) {
      return "Le mot de passe est trop court (6 caractères minimum).";
    }
    if (m.indexOf("for security purposes") !== -1) {
      return "Trop de tentatives. Merci de patienter quelques secondes avant de réessayer.";
    }
    if (m.indexOf("rate limit") !== -1) {
      return "Trop de tentatives. Réessaie dans quelques minutes.";
    }
    if (m.indexOf("network") !== -1 || m.indexOf("fetch") !== -1) {
      return "Problème de connexion réseau. Vérifie ta connexion et réessaie.";
    }
    return "Une erreur est survenue (" + message + "). Réessaie ou contacte l'agence si ça persiste.";
  }

  function eyeIconSVG(open) {
    if (open) {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    }
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
  }

  function passwordFieldHTML(id, autocomplete) {
    return '<div style="position:relative;margin-bottom:10px;">' +
      '<input id="' + id + '" type="password" placeholder="Mot de passe" autocomplete="' + autocomplete + '" style="' + inputStyle().replace("margin-bottom:10px;", "margin-bottom:0;") + "padding-right:42px;" + '">' +
      '<button type="button" id="' + id + '-toggle" aria-label="Afficher le mot de passe" style="position:absolute;top:50%;right:8px;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:6px;display:flex;color:var(--muted,#6E6379);">' + eyeIconSVG(false) + '</button>' +
    '</div>';
  }

  function wirePasswordToggle(id) {
    var btn = document.getElementById(id + "-toggle");
    var input = document.getElementById(id);
    if (!btn || !input) return;
    btn.addEventListener("click", function () {
      var showing = input.type === "text";
      input.type = showing ? "password" : "text";
      btn.innerHTML = eyeIconSVG(!showing);
      btn.setAttribute("aria-label", showing ? "Afficher le mot de passe" : "Masquer le mot de passe");
      input.focus();
    });
  }

  function renderAuthStep() {
    viewEl.innerHTML =
      '<div style="font-family:Fraunces,serif;font-weight:700;font-size:19px;color:var(--ink,#241B2F);margin-bottom:18px;">Connexion / Inscription</div>' +
      '<div id="sb-err" style="display:none;background:#FAECE7;color:#B93F2E;font-size:13px;padding:10px 12px;border-radius:8px;margin-bottom:14px;"></div>' +
      '<input id="sb-email" type="email" placeholder="Email" autocomplete="email" style="' + inputStyle() + '">' +
      passwordFieldHTML("sb-password", "current-password") +
      '<button id="sb-login-btn" style="' + btnPrimaryStyle() + '">Se connecter</button>' +
      '<button id="sb-signup-btn" style="' + btnGhostStyle() + '">Créer un compte</button>' +
      '<div style="color:var(--muted,#6E6379);font-size:12px;margin-top:14px;text-align:center;">Une vérification en deux étapes (code à 6 chiffres) est requise à chaque connexion.</div>';

    wirePasswordToggle("sb-password");

    document.getElementById("sb-login-btn").addEventListener("click", function () {
      var email = document.getElementById("sb-email").value.trim();
      var password = document.getElementById("sb-password").value;
      if (!email || !password) return showError("Renseigne ton email et ton mot de passe.");
      window.sbClient.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
        if (res.error) return showError(translateAuthError(res.error.message));
        afterAuth();
      });
    });

    document.getElementById("sb-signup-btn").addEventListener("click", function () {
      var email = document.getElementById("sb-email").value.trim();
      var password = document.getElementById("sb-password").value;
      if (!email || !password) return showError("Renseigne un email et un mot de passe.");
      if (password.length < 6) return showError("Le mot de passe doit faire au moins 6 caractères.");
      window.sbClient.auth.signUp({ email: email, password: password }).then(function (res) {
        if (res.error) return showError(translateAuthError(res.error.message));
        if (res.data.session) {
          afterAuth();
        } else {
          viewEl.innerHTML =
            '<div style="font-family:Fraunces,serif;font-weight:700;font-size:19px;color:var(--ink,#241B2F);margin-bottom:14px;">Vérifie ta boîte mail</div>' +
            '<div style="color:var(--muted,#6E6379);font-size:14px;">Compte créé. Confirme ton adresse via l\'email reçu, puis reviens te connecter — la mise en place du code à 6 chiffres se fera à ce moment-là.</div>';
        }
      });
    });
  }

  function afterAuth() {
    var mfa = window.sbClient.auth.mfa;
    mfa.listFactors().then(function (res) {
      if (res.error) return showError(translateAuthError(res.error.message));
      var totp = (res.data.totp || []).find(function (f) { return f.status === "verified"; });
      if (!totp) {
        renderEnrollStep();
      } else {
        mfa.getAuthenticatorAssuranceLevel().then(function (aalRes) {
          if (aalRes.data && aalRes.data.currentLevel === "aal2") {
            finishLogin();
          } else {
            renderChallengeStep(totp.id);
          }
        });
      }
    });
  }

  function renderEnrollStep() {
    viewEl.innerHTML = '<div style="text-align:center;color:var(--muted,#6E6379);font-size:14px;">Préparation du code de sécurité…</div>';
    window.sbClient.auth.mfa.enroll({ factorType: "totp" }).then(function (res) {
      if (res.error) return showError(translateAuthError(res.error.message));
      var factorId = res.data.id;
      var qr = res.data.totp.qr_code;
      var secret = res.data.totp.secret;
      viewEl.innerHTML =
        '<div style="font-family:Fraunces,serif;font-weight:700;font-size:19px;color:var(--ink,#241B2F);margin-bottom:10px;">Active la vérification en 2 étapes</div>' +
        '<div style="color:var(--muted,#6E6379);font-size:13px;margin-bottom:14px;">Obligatoire. Scanne ce code avec Google Authenticator (ou une app équivalente), ou entre la clé manuellement.</div>' +
        '<div style="text-align:center;margin-bottom:12px;"><img src="' + qr + '" alt="QR code" style="width:160px;height:160px;"></div>' +
        '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:12px;background:var(--teal-bg,#E7F1EF);padding:8px;border-radius:8px;text-align:center;word-break:break-all;margin-bottom:14px;">' + secret + '</div>' +
        '<div id="sb-err" style="display:none;background:#FAECE7;color:#B93F2E;font-size:13px;padding:10px 12px;border-radius:8px;margin-bottom:14px;"></div>' +
        '<input id="sb-code" type="text" inputmode="numeric" maxlength="6" placeholder="Code à 6 chiffres" style="' + inputStyle() + 'text-align:center;letter-spacing:4px;">' +
        '<button id="sb-confirm-btn" style="' + btnPrimaryStyle() + '">Confirmer et activer</button>';

      document.getElementById("sb-confirm-btn").addEventListener("click", function () {
        var code = document.getElementById("sb-code").value.trim();
        if (!code) return showError("Entre le code affiché sur ton application.");
        window.sbClient.auth.mfa.challenge({ factorId: factorId }).then(function (chRes) {
          if (chRes.error) return showError(translateAuthError(chRes.error.message));
          window.sbClient.auth.mfa.verify({ factorId: factorId, challengeId: chRes.data.id, code: code }).then(function (vRes) {
            if (vRes.error) return showError("Code incorrect, réessaie.");
            finishLogin();
          });
        });
      });
    });
  }

  function renderChallengeStep(factorId) {
    viewEl.innerHTML =
      '<div style="font-family:Fraunces,serif;font-weight:700;font-size:19px;color:var(--ink,#241B2F);margin-bottom:14px;">Code de vérification</div>' +
      '<div style="color:var(--muted,#6E6379);font-size:13px;margin-bottom:14px;">Entre le code à 6 chiffres généré par ton application d\'authentification.</div>' +
      '<div id="sb-err" style="display:none;background:#FAECE7;color:#B93F2E;font-size:13px;padding:10px 12px;border-radius:8px;margin-bottom:14px;"></div>' +
      '<input id="sb-code" type="text" inputmode="numeric" maxlength="6" placeholder="Code à 6 chiffres" style="' + inputStyle() + 'text-align:center;letter-spacing:4px;">' +
      '<button id="sb-confirm-btn" style="' + btnPrimaryStyle() + '">Valider</button>';

    document.getElementById("sb-confirm-btn").addEventListener("click", function () {
      var code = document.getElementById("sb-code").value.trim();
      if (!code) return showError("Entre le code affiché sur ton application.");
      window.sbClient.auth.mfa.challenge({ factorId: factorId }).then(function (chRes) {
        if (chRes.error) return showError(translateAuthError(chRes.error.message));
        window.sbClient.auth.mfa.verify({ factorId: factorId, challengeId: chRes.data.id, code: code }).then(function (vRes) {
          if (vRes.error) return showError("Code incorrect, réessaie.");
          finishLogin();
        });
      });
    });
  }

  function finishLogin() {
    window.sbClient.auth.getSession().then(function (res) {
      var session = res.data.session;
      if (session) setCookie(session.access_token, session.expires_in);
      closeModal();
      var next = new URLSearchParams(window.location.search).get("next");
      // On ne suit "next" que s'il s'agit d'un chemin local (sécurité anti-open-redirect).
      if (next && next.indexOf("/") === 0 && next.indexOf("//") !== 0) {
        window.location.href = next;
      } else {
        window.location.reload();
      }
    });
  }

  function openAuthModal() {
    ensureModal();
    renderAuthStep();
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
      if (event === "SIGNED_OUT") {
        clearCookie();
        renderNav(null);
      }
    });

    client.auth.getSession().then(function (res) {
      var session = res.data.session;
      if (!session) {
        renderNav(null);
        return;
      }
      client.auth.mfa.getAuthenticatorAssuranceLevel().then(function (aalRes) {
        if (aalRes.data && aalRes.data.currentLevel === "aal2") {
          setCookie(session.access_token, session.expires_in);
          renderNav(session.user);
        } else {
          clearCookie();
          renderNav(null);
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
