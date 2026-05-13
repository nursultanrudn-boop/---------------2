/**
 * «Кодовая» текстура на фоне, видимая только в круглом спотлайте у курсора.
 * Подключается на страницах, где в разметке есть .home-code-spotlight.
 * В .main-area: над текстом/медиа — градиентный спотлайт; в пустых отступах — без эффекта (как за пределами круга).
 */
(function () {
  /**
   * Главный переключатель эффекта «код под курсором» (спотлайт + canvas).
   * Поставьте true, чтобы снова включить. Ищите по проекту: ENABLE_HOME_CODE_SPOTLIGHT
   */
  const ENABLE_HOME_CODE_SPOTLIGHT = false;

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

  /** Кэш геометрии слоя (совпадает с областью clientX/Y / Visual Viewport) */
  let layoutW = -1;
  let layoutH = -1;
  let layoutLeft = 0;
  let layoutTop = 0;

  /**
   * Прямоугольник «вьюпорта для указателя»: Visual Viewport при наличии (та же система координат,
   * что у clientX/clientY при CSS zoom на <html> из main.js и при сдвигах визуального вьюпорта),
   * иначе — getBoundingClientRect у корневого элемента.
   */
  function readSpotlightBox() {
    var vv = window.visualViewport;
    if (vv && vv.width > 0 && vv.height > 0) {
      return {
        left: vv.offsetLeft,
        top: vv.offsetTop,
        width: vv.width,
        height: vv.height,
      };
    }
    var r = document.documentElement.getBoundingClientRect();
    var fw = r.width || document.documentElement.clientWidth || window.innerWidth || 0;
    var fh = r.height || document.documentElement.clientHeight || window.innerHeight || 0;
    return {
      left: r.left,
      top: r.top,
      width: fw,
      height: fh,
    };
  }

  function syncSpotlightLayout() {
    if (!container) return;
    var b = readSpotlightBox();
    var w = Math.max(1, Math.round(b.width));
    var h = Math.max(1, Math.round(b.height));
    if (
      w === layoutW &&
      h === layoutH &&
      Math.abs(b.left - layoutLeft) < 0.5 &&
      Math.abs(b.top - layoutTop) < 0.5 &&
      container.style.width
    ) {
      return;
    }

    layoutW = w;
    layoutH = h;
    layoutLeft = b.left;
    layoutTop = b.top;
    container.style.left = b.left + "px";
    container.style.top = b.top + "px";
    container.style.width = w + "px";
    container.style.height = h + "px";
    container.style.right = "auto";
    container.style.bottom = "auto";
  }

  function isEnabledContext() {
    if (!ENABLE_HOME_CODE_SPOTLIGHT) return false;
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
    syncSpotlightLayout();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var box = readSpotlightBox();
    var w = Math.max(1, Math.round(box.width));
    var h = Math.max(1, Math.round(box.height));
    if (w < 8 || h < 8) {
      w = Math.max(w, document.documentElement.clientWidth || window.innerWidth || 800);
      h = Math.max(h, document.documentElement.clientHeight || window.innerHeight || 600);
    }
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
    syncSpotlightLayout();
    var b = readSpotlightBox();
    var lx = pendingX - b.left;
    var ly = pendingY - b.top;
    /*
      Проценты для mask: тот же прямоугольник, что readSpotlightBox() (VV / zoom / gutter).
     */
    var w = b.width;
    var h = b.height;
    var xPct = w > 0.5 ? (lx / w) * 100 : 50;
    var yPct = h > 0.5 ? (ly / h) * 100 : 50;
    container.style.setProperty("--home-spot-x-pct", xPct.toFixed(3) + "%");
    container.style.setProperty("--home-spot-y-pct", yPct.toFixed(3) + "%");
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

      if (el.closest && el.closest(".home-code-spotlight")) continue;
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
    /* Сначала показываем слой — иначе rect у [hidden] = 0 и canvas почти пустой */
    container.hidden = false;
    container.classList.add("home-code-spotlight--ready");
    drawCanvas();
    window.addEventListener("resize", drawCanvas, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", drawCanvas, { passive: true });
      window.visualViewport.addEventListener("scroll", drawCanvas, { passive: true });
    }
    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("blur", onLeave, { passive: true });
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
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", drawCanvas);
      window.visualViewport.removeEventListener("scroll", drawCanvas);
    }
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
    layoutW = -1;
    layoutH = -1;
    layoutLeft = 0;
    layoutTop = 0;
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
