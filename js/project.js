(function () {
  "use strict";

  var auth = window.ArxionoAuth;
  var feedLib = window.ArxionoFeed;
  var pageStatus = document.getElementById("pageStatus");

  if (!auth || !auth.ready) {
    if (pageStatus) pageStatus.textContent = "Community isn't configured yet — add your Supabase URL and anon key to js/supabase-config.js.";
    return;
  }

  var sb = auth.sb;
  var escapeNode = feedLib.escapeNode;
  var timeAgo = feedLib.timeAgo;

  var CATEGORY_LABELS = {
    startup: "Startup idea",
    funding: "Raising funding",
    website: "Website",
    web_app: "Web app",
    mobile_app: "Mobile app",
    other: "Other",
  };

  var projectId = new URLSearchParams(window.location.search).get("id");
  if (!projectId) {
    pageStatus.textContent = "No project specified.";
    return;
  }

  var state = {
    project: null,
    voteInfo: { score: 0, myVote: 0 },
    isFollowing: false,
  };

  var detailEl = document.getElementById("projectDetail");
  var ownerActions = document.getElementById("ownerActions");
  var deleteProjectBtn = document.getElementById("deleteProjectBtn");
  var updatesSection = document.getElementById("updatesSection");
  var updatesList = document.getElementById("updatesList");
  var newUpdateWrap = document.getElementById("newUpdateWrap");
  var newUpdateForm = document.getElementById("newUpdateForm");
  var updateError = document.getElementById("updateError");
  var updateSubmitBtn = document.getElementById("updateSubmitBtn");
  var updateTemplate = document.getElementById("updateTemplate");
  var commentTemplate = document.getElementById("commentTemplate");
  var commentsList = document.getElementById("commentsList");
  var commentForm = document.getElementById("commentForm");
  var commentCountEl = document.querySelector(".comment-count");

  function showError(el, message) {
    el.textContent = message;
    el.hidden = false;
  }

  async function loadProject() {
    var { data: project, error } = await sb
      .from("projects")
      .select(
        "id, title, description, image_url, link, contact, category, created_at, user_id, " +
          "profiles!projects_user_id_fkey(username, avatar_url)"
      )
      .eq("id", projectId)
      .maybeSingle();

    if (error || !project) {
      pageStatus.textContent = "That project couldn't be found.";
      return;
    }

    state.project = project;
    document.title = project.title + " | Arxiono Community";

    var { data: votes } = await sb.from("votes").select("user_id, value").eq("project_id", projectId);
    var score = 0, myVote = 0;
    (votes || []).forEach(function (v) {
      score += v.value;
      if (auth.user && v.user_id === auth.user.id) myVote = v.value;
    });
    state.voteInfo = { score: score, myVote: myVote };

    if (auth.user) {
      var { data: follow } = await sb
        .from("follows")
        .select("follower_id")
        .eq("follower_id", auth.user.id)
        .eq("following_id", project.user_id)
        .maybeSingle();
      state.isFollowing = !!follow;
    }

    pageStatus.hidden = true;
    detailEl.hidden = false;
    renderProject();
    updatesSection.hidden = false;
    loadUpdates();
    loadComments();
  }

  function renderProject() {
    var project = state.project;
    var username = project.profiles ? project.profiles.username : "unknown";

    detailEl.querySelector(".project-title").textContent = project.title;
    detailEl.querySelector(".project-description").textContent = project.description;
    detailEl.querySelector(".project-time").textContent = timeAgo(project.created_at);

    var avatarSlot = detailEl.querySelector(".author-avatar");
    avatarSlot.innerHTML = "";
    avatarSlot.appendChild(feedLib.avatarEl(project.profiles, 28));

    var authorLink = detailEl.querySelector(".author-link");
    authorLink.href = "/profile.html?u=" + encodeURIComponent(username);
    authorLink.textContent = "@" + username;

    var categoryTag = detailEl.querySelector(".category-tag");
    if (project.category && CATEGORY_LABELS[project.category]) {
      categoryTag.textContent = CATEGORY_LABELS[project.category];
      categoryTag.hidden = false;
    }

    var followBtn = detailEl.querySelector(".follow-btn");
    if (auth.user && project.user_id === auth.user.id) {
      followBtn.hidden = true;
    } else {
      followBtn.hidden = false;
      followBtn.textContent = state.isFollowing ? "Following" : "Follow";
      followBtn.classList.toggle("following", state.isFollowing);
      followBtn.onclick = toggleFollow;
    }

    var img = detailEl.querySelector(".project-image");
    if (project.image_url) {
      img.src = project.image_url;
      img.alt = project.title;
      img.hidden = false;
    }

    var link = detailEl.querySelector(".project-link");
    if (project.link) {
      link.href = project.link;
      link.hidden = false;
    }

    var contactSlot = detailEl.querySelector(".project-contact-slot");
    contactSlot.innerHTML = "";
    if (project.contact) contactSlot.appendChild(feedLib.contactEl(project.contact));

    var scoreEl = detailEl.querySelector(".vote-score");
    var upBtn = detailEl.querySelector(".vote-up");
    var downBtn = detailEl.querySelector(".vote-down");
    scoreEl.textContent = state.voteInfo.score;
    upBtn.classList.toggle("active-up", state.voteInfo.myVote === 1);
    downBtn.classList.toggle("active-down", state.voteInfo.myVote === -1);
    upBtn.onclick = function () { handleVote(1, scoreEl, upBtn, downBtn); };
    downBtn.onclick = function () { handleVote(-1, scoreEl, upBtn, downBtn); };

    if (auth.user && project.user_id === auth.user.id) {
      newUpdateWrap.hidden = false;
      ownerActions.hidden = false;
    } else {
      ownerActions.hidden = true;
    }
  }

  feedLib.confirmButton(deleteProjectBtn, "Confirm delete?", async function () {
    var { error } = await sb.from("projects").delete().eq("id", projectId);
    if (error) {
      feedLib.showToast("Couldn't delete that project — please try again.");
      return;
    }
    window.location.href = "/community.html";
  });

  async function handleVote(value, scoreEl, upBtn, downBtn) {
    if (!auth.user) {
      auth.requireLogin();
      return;
    }
    try {
      var updated = await feedLib.castVote(sb, auth.user.id, projectId, value, state.voteInfo);
      state.voteInfo = updated;
      scoreEl.textContent = updated.score;
      upBtn.classList.toggle("active-up", updated.myVote === 1);
      downBtn.classList.toggle("active-down", updated.myVote === -1);
    } catch (err) {
      feedLib.showToast(err.message || "Couldn't save your vote — please try again.");
    }
  }

  async function toggleFollow() {
    if (!auth.user) {
      auth.requireLogin();
      return;
    }
    var targetUserId = state.project.user_id;
    try {
      if (state.isFollowing) {
        var { error } = await sb.from("follows").delete().eq("follower_id", auth.user.id).eq("following_id", targetUserId);
        if (error) throw error;
      } else {
        var { error: insErr } = await sb.from("follows").insert({ follower_id: auth.user.id, following_id: targetUserId });
        if (insErr) throw insErr;
      }
      state.isFollowing = !state.isFollowing;
      renderProject();
    } catch (err) {
      feedLib.showToast(err.message || "Couldn't update follow status — please try again.");
    }
  }

  // ---------- updates ----------
  newUpdateForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    updateError.hidden = true;

    var body = document.getElementById("updateBody").value.trim();
    var file = document.getElementById("updateImage").files[0];
    if (!body) return;

    updateSubmitBtn.disabled = true;
    updateSubmitBtn.querySelector(".btn-label").textContent = "Posting…";

    try {
      var imageUrl = null;
      if (file) {
        var path = auth.user.id + "/" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        var { error: uploadError } = await sb.storage.from("project-images").upload(path, file);
        if (uploadError) throw uploadError;
        imageUrl = sb.storage.from("project-images").getPublicUrl(path).data.publicUrl;
      }

      var { error } = await sb.from("project_updates").insert({
        project_id: projectId,
        user_id: auth.user.id,
        body: body,
        image_url: imageUrl,
      });
      if (error) throw error;

      newUpdateForm.reset();
      loadUpdates();
    } catch (err) {
      showError(updateError, err.message || "Couldn't post that update. Please try again.");
    } finally {
      updateSubmitBtn.disabled = false;
      updateSubmitBtn.querySelector(".btn-label").textContent = "Post update";
    }
  });

  async function loadUpdates() {
    var { data: updates } = await sb
      .from("project_updates")
      .select("id, body, image_url, created_at, user_id, profiles!project_updates_user_id_fkey(username, avatar_url)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    updatesList.innerHTML = "";
    (updates || []).forEach(function (update) {
      var node = updateTemplate.content.cloneNode(true);
      var card = node.querySelector(".update-card");
      var username = update.profiles ? update.profiles.username : "unknown";

      card.querySelector(".author-avatar").appendChild(feedLib.avatarEl(update.profiles, 32));

      var authorLink = card.querySelector(".author-link");
      authorLink.href = "/profile.html?u=" + encodeURIComponent(username);
      authorLink.appendChild(escapeNode("@" + username));

      card.querySelector(".update-time").appendChild(escapeNode(timeAgo(update.created_at)));
      card.querySelector(".update-text").appendChild(escapeNode(update.body));

      var img = card.querySelector(".update-image");
      if (update.image_url) {
        img.src = update.image_url;
        img.alt = "";
        img.hidden = false;
      }

      var deleteBtn = card.querySelector(".update-delete");
      if (auth.user && update.user_id === auth.user.id) {
        deleteBtn.hidden = false;
        feedLib.confirmButton(deleteBtn, "Confirm?", async function () {
          var { error } = await sb.from("project_updates").delete().eq("id", update.id);
          if (!error) loadUpdates();
          else feedLib.showToast("Couldn't delete that update.");
        });
      }

      updatesList.appendChild(node);
    });

    if (!updates || !updates.length) {
      updatesList.innerHTML = "<p class=\"feed-status\">No updates posted yet.</p>";
    }
  }

  // ---------- comments ----------
  async function loadComments() {
    commentsList.innerHTML = "<p class=\"feed-status\">Loading…</p>";
    var { data: comments } = await sb
      .from("comments")
      .select("id, body, created_at, user_id, profiles(username)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    commentsList.innerHTML = "";
    (comments || []).forEach(function (c) {
      var node = commentTemplate.content.cloneNode(true);
      var username = c.profiles ? c.profiles.username : "unknown";
      var authorEl = node.querySelector(".comment-author");
      authorEl.href = "/profile.html?u=" + encodeURIComponent(username);
      authorEl.appendChild(escapeNode("@" + username + ":"));
      node.querySelector(".comment-body").appendChild(escapeNode(c.body));

      var deleteBtn = node.querySelector(".comment-delete");
      if (auth.user && c.user_id === auth.user.id) {
        deleteBtn.hidden = false;
        feedLib.confirmButton(deleteBtn, "Confirm?", async function () {
          var { error } = await sb.from("comments").delete().eq("id", c.id);
          if (!error) loadComments();
          else feedLib.showToast("Couldn't delete that comment.");
        });
      }

      commentsList.appendChild(node);
    });
    commentCountEl.textContent = comments ? comments.length : 0;
    if (!comments || !comments.length) {
      commentsList.innerHTML = "<p class=\"feed-status\">No comments yet.</p>";
    }
  }

  commentForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!auth.user) {
      auth.requireLogin();
      return;
    }
    var input = document.getElementById("commentInput");
    var body = input.value.trim();
    if (!body) return;

    var { error } = await sb.from("comments").insert({
      project_id: projectId,
      user_id: auth.user.id,
      body: body,
    });
    if (!error) {
      input.value = "";
      loadComments();
    } else {
      feedLib.showToast("Couldn't post that comment — please try again.");
    }
  });

  auth.onChange(function () {
    if (state.project) renderProject();
  });

  loadProject();
})();
