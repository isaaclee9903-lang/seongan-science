/* ===== SND: 악기 소리 내기 + 소리 분석 화면(파형) =====
   - 실제 악기 녹음(audio/*.mp3, 한 음 2.2초)을 Web Audio로 재생해요. 다른 음은 가까운 녹음을 빠르게·느리게 재생해 만들어요.
   - 파형은 마이크가 아니라 재생 중인 녹음 자료를 그대로 그려요(소리를 꺼 둔 기기에서도 같은 파형이 보여요).
   - SND.scope(host, opts): 교과서 그림 Ⅲ-16~18처럼 모눈 위에 파형을 그리는 화면 */
(() => {
  'use strict';
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midiOf = (n) => { const m = /^([A-G])(s?)(-?\d)$/.exec(n); return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] ? 1 : 0); };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // 악기 목록: base = 이 악기의 '낮은 도'(MIDI 번호), part = 진동하는 부분, perc = 치는 악기(소리가 빨리 줄어듦), g4 = '솔'(G4)을 자연스럽게 낼 수 있음
  const INST = {
    violin:     { name: '바이올린',   fam: 'str', base: 60, part: '줄', how: '활로 줄을 문질러 줄이 진동해요', s: ['C4', 'E4', 'G4', 'A4', 'C5'], g4: 1 },
    cello:      { name: '첼로',       fam: 'str', base: 48, part: '줄', how: '활로 굵은 줄을 문질러 줄이 진동해요', s: ['C3', 'E3', 'G3', 'A3', 'C4', 'G4'], g4: 1 },
    contrabass: { name: '콘트라베이스', fam: 'str', base: 36, part: '줄', how: '활로 아주 굵고 긴 줄을 문질러 줄이 진동해요', s: ['C2', 'E2', 'Gs2', 'Cs3'] },
    harp:       { name: '하프',       fam: 'str', base: 60, part: '줄', how: '손가락으로 줄을 퉁겨 줄이 진동해요', s: ['B3', 'D4', 'F4', 'A4', 'C5'], perc: 1, g4: 1 },
    flute:      { name: '플루트',     fam: 'ww',  base: 72, part: '관 속 공기', how: '구멍에 입김을 불어 관 속 공기가 진동해요', s: ['A4', 'C5', 'E5', 'A5', 'C6'], g4: 1 },
    clarinet:   { name: '클라리넷',   fam: 'ww',  base: 60, part: '관 속 공기', how: '입김을 불어 관 속 공기가 진동해요', s: ['D4', 'F4', 'As4', 'D5'], g4: 1 },
    bassoon:    { name: '바순',       fam: 'ww',  base: 48, part: '관 속 공기', how: '입김을 불어 긴 관 속 공기가 진동해요', s: ['C3', 'G3', 'A3', 'C4', 'G4'], g4: 1 },
    recorder:   { name: '리코더',     fam: 'ww',  base: 72, part: '관 속 공기', how: '입김을 불어 관 속 공기가 진동해요', s: ['G4', 'C5', 'E5', 'G5', 'C6'], g4: 1 },
    trumpet:    { name: '트럼펫',     fam: 'br',  base: 60, part: '관 속 공기', how: '입술을 떨며 불어 관 속 공기가 진동해요', s: ['C4', 'Ds4', 'F4', 'G4', 'As4', 'D5'], g4: 1 },
    horn:       { name: '호른',       fam: 'br',  base: 48, part: '관 속 공기', how: '입술을 떨며 불어 둥글게 감긴 관 속 공기가 진동해요', s: ['D3', 'F3', 'A3', 'C4'] },
    trombone:   { name: '트롬본',     fam: 'br',  base: 48, part: '관 속 공기', how: '입술을 떨며 불어 관 속 공기가 진동해요', s: ['C3', 'Ds3', 'F3', 'Gs3', 'C4', 'F4'], g4: 1 },
    tuba:       { name: '튜바',       fam: 'br',  base: 36, part: '관 속 공기', how: '입술을 떨며 불어 크고 긴 관 속 공기가 진동해요', s: ['As1', 'Ds2', 'F2', 'As2'] },
    xylophone:  { name: '실로폰',     fam: 'pc',  base: 72, part: '나무 막대', how: '채로 나무 막대를 쳐서 막대가 진동해요', s: ['G4', 'C5', 'G5', 'C6'], perc: 1, g4: 1 },
    timpani:    { name: '팀파니',     fam: 'pc',  base: 36, part: '막', how: '채로 가죽 막을 쳐서 막이 진동해요', s: ['C2', 'E2', 'G2', 'C3'], perc: 1 },
  };
  const FAM = { str: '현악기', ww: '목관 악기', br: '금관 악기', pc: '타악기' };
  const SCALE = [['도', 0], ['레', 2], ['미', 4], ['파', 5], ['솔', 7], ['라', 9], ['시', 11], ['도', 12]];
  const VEL = { soft: 0.32, mid: 0.62, loud: 1 };
  const SOL = 67; // '솔'(G4)
  const BASE = (window.SND_BASE || 'audio/');

  let ctx = null, master = null;
  const buf = {};       // 'violin-C4' → { b: AudioBuffer, m: midi, P: 녹음 한 주기의 샘플 수 }
  const loading = {};
  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* 아이패드 무음 스위치 대비 */ }
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -6; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // 녹음에서 실제 한 주기 길이를 찾아 두면 파형 화면이 흔들리지 않아요
  function period(b, m) {
    const d = b.getChannelData(0), sr = b.sampleRate, P0 = sr / hz(m);
    const s0 = Math.floor(0.25 * sr), n = Math.min(Math.floor(4 * P0) + 512, d.length - s0 - Math.ceil(1.3 * P0) - 2);
    if (n < 64) return P0;
    let best = P0, bv = -Infinity;
    for (let L = Math.floor(P0 * 0.92); L <= Math.ceil(P0 * 1.08); L++) {
      let c = 0; for (let i = 0; i < n; i++) c += d[s0 + i] * d[s0 + i + L];
      if (c > bv) { bv = c; best = L; }
    }
    // 소수점까지 다듬기(포물선)
    const cc = (L) => { let c = 0; for (let i = 0; i < n; i++) c += d[s0 + i] * d[s0 + i + L]; return c; };
    const a = cc(best - 1), b2 = bv, c2 = cc(best + 1), den = a - 2 * b2 + c2;
    return den < 0 ? best + 0.5 * (a - c2) / den : best;
  }
  // 화면 크기 맞춤: 세게(1) 연주할 때 소리가 고른 부분의 가장 큰 흔들림이 화면 높이의 80%가 되게 (소리 크기는 그대로)
  function dgain(b) {
    const d = b.getChannelData(0), sr = b.sampleRate; let pk = 0;
    for (let i = Math.floor(0.08 * sr), e = Math.min(d.length, Math.floor(0.6 * sr)); i < e; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; }
    return 0.8 / (pk || 1);
  }
  function load(id) {
    if (loading[id]) return loading[id];
    const A = audio(); const I = INST[id];
    const dec = (ab) => new Promise((res, rej) => { const p = A.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); });
    loading[id] = Promise.all(I.s.map((n) => fetch(BASE + id + '-' + n + '.mp3').then((r) => { if (!r.ok) throw new Error(id + '-' + n + ' 소리 파일 없음'); return r.arrayBuffer(); })
      .then(dec).then((b) => { const m = midiOf(n); buf[id + '-' + n] = { b, m, P: period(b, m), dg: dgain(b) }; })))
      .catch((e) => { delete loading[id]; throw e; });
    return loading[id];
  }
  const ready = (id) => INST[id].s.every((n) => buf[id + '-' + n]);
  function pick(id, m) {
    let best = null;
    INST[id].s.forEach((n) => { const x = buf[id + '-' + n]; if (x && (!best || Math.abs(x.m - m) < Math.abs(best.m - m))) best = x; });
    return best;
  }

  // 지금 울리는 소리(한 번에 하나)
  let cur = null;
  const listeners = new Set();
  const REL = 0.14;
  function stop(fast) {
    if (!cur) return;
    const v = cur; cur = null;
    if (v.src) {
      const t = ctx.currentTime, r = fast ? 0.05 : REL;
      try { v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0, t + r); v.src.stop(t + r + 0.02); } catch (e) { /* 이미 끝남 */ }
    }
    listeners.forEach((f) => f(null));
  }
  // play: 소리를 내고 voice를 돌려줘요. 소리를 낼 수 없는 기기(자동 재생 막힘)에서도 파형은 시계로 움직여요
  function play(id, m, vel) {
    const A = audio(); const x = pick(id, m); if (!x) return null;
    stop(true);
    const rate = Math.pow(2, (m - x.m) / 12), V = vel == null ? 1 : vel;
    const v = { id, m, vel: V, x, rate, t0: performance.now() / 1000, dur: x.b.duration / rate, src: null, g: null };
    if (A) {
      const src = A.createBufferSource(); src.buffer = x.b; src.playbackRate.value = rate;
      const g = A.createGain(); g.gain.value = V;
      src.connect(g); g.connect(master); src.start();
      v.src = src; v.g = g; v.at0 = A.currentTime;
      src.onended = () => { if (cur === v) { cur = null; listeners.forEach((f) => f(null)); } };
    }
    cur = v; listeners.forEach((f) => f(v));
    return v;
  }
  const elapsed = (v) => (v.src && ctx && ctx.state === 'running' ? ctx.currentTime - v.at0 : performance.now() / 1000 - v.t0);
  // 녹음 자료에서 파형 한 조각 꺼내기: t초 시점부터 win초 동안, n개 점. 한 주기에 맞춰 시작해 화면이 흔들리지 않아요
  function slice(x, rate, vel, t, win, n, out) {
    const d = x.b.getChannelData(0), sr = x.b.sampleRate;
    const P = x.P, p = t * rate * sr;
    const p0 = Math.floor(p / P) * P, span = win * rate * sr;
    out = out || new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const q = p0 + (k / (n - 1)) * span, i = Math.floor(q), f = q - i;
      out[k] = i + 1 < d.length ? x.dg * vel * (d[i] * (1 - f) + d[i + 1] * f) : 0;
    }
    return out;
  }
  // 기록용 파형(소리를 내지 않고 계산): 소리가 가장 고른 순간을 찍어요
  // norm: 세기를 맞춰 보여 줄 때(음색 비교) 고른 크기(RMS)
  function shot(id, m, vel, win, n, norm) {
    const x = pick(id, m); if (!x) return null;
    const rate = Math.pow(2, (m - x.m) / 12);
    const a = slice(x, rate, vel, INST[id].perc ? 0.12 : 0.42, win, n || 600);
    if (norm) { let q = 0; for (let k = 0; k < a.length; k++) q += a[k] * a[k]; q = Math.sqrt(q / a.length) || 1; for (let k = 0; k < a.length; k++) a[k] *= (norm * vel) / q; }
    return a;
  }

  /* ===== 소리 분석 화면 ===== */
  function scope(host, o) {
    o = Object.assign({ win: 0.02, rows: 6, live: true, label: '시간', amp: 1 }, o || {});
    const cv = document.createElement('canvas'); cv.className = 'scv'; host.appendChild(cv);
    const lab = document.createElement('span'); lab.className = 'scl'; lab.textContent = o.label; host.appendChild(lab);
    const g = cv.getContext('2d');
    const N = 720; let data = new Float32Array(N), ghost = null, frozen = null, mark = null;
    let W = 0, H = 0, dpr = 1, raf = 0, alive = true;
    const S = { o, host, cv };
    function size() {
      const r = host.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(10, r.width); H = Math.max(10, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
      draw();
    }
    function line(arr, col, wd, dash) {
      const cy = H / 2, A = (H / 2) * o.amp;
      g.beginPath();
      for (let k = 0; k < arr.length; k++) { const X = (k / (arr.length - 1)) * W, Y = cy - Math.max(-1.15, Math.min(1.15, arr[k])) * A; k ? g.lineTo(X, Y) : g.moveTo(X, Y); }
      g.strokeStyle = col; g.lineWidth = wd; g.lineJoin = 'round'; g.lineCap = 'round'; g.setLineDash(dash || []); g.stroke(); g.setLineDash([]);
    }
    function draw() {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      const c = H / o.rows, cy = H / 2;
      g.lineWidth = 1; g.strokeStyle = '#e3e9ef'; g.beginPath();
      for (let y = c; y < H - 0.5; y += c) { g.moveTo(0, Math.round(y) + 0.5); g.lineTo(W, Math.round(y) + 0.5); }
      for (let x = c; x < W - 0.5; x += c) { g.moveTo(Math.round(x) + 0.5, 0); g.lineTo(Math.round(x) + 0.5, H); }
      g.stroke();
      g.strokeStyle = '#a9b6c3'; g.beginPath(); g.moveTo(0, Math.round(cy) + 0.5); g.lineTo(W, Math.round(cy) + 0.5); g.stroke();
      if (ghost) line(ghost, '#b9c4cf', 2, [5, 4]);
      const arr = frozen || data;
      line(arr, '#0e63b3', Math.max(2, Math.min(3, W / 320)));
      if (mark === 'amp') {
        let mx = 0, ki = 0; for (let k = 0; k < arr.length * 0.6; k++) if (arr[k] > mx) { mx = arr[k]; ki = k; }
        if (mx > 0.02) {
          const X = (ki / (arr.length - 1)) * W, Y = cy - Math.min(1.15, mx) * (H / 2) * o.amp;
          g.strokeStyle = '#14263b'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X, cy); g.lineTo(X, Y); g.stroke();
          g.beginPath(); g.moveTo(X - 6, Y); g.lineTo(X + 6, Y); g.moveTo(X - 6, cy); g.lineTo(X + 6, cy); g.stroke();
          S.ampAt = { x: X, y: (cy + Y) / 2 };
        } else S.ampAt = null;
      } else S.ampAt = null;
      if (S.onDraw) S.onDraw(S);
    }
    let lastV = null;
    function tick() {
      if (!alive) return;
      raf = requestAnimationFrame(tick);
      if (!o.live || frozen) return;
      const v = cur;
      if (v && (!o.only || o.only(v))) {
        const t = elapsed(v);
        if (t < v.dur) {
          slice(v.x, v.rate, v.vel * (v.gain || 1), Math.max(0, t), o.win, N, data); lastV = v; draw(); return;
        }
      }
      // 소리가 멈추면 파형이 진동 중심으로 천천히 줄어들어요
      let any = false; for (let k = 0; k < N; k++) { data[k] *= 0.82; if (Math.abs(data[k]) > 0.002) any = true; else data[k] = 0; }
      if (any || lastV) { lastV = null; draw(); }
    }
    S.set = (p) => { Object.assign(o, p); draw(); };
    S.freeze = (arr) => { frozen = arr; draw(); };
    S.clear = () => { frozen = null; data = new Float32Array(N); draw(); };
    S.ghost = (arr) => { ghost = arr; draw(); };
    S.mark = (m) => { mark = m; draw(); };
    S.data = () => frozen || data;
    S.draw = draw;
    S.kill = () => { alive = false; cancelAnimationFrame(raf); };
    if (window.ResizeObserver) new ResizeObserver(size).observe(host); else window.addEventListener('resize', size);
    size(); tick();
    return S;
  }

  window.SND = { INST, FAM, SCALE, VEL, SOL, hz, midiOf, audio, load, ready, play, stop, shot, scope, N: 720,
    on: (f) => listeners.add(f), off: (f) => listeners.delete(f), cur: () => cur, elapsed };
})();
