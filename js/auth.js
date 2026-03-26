// ── ThinkHere — Cognito Auth (Authorization Code + PKCE) ──

const AUTH_CONFIG = {
  userPoolId: "us-east-1_LSizPNStx",
  clientId: "21r4hda7dvc55rktfpmuj78ife",
  cognitoDomain: "thinkhere.auth.us-east-1.amazoncognito.com",
  region: "us-east-1",
  signInRedirectUri: "https://thinkhere.ai/",
  signOutRedirectUri: "https://thinkhere.ai/",
  appUrl: "https://app.thinkhere.ai",
  scopes: ["openid", "email", "profile"],
};

// ── PKCE Helpers ──
function generateRandomString(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("").slice(0, length);
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ── Build Auth URLs ──
async function getSignInUrl() {
  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem("thinkhere_pkce_verifier", verifier);

  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.clientId,
    response_type: "code",
    scope: AUTH_CONFIG.scopes.join(" "),
    redirect_uri: AUTH_CONFIG.signInRedirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });
  return `https://${AUTH_CONFIG.cognitoDomain}/login?${params}`;
}

async function getSignUpUrl() {
  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem("thinkhere_pkce_verifier", verifier);

  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.clientId,
    response_type: "code",
    scope: AUTH_CONFIG.scopes.join(" "),
    redirect_uri: AUTH_CONFIG.signInRedirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });
  return `https://${AUTH_CONFIG.cognitoDomain}/signup?${params}`;
}

function getSignOutUrl() {
  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.clientId,
    logout_uri: AUTH_CONFIG.signOutRedirectUri,
  });
  return `https://${AUTH_CONFIG.cognitoDomain}/logout?${params}`;
}

// ── Token Exchange ──
async function exchangeCodeForTokens(code) {
  const verifier = sessionStorage.getItem("thinkhere_pkce_verifier");
  if (!verifier) {
    console.error("No PKCE verifier found");
    return null;
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: AUTH_CONFIG.clientId,
    code,
    redirect_uri: AUTH_CONFIG.signInRedirectUri,
    code_verifier: verifier,
  });

  try {
    const resp = await fetch(`https://${AUTH_CONFIG.cognitoDomain}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!resp.ok) {
      console.error("Token exchange failed:", resp.status, await resp.text());
      return null;
    }

    const data = await resp.json();
    sessionStorage.removeItem("thinkhere_pkce_verifier");

    return {
      idToken: data.id_token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresIn: data.expires_in || 3600,
      timestamp: Date.now(),
    };
  } catch (e) {
    console.error("Token exchange error:", e);
    return null;
  }
}

// ── JWT Parsing ──
function parseJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// ── Token Storage ──
function storeTokens(tokens) {
  sessionStorage.setItem("thinkhere_tokens", JSON.stringify(tokens));
}

function getStoredTokens() {
  try {
    const raw = sessionStorage.getItem("thinkhere_tokens");
    if (!raw) return null;
    const tokens = JSON.parse(raw);
    const elapsed = (Date.now() - tokens.timestamp) / 1000;
    if (elapsed >= tokens.expiresIn) {
      sessionStorage.removeItem("thinkhere_tokens");
      return null;
    }
    return tokens;
  } catch {
    return null;
  }
}

function clearTokens() {
  sessionStorage.removeItem("thinkhere_tokens");
  sessionStorage.removeItem("thinkhere_pkce_verifier");
}

// ── Auth Actions ──
window.signIn = async function () {
  window.location.href = await getSignInUrl();
};

window.signUp = async function () {
  window.location.href = await getSignUpUrl();
};

window.signOut = function () {
  clearTokens();
  window.location.href = getSignOutUrl();
};

// ── Check Auth State ──
function isAuthenticated() {
  return getStoredTokens() !== null;
}

function getAuthenticatedUser() {
  const tokens = getStoredTokens();
  if (!tokens) return null;
  const payload = parseJwtPayload(tokens.idToken);
  return {
    email: payload?.email || "",
    sub: payload?.sub || "",
  };
}

// ── Init ──
(async function () {
  // Check for authorization code in URL params (returning from Cognito)
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (code) {
    const tokens = await exchangeCodeForTokens(code);
    if (tokens) {
      storeTokens(tokens);
      // Clean URL and reload
      window.history.replaceState(null, "", window.location.pathname);
      window.location.reload();
      return;
    }
  }

  // Update UI if authenticated
  if (isAuthenticated()) {
    const user = getAuthenticatedUser();
    const signInBtn = document.getElementById("signInBtn");
    const createAccountBtn = document.getElementById("createAccountBtn");
    const sidebarSignInBtn = document.getElementById("sidebarSignInBtn");

    if (signInBtn && user) {
      signInBtn.textContent = "Sign out";
      signInBtn.onclick = () => window.signOut();
    }
    if (createAccountBtn && user) {
      createAccountBtn.textContent = user.email;
      createAccountBtn.onclick = null;
      createAccountBtn.style.cursor = "default";
    }
    if (sidebarSignInBtn) {
      sidebarSignInBtn.textContent = user.email;
      sidebarSignInBtn.onclick = null;
    }
  }
})();
