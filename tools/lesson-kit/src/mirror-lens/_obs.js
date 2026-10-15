/* ===== 관찰대 페이지 (거울·렌즈 공통) =====
   window.OBS_CFG = { devs, toy, links, concl } 를 먼저 정해요.
   주소 끝에 ?dev=concave-mirror&d=1.45 (기구·거리), &rec=all (기록 채우기, 화면 검사용) */
(() => {
  'use strict';
  try {
    const S = window.SM, { $, $$ } = S, Q = S.Q, CFG = window.OBS_CFG;
    const OPTS = ['물체보다 큰 크기의 바로 선 상', '물체보다 큰 크기의 거꾸로 선 상', '물체보다 작은 크기의 바로 선 상', '물체보다 작은 크기의 거꾸로 선 상'];
    const st = { dev: CFG.devs[0], d: ML.PRESET[0], rec: {}, ask: null, anim: 0, seen: {} };
    if (CFG.devs.includes(Q.get('dev'))) st.dev = Q.get('dev');
    if (Q.get('d')) st.d = +Q.get('d');
    S.st = st;
    const flag = (n) => { if (Q.get(n) === '1') return true; try { return !!(window.frameElement && window.frameElement.dataset[n] === '1'); } catch (e) { return false; } };
    const EMBED = flag('embed');
    $$('[data-link]').forEach((a) => {
      const key = a.dataset.link; a.href = CFG.links[key];
      a.addEventListener('click', (e) => { if (!EMBED) return; e.preventDefault(); parent.postMessage({ type: 'ras-nav', target: key }, '*'); });
    });

    /* 장면 */
    const V = ML.view($('#view'), { dev: st.dev, toy: CFG.toy });
    const SD = ML.side($('#side'), { dev: st.dev, toy: CFG.toy, onDrag: (d) => { stopAnim(); setD(d); }, onEnd: () => snap() });
    const near = (d) => ML.PRESET.findIndex((p) => Math.abs(p - d) < 0.04);

    /* 기구 고르기 */
    $('#seg').innerHTML = CFG.devs.map((k) => `<button type="button" role="tab" data-dev="${k}"><svg width="22" height="34" viewBox="-30 -110 60 220"></svg>${ML.NAMES[k]}</button>`).join('');
    $$('#seg button').forEach((b) => { ML.icon(b.querySelector('svg'), b.dataset.dev, 0, 0, 200); b.addEventListener('click', () => pickDev(b.dataset.dev)); });
    function pickDev(k) {
      st.dev = k; V.dev(k); SD.dev(k); closeAsk(); paint();
    }

    /* 거리 */
    const rng = $('#rng');
    function setD(d) {
      st.d = Math.max(0.3, Math.min(3.6, d));
      V.set(st.d); SD.set(st.d); rng.value = st.d;
      paint();
    }
    function snap() { const i = ML.PRESET.findIndex((p) => Math.abs(p - st.d) < 0.18); if (i >= 0) glide(ML.PRESET[i], 260); }
    function stopAnim() { if (st.anim) cancelAnimationFrame(st.anim); st.anim = 0; }
    function glide(to, ms) {
      stopAnim(); closeAsk();
      const from = st.d, t0 = performance.now(), dur = S.reduce ? 1 : ms || Math.min(3400, 600 + Math.abs(to - from) * 900);
      const step = (now) => { const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; setD(from + (to - from) * e); if (t < 1) st.anim = requestAnimationFrame(step); else st.anim = 0; };
      st.anim = requestAnimationFrame(step);
    }
    rng.addEventListener('input', () => { stopAnim(); closeAsk(); setD(+rng.value); });
    rng.addEventListener('change', snap);
    $$('#pos button').forEach((b, i) => b.addEventListener('click', () => glide(ML.PRESET[i])));

    /* 기록 */
    const key = (dev, i) => dev + ':' + i;
    function closeAsk() { st.ask = null; $('#ask').hidden = true; }
    $('#bRec').addEventListener('click', () => {
      const i = near(st.d); if (i < 0) return;
      st.ask = i;
      $('#askQ').innerHTML = `물체가 <b>${ML.NAMES[st.dev]}</b>에서 <b>${ML.ZONE[i]}</b> 있을 때 보이는 상은?`;
      $$('#ask .opt').forEach((b) => b.classList.remove('bad'));
      $('#ask').hidden = false;
      fb('관찰한 모습 고르기', '거울(렌즈) 속 상과 실제 물체를 비교해 <b>크기</b>와 <b>방향</b>을 골라요.');
    });
    $('#opts').innerHTML = OPTS.map((t, j) => `<button type="button" class="opt" data-j="${j}">${t}</button>`).join('');
    $$('#ask .opt').forEach((b) => b.addEventListener('click', () => {
      if (st.ask == null) return;
      const c = ML.calc(st.dev, ML.PRESET[st.ask]), ans = ML.label(st.dev, ML.PRESET[st.ask]), pick = b.textContent;
      if (pick === ans) { const z = st.ask; st.rec[key(st.dev, z)] = true; closeAsk(); fb('기록했어요', `${ML.NAMES[st.dev]} · ${ML.ZONE[z]}: <b>${ans}</b>`, 'ok'); sheet(); paint(); }
      else {
        b.classList.add('bad');
        const sizeOk = pick.includes(c.big ? '큰' : '작은'), dirOk = pick.includes(c.up ? '바로' : '거꾸로');
        fb('다시 살펴봐요', !sizeOk ? '상의 <b>크기</b>를 실제 물체와 비교해 보세요. F 모양의 긴 막대 길이를 견주어 봐도 좋아요.' : !dirOk ? '상의 <b>방향</b>을 보세요. F의 가로 막대가 위쪽에 있나요, 아래쪽에 있나요?' : '크기와 방향을 다시 비교해 보세요.', 'no');
      }
    }));

    /* 관찰 기록지 */
    const minis = {};
    function sheet() {
      if (!$('#sheet').dataset.built) {
        $('#sheet').innerHTML = '<div class="sh-h"></div>' + ML.ZONE.map((z) => `<div class="sh-h">${z}</div>`).join('') + CFG.devs.map((k) => `<div class="sh-d"><svg width="20" height="30" viewBox="-30 -110 60 220"></svg>${ML.NAMES[k]}</div>` + ML.ZONE.map((z, i) => `<div class="sh-c" data-k="${key(k, i)}"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="#fff" stroke="#bcd0e2" stroke-width="2" stroke-dasharray="5 5"/></svg><span></span></div>`).join('')).join('');
        $$('#sheet .sh-d svg').forEach((s, j) => ML.icon(s, CFG.devs[j], 0, 0, 200));
        $('#sheet').dataset.built = 1;
      }
      $$('#sheet .sh-c').forEach((c) => {
        const k = c.dataset.k, [dev, i] = k.split(':'), on = !!st.rec[k];
        if (on && !minis[k]) { minis[k] = ML.inner(c.querySelector('svg'), dev, CFG.toy, ML.PRESET[+i], 60, 60, 50, { H0: (ML.isMirror(dev) ? 1.3 : 2.6) * 50 }); }
        c.classList.toggle('on', on);
        c.querySelector('span').textContent = on ? ML.label(dev, ML.PRESET[+i]).replace('물체보다 ', '') : '';
      });
      CFG.devs.forEach((k) => {
        const done = [0, 1, 2].every((i) => st.rec[key(k, i)]);
        const box = $('#concl-' + k); box.classList.toggle('lock', !done);
        box.querySelector('p').innerHTML = done ? CFG.concl[k] : '세 위치를 모두 기록하면 정리가 나타나요.';
      });
      const all = CFG.devs.every((k) => [0, 1, 2].every((i) => st.rec[key(k, i)]));
      $('#why').hidden = !all;
      $('#prog i').style.width = (Object.keys(st.rec).length / (CFG.devs.length * 3) * 100) + '%';
    }

    function fb(t, m, cls = '') { $('#fb').className = 'fbk ' + cls; $('#fbT').textContent = t; $('#fbM').innerHTML = m; }
    function paint() {
      const i = near(st.d);
      $$('#seg button').forEach((b) => { b.setAttribute('aria-selected', String(b.dataset.dev === st.dev)); });
      $$('#pos button').forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
      $('#bRec').disabled = i < 0 || !!st.rec[key(st.dev, i)];
      $('#bRec').textContent = i < 0 ? '위치 단추를 누르면 기록할 수 있어요' : st.rec[key(st.dev, i)] ? `${ML.ZONE[i]} · 기록했어요` : `${ML.ZONE[i]} · 이 모습 기록하기`;
      const nRec = Object.keys(st.rec).length;
      const ph = nRec === 0 ? 0 : CFG.devs.every((k) => [0, 1, 2].every((j) => st.rec[key(k, j)])) ? 3 : [0, 1, 2].every((j) => st.rec[key(CFG.devs[0], j)]) ? 1 : 0;
      $$('#ph .ph').forEach((x) => { const p = +x.dataset.p; x.classList.toggle('on', p === ph); x.classList.toggle('done', p < ph); });
    }

    if (Q.get('rec') === 'all') CFG.devs.forEach((k) => [0, 1, 2].forEach((i) => (st.rec[key(k, i)] = true)));
    if (Q.get('rec') === 'one') st.rec[key(CFG.devs[0], 0)] = true;
    sheet(); setD(st.d); paint();
    fb('관찰 시작', CFG.start);
    if (Q.get('ask') === '1') $('#bRec').click();
    if (Q.get('glide')) setTimeout(() => glide(+Q.get('glide')), 300);
    window.SM.okUI = true; window.SM.ok3d = true;
  } catch (err) { window.SM_err('관찰대', err); }
})();
