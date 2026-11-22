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

  var username = new URLSearchParams(window.location.search).get("u");
  if (!username) {
    pageStatus.textContent = "No profile specified.";
    return;
  }

  var state = {
    profile: null,
    isOwn: false,
    isFollowing: false,
    myFollowingIds: new Set(),
  };

  var profileHeader = document.getElementById("profileHeader");
  var followBtn = document.getElementById("followBtn");
  var editProfileBtn = document.getElementById("editProfileBtn");
  var editProfileWrap = document.getElementById("editProfileWrap");
  var editProfileForm = document.getElementById("editProfileForm");
  var editProfileError = document.getElementById("editProfileError");
  var editProfileSubmitBtn = document.getElementById("editProfileSubmitBtn");
  var cancelEditProfile = document.getElementById("cancelEditProfile");
  var profileTabs = document.getElementById("profileTabs");
  var projectsGrid = document.getElementById("projectsGrid");

  var peopleModal = document.getElementById("peopleModal");
  var peopleModalTitle = document.getElementById("peopleModalTitle");
  var peopleModalClose = document.getElementById("peopleModalClose");
  var peopleList = document.getElementById("peopleList");
  var personRowTemplate = document.getElementById("personRowTemplate");
  var projectTileTemplate = document.getElementById("projectTileTemplate");

  peopleModalClose.addEventListener("click", function () { peopleModal.hidden = true; });
  peopleModal.addEventListener("click", function (e) {
    if (e.target === peopleModal) peopleModal.hidden = true;
  });

  async function loadProfile() {
    var { data: profile, error } = await sb
      .from("profiles")
      .select("id, username, bio, avatar_url, created_at")
      .eq("username", username)
      .maybeSingle();

    if (error || !profile) {
      pageStatus.textContent = "That profile couldn't be found.";
      return;
    }

    state.profile = profile;
    state.isOwn = !!(auth.user && auth.user.id === profile.id);
    document.title = "@" + profile.username + " | Arxiono Community";

    if (auth.user && !state.isOwn) {
      var { data: follow } = await sb
        .from("follows")
        .select("follower_id")
        .eq("follower_id", auth.user.id)
        .eq("following_id", profile.id)
        .maybeSingle();
      state.isFollowing = !!follow;
    }

    pageStatus.hidden = true;
    profileHeader.hidden = false;
    profileTabs.hidden = false;
    renderHeader();
    loadStats();
    loadProjects();
  }

  function renderHeader() {
    var profile = state.profile;

    var avatarSlot = document.getElementById("profileAvatarSlot");
    avatarSlot.innerHTML = "";
    avatarSlot.appendChild(feedLib.avatarEl(profile, 96));

    document.getElementById("profileUsername").textContent = "@" + profile.username;
    document.getElementById("profileBio").textContent = profile.bio || (state.isOwn ? "Add a bio so people know what you're building." : "");

    if (state.isOwn) {
      editProfileBtn.hidden = false;
      followBtn.hidden = true;
      document.getElementById("editBio").value = profile.bio || "";
    } else if (auth.user) {
      followBtn.hidden = false;
      editProfileBtn.hidden = true;
      followBtn.textContent = state.isFollowing ? "Following" : "Follow";
      followBtn.classList.toggle("following", state.isFollowing);
    } else {
      followBtn.hidden = false;
      editProfileBtn.hidden = true;
      followBtn.textContent = "Follow";
      followBtn.classList.remove("following");
    }
  }

  followBtn.addEventListener("click", async function () {
    if (!auth.user) {
      auth.requireLogin();
      return;
    }
    try {
      if (state.isFollowing) {
        var { error } = await sb.from("follows").delete().eq("follower_id", auth.user.id).eq("following_id", state.profile.id);
        if (error) throw error;
      } else {
        var { error: insErr } = await sb.from("follows").insert({ follower_id: auth.user.id, following_id: state.profile.id });
        if (insErr) throw insErr;
      }
      state.isFollowing = !state.isFollowing;
      renderHeader();
      loadStats();
    } catch (err) {
      feedLib.showToast(err.message || "Couldn't update follow status — please try again.");
    }
  });

  editProfileBtn.addEventListener("click", function () {
    editProfileWrap.hidden = !editProfileWrap.hidden;
  });
  cancelEditProfile.addEventListener("click", function () {
    editProfileWrap.hidden = true;
    editProfileError.hidden = true;
  });

  editProfileForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    editProfileError.hidden = true;

    var bio = document.getElementById("editBio").value.trim();
    var file = document.getElementById("editAvatar").files[0];

    editProfileSubmitBtn.disabled = true;
    editProfileSubmitBtn.querySelector(".btn-label").textContent = "Saving…";

    try {
      var updates = { bio: bio || null };

      if (file) {
        var path = auth.user.id + "/" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        var { error: uploadError } = await sb.storage.from("avatars").upload(path, file);
        if (uploadError) throw uploadError;
        updates.avatar_url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      var { error } = await sb.from("profiles").update(updates).eq("id", auth.user.id);
      if (error) throw error;

      Object.assign(state.profile, updates);
      editProfileWrap.hidden = true;
      renderHeader();
    } catch (err) {
      editProfileError.textContent = err.message || "Couldn't save your profile. Please try again.";
      editProfileError.hidden = false;
    } finally {
      editProfileSubmitBtn.disabled = false;
      editProfileSubmitBtn.querySelector(".btn-label").textContent = "Save";
    }
  });

  // ---------- stats + followers/following ----------
  async function loadStats() {
    var profileId = state.profile.id;

    var [{ count: projectCount }, { count: followerCount }, { count: followingCount }] = await Promise.all([
      sb.from("projects").select("id", { count: "exact", head: true }).eq("user_id", profileId),
      sb.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", profileId),
      sb.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", profileId),
    ]);

    document.getElementById("statProjects").textContent = projectCount || 0;
    document.getElementById("statFollowersCount").textContent = followerCount || 0;
    document.getElementById("statFollowingCount").textContent = followingCount || 0;
  }

  document.getElementById("statFollowers").addEventListener("click", function () {
    openPeopleModal("Followers", loadFollowers);
  });
  document.getElementById("statFollowing").addEventListener("click", function () {
    openPeopleModal("Following", loadFollowing);
  });

  async function openPeopleModal(title, loader) {
    peopleModalTitle.textContent = title;
    peopleList.innerHTML = "<p class=\"feed-status\">Loading…</p>";
    peopleModal.hidden = false;

    if (auth.user) {
      var { data: mine } = await sb.from("follows").select("following_id").eq("follower_id", auth.user.id);
      state.myFollowingIds = new Set((mine || []).map(function (f) { return f.following_id; }));
    }

    var people = await loader();
    renderPeopleList(people);
  }

  async function loadFollowers() {
    var { data } = await sb
      .from("follows")
      .select("profiles!follows_follower_id_fkey(id, username, avatar_url)")
      .eq("following_id", state.profile.id);
    return (data || []).map(function (row) { return row.profiles; }).filter(Boolean);
  }

  async function loadFollowing() {
    var { data } = await sb
      .from("follows")
      .select("profiles!follows_following_id_fkey(id, username, avatar_url)")
      .eq("follower_id", state.profile.id);
    return (data || []).map(function (row) { return row.profiles; }).filter(Boolean);
  }

  function renderPeopleList(people) {
    peopleList.innerHTML = "";
    if (!people.length) {
      peopleList.innerHTML = "<p class=\"feed-status\">Nobody here yet.</p>";
      return;
    }

    people.forEach(function (person) {
      var node = personRowTemplate.content.cloneNode(true);
      var row = node.querySelector(".person-row");
      row.querySelector(".author-avatar").appendChild(feedLib.avatarEl(person, 36));

      var link = row.querySelector(".person-row-link");
      link.href = "/profile.html?u=" + encodeURIComponent(person.username);
      link.appendChild(escapeNode("@" + person.username));

      var btn = row.querySelector(".person-row-follow");
      if (!auth.user || auth.user.id === person.id) {
        btn.hidden = true;
      } else {
        var isFollowing = state.myFollowingIds.has(person.id);
        btn.textContent = isFollowing ? "Following" : "Follow";
        btn.classList.toggle("following", isFollowing);
        btn.addEventListener("click", async function () {
          try {
            if (state.myFollowingIds.has(person.id)) {
              var { error } = await sb.from("follows").delete().eq("follower_id", auth.user.id).eq("following_id", person.id);
              if (error) throw error;
              state.myFollowingIds.delete(person.id);
            } else {
              var { error: insErr } = await sb.from("follows").insert({ follower_id: auth.user.id, following_id: person.id });
              if (insErr) throw insErr;
              state.myFollowingIds.add(person.id);
            }
            btn.textContent = state.myFollowingIds.has(person.id) ? "Following" : "Follow";
            btn.classList.toggle("following", state.myFollowingIds.has(person.id));
            if (person.id === state.profile.id) {
              state.isFollowing = state.myFollowingIds.has(person.id);
              renderHeader();
            }
          } catch (err) {
            feedLib.showToast(err.message || "Couldn't update follow status — please try again.");
          }
        });
      }

      peopleList.appendChild(node);
    });
  }

  // ---------- projects grid ----------
  async function loadProjects() {
    var { data: projects } = await sb
      .from("projects")
      .select("id, title, image_url, created_at, comments(count)")
      .eq("user_id", state.profile.id)
      .order("created_at", { ascending: false });

    projectsGrid.innerHTML = "";

    var list = projects || [];
    if (!list.length) {
      projectsGrid.innerHTML = "<p class=\"feed-status\">No projects posted yet.</p>";
      return;
    }

    var ids = list.map(function (p) { return p.id; });
    var scores = {};
    var { data: votes } = await sb.from("votes").select("project_id, value").in("project_id", ids);
    (votes || []).forEach(function (v) {
      scores[v.project_id] = (scores[v.project_id] || 0) + v.value;
    });

    list.forEach(function (project) {
      var node = projectTileTemplate.content.cloneNode(true);
      var tile = node.querySelector(".project-tile");
      tile.href = "/project.html?id=" + project.id;

      var img = tile.querySelector(".project-tile-image");
      var fallback = tile.querySelector(".project-tile-fallback");
      if (project.image_url) {
        img.src = project.image_url;
        img.hidden = false;
        fallback.hidden = true;
      } else {
        fallback.querySelector(".project-tile-title").appendChild(escapeNode(project.title));
      }

      tile.querySelector(".project-tile-score").appendChild(escapeNode("▲ " + (scores[project.id] || 0)));
      var commentCount = (project.comments && project.comments[0] && project.comments[0].count) || 0;
      tile.querySelector(".project-tile-comments").appendChild(escapeNode(commentCount + " comments"));

      projectsGrid.appendChild(node);
    });
  }

  auth.onChange(function () {
    if (state.profile) {
      state.isOwn = !!(auth.user && auth.user.id === state.profile.id);
      renderHeader();
    }
  });

  loadProfile();
})();
