(function () {
  "use strict";

  var auth = window.ArxionoAuth;
  var feedLib = window.ArxionoFeed;

  if (!auth || !auth.ready) {
    var fs = document.getElementById("feedStatus");
    if (fs) {
      fs.textContent = "Community isn't configured yet — add your Supabase URL and anon key to js/supabase-config.js.";
    }
    return;
  }

  var sb = auth.sb;

  var CATEGORY_LABELS = {
    startup: "Startup idea",
    funding: "Raising funding",
    website: "Website",
    web_app: "Web app",
    mobile_app: "Mobile app",
    other: "Other",
  };

  var state = {
    projects: [],
    updates: [],
    votesByProject: {},
    followingIds: new Set(),
    sort: "new",
    view: "gallery",
    search: "",
    category: "all",
    status: "loading",
  };

  // ---------- DOM refs ----------
  var boardActions = document.getElementById("authArea");
  var feed = document.getElementById("feed");
  var feedStatus = document.getElementById("feedStatus");
  var galleryGrid = document.getElementById("galleryGrid");
  var searchInput = document.getElementById("searchInput");
  var categoryFilter = document.getElementById("categoryFilter");
  var newPostWrap = document.getElementById("newPostWrap");
  var newPostForm = document.getElementById("newPostForm");
  var postError = document.getElementById("postError");
  var postSubmitBtn = document.getElementById("postSubmitBtn");
  var cancelPostBtn = document.getElementById("cancelPost");

  var cardTemplate = document.getElementById("projectCardTemplate");
  var updateTemplate = document.getElementById("updateCardTemplate");
  var commentTemplate = document.getElementById("commentTemplate");
  var galleryTileTemplate = document.getElementById("galleryTileTemplate");

  // ---------- helpers ----------
  var escapeNode = feedLib.escapeNode;
  var timeAgo = feedLib.timeAgo;

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
    var category = document.getElementById("postCategory").value;
    var description = document.getElementById("postDescription").value.trim();
    var link = document.getElementById("postLink").value.trim();
    var contact = document.getElementById("postContact").value.trim();
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
        category: category,
        description: description,
        link: link || null,
        contact: contact || null,
        image_url: imageUrl,
      });
      if (insertError) throw insertError;

      newPostForm.reset();
      newPostWrap.hidden = true;
      loadFeed();
    } catch (err) {
      showError(postError, err.message || "Couldn't post that. Please try again.");
    } finally {
      postSubmitBtn.disabled = false;
      postSubmitBtn.querySelector(".btn-label").textContent = "Post it";
    }
  });

  // ---------- feed ----------
  document.querySelectorAll(".sort-toggle .sort-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.sort = btn.dataset.sort;
      document.querySelectorAll(".sort-toggle .sort-btn").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      renderFeed();
    });
  });

  document.querySelectorAll(".view-toggle .sort-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.view = btn.dataset.view;
      document.querySelectorAll(".view-toggle .sort-btn").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      renderFeed();
    });
  });

  categoryFilter.querySelectorAll(".category-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      state.category = chip.dataset.category;
      categoryFilter.querySelectorAll(".category-chip").forEach(function (c) {
        c.classList.toggle("active", c === chip);
      });
      renderFeed();
    });
  });

  var searchDebounce;
  searchInput.addEventListener("input", function () {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(function () {
      state.search = searchInput.value.trim().toLowerCase();
      renderFeed();
    }, 150);
  });

  async function loadFeed() {
    feedStatus.hidden = false;
    feedStatus.textContent = "Loading projects…";

    var { data: projects, error } = await sb
      .from("projects")
      .select(
        "id, title, description, image_url, link, contact, category, created_at, user_id, " +
          "profiles!projects_user_id_fkey(username, avatar_url), comments(count)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      state.status = "error";
      renderFeed();
      return;
    }

    var { data: updates } = await sb
      .from("project_updates")
      .select(
        "id, body, image_url, created_at, user_id, project_id, " +
          "profiles!project_updates_user_id_fkey(username, avatar_url), " +
          "projects!project_updates_project_id_fkey(title)"
      )
      .order("created_at", { ascending: false });

    state.projects = (projects || []).map(function (p) { return Object.assign({ kind: "project" }, p); });
    state.updates = (updates || []).map(function (u) { return Object.assign({ kind: "update" }, u); });

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

    state.status = "ready";
    renderFeed();
  }

  function matchesFilters(project) {
    if (state.category !== "all" && project.category !== state.category) return false;
    if (!state.search) return true;
    var haystack = ((project.title || "") + " " + (project.description || "")).toLowerCase();
    return haystack.indexOf(state.search) !== -1;
  }

  function sortedProjects(list) {
    var byScore = function (a, b) {
      var sa = (state.votesByProject[a.id] || { score: 0 }).score;
      var sb2 = (state.votesByProject[b.id] || { score: 0 }).score;
      return sb2 - sa;
    };
    var byDate = function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    };
    return list.slice().sort(state.sort === "top" ? byScore : byDate);
  }

  function hasActiveFilters() {
    return !!state.search || state.category !== "all";
  }

  function emptyMessage() {
    return hasActiveFilters() ? "No projects match your filters." : "No projects yet — be the first to post one.";
  }

  function renderFeed() {
    if (state.status !== "ready") {
      feed.hidden = true;
      galleryGrid.hidden = true;
      feedStatus.hidden = false;
      feedStatus.textContent = state.status === "error" ? "Couldn't load the feed right now." : "Loading projects…";
      return;
    }

    var filteredProjects = state.projects.filter(matchesFilters);

    if (state.view === "gallery") {
      feed.hidden = true;
      renderGallery(sortedProjects(filteredProjects));
      return;
    }

    galleryGrid.hidden = true;
    feed.hidden = false;
    feed.innerHTML = "";

    var items;
    if (state.sort === "top") {
      items = sortedProjects(filteredProjects);
    } else {
      // filtering narrows the feed to matching projects only — update posts
      // don't carry a category or searchable text, so hide them while filtering
      var updates = hasActiveFilters() ? [] : state.updates;
      items = filteredProjects.concat(updates).sort(function (a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }

    if (!items.length) {
      feedStatus.hidden = false;
      feedStatus.textContent = emptyMessage();
      return;
    }
    feedStatus.hidden = true;

    items.forEach(function (item) {
      feed.appendChild(item.kind === "update" ? renderUpdateCard(item) : renderCard(item));
    });
  }

  function renderGallery(list) {
    feedStatus.hidden = true;
    galleryGrid.hidden = false;
    galleryGrid.innerHTML = "";

    if (!list.length) {
      galleryGrid.hidden = true;
      feedStatus.hidden = false;
      feedStatus.textContent = emptyMessage();
      return;
    }

    list.forEach(function (project) {
      galleryGrid.appendChild(renderGalleryTile(project));
    });
  }

  function renderGalleryTile(project) {
    var node = galleryTileTemplate.content.cloneNode(true);
    var tile = node.querySelector(".project-tile");
    var link = tile.querySelector(".project-tile-link");
    link.href = "/project.html?id=" + project.id;

    var img = tile.querySelector(".project-tile-image");
    var fallback = tile.querySelector(".project-tile-fallback");
    if (project.image_url) {
      img.src = project.image_url;
      img.alt = project.title;
      img.hidden = false;
      fallback.hidden = true;
    } else {
      fallback.querySelector(".project-tile-title").appendChild(escapeNode(project.title));
    }

    if (project.category && CATEGORY_LABELS[project.category]) {
      var catTag = tile.querySelector(".tile-category-tag");
      catTag.appendChild(escapeNode(CATEGORY_LABELS[project.category]));
      catTag.hidden = false;
    }

    var username = project.profiles ? project.profiles.username : "unknown";
    tile.querySelector(".project-tile-author").appendChild(escapeNode("@" + username));

    var commentCount = (project.comments && project.comments[0] && project.comments[0].count) || 0;
    tile.querySelector(".project-tile-stats").appendChild(escapeNode(commentCount + " comments"));

    var voteInfo = state.votesByProject[project.id] || { score: 0, myVote: 0 };
    var scoreEl = tile.querySelector(".tile-vote-score");
    var upBtn = tile.querySelector(".tile-vote-up");
    var downBtn = tile.querySelector(".tile-vote-down");
    scoreEl.textContent = voteInfo.score;
    upBtn.classList.toggle("active-up", voteInfo.myVote === 1);
    downBtn.classList.toggle("active-down", voteInfo.myVote === -1);

    upBtn.addEventListener("click", function (e) {
      e.preventDefault();
      handleVote(project.id, 1, scoreEl, upBtn, downBtn);
    });
    downBtn.addEventListener("click", function (e) {
      e.preventDefault();
      handleVote(project.id, -1, scoreEl, upBtn, downBtn);
    });

    return node;
  }

  function renderCard(project) {
    var node = cardTemplate.content.cloneNode(true);
    var card = node.querySelector(".project-card");
    var voteInfo = state.votesByProject[project.id] || { score: 0, myVote: 0 };
    var username = project.profiles ? project.profiles.username : "unknown";

    var titleLink = card.querySelector(".project-title-link");
    titleLink.href = "/project.html?id=" + project.id;
    titleLink.appendChild(escapeNode(project.title));

    card.querySelector(".project-description").appendChild(escapeNode(project.description));
    card.querySelector(".project-time").appendChild(escapeNode(timeAgo(project.created_at)));

    card.querySelector(".author-avatar").appendChild(feedLib.avatarEl(project.profiles, 24));

    var authorLink = card.querySelector(".author-link");
    authorLink.href = "/profile.html?u=" + encodeURIComponent(username);
    authorLink.appendChild(escapeNode("@" + username));

    if (project.category && CATEGORY_LABELS[project.category]) {
      var categoryTag = card.querySelector(".category-tag");
      categoryTag.appendChild(escapeNode(CATEGORY_LABELS[project.category]));
      categoryTag.hidden = false;
    }

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

    card.querySelector(".project-detail-link").href = "/project.html?id=" + project.id;

    if (project.contact) {
      card.querySelector(".project-contact-slot").appendChild(feedLib.contactEl(project.contact));
    }

    var scoreEl = card.querySelector(".vote-score");
    scoreEl.textContent = voteInfo.score;
    var upBtn = card.querySelector(".vote-up");
    var downBtn = card.querySelector(".vote-down");
    upBtn.classList.toggle("active-up", voteInfo.myVote === 1);
    downBtn.classList.toggle("active-down", voteInfo.myVote === -1);

    upBtn.addEventListener("click", function () {
      handleVote(project.id, 1, scoreEl, upBtn, downBtn);
    });
    downBtn.addEventListener("click", function () {
      handleVote(project.id, -1, scoreEl, upBtn, downBtn);
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
        loadComments(project.id, section.querySelector(".comments-list"), commentCountEl);
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
        loadComments(project.id, section.querySelector(".comments-list"), commentCountEl);
        commentCountEl.textContent = Number(commentCountEl.textContent) + 1;
      } else {
        feedLib.showToast("Couldn't post that comment — please try again.");
      }
    });

    return node;
  }

  function renderUpdateCard(update) {
    var node = updateTemplate.content.cloneNode(true);
    var card = node.querySelector(".update-card");
    var username = update.profiles ? update.profiles.username : "unknown";
    var projectTitle = update.projects ? update.projects.title : "a project";

    card.querySelector(".author-avatar").appendChild(feedLib.avatarEl(update.profiles, 32));

    var authorLink = card.querySelector(".author-link");
    authorLink.href = "/profile.html?u=" + encodeURIComponent(username);
    authorLink.appendChild(escapeNode("@" + username));

    var projectLink = card.querySelector(".update-project-link");
    projectLink.href = "/project.html?id=" + update.project_id;
    projectLink.appendChild(escapeNode(projectTitle));

    card.querySelector(".update-time").appendChild(escapeNode(timeAgo(update.created_at)));
    card.querySelector(".update-text").appendChild(escapeNode(update.body));

    var img = card.querySelector(".update-image");
    if (update.image_url) {
      img.src = update.image_url;
      img.alt = "";
      img.hidden = false;
    }

    return node;
  }

  async function loadComments(projectId, container, commentCountEl) {
    container.innerHTML = "<p class=\"feed-status\">Loading…</p>";
    var { data: comments } = await sb
      .from("comments")
      .select("id, body, created_at, user_id, profiles(username)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    container.innerHTML = "";
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
          if (!error) {
            loadComments(projectId, container, commentCountEl);
            if (commentCountEl) commentCountEl.textContent = Math.max(0, Number(commentCountEl.textContent) - 1);
          } else {
            feedLib.showToast("Couldn't delete that comment.");
          }
        });
      }

      container.appendChild(node);
    });
    if (!comments || !comments.length) {
      container.innerHTML = "<p class=\"feed-status\">No comments yet.</p>";
    }
  }

  async function handleVote(projectId, value, scoreEl, upBtn, downBtn) {
    if (!auth.user) {
      auth.requireLogin();
      return;
    }

    var info = state.votesByProject[projectId] || { score: 0, myVote: 0 };

    try {
      var updated = await feedLib.castVote(sb, auth.user.id, projectId, value, info);
      state.votesByProject[projectId] = updated;
      scoreEl.textContent = updated.score;
      upBtn.classList.toggle("active-up", updated.myVote === 1);
      downBtn.classList.toggle("active-down", updated.myVote === -1);
    } catch (err) {
      feedLib.showToast(err.message || "Couldn't save your vote — please try again.");
    }
  }

  async function toggleFollow(targetUserId) {
    if (!auth.user) {
      auth.requireLogin();
      return;
    }

    try {
      if (state.followingIds.has(targetUserId)) {
        var { error } = await sb.from("follows").delete().eq("follower_id", auth.user.id).eq("following_id", targetUserId);
        if (error) throw error;
        state.followingIds.delete(targetUserId);
      } else {
        var { error: insErr } = await sb.from("follows").insert({ follower_id: auth.user.id, following_id: targetUserId });
        if (insErr) throw insErr;
        state.followingIds.add(targetUserId);
      }
      // re-render so every card by this author reflects the new follow state
      renderFeed();
    } catch (err) {
      feedLib.showToast(err.message || "Couldn't update follow status — please try again.");
    }
  }

  loadFeed();
})();
