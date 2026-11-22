// A rotating wireframe dot-globe for the hero section. Pure canvas, no
// libraries — points sit on lines of latitude and longitude (so it reads as
// an actual globe rather than a random scatter of dots), shaded with a
// simple directional light plus camera-facing depth, and rotate continuously
// with a slight wobble so it doesn't feel mechanical.
(function () {
  "use strict";

  var canvas = document.getElementById("dotGlobe");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var size = 240;

  function resize() {
    size = canvas.clientWidth || canvas.width || 240;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------- build points along meridians (longitude) and parallels (latitude) ----------
  var points = [];
  var MERIDIANS = 16;
  var MERIDIAN_STEPS = 32;
  var PARALLELS = 8;
  var PARALLEL_STEPS = 56;

  for (var m = 0; m < MERIDIANS; m++) {
    var lon = (m / MERIDIANS) * Math.PI * 2;
    for (var s = 0; s <= MERIDIAN_STEPS; s++) {
      var lat = (s / MERIDIAN_STEPS) * Math.PI - Math.PI / 2;
      var cosLat = Math.cos(lat);
      points.push({
        x: cosLat * Math.cos(lon),
        y: Math.sin(lat),
        z: cosLat * Math.sin(lon),
      });
    }
  }
  for (var p = 1; p < PARALLELS; p++) {
    var lat2 = (p / PARALLELS) * Math.PI - Math.PI / 2;
    var r = Math.cos(lat2);
    var py = Math.sin(lat2);
    for (var t = 0; t < PARALLEL_STEPS; t++) {
      var lon2 = (t / PARALLEL_STEPS) * Math.PI * 2;
      points.push({
        x: r * Math.cos(lon2),
        y: py,
        z: r * Math.sin(lon2),
      });
    }
  }

  // light direction (fixed relative to the viewer, so it reads as a lamp
  // lighting the globe from the upper-left as it spins)
  var light = normalize({ x: -0.5, y: -0.45, z: 0.75 });
  function normalize(v) {
    var len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  var angle = 0;
  var wobblePhase = 0;
  var baseTilt = 0.32;

  function draw() {
    var r = size / 2;
    var sphereR = r * 0.82;
    var cosA = Math.cos(angle);
    var sinA = Math.sin(angle);
    var tilt = baseTilt + Math.sin(wobblePhase) * 0.05;
    var cosT = Math.cos(tilt);
    var sinT = Math.sin(tilt);

    ctx.clearRect(0, 0, size, size);

    // soft ambient glow behind the sphere, like a lamp catching it
    var glow = ctx.createRadialGradient(r, r, sphereR * 0.2, r, r, sphereR * 1.35);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.07)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    var projected = new Array(points.length);
    for (var i = 0; i < points.length; i++) {
      var pt = points[i];
      // rotate around Y axis
      var x = pt.x * cosA - pt.z * sinA;
      var z = pt.x * sinA + pt.z * cosA;
      var y = pt.y;
      // tilt around X axis
      var y2 = y * cosT - z * sinT;
      var z2 = y * sinT + z * cosT;

      var ndotl = x * light.x + y2 * light.y + z2 * light.z;
      var lightAmt = Math.max(0, ndotl);
      var depth = (z2 + 1) / 2;
      var brightness = depth * (0.22 + lightAmt * 0.85);

      projected[i] = { x: x, y: y2, z: z2, b: brightness };
    }
    projected.sort(function (a, b) { return a.z - b.z; });

    for (var j = 0; j < projected.length; j++) {
      var p2 = projected[j];
      if (p2.b <= 0.02) continue;
      var screenX = r + p2.x * sphereR;
      var screenY = r + p2.y * sphereR;
      var radius = 0.5 + p2.b * 1.35;
      var opacity = Math.min(1, p2.b);

      ctx.beginPath();
      ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, " + opacity.toFixed(3) + ")";
      ctx.fill();
    }
  }

  var rafId = null;
  function tick() {
    angle += 0.0036;
    wobblePhase += 0.006;
    draw();
    rafId = requestAnimationFrame(tick);
  }

  resize();
  draw();

  if (!reduceMotion) {
    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", function () {
    resize();
    draw();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!reduceMotion && !rafId) {
      rafId = requestAnimationFrame(tick);
    }
  });
})();
