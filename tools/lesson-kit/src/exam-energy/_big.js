/* ===== 전체 화면일 때 아래 막대에 '원래 화면' 버튼을 보여 줘요 (탭 껍데기 index.html이 알려 줌) ===== */
(() => {
  const b = document.getElementById('bExit');
  if (!b) return;
  b.addEventListener('click', () => { try { parent.postMessage({ type: 'ex-big-exit' }, '*'); } catch (e) {} });
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'ex-big') document.body.classList.toggle('big', !!e.data.on);
  });
  try { if (parent !== window) parent.postMessage({ type: 'ex-big-ask' }, '*'); } catch (e) {}
})();
