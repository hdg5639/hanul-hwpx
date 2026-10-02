(() => {
  'use strict';
  const api = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : window.__previewApi;
  const base = window.__hanulConfig.base;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const parsed = new URL(url, document.baseURI);
    if (parsed.pathname.startsWith('/rhwp/')) {
      const rewritten = new URL(parsed.pathname.slice(6), base).href;
      return originalFetch(input instanceof Request ? new Request(rewritten, input) : rewritten, init);
    }
    return originalFetch(input, init);
  };
  // A consistent default skin; the upstream theme menu still lets users change it.
  try {
    const settings = JSON.parse(localStorage.getItem('rhwp-settings') || '{}');
    settings.theme = { ...settings.theme, skin: 'flat', mode: 'light' };
    localStorage.setItem('rhwp-settings', JSON.stringify(settings));
  } catch {}
  let version = 0, suppress = true, loaded = false, composing = false;
  const engine = () => window.__hanulEngine;
  const state = text => { const el = document.getElementById('hanul-state'); if (el) el.textContent = text; };
  const notice = text => { const el = document.getElementById('hanul-notice'); if (el) { el.textContent = text; el.hidden = !text; } };
  const post = message => api.postMessage(message);
  const fail = error => { state('작업 실패'); notice(String(error)); post({ type: 'error', error: String(error) }); };
  document.addEventListener('compositionstart', () => { composing = true; }, true);
  document.addEventListener('compositionend', () => { composing = false; }, true);
  document.addEventListener('keydown', event => {
    const command = event.ctrlKey || event.metaKey;
    if (command && !event.altKey && (event.code === 'KeyS' || event.key.toLowerCase() === 's' || event.key === 'ㄴ')) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (!loaded) return;
      if (composing || event.isComposing) { notice('한글 입력을 완료한 뒤 저장해 주세요.'); return; }
      state('저장 중…'); post({ type: event.shiftKey ? 'saveAs' : 'save' });
    }
  }, true);
  window.addEventListener('message', async event => {
    const message = event.data;
    if (!message || message.type !== 'request') return;
    try {
      let result;
      const params = message.params || {};
      switch (message.method) {
        case 'load':
          suppress = true; loaded = false;
          result = params.bytes.length ? await engine().load(params.bytes, params.name) : await engine().create();
          version = params.restored ? 1 : 0;
          document.getElementById('hanul-name').textContent = params.name;
          notice(params.restored ? '복구본을 열었습니다. 저장하면 원본에 반영됩니다.' : result.warnings?.count ? `문서 구조 경고 ${result.warnings.count}건. 표시와 저장 결과를 확인해 주세요.` : '');
          loaded = true; suppress = false; state(params.restored ? '복구됨 · 저장 필요' : '편집 준비 완료');
          break;
        case 'export':
          if (!loaded) throw Error('문서가 아직 준비되지 않았습니다.');
          if (composing) throw Error('한글 입력을 완료한 뒤 저장해 주세요.');
          state('저장 검증 중…');
          result = { bytes: await engine().export(params.format), version };
          break;
        case 'saved':
          if (version === params.version) { await engine().saved(params.name); state(version === params.version ? '저장 완료' : '변경됨 · 저장 필요'); if (version === params.version) notice(''); }
          else state('변경됨 · 저장 필요');
          result = { version }; break;
        case 'saveFailed': state('저장 실패 · 변경 유지'); notice(params.error); result = {}; break;
        case 'testInput':
          if (!window.__hanulConfig.development) throw Error('개발 모드에서만 사용할 수 있습니다.');
          const input = document.querySelector('textarea');
          input.focus(); input.value = params.text;
          input.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: params.text, bubbles: true }));
          await new Promise(resolve => requestAnimationFrame(resolve));
          result = { version }; break;
        default: throw Error('알 수 없는 편집기 요청');
      }
      post({ type: 'response', id: message.id, result });
    } catch (error) {
      if (message.method === 'load') { suppress = true; loaded = false; }
      state('작업 실패'); notice(error.message || String(error));
      post({ type: 'response', id: message.id, error: error.message || String(error) });
    }
  });
  document.addEventListener('DOMContentLoaded', async () => {
    for (const [id, type] of [['hanul-new', 'new'], ['hanul-open', 'open'], ['hanul-save', 'save'], ['hanul-save-as', 'saveAs']]) {
      document.getElementById(id).onclick = () => { if (type.startsWith('save')) { if (!loaded) return; state('저장 중…'); } post({ type }); };
    }
    try {
      const deadline = Date.now() + 60000;
      while (!engine() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
      if (!engine()) throw Error('문서 엔진을 불러오지 못했습니다.');
      await engine().ready();
      engine().onChange(() => { if (suppress || !loaded) return; version++; state('변경됨 · 저장 필요'); post({ type: 'changed', version }); });
      // File lifecycle is owned by VS Code. Hide unsupported embedded/browser commands.
      for (const node of document.querySelectorAll('[data-menu="file"], [data-cmd^="file:"], [data-cmd="edit:compare-documents"]')) node.hidden = true;
      post({ type: 'ready' });
    } catch (error) { fail(error.message || String(error)); }
  });
})();
