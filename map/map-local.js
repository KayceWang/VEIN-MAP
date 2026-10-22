(() => {
  const mapDiv = document.getElementById('game-map');
  const viewKey = 'vein-map-view:' + (new URLSearchParams(location.search).get('preset') || 'all');
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(viewKey)); } catch { saved = null; }
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y) && Number.isInteger(saved.zoom) && saved.zoom >= 0 && saved.zoom <= 6) {
    mapDiv.setAttribute('data-center-x', saved.x);
    mapDiv.setAttribute('data-center-y', saved.y);
    mapDiv.setAttribute('data-zoom', saved.zoom);
  }
  window.saveVeinView = () => {
    if (!window.map) return;
    const p = window.map.project(window.map.getCenter(), 5);
    const checks = [...document.querySelectorAll('.vein-filter-drawer input[type=checkbox]')].map(input => ({
      key: ['data-vein-style-key', 'data-vein-cat-id', 'data-vein-item-id', 'data-vein-importance-visual', 'data-local-setting'].find(a => input.hasAttribute(a)),
      value: input.getAttribute(['data-vein-style-key', 'data-vein-cat-id', 'data-vein-item-id', 'data-vein-importance-visual', 'data-local-setting'].find(a => input.hasAttribute(a)) || ''),
      checked: input.checked
    })).filter(item => item.key);
    sessionStorage.setItem(viewKey, JSON.stringify({x:p.x, y:p.y, zoom:window.map.getZoom(), checks}));
  };
  const controls = document.createElement('div');
  controls.className = 'local-map-controls';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = VeinLocal.language === 'zh' ? 'English' : '中文';
  button.setAttribute('aria-label', VeinLocal.language === 'zh' ? '切换到英文' : 'Switch to Chinese');
  button.addEventListener('click', () => {
    saveVeinView();
    const next = VeinLocal.language === 'zh' ? 'en' : 'zh';
    if (window.parent !== window) {
      window.parent.postMessage({type:'vein-language', language:next}, location.origin);
    } else {
      localStorage.setItem('vein-language', next);
      const url = new URL(location.href); url.searchParams.set('ui', next); url.searchParams.set('lang','en'); location.replace(url);
    }
  });
  controls.appendChild(button);
  document.getElementById('map-container').appendChild(controls);
  const script = document.createElement('script');
  script.src = VeinLocal.language === 'zh' ? 'map.zh.js' : 'map.js';
  script.onerror = () => {
    const warning = document.createElement('p');
    warning.className = 'local-load-error';
    warning.textContent = '地图加载失败，请用 Start-Map.cmd 启动后访问本地网址。';
    document.body.appendChild(warning);
  };
  script.onload = () => {
    if (window.map) window.map.on('moveend zoomend', saveVeinView);
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.vein-filter-drawer')) return;
      observer.disconnect();
      const grouped = document.querySelector('input[aria-label="Grouped view"],input[aria-label="分组视图"]');
      if (grouped) grouped.setAttribute('data-local-setting', 'grouped-view');
      for (const state of saved?.checks || []) {
        const input = [...document.querySelectorAll('input[type=checkbox]')].find(el => el.getAttribute(state.key) === state.value);
        if (input && input.checked !== state.checked) {
          input.checked = state.checked;
          input.dispatchEvent(new Event('change', {bubbles:true}));
        }
      }
      VeinLocal.setLanguage(VeinLocal.language);
    });
    observer.observe(document.body, {childList:true, subtree:true});
  };
  document.body.appendChild(script);
})();
