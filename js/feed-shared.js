// Shared helpers used by community.js, project.js and profile.js —
// avoids re-implementing the same formatting/voting/toast logic on every page.
(function () {
  "use strict";

  function escapeNode(text) {
    return document.createTextNode(text == null ? "" : String(text));
  }

  function timeAgo(dateStr) {
    var diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return Math.floor(diff / 86400) + "d ago";
  }

  // Renders an avatar: the user's uploaded image if they have one, otherwise
  // a plate with their first initial.
  function avatarEl(profile, size) {
    var el;
    if (profile && profile.avatar_url) {
      el = document.createElement("img");
      el.src = profile.avatar_url;
      el.alt = "";
      el.className = "avatar-img";
    } else {
      el = document.createElement("span");
      el.className = "avatar-fallback";
      var username = profile && profile.username ? profile.username : "?";
      el.appendChild(escapeNode(username[0].toUpperCase()));
    }
    el.style.width = size + "px";
    el.style.height = size + "px";
    return el;
  }

  // A link styled like plain text that navigates to a profile page.
  function profileLink(username, text) {
    var a = document.createElement("a");
    a.href = "/profile.html?u=" + encodeURIComponent(username);
    a.className = "author-link";
    a.appendChild(escapeNode(text || "@" + username));
    return a;
  }

  function showToast(message) {
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add("visible");
    });
    setTimeout(function () {
      toast.classList.remove("visible");
      setTimeout(function () {
        toast.remove();
      }, 250);
    }, 3200);
  }

  // Casts/changes/removes a vote on a project and reports the real DB error
  // instead of assuming it worked — throws on failure so the caller can
  // leave the UI untouched and tell the user.
  async function castVote(sb, userId, projectId, value, info) {
    var removing = info.myVote === value;

    if (removing) {
      var del = await sb.from("votes").delete().eq("project_id", projectId).eq("user_id", userId);
      if (del.error) throw del.error;
      return { score: info.score - value, myVote: 0 };
    }

    var delta = value - info.myVote;
    var up = await sb
      .from("votes")
      .upsert({ project_id: projectId, user_id: userId, value: value }, { onConflict: "project_id,user_id" });
    if (up.error) throw up.error;
    return { score: info.score + delta, myVote: value };
  }

  // A contact value can be an email, a URL, or just a handle (e.g. "@you on
  // Telegram") — render whichever is actually clickable, plain text otherwise.
  function contactEl(contact) {
    var wrap = document.createElement("div");
    wrap.className = "project-contact";

    var label = document.createElement("span");
    label.className = "project-contact-label";
    label.appendChild(escapeNode("Contact:"));
    wrap.appendChild(label);

    var value;
    if (/^https?:\/\//i.test(contact)) {
      value = document.createElement("a");
      value.href = contact;
      value.target = "_blank";
      value.rel = "noopener";
      value.appendChild(escapeNode(contact));
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      value = document.createElement("a");
      value.href = "mailto:" + contact;
      value.appendChild(escapeNode(contact));
    } else {
      value = document.createElement("span");
      value.appendChild(escapeNode(contact));
    }
    value.className = (value.className ? value.className + " " : "") + "project-contact-value";
    wrap.appendChild(value);

    return wrap;
  }

  // Wires a button so the first click arms it ("Delete" -> "Confirm?") and
  // only the second click (within a few seconds) actually runs the action.
  // Avoids a native confirm() popup while still preventing stray deletes.
  function confirmButton(btn, confirmText, onConfirm) {
    var originalText = btn.textContent;
    var armed = false;
    var resetTimer = null;

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (!armed) {
        armed = true;
        btn.textContent = confirmText;
        btn.classList.add("confirming");
        resetTimer = setTimeout(function () {
          armed = false;
          btn.textContent = originalText;
          btn.classList.remove("confirming");
        }, 4000);
        return;
      }

      clearTimeout(resetTimer);
      armed = false;
      btn.textContent = originalText;
      btn.classList.remove("confirming");
      onConfirm();
    });
  }

  window.ArxionoFeed = {
    escapeNode: escapeNode,
    timeAgo: timeAgo,
    avatarEl: avatarEl,
    profileLink: profileLink,
    showToast: showToast,
    castVote: castVote,
    contactEl: contactEl,
    confirmButton: confirmButton,
  };
})();
