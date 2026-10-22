(() => {
  const frames = [...document.querySelectorAll('iframe[data-local-map]')];
  const toggle = document.getElementById('language-toggle');
  function update(value) {
    VeinLocal.setLanguage(value);
    document.title = document.querySelector('h1')?.textContent || document.title;
    toggle.textContent = value === 'zh' ? 'English / 切换英文' : '中文 / Switch to Chinese';
    toggle.setAttribute('aria-label', value === 'zh' ? '切换到英文' : 'Switch to Chinese');
    frames.forEach(frame => {
      const url = new URL(frame.getAttribute('src'), location.href);
      if (url.searchParams.get('ui') === value) return;
      if (frame.contentWindow?.saveVeinView) frame.contentWindow.saveVeinView();
      url.searchParams.set('ui', value);
      frame.src = url.href;
    });
  }
  toggle.addEventListener('click', () => update(VeinLocal.language === 'zh' ? 'en' : 'zh'));
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || !frames.some(f => f.contentWindow === event.source) || event.data?.type !== 'vein-language') return;
    update(event.data.language === 'en' ? 'en' : 'zh');
  });
  update(VeinLocal.language);
})();
