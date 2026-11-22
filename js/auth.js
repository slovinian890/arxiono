// Shared auth: Supabase session, the login/signup modal, and the nav widget.
// Used by every page. Other scripts (community.js) read window.ArxionoAuth
// instead of creating their own Supabase client or modal.
(function () {
  "use strict";

  if (!window.supabase || !window.SUPABASE_URL || window.SUPABASE_URL.includes("YOUR-PROJECT")) {
    window.ArxionoAuth = {
      ready: false,
      user: null,
      profile: null,
      onChange: function () {},
      requireLogin: function () {},
    };
    return;
  }

  var sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  var state = { user: null, profile: null };
  var listeners = [];

  var authModal = document.getElementById("authModal");
  var authModalClose = document.getElementById("authModalClose");
  var authModalTitle = document.getElementById("authModalTitle");
  var loginForm = document.getElementById("loginForm");
  var signupForm = document.getElementById("signupForm");
  var loginError = document.getElementById("loginError");
  var signupError = document.getElementById("signupError");
  var authConfirm = document.getElementById("authConfirm");
  var authConfirmOk = document.getElementById("authConfirmOk");
  var authTabs = authModal ? authModal.querySelectorAll(".modal-tab") : [];

  var navAuthDesktop = document.getElementById("navAuth");
  var navAuthMobile = document.getElementById("navAuthMobile");

  function showError(el, message) {
    el.textContent = message;
    el.hidden = false;
  }
  function hideError(el) {
    el.hidden = true;
  }

  function setAuthTab(tab) {
    var isLogin = tab === "login";
    loginForm.hidden = !isLogin;
    signupForm.hidden = isLogin;
    authConfirm.hidden = true;
    authModalTitle.textContent = isLogin ? "Welcome back" : "Join the community";
    authTabs.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.tab === tab);
      btn.hidden = false;
    });
  }

  function showSignupConfirmation() {
    loginForm.hidden = true;
    signupForm.hidden = true;
    authConfirm.hidden = false;
    authModalTitle.textContent = "Almost there";
    authTabs.forEach(function (btn) {
      btn.hidden = true;
    });
  }

  function openAuthModal(tab) {
    if (!authModal) {
      window.location.href = "/community.html";
      return;
    }
    authModal.hidden = false;
    setAuthTab(tab || "login");
  }

  function closeAuthModal() {
    authModal.hidden = true;
    hideError(loginError);
    hideError(signupError);
    loginForm.reset();
    signupForm.reset();
  }

  if (authModal) {
    authTabs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setAuthTab(btn.dataset.tab);
      });
    });
    authModalClose.addEventListener("click", closeAuthModal);
    authModal.addEventListener("click", function (e) {
      if (e.target === authModal) closeAuthModal();
    });
    authConfirmOk.addEventListener("click", closeAuthModal);

    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideError(loginError);
      var email = document.getElementById("loginEmail").value.trim();
      var password = document.getElementById("loginPassword").value;

      var { error } = await sb.auth.signInWithPassword({ email: email, password: password });
      if (error) {
        showError(loginError, error.message);
        return;
      }
      closeAuthModal();
    });

    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideError(signupError);
      var username = document.getElementById("signupUsername").value.trim();
      var email = document.getElementById("signupEmail").value.trim();
      var password = document.getElementById("signupPassword").value;

      var { data: existing } = await sb
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (existing) {
        showError(signupError, "That username is taken — try another.");
        return;
      }

      var { error } = await sb.auth.signUp({
        email: email,
        password: password,
        options: { data: { username: username } },
      });
      if (error) {
        showError(signupError, error.message);
        return;
      }

      showSignupConfirmation();
    });
  }

  function renderNavInto(container, mobile) {
    if (!container) return;
    container.innerHTML = "";
    container.className = mobile ? "nav-auth" : "nav-auth";

    if (state.user && state.profile) {
      var who = document.createElement("a");
      who.className = "nav-auth-user";
      who.href = "/profile.html?u=" + encodeURIComponent(state.profile.username);
      who.textContent = "@" + state.profile.username;

      var logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.className = "nav-auth-link";
      logoutBtn.textContent = "Log out";
      logoutBtn.addEventListener("click", async function () {
        await sb.auth.signOut();
      });

      container.appendChild(who);
      container.appendChild(logoutBtn);
    } else {
      var loginBtn = document.createElement("button");
      loginBtn.type = "button";
      loginBtn.className = "nav-auth-link";
      loginBtn.textContent = "Log in";
      loginBtn.addEventListener("click", function () {
        openAuthModal("login");
      });

      var signupBtn = document.createElement("button");
      signupBtn.type = "button";
      signupBtn.className = "btn-plate-outline";
      signupBtn.textContent = "Sign up";
      signupBtn.addEventListener("click", function () {
        openAuthModal("signup");
      });

      container.appendChild(loginBtn);
      container.appendChild(signupBtn);
    }
  }

  function renderNav() {
    renderNavInto(navAuthDesktop, false);
    renderNavInto(navAuthMobile, true);
  }

  async function refreshSession() {
    var { data } = await sb.auth.getSession();
    state.user = data.session ? data.session.user : null;

    if (state.user) {
      var { data: profile } = await sb
        .from("profiles")
        .select("id, username, bio, avatar_url")
        .eq("id", state.user.id)
        .maybeSingle();
      state.profile = profile;
    } else {
      state.profile = null;
    }

    renderNav();
    listeners.forEach(function (cb) {
      cb(state.user, state.profile);
    });
  }

  sb.auth.onAuthStateChange(function () {
    refreshSession();
  });

  window.ArxionoAuth = {
    ready: true,
    sb: sb,
    get user() {
      return state.user;
    },
    get profile() {
      return state.profile;
    },
    onChange: function (cb) {
      listeners.push(cb);
      if (state.user !== undefined) cb(state.user, state.profile);
    },
    requireLogin: function () {
      openAuthModal("login");
    },
  };

  refreshSession();
})();
