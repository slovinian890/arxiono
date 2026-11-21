(function () {
  "use strict";

  // ---------- Sticky nav background on scroll ----------
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 24) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---------- Mobile nav toggle ----------
  var navToggle = document.getElementById("navToggle");
  var navMobile = document.getElementById("navMobile");

  navToggle.addEventListener("click", function () {
    var isOpen = navMobile.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navMobile.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navMobile.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // ---------- Scroll reveal ----------
  var revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var delay = el.dataset.delay ? Number(el.dataset.delay) : 0;
            setTimeout(function () {
              el.classList.add("in-view");
            }, delay);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // no IntersectionObserver support: just show everything
    revealEls.forEach(function (el) {
      el.classList.add("in-view");
    });
  }

  // stagger reveal delay within repeated groups (chapters, spec rows, steps)
  function stagger(selector, stepMs) {
    document.querySelectorAll(selector).forEach(function (group) {
      var items = group.querySelectorAll(".reveal");
      items.forEach(function (el, i) {
        el.dataset.delay = String(i * stepMs);
      });
    });
  }
  stagger(".chapters", 50);
  stagger(".spec-list", 40);
  stagger(".steps", 50);

  // ---------- Idea submission form (only present on the home page) ----------
  var form = document.getElementById("ideaForm");
  if (!form) return;

  var formGrid = form.querySelector(".form-grid");
  var formSuccess = document.getElementById("formSuccess");
  var formError = document.getElementById("formError");
  var submitBtn = document.getElementById("submitBtn");
  var resetBtn = document.getElementById("resetForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    formError.hidden = true;
    submitBtn.disabled = true;
    submitBtn.querySelector(".btn-label").textContent = "Sending…";

    var data = Object.fromEntries(new FormData(form).entries());

    fetch("/api/submit-idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        if (!res.ok) {
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (body) {
              throw new Error(body.error || "Something went wrong. Please try again.");
            });
        }
        return res.json();
      })
      .then(function () {
        formGrid.hidden = true;
        formSuccess.hidden = false;
      })
      .catch(function (err) {
        formError.hidden = false;
        formError.textContent = err.message || "Something went wrong.";
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.querySelector(".btn-label").textContent = "Send my idea";
      });
  });

  resetBtn.addEventListener("click", function () {
    form.reset();
    formSuccess.hidden = true;
    formGrid.hidden = false;
  });
})();
