(function () {
  "use strict";

  var auth = window.ArxionoAuth;

  if (!auth || !auth.ready) {
    var fs = document.getElementById("feedStatus");
    if (fs) {
      fs.textContent = "Community isn't configured yet — add your Supabase URL and anon key to js/supabase-config.js.";
    }
    return;
  }

  var sb = auth.sb;

  var state = {
    projects: [],
    votesByProject: {},
    followingIds: new Set(),
    sort: "new",
  };

  // ---------- DOM refs ----------
  var boardActions = document.getElementById("authArea");
  var feed = document.getElementById("feed");
  var feedStatus = document.getElementById("feedStatus");
  var newPostWrap = document.getElementById("newPostWrap");
  var newPostForm = document.getElementById("newPostForm");
  var postError = document.getElementById("postError");
  var postSubmitBtn = document.getElementById("postSubmitBtn");
  var cancelPostBtn = document.getElementById("cancelPost");

  var cardTemplate = document.getElementById("projectCardTemplate");
  var commentTemplate = document.getElementById("commentTemplate");

  // ---------- helpers ----------
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

  function showError(el, message) {
    el.textContent = message;
    el.hidden = false;
  }
  function hideError(el) {
    el.hidden = true;
  }

  // ---------- board actions (New post button, only when signed in) ----------
  function renderBoardActions() {
    boardActions.innerHTML = "";
    if (!auth.user) return;

    var newBtn = document.createElement("button");
    newBtn.type = "button";
    newBtn.className = "btn-plate-outline";
    newBtn.textContent = "New post";
    newBtn.addEventListener("click", function () {
      newPostWrap.hidden = !newPostWrap.hidden;
    });
    boardActions.appendChild(newBtn);
  }

  async function loadFollowing() {
    if (!auth.user) {
      state.followingIds = new Set();
      return;
    }
    var { data: follows } = await sb
      .from("follows")
      .select("following_id")
      .eq("follower_id", auth.user.id);
    state.followingIds = new Set((follows || []).map(function (f) { return f.following_id; }));
  }

  auth.onChange(function () {
    renderBoardActions();
    loadFollowing().then(renderFeed);
    if (!auth.user) newPostWrap.hidden = true;
  });

  // ---------- new post ----------
  cancelPostBtn.addEventListener("click", function () {
    newPostWrap.hidden = true;
    newPostForm.reset();
    hideError(postError);
  });

  newPostForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    hideError(postError);

    if (!auth.user) {
      auth.requireLogin();
      return;
    }

    var title = document.getElementById("postTitle").value.trim();
    var description = document.getElementById("postDescription").value.trim();
    var link = document.getElementById("postLink").value.trim();
    var file = document.getElementById("postImage").files[0];

    postSubmitBtn.disabled = true;
    postSubmitBtn.querySelector(".btn-label").textContent = "Posting…";

    try {
      var imageUrl = null;
      if (file) {
        var path = auth.user.id + "/" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        var { error: uploadError } = await sb.storage.from("project-images").upload(path, file);
        if (uploadError) throw uploadError;
        imageUrl = sb.storage.from("project-images").getPublicUrl(path).data.publicUrl;
      }

      var { error: insertError } = await sb.from("projects").insert({
        user_id: auth.user.id,
        title: title,
        description: description,
        link: link || null,
        image_url: imageUrl,
      });
      if (insertError) throw insertError;

      newPostForm.reset();
      newPostWrap.hidden = true;
      loadProjects();
    } catch (err) {
      showError(postError, err.message || "Couldn't post that. Please try again.");
    } finally {
      postSubmitBtn.disabled = false;
      postSubmitBtn.querySelector(".btn-label").textContent = "Post it";
    }
  });

  // ---------- feed ----------
  document.querySelectorAll(".sort-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.sort = btn.dataset.sort;
      document.querySelectorAll(".sort-btn").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      renderFeed();
    });
  });

  async function loadProjects() {
    feedStatus.hidden = false;
    feedStatus.textContent = "Loading projects…";

    var { data: projects, error } = await sb
      .from("projects")
      .select("id, title, description, image_url, link, created_at, user_id, profiles!projects_user_id_fkey(username), comments(count)")
      .order("created_at", { ascending: false });

    if (error) {
      feedStatus.textContent = "Couldn't load the feed right now.";
      return;
    }

    state.projects = projects || [];

    var ids = state.projects.map(function (p) { return p.id; });
    state.votesByProject = {};
    if (ids.length) {
      var { data: votes } = await sb.from("votes").select("project_id, user_id, value").in("project_id", ids);
      (votes || []).forEach(function (v) {
        if (!state.votesByProject[v.project_id]) {
          state.votesByProject[v.project_id] = { score: 0, myVote: 0 };
        }
        state.votesByProject[v.project_id].score += v.value;
        if (auth.user && v.user_id === auth.user.id) {
          state.votesByProject[v.project_id].myVote = v.value;
        }
      });
    }

    renderFeed();
  }

  function renderFeed() {
    var list = state.projects.slice();

    if (state.sort === "top") {
      list.sort(function (a, b) {
        var sa = (state.votesByProject[a.id] || { score: 0 }).score;
        var sb2 = (state.votesByProject[b.id] || { score: 0 }).score;
        return sb2 - sa;
      });
    }

    feed.innerHTML = "";

    if (!list.length) {
      feedStatus.hidden = false;
      feedStatus.textContent = "No projects yet — be the first to post one.";
      return;
    }
    feedStatus.hidden = true;

    list.forEach(function (project) {
      feed.appendChild(renderCard(project));
    });
  }

  function renderCard(project) {
    var node = cardTemplate.content.cloneNode(true);
    var card = node.querySelector(".project-card");
    var voteInfo = state.votesByProject[project.id] || { score: 0, myVote: 0 };

    card.querySelector(".project-title").appendChild(escapeNode(project.title));
    card.querySelector(".project-description").appendChild(escapeNode(project.description));
    card.querySelector(".project-time").appendChild(escapeNode(timeAgo(project.created_at)));

    var username = project.profiles ? project.profiles.username : "unknown";
    var authorLink = card.querySelector(".author-link");
    authorLink.appendChild(escapeNode("@" + username));

    var followBtn = card.querySelector(".follow-btn");
    if (auth.user && project.user_id === auth.user.id) {
      followBtn.hidden = true;
    } else {
      var isFollowing = state.followingIds.has(project.user_id);
      followBtn.textContent = isFollowing ? "Following" : "Follow";
      followBtn.classList.toggle("following", isFollowing);
      followBtn.addEventListener("click", function () {
        toggleFollow(project.user_id);
      });
    }

    var img = card.querySelector(".project-image");
    if (project.image_url) {
      img.src = project.image_url;
      img.alt = project.title;
      img.hidden = false;
    }

    var link = card.querySelector(".project-link");
    if (project.link) {
      link.href = project.link;
      link.hidden = false;
    }

    var scoreEl = card.querySelector(".vote-score");
    scoreEl.textContent = voteInfo.score;
    var upBtn = card.querySelector(".vote-up");
    var downBtn = card.querySelector(".vote-down");
    upBtn.classList.toggle("active-up", voteInfo.myVote === 1);
    downBtn.classList.toggle("active-down", voteInfo.myVote === -1);

    upBtn.addEventListener("click", function () {
      castVote(project.id, 1, scoreEl, upBtn, downBtn);
    });
    downBtn.addEventListener("click", function () {
      castVote(project.id, -1, scoreEl, upBtn, downBtn);
    });

    var commentCountEl = card.querySelector(".comment-count");
    commentCountEl.textContent = (project.comments && project.comments[0] && project.comments[0].count) || 0;

    var toggleBtn = card.querySelector(".comments-toggle");
    var section = card.querySelector(".comments-section");
    var loaded = false;
    toggleBtn.addEventListener("click", function () {
      section.hidden = !section.hidden;
      if (!section.hidden && !loaded) {
        loaded = true;
        loadComments(project.id, section.querySelector(".comments-list"));
      }
    });

    var commentForm = card.querySelector(".comment-form");
    commentForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!auth.user) {
        auth.requireLogin();
        return;
      }
      var input = commentForm.querySelector(".comment-input");
      var body = input.value.trim();
      if (!body) return;

      var { error } = await sb.from("comments").insert({
        project_id: project.id,
        user_id: auth.user.id,
        body: body,
      });
      if (!error) {
        input.value = "";
        loadComments(project.id, section.querySelector(".comments-list"));
        commentCountEl.textContent = Number(commentCountEl.textContent) + 1;
      }
    });

    return node;
  }

  async function loadComments(projectId, container) {
    container.innerHTML = "<p class=\"feed-status\">Loading…</p>";
    var { data: comments } = await sb
      .from("comments")
      .select("body, created_at, profiles(username)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    container.innerHTML = "";
    (comments || []).forEach(function (c) {
      var node = commentTemplate.content.cloneNode(true);
      node.querySelector(".comment-author").appendChild(escapeNode("@" + (c.profiles ? c.profiles.username : "unknown") + ":"));
      node.querySelector(".comment-body").appendChild(escapeNode(c.body));
      container.appendChild(node);
    });
    if (!comments || !comments.length) {
      container.innerHTML = "<p class=\"feed-status\">No comments yet.</p>";
    }
  }

  async function castVote(projectId, value, scoreEl, upBtn, downBtn) {
    if (!auth.user) {
      auth.requireLogin();
      return;
    }

    var info = state.votesByProject[projectId] || { score: 0, myVote: 0 };
    var removing = info.myVote === value;

    if (removing) {
      await sb.from("votes").delete().eq("project_id", projectId).eq("user_id", auth.user.id);
      info.score -= value;
      info.myVote = 0;
    } else {
      var delta = value - info.myVote;
      await sb.from("votes").upsert({ project_id: projectId, user_id: auth.user.id, value: value });
      info.score += delta;
      info.myVote = value;
    }

    state.votesByProject[projectId] = info;
    scoreEl.textContent = info.score;
    upBtn.classList.toggle("active-up", info.myVote === 1);
    downBtn.classList.toggle("active-down", info.myVote === -1);
  }

  async function toggleFollow(targetUserId) {
    if (!auth.user) {
      auth.requireLogin();
      return;
    }

    if (state.followingIds.has(targetUserId)) {
      await sb.from("follows").delete().eq("follower_id", auth.user.id).eq("following_id", targetUserId);
      state.followingIds.delete(targetUserId);
    } else {
      await sb.from("follows").insert({ follower_id: auth.user.id, following_id: targetUserId });
      state.followingIds.add(targetUserId);
    }

    // re-render so every card by this author reflects the new follow state
    renderFeed();
  }

  loadProjects();
})();
