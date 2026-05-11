/**
 * Сохранение масштаба браузера между страницами (актуально для file://).
 *
 * Идея: window.devicePixelRatio пропорционально меняется вместе с зумом браузера.
 * Перед уходом со страницы сохраняем «эффективный» DPR в sessionStorage.
 * При загрузке следующей страницы, если браузер сбросил зум, компенсируем
 * разницу через CSS zoom на <html>.
 */
(function () {
  const ZOOM_KEY = "portfolio_zoom_dpr";

  // ── Восстановление ──────────────────────────────────────────────────────────
  const saved = parseFloat(sessionStorage.getItem(ZOOM_KEY) || "0");
  const current = window.devicePixelRatio;

  if (saved && Math.abs(saved - current) > 0.02) {
    // Браузер сбросил зум — выставляем CSS zoom, чтобы компенсировать
    document.documentElement.style.zoom = (saved / current).toFixed(4);
  }

  // ── Сохранение перед уходом ──────────────────────────────────────────────────
  window.addEventListener("beforeunload", () => {
    const cssZoom = parseFloat(document.documentElement.style.zoom || "1");
    // Эффективный DPR = реальный DPR × CSS zoom
    sessionStorage.setItem(ZOOM_KEY, String(current * cssZoom));
  });
})();

/**
 * Панель управления — навигация по разделам + контакты.
 * Компонент рендерится один раз из этого файла;
 * активная кнопка определяется автоматически по имени текущей страницы.
 */
(function () {
  const DOCK_INTRO_SEEN_KEY = "portfolio_dock_intro_seen";
  /* SVG-строки с fill="currentColor" — цвет управляется через CSS */
  const ICON_HOME = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.6191 4.02454C11.4316 3.39296 12.5695 3.39276 13.3818 4.02454L20.5605 9.60853C20.743 9.75058 20.8505 9.96906 20.8506 10.2003V18.6007C20.8505 19.8431 19.8429 20.8504 18.6006 20.8507H5.40039C4.15782 20.8507 3.1505 19.8433 3.15039 18.6007V10.2003C3.15046 9.9691 3.25701 9.75058 3.43945 9.60853L10.6191 4.02454ZM12.4609 5.20911C12.1902 4.99853 11.8109 4.99867 11.54 5.20911L4.65039 10.5665V18.6007C4.6505 19.0148 4.98624 19.3507 5.40039 19.3507H8.55078V14.4005C8.5508 13.1579 9.55815 12.1505 10.8008 12.1505H13.2002C14.4426 12.1507 15.4502 13.158 15.4502 14.4005V19.3507H18.6006C19.0145 19.3504 19.3505 19.0146 19.3506 18.6007V10.5665L12.4609 5.20911ZM10.8008 13.6505C10.3866 13.6505 10.0508 13.9863 10.0508 14.4005V19.3507H13.9502V14.4005C13.9502 13.9865 13.6142 13.6507 13.2002 13.6505H10.8008Z" fill="currentColor"/></svg>`;
  const ICON_PHONE = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.83502 4.23108C7.92727 3.7346 9.07508 4.34314 9.53326 5.27893L10.7794 7.82483C11.1698 8.62239 11.0547 9.57594 10.4854 10.2574L9.57623 11.3453C9.39204 11.5658 9.37398 11.8094 9.4483 11.9664C9.79712 12.7024 10.3 13.2542 11.5421 13.986C11.7514 14.1093 12.0354 14.104 12.2725 13.944L13.8155 12.903C14.4546 12.4717 15.2704 12.3984 15.9766 12.7076L18.5919 13.8522C19.6035 14.2952 20.2336 15.4909 19.7364 16.6178C19.1182 18.0185 18.27 19.0086 17.2393 19.6002C16.2077 20.1923 15.0597 20.3462 13.9131 20.1949C11.6531 19.8967 9.3215 18.4069 7.4942 16.528C5.66301 14.6449 4.21846 12.2485 3.84479 9.98498C3.65637 8.84332 3.73521 7.69843 4.21881 6.67541C4.70708 5.64258 5.57502 4.80389 6.83502 4.23108ZM8.18561 5.93908C8.01305 5.58656 7.66997 5.49943 7.45612 5.59631C6.47522 6.04223 5.89141 6.6453 5.57428 7.31604C5.25251 7.99671 5.17197 8.81795 5.32428 9.74084C5.63228 11.6063 6.87226 13.7369 8.5694 15.4821C10.2704 17.2311 12.3109 18.4713 14.1094 18.7086C14.9922 18.8251 15.7962 18.698 16.4922 18.2985C17.189 17.8985 17.8453 17.1861 18.3633 16.0123C18.4752 15.7587 18.3608 15.3885 17.9903 15.2262L15.3751 14.0817C15.1397 13.9786 14.8674 14.0034 14.6544 14.1471L13.1114 15.1881C12.4311 15.6469 11.5244 15.7173 10.7803 15.2789C9.37677 14.452 8.61121 13.7027 8.09283 12.609C7.72104 11.8245 7.9412 10.9635 8.42487 10.3844L9.33405 9.29553C9.52369 9.06846 9.56261 8.75075 9.43268 8.48498L8.18561 5.93908Z" fill="currentColor"/></svg>`;
  const ICON_CASES = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 2.24609C20.7425 2.24609 21.7498 3.25362 21.75 4.49609V19.4961C21.75 20.7387 20.7426 21.7461 19.5 21.7461H4.5C3.25736 21.7461 2.25 20.7387 2.25 19.4961V4.49609C2.2502 3.25362 3.25748 2.24609 4.5 2.24609H19.5ZM3.75 14.5859V19.4961C3.75 19.9103 4.08579 20.2461 4.5 20.2461H19.5C19.9142 20.2461 20.25 19.9103 20.25 19.4961V14.5566L16.5 10.8066L13.7549 13.5508L16.3359 16.7773C16.5946 17.1007 16.542 17.5732 16.2188 17.832C15.8953 18.0908 15.4228 18.0383 15.1641 17.7148L12.1641 13.9648V13.9639L8.91504 10.0654L3.75 14.5859ZM4.5 3.74609C4.08591 3.74609 3.7502 4.08205 3.75 4.49609V12.5928L8.12109 8.76855L8.22266 8.68848C8.71295 8.34141 9.38533 8.39423 9.81543 8.81348L9.9043 8.90918L12.7998 12.3848L15.6162 9.56934L15.7109 9.4834C16.1691 9.10983 16.8309 9.10983 17.2891 9.4834L17.3838 9.56934L20.25 12.4355V4.49609C20.2498 4.08205 19.9141 3.74609 19.5 3.74609H4.5Z" fill="currentColor"/></svg>`;
  const ICON_ABOUT = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.6139 12C12.028 12.0001 12.3639 12.3359 12.3639 12.75C12.3639 13.1641 12.028 13.4999 11.6139 13.5H10.8639C8.51288 13.5 7.33381 13.8164 6.68225 14.4121C6.04524 14.9947 5.72784 16.0169 5.64123 18.0303C5.62494 18.409 5.9388 18.7498 6.36291 18.75H11.6139C12.028 18.7501 12.3639 19.0859 12.3639 19.5C12.3639 19.9141 12.028 20.2499 11.6139 20.25H6.36291C5.1305 20.2498 4.08732 19.2422 4.14221 17.9658C4.2294 15.9388 4.54267 14.337 5.67053 13.3057C6.78397 12.2876 8.50443 12 10.8639 12H11.6139ZM16.6871 18C17.1013 18 17.4371 18.3358 17.4371 18.75V18.8623C17.4371 19.2765 17.1013 19.6123 16.6871 19.6123C16.2731 19.612 15.9371 19.2764 15.9371 18.8623V18.75C15.9371 18.3359 16.2731 18.0003 16.6871 18ZM16.6871 11.25C18.0333 11.25 19.1246 12.3413 19.1246 13.6875C19.1246 14.7721 18.4161 15.6882 17.4371 16.0049V16.5C17.4371 16.9142 17.1013 17.25 16.6871 17.25C16.2731 17.2497 15.9371 16.9141 15.9371 16.5V15.625C15.9371 15.0498 16.3913 14.6799 16.8268 14.5986L16.9098 14.5986C17.3199 14.499 17.6246 14.1282 17.6246 13.6875C17.6246 13.1697 17.2049 12.75 16.6871 12.75C16.1696 12.7503 15.7496 13.1699 15.7496 13.6875C15.7496 14.1017 15.4138 14.4375 14.9996 14.4375C14.5856 14.4372 14.2496 14.1016 14.2496 13.6875C14.2496 12.3415 15.3412 11.2503 16.6871 11.25ZM11.8072 3.75488C13.7884 3.85561 15.3639 5.49385 15.3639 7.5L15.359 7.69336C15.2584 9.6745 13.62 11.2499 11.6139 11.25L11.4205 11.2451C9.43932 11.1445 7.86389 9.50622 7.86389 7.5C7.86389 5.42893 9.54282 3.75 11.6139 3.75L11.8072 3.75488ZM11.6139 5.25C10.3712 5.25 9.36389 6.25736 9.36389 7.5C9.36389 8.74264 10.3712 9.75 11.6139 9.75C12.8564 9.7499 13.8639 8.74258 13.8639 7.5C13.8639 6.25742 12.8564 5.2501 11.6139 5.25Z" fill="currentColor"/></svg>`;

  const pages = [
    { label: "Главная страница", href: "index.html",  icon: ICON_HOME  },
    { label: "Кейсы",           href: "cases.html", icon: ICON_CASES },
    { label: "Обо мне",         href: "about.html", icon: ICON_ABOUT },
  ];

  const contacts = [
    { href: "https://t.me/Haci_111",                                                               icon: "images/icons/icon-telegram.svg", label: "Telegram" },
    { href: "https://www.linkedin.com/in/nursultan-gadzhiev-b75b5a3a6/",                           icon: "images/icons/icon-linkedin.svg", label: "LinkedIn" },
    { href: "https://drive.google.com/file/d/1LmTlOFXBsoBo7CV6uEQRUcZARY7g2i0g/view?usp=sharing", icon: "images/icons/icon-cv.svg",       label: "Резюме PDF" },
  ];

  /** Имя текущего файла: "index.html", "cases.html" и т.д. */
  const currentFile = location.pathname.split("/").pop() || "index.html";

  /* Секция с кнопками-разделами */
  const sectionsNav = document.createElement("nav");
  sectionsNav.className = "dock";
  sectionsNav.setAttribute("aria-label", "Разделы сайта");

  pages.forEach(({ label, href, icon }) => {
    const a = document.createElement("a");
    a.className = "btn-primary" + (currentFile === href ? " is-active" : "");
    a.href = href;
    if (currentFile === href) a.setAttribute("aria-current", "page");

    const iconSpan = document.createElement("span");
    iconSpan.className = "btn-primary__icon";
    iconSpan.setAttribute("aria-hidden", "true");
    iconSpan.innerHTML = icon;

    const labelSpan = document.createElement("span");
    labelSpan.className = "btn-primary__label";
    labelSpan.textContent = label;

    a.appendChild(iconSpan);
    a.appendChild(labelSpan);
    sectionsNav.appendChild(a);
  });

  /* Секция с иконками-контактами */
  const contactsNav = document.createElement("nav");
  contactsNav.className = "dock";
  contactsNav.setAttribute("aria-label", "Контакты");

  /* Кнопка «Контакты» — видна только на планшете и телефоне */
  const contactsBtn = document.createElement("a");
  contactsBtn.className = "btn-primary contacts-mobile-btn" +
    (currentFile === "contacts.html" ? " is-active" : "");
  contactsBtn.href = "contacts.html";
  if (currentFile === "contacts.html") contactsBtn.setAttribute("aria-current", "page");

  const phoneIconSpan = document.createElement("span");
  phoneIconSpan.className = "btn-primary__icon";
  phoneIconSpan.setAttribute("aria-hidden", "true");
  phoneIconSpan.innerHTML = ICON_PHONE;

  const phoneLabelSpan = document.createElement("span");
  phoneLabelSpan.className = "btn-primary__label";
  phoneLabelSpan.textContent = "Контакты";

  contactsBtn.appendChild(phoneIconSpan);
  contactsBtn.appendChild(phoneLabelSpan);
  contactsNav.appendChild(contactsBtn);

  /* 3 иконки-контакта — видны только на десктопе */
  contacts.forEach(({ href, icon, label }) => {
    const a = document.createElement("a");
    a.className = "dock__icon-btn";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", label);
    a.setAttribute("title", label);

    const img = document.createElement("img");
    img.src = icon;
    img.alt = "";

    a.appendChild(img);
    contactsNav.appendChild(a);
  });

  /* Обёртка */
  const wrap = document.createElement("div");
  wrap.className = "dock-wrap";
  const hasSeenIntro = sessionStorage.getItem(DOCK_INTRO_SEEN_KEY) === "1";
  if (!hasSeenIntro) {
    wrap.classList.add("dock-wrap--intro");
    sessionStorage.setItem(DOCK_INTRO_SEEN_KEY, "1");
  }
  wrap.appendChild(sectionsNav);
  wrap.appendChild(contactsNav);

  /*
    Progressive blur под панелью (как hatoyan.com/case/salmon/):
    несколько слоёв с backdrop-filter и смещёнными mask-image — плавное «туманное» дно.
  */
  /* Максимально близко к hatoyan.com/case/salmon/: те же blur-ступени и маски */
  const DOCK_PROGRESSIVE_LAYERS = [
    { blur: 44, mask: "linear-gradient(to top, transparent 0%, black 0%, black 10%, transparent 27%)" },
    { blur: 32, mask: "linear-gradient(to top, transparent 0%, black 10%, black 20%, transparent 37%)" },
    { blur: 16, mask: "linear-gradient(to top, transparent 3%, black 20%, black 30%, transparent 47%)" },
    { blur: 12, mask: "linear-gradient(to top, transparent 13%, black 30%, black 40%, transparent 57%)" },
    { blur: 8, mask: "linear-gradient(to top, transparent 23%, black 40%, black 50%, transparent 67%)" },
    { blur: 4, mask: "linear-gradient(to top, transparent 33%, black 50%, black 60%, transparent 77%)" },
    { blur: 2, mask: "linear-gradient(to top, transparent 43%, black 60%, black 70%, transparent 87%)" },
    { blur: 1, mask: "linear-gradient(to top, transparent 53%, black 70%, black 80%, transparent 97%)" },
  ];

  /* Как в styles.css: за @media (max-width: 1024px) — без progressive blur */
  const DOCK_PROGRESSIVE_BLUR_DESKTOP_MQ = "(min-width: 1025px)";

  function prefersReducedDockMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function dockProgressiveBlurWanted() {
    if (prefersReducedDockMotion()) return false;
    if (!window.matchMedia) return false;
    return window.matchMedia(DOCK_PROGRESSIVE_BLUR_DESKTOP_MQ).matches;
  }

  function buildDockProgressiveBlurElement() {
    const el = document.createElement("div");
    el.className = "dock-progressive-bottom";
    el.setAttribute("aria-hidden", "true");

    DOCK_PROGRESSIVE_LAYERS.forEach(({ blur, mask }) => {
      const layer = document.createElement("div");
      layer.className = "dock-progressive-blur-layer";
      layer.style.backdropFilter = "blur(" + blur + "px)";
      layer.style.webkitBackdropFilter = "blur(" + blur + "px)";
      layer.style.maskImage = mask;
      layer.style.webkitMaskImage = mask;
      el.appendChild(layer);
    });

    return el;
  }

  let progressiveBottom = dockProgressiveBlurWanted() ? buildDockProgressiveBlurElement() : null;
  if (progressiveBottom) {
    document.body.classList.add("has-dock-progressive-blur");
  }

  /* Монтируем в #dock-root или прямо в body */
  const root = document.getElementById("dock-root");
  if (root) {
    if (progressiveBottom) {
      root.replaceWith(progressiveBottom, wrap);
    } else {
      root.replaceWith(wrap);
    }
  } else {
    if (progressiveBottom) {
      document.body.appendChild(progressiveBottom);
    }
    document.body.appendChild(wrap);
  }

  function syncDockProgressiveBlur() {
    const want = dockProgressiveBlurWanted();
    if (want && !progressiveBottom) {
      progressiveBottom = buildDockProgressiveBlurElement();
      wrap.parentNode.insertBefore(progressiveBottom, wrap);
      document.body.classList.add("has-dock-progressive-blur");
    } else if (!want && progressiveBottom) {
      progressiveBottom.remove();
      progressiveBottom = null;
      document.body.classList.remove("has-dock-progressive-blur");
    }
  }

  if (window.matchMedia) {
    const mql = window.matchMedia(DOCK_PROGRESSIVE_BLUR_DESKTOP_MQ);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", syncDockProgressiveBlur);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(syncDockProgressiveBlur);
    }
  }
})();

