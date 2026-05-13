/**
 * «Кодовая» текстура на фоне, видимая только в круглом спотлайте у курсора.
 * Подключается на страницах, где в разметке есть .home-code-spotlight.
 * В .main-area: над текстом/медиа — градиентный спотлайт; в пустых отступах — без эффекта (как за пределами круга).
 */
(function () {
  const DESKTOP_MQ = "(min-width: 1025px)";
  /** Символы для смены — цифры, операторы, пунктуация, «кодовые» знаки */
  const CHARSET =
    "0123456789" +
    "abcdefghijklmnopqrstuvwxyz" +
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    "*+-/.;=<>[]{}()_!?@#$%^&|~`:\\";

  const STEP_X = 11;
  const STEP_Y = 15;

  /** Элементы контента: над ними внутри .main-area включается спотлайт */
  var SPOTLIGHT_SUBSTANTIVE_SEL =
    [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "li",
      "dt",
      "dd",
      "a",
      "button",
      "img",
      "picture",
      "video",
      "svg",
      "figure",
      "blockquote",
      "table",
      "pre",
      "code",
      "article",
      ".contacts-list__item",
      ".case-hero",
      ".case-design__img",
      ".profile-head",
      ".avatar",
    ].join(", ");

  let mounted = false;
  let container;
  let canvas;
  let ctx;
  let spotRafId = 0;
  let pendingX = 0;
  let pendingY = 0;

  let gridCols = 0;
  let gridRows = 0;
  let chars;
  let opacities;
  let pageBg = "#ffffff";

  let scrambleId = null;

  function isEnabledContext() {
    if (!document.body) return false;
    if (!document.querySelector(".home-code-spotlight")) return false;
    if (!window.matchMedia) return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return window.matchMedia(DESKTOP_MQ).matches;
  }

  function randomChar() {
    return CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }

  function pickDifferentChar(prev) {
    let c = randomChar();
    let guard = 0;
    while (c === prev && guard++ < 8) {
      c = randomChar();
    }
    return c;
  }

  function buildGrid(w, h) {
    gridCols = Math.ceil(w / STEP_X);
    gridRows = Math.ceil(h / STEP_Y);
    const n = gridCols * gridRows;
    chars = new Array(n);
    opacities = new Array(n);
    for (let i = 0; i < n; i++) {
      chars[i] = randomChar();
      opacities[i] = 0.06 + Math.random() * 0.14;
    }
  }

  function drawCell(col, row) {
    const i = row * gridCols + col;
    if (i < 0 || i >= chars.length) return;
    const x = col * STEP_X;
    const y = row * STEP_Y;
    ctx.fillStyle = pageBg;
    ctx.fillRect(x, y, STEP_X + 1, STEP_Y + 1);
    ctx.fillStyle = "rgba(67, 81, 101, " + opacities[i].toFixed(3) + ")";
    ctx.fillText(chars[i], x, y);
  }

  function drawCanvas() {
    if (!ctx || !canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    pageBg = getComputedStyle(document.documentElement).getPropertyValue("--bg-page").trim() || "#ffffff";

    ctx.textBaseline = "top";
    ctx.font = '500 11px ui-monospace, "Cascadia Code", "Consolas", monospace';

    buildGrid(w, h);

    ctx.fillStyle = pageBg;
    ctx.fillRect(0, 0, w, h);

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const i = row * gridCols + col;
        ctx.fillStyle = "rgba(67, 81, 101, " + opacities[i].toFixed(3) + ")";
        ctx.fillText(chars[i], col * STEP_X, row * STEP_Y);
      }
    }
  }

  function tickScramble() {
    if (!ctx || !chars.length) return;
    if (!document.body.classList.contains("home-code-spotlight--on")) return;
    if (document.body.classList.contains("home-code-spotlight--main-empty")) return;

    var n = chars.length;
    var batch = Math.max(12, Math.floor(n * 0.035));

    for (var k = 0; k < batch; k++) {
      const idx = Math.floor(Math.random() * n);
      chars[idx] = pickDifferentChar(chars[idx]);
      const row = Math.floor(idx / gridCols);
      const col = idx % gridCols;
      drawCell(col, row);
    }
  }

  function startScramble() {
    if (scrambleId != null) return;
    scrambleId = window.setInterval(tickScramble, 90);
  }

  function stopScramble() {
    if (scrambleId != null) {
      window.clearInterval(scrambleId);
      scrambleId = null;
    }
  }

  function applySpot() {
    spotRafId = 0;
    if (!container) return;
    container.style.setProperty("--home-spot-x", pendingX + "px");
    container.style.setProperty("--home-spot-y", pendingY + "px");
    updateMainZoneFromPoint(pendingX, pendingY);
  }

  /**
   * Вне .main-area — полный спотлайт.
   * Внутри main, но курсор на отступе / пустом месте — скрыть слой (как «край» страницы).
   * Внутри main над контентом — показать градиент.
   */
  function updateMainZoneFromPoint(x, y) {
    var mainEl = document.querySelector(".main-area");
    if (!mainEl) return;

    var stack;
    try {
      stack = document.elementsFromPoint(x, y);
    } catch (err) {
      return;
    }

    if (!stack || !stack.length) {
      document.body.classList.remove("home-code-spotlight--main-empty");
      return;
    }

    var i;
    var el;

    for (i = 0; i < stack.length; i++) {
      el = stack[i];
      if (!el || el.nodeType !== 1) continue;

      if (el.classList && el.classList.contains("home-code-spotlight")) continue;
      if (el.closest && el.closest(".dock-wrap")) continue;
      if (el.closest && el.closest(".dock-progressive-bottom")) continue;
      if (el.closest && el.closest(".corner-label")) continue;
      if (el.closest && el.closest(".tg-block")) continue;
      if (el.closest && el.closest(".case-sidebar")) continue;
      if (el.closest && el.closest(".case-back-mobile")) continue;

      if (!mainEl.contains(el)) {
        document.body.classList.remove("home-code-spotlight--main-empty");
        return;
      }

      if (el === mainEl) {
        document.body.classList.add("home-code-spotlight--main-empty");
        return;
      }

      if (el.closest(SPOTLIGHT_SUBSTANTIVE_SEL)) {
        document.body.classList.remove("home-code-spotlight--main-empty");
        return;
      }
    }

    document.body.classList.add("home-code-spotlight--main-empty");
  }

  function onMove(e) {
    document.body.classList.add("home-code-spotlight--on");
    startScramble();
    pendingX = e.clientX;
    pendingY = e.clientY;
    if (!spotRafId) {
      spotRafId = requestAnimationFrame(applySpot);
    }
  }

  function onLeave() {
    document.body.classList.remove("home-code-spotlight--on");
    document.body.classList.remove("home-code-spotlight--main-empty");
    stopScramble();
  }

  function mount() {
    if (mounted) return;

    container = document.querySelector(".home-code-spotlight");
    canvas = document.querySelector(".home-code-spotlight__canvas");
    if (!container || !canvas) return;
    ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    mounted = true;
    drawCanvas();
    window.addEventListener("resize", drawCanvas, { passive: true });
    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("blur", onLeave, { passive: true });

    container.hidden = false;
    container.classList.add("home-code-spotlight--ready");
  }

  function unmount() {
    stopScramble();
    if (!mounted) {
      document.body.classList.remove("home-code-spotlight--on");
      document.body.classList.remove("home-code-spotlight--main-empty");
      return;
    }
    document.body.classList.remove("home-code-spotlight--on");
    document.body.classList.remove("home-code-spotlight--main-empty");
    window.removeEventListener("resize", drawCanvas);
    document.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("blur", onLeave);

    if (container) {
      container.hidden = true;
      container.classList.remove("home-code-spotlight--ready");
    }
    container = null;
    canvas = null;
    ctx = null;
    chars = null;
    opacities = null;
    mounted = false;
    if (spotRafId) {
      cancelAnimationFrame(spotRafId);
      spotRafId = 0;
    }
  }

  let mqListenerAttached = false;

  function sync() {
    if (isEnabledContext()) {
      if (!mounted) mount();
    } else {
      unmount();
    }
  }

  function init() {
    sync();
    if (!window.matchMedia || mqListenerAttached) return;
    mqListenerAttached = true;
    const mql = window.matchMedia(DESKTOP_MQ);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", sync);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(sync);
    }
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (typeof rm.addEventListener === "function") {
      rm.addEventListener("change", sync);
    } else if (typeof rm.addListener === "function") {
      rm.addListener(sync);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
