/**
 * Text scramble — только слово-приветствие циклически меняется через случайные символы.
 * Остальная часть заголовка («, я Султан») статична.
 */
(function () {
  const CHARS = '!<>-_\\/[]{}=+*^?#@$%0123456789abcdefghijklmnopqrstuvwxyz';

  const PHRASES = ['Привет', 'Салют', 'Бонжур', 'Хола', 'Нихао', 'Салам'];

  // Пауза между словами (мс)
  const PAUSE = 2000;

  class TextScramble {
    constructor(el) {
      this.el = el;
      this.queue = [];
      this.frame = 0;
      this.rafTick = 0;
      this.frameRequest = null;
      this._update = this._update.bind(this);
    }

    setText(newText) {
      const oldText = this.el.textContent;
      const length = Math.max(oldText.length, newText.length);

      return new Promise((resolve) => {
        this._resolve = resolve;
        this.queue = [];

        for (let i = 0; i < length; i++) {
          const from = oldText[i] || '';
          const to   = newText[i] || '';
          const start = Math.floor(Math.random() * 30);
          const end   = start + Math.floor(Math.random() * 30) + 8;
          this.queue.push({ from, to, start, end, char: '' });
        }

        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.rafTick = 0;
        this._update();
      });
    }

    _update() {
      // Пропускаем каждый второй RAF-тик — анимация в 2× медленнее
      this.rafTick++;
      if (this.rafTick % 2 !== 0) {
        this.frameRequest = requestAnimationFrame(this._update);
        return;
      }

      let html = '';
      let complete = 0;

      for (let i = 0; i < this.queue.length; i++) {
        const item = this.queue[i];

        if (this.frame >= item.end) {
          complete++;
          html += item.to ? `<span>${item.to}</span>` : '';
        } else if (this.frame >= item.start) {
          if (!item.char || Math.random() < 0.28) {
            item.char = CHARS[Math.floor(Math.random() * CHARS.length)];
          }
          html += `<span class="scramble-char">${item.char}</span>`;
        } else {
          html += item.from ? `<span>${item.from}</span>` : '';
        }
      }

      this.el.innerHTML = html;

      if (complete === this.queue.length) {
        this.el.textContent = this.queue.map((q) => q.to).join('');
        this._resolve();
      } else {
        this.frame++;
        this.frameRequest = requestAnimationFrame(this._update);
      }
    }
  }

  function init() {
    const el = document.querySelector('.scramble-target');
    if (!el) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const fx = new TextScramble(el);
    let index = 0;

    function next() {
      index = (index + 1) % PHRASES.length;
      fx.setText(PHRASES[index]).then(() => {
        setTimeout(next, PAUSE);
      });
    }

    // Первая пауза перед стартом цикла
    setTimeout(next, PAUSE);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
