/* Offline display translation. Coordinates, IDs and game rules remain in the source data. */
window.VeinLocal = (() => {
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  const dictionary = Object.fromEntries(Object.entries(window.VEIN_LOCALE).map(([key, value]) => [normalize(key), value]));
  const query = new URLSearchParams(location.search);
  const isMap = location.pathname.endsWith('/embed.html');
  let language = query.get('ui') || localStorage.getItem('vein-language') || 'zh';
  if (!['zh', 'en'].includes(language)) language = 'zh';
  const originals = new WeakMap();
  const attributes = new WeakMap();

  function translate(text) {
    const key = normalize(text);
    if (dictionary[key]) return text.replace(text.trim(), dictionary[key]);
    return text
      .replace(/^Inside /, '位于内部：').replace(/^Near /, '位于附近：').replace(/^Within /, '位于区域内：')
      .replace(/\bMay require\b/g, '可能需要').replace(/\bRequired\b/g, '需要')
      .replace(/\bRecommended\b/g, '建议').replace(/\bMemo:/g, '备注：')
      .replace(/\(Sometimes\)/g, '（有时出现）').replace(/\(Many\)/g, '（多个）')
      .replace(/\(Req\. Lv\./g, '（需要开锁等级 ').replace(/Open guide/g, '打开本地攻略');
  }

  function apply(root = document.body) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE || root.closest('script,style,svg,#language-toggle,.local-map-controls')) return;
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walk.nextNode())) {
      if (!node.textContent.trim() || node.parentElement.closest('script,style,svg,#language-toggle,.local-map-controls')) continue;
      const previous = originals.get(node);
      const original = previous && node.textContent === previous.displayed ? previous.original : node.textContent;
      const displayed = language === 'zh' ? translate(original) : original;
      originals.set(node, {original, displayed});
      if (node.textContent !== displayed) node.textContent = displayed;
    }
    for (const el of [root, ...root.querySelectorAll('[title],[placeholder],[aria-label]')]) {
      if (el.closest('#language-toggle,.local-map-controls')) continue;
      let saved = attributes.get(el);
      if (!saved) { saved = {}; attributes.set(el, saved); }
      for (const attr of ['title', 'placeholder', 'aria-label']) {
        const value = el.getAttribute(attr);
        if (value === null) continue;
        const old = saved[attr];
        const original = old && value === old.displayed ? old.original : value;
        const displayed = language === 'zh' ? translate(original) : original;
        saved[attr] = {original, displayed};
        if (value !== displayed) el.setAttribute(attr, displayed);
      }
    }
  }

  function setLanguage(value) {
    language = value;
    localStorage.setItem('vein-language', value);
    document.documentElement.lang = value === 'zh' ? 'zh-CN' : 'en';
    apply();
  }
  setLanguage(language);
  const observerOptions = {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'aria-label']};
  const observer = new MutationObserver(records => {
    observer.disconnect();
    for (const record of records) {
      if (record.type === 'characterData') apply(record.target.parentElement);
      else if (record.type === 'attributes') apply(record.target);
      else for (const node of record.addedNodes) apply(node.nodeType === Node.TEXT_NODE ? node.parentElement : node);
    }
    observer.observe(document.body, observerOptions);
  });
  observer.observe(document.body, observerOptions);
  return {get language() {return language;}, setLanguage, translate, isMap};
})();
