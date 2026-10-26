/* ===== 원소 수업 그림 도구: 물체와 원소 표본 =====
   EL.ITEMS   그림 Ⅳ-1 우리 주변의 원소와 화합물 10가지 { id, name, kind:'el'|'cp', els, etc, sw(돋보기 입자), draw(ctx, x, y, s, t) }
   EL.SAMPLE  그림 Ⅳ-2·원소 기호 규칙에 나온 원소 표본 그림 { 기호: draw(ctx, x, y, s, t) }
   EL.thumb(canvas, draw, o)   작은 캔버스 하나에 그림 하나 그리기(움직이면 계속 그림)
   모든 그림은 가운데 (x, y), 크기 s(대략 지름)를 기준으로 그린다. 색은 실제 물질 색. */
(() => {
  const { TAU, rng, rr, contact, shade, rgba, addLoop } = EL;

  /* ---- 덩어리(금속·광물): 불규칙한 다각형에 윗면은 밝게, 아랫면은 어둡게 ---- */
  function chunk(ctx, x, y, r, col, seed, o = {}) {
    const R = rng(seed), n = 7 + Math.floor(R() * 3), pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU + R() * 0.4; const rr2 = r * (0.72 + R() * 0.38); pts.push([x + Math.cos(a) * rr2, y + Math.sin(a) * rr2 * (o.flat || 0.78)]); }
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
    const g = ctx.createLinearGradient(x - r, y - r, x + r * 0.6, y + r);
    g.addColorStop(0, shade(col, 0.35)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.4));
    ctx.fillStyle = g; ctx.fill();
    // 면 나누기: 가운데 점에서 꼭짓점 몇 개로 이어 면을 만든다
    const c = [x - r * 0.12 + R() * r * 0.1, y - r * 0.15];
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n], mid = (Math.atan2((p[1] + q[1]) / 2 - y, (p[0] + q[0]) / 2 - x));
      const lit = Math.cos(mid + 2.3); // 왼쪽 위에서 오는 빛
      ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.closePath();
      ctx.fillStyle = lit > 0 ? `rgba(255,255,255,${0.22 * lit * (o.shine || 1)})` : `rgba(10,20,30,${-0.2 * lit})`; ctx.fill();
    }
    ctx.strokeStyle = rgba('#14263b', 0.25); ctx.lineWidth = 1; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke();
    if (o.grain) { ctx.fillStyle = o.grain; for (let i = 0; i < 14; i++) { const a = R() * TAU, d = R() * r * 0.7; ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, 1.6, 1.6); } }
  }
  function heap(ctx, x, y, s, col, seed, count = 9, o = {}) {
    contact(ctx, x, y + s * 0.3, s * 1.2, 0.22, 0.22);
    const R = rng(seed), list = [];
    for (let i = 0; i < count; i++) { const a = R() * TAU, d = R() * s * 0.32; list.push([x + Math.cos(a) * d * 1.2, y + Math.sin(a) * d * 0.45 + s * 0.06, s * (0.16 + R() * 0.1), Math.floor(R() * 1e6)]); }
    list.sort((p, q) => p[1] - q[1]).forEach(([cx, cy, r, sd]) => chunk(ctx, cx, cy - r * 0.3, r, col, sd, o));
  }
  // 둥근 바닥 플라스크(기체 표본)
  function flask(ctx, x, y, s, gas, label) {
    const r = s * 0.32, nk = s * 0.09, top = y - s * 0.42;
    contact(ctx, x, y + r + s * 0.02, s * 0.8, 0.2);
    const cy = y + s * 0.06, hy = Math.sqrt(r * r - nk * nk);
    ctx.beginPath(); ctx.moveTo(x - nk, top); ctx.lineTo(x - nk, cy - hy); ctx.arc(x, cy, r, Math.atan2(-hy, -nk), Math.atan2(-hy, nk), true); ctx.lineTo(x + nk, top); ctx.closePath();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.2, r * 0.1, x, y, r * 1.2);
    g.addColorStop(0, gas ? rgba(gas, 0.28) : 'rgba(240,246,251,.6)'); g.addColorStop(1, gas ? rgba(gas, 0.62) : 'rgba(214,226,238,.75)');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(96,120,146,.85)'; ctx.lineWidth = Math.max(1.2, s * 0.018); ctx.stroke();
    // 마개
    ctx.fillStyle = '#8b5e3c'; rr(ctx, x - nk * 1.25, top - s * 0.09, nk * 2.5, s * 0.11, s * 0.02); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x - nk * 1.1, top - s * 0.075, nk * 2.2, s * 0.025);
  }
  function balloon(ctx, x, y, r, col, sx, sy) {
    ctx.strokeStyle = 'rgba(90,107,126,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y + r * 1.12); ctx.quadraticCurveTo((x + sx) / 2 + r * 0.3, (y + sy) / 2 + r, sx, sy); ctx.stroke();
    ctx.fillStyle = shade(col, -0.25); ctx.beginPath(); ctx.moveTo(x - r * 0.14, y + r * 1.16); ctx.lineTo(x + r * 0.14, y + r * 1.16); ctx.lineTo(x, y + r * 1.02); ctx.closePath(); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r * 1.15);
    g.addColorStop(0, shade(col, 0.4)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r * 0.9, r * 1.08, 0, 0, TAU); ctx.fill();
  }
  function fog(ctx, x, y, w, t, a = 0.5) {
    for (let i = 0; i < 6; i++) {
      const k = ((t * 0.25 + i / 6) % 1), xx = x + Math.sin(i * 2.1 + t * 0.6) * w * 0.3 + (i - 2.5) * w * 0.12, yy = y + k * w * 0.35;
      const g = ctx.createRadialGradient(xx, yy, 1, xx, yy, w * (0.18 + k * 0.2));
      g.addColorStop(0, `rgba(235,242,248,${a * (1 - k)})`); g.addColorStop(1, 'rgba(235,242,248,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xx, yy, w * (0.18 + k * 0.2), 0, TAU); ctx.fill();
    }
  }

  /* ---- 그림 Ⅳ-1 물체 ---- */
  const D = {
    diamond(ctx, x, y, s, t) {
      const w = s * 0.82, top = y - s * 0.26, gir = y - s * 0.1, bot = y + s * 0.36, tw = w * 0.52;
      contact(ctx, x, bot + s * 0.06, s * 0.7, 0.16);
      const L = x - w / 2, Rr = x + w / 2;
      const crown = [[x - tw / 2, top], [x + tw / 2, top], [Rr, gir], [L, gir]];
      // 윗면(테이블)과 크라운 면
      const fc = ['#f3f8fd', '#d9e9f7', '#c4dbf0', '#e8f2fb', '#b9d2ea', '#f8fbff'];
      const pts = [L, x - tw / 2, x - tw / 6, x + tw / 6, x + tw / 2, Rr];
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(pts[i], i === 0 ? gir : top); ctx.lineTo(pts[i + 1], i + 1 === 5 ? gir : top); ctx.lineTo(lerp2(pts[i + 1], x, 0.15), gir); ctx.lineTo(lerp2(pts[i], x, 0.15), gir); ctx.closePath();
        ctx.fillStyle = fc[i]; ctx.fill();
      }
      ctx.fillStyle = '#f7fbff'; ctx.beginPath(); ctx.moveTo(crown[0][0], top); ctx.lineTo(crown[1][0], top); ctx.lineTo(x + tw * 0.32, gir - s * 0.05); ctx.lineTo(x - tw * 0.32, gir - s * 0.05); ctx.closePath(); ctx.fill();
      // 아래(파빌리온) 면
      const pv = ['#cfe1f3', '#a9c6e3', '#e3eef9', '#93b4d6', '#bcd4ec', '#d8e7f6'];
      for (let i = 0; i < 6; i++) { const a = L + (w / 6) * i, b = L + (w / 6) * (i + 1); ctx.beginPath(); ctx.moveTo(a, gir); ctx.lineTo(b, gir); ctx.lineTo(x, bot); ctx.closePath(); ctx.fillStyle = pv[i]; ctx.fill(); }
      ctx.strokeStyle = 'rgba(88,120,156,.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - tw / 2, top); ctx.lineTo(x + tw / 2, top); ctx.lineTo(Rr, gir); ctx.lineTo(x, bot); ctx.lineTo(L, gir); ctx.closePath(); ctx.moveTo(L, gir); ctx.lineTo(Rr, gir); ctx.stroke();
      ctx.strokeStyle = 'rgba(88,120,156,.28)'; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(L + (w / 6) * i, gir); ctx.lineTo(x, bot); ctx.stroke(); }
      // 은은한 빛 한 점(천천히 깜빡)
      const k = 0.5 + 0.5 * Math.sin(t * 1.6);
      ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * k})`; ctx.lineWidth = 1.6; const sx = x - tw * 0.22, sy = top + s * 0.06, sl = s * (0.05 + 0.03 * k);
      ctx.beginPath(); ctx.moveTo(sx - sl, sy); ctx.lineTo(sx + sl, sy); ctx.moveTo(sx, sy - sl); ctx.lineTo(sx, sy + sl); ctx.stroke();
    },
    capsule(ctx, x, y, s) {
      const cap = (cx, cy, w, col, tilt) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
        const h = w * 0.62, tb = w * 0.62;
        contact(ctx, 0, h * 0.55, w * 1.2, 0.18);
        let g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        g.addColorStop(0, shade(col, -0.3)); g.addColorStop(0.3, shade(col, 0.35)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.38));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.35); ctx.lineTo(-tb / 2, h * 0.45); ctx.ellipse(0, h * 0.45, tb / 2, tb * 0.13, 0, Math.PI, 0, true); ctx.lineTo(w / 2, -h * 0.35); ctx.closePath(); ctx.fill();
        // 줄무늬(눌린 홈)
        ctx.strokeStyle = rgba('#000000', 0.12); ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * w * 0.12, -h * 0.3); ctx.lineTo(i * tb * 0.12, h * 0.42); ctx.stroke(); }
        // 테두리 테와 덮개(은박)
        g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, '#9aa5b1'); g.addColorStop(0.4, '#eef2f5'); g.addColorStop(1, '#8a96a3');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -h * 0.35, w / 2 + w * 0.06, w * 0.15, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#d7dde3'; ctx.beginPath(); ctx.ellipse(0, -h * 0.36, w / 2 - w * 0.03, w * 0.11, 0, 0, TAU); ctx.fill();
        ctx.restore();
      };
      cap(x + s * 0.2, y - s * 0.02, s * 0.5, '#7a3fa0', 0.18);
      cap(x - s * 0.16, y + s * 0.1, s * 0.56, '#b8c2cc', -0.1);
    },
    balloons(ctx, x, y, s, t) {
      const sx = x + s * 0.02, sy = y + s * 0.5;
      const B = [['#3cbfc9', -0.26, -0.28, 0.19], ['#2f9e57', 0.24, -0.24, 0.18], ['#f08a92', -0.33, 0.02, 0.17], ['#e24a3f', 0.02, -0.06, 0.21]];
      contact(ctx, sx, sy + 4, s * 0.25, 0.15);
      B.forEach(([c, dx, dy, r], i) => balloon(ctx, x + dx * s + Math.sin(t * 1.1 + i) * s * 0.01, y + dy * s + Math.cos(t * 0.9 + i) * s * 0.008, r * s, c, sx, sy));
    },
    copper(ctx, x, y, s) {
      contact(ctx, x, y + s * 0.3, s * 0.9, 0.2);
      const n = 11, rx = s * 0.36, ry = s * 0.14;
      for (let i = 0; i < n; i++) {
        const yy = y - s * 0.12 + i * s * 0.035, k = i / (n - 1);
        ctx.strokeStyle = shade('#c8642a', -0.25 + 0.25 * Math.sin(i)); ctx.lineWidth = s * 0.032;
        ctx.beginPath(); ctx.ellipse(x, yy, rx, ry, 0, Math.PI * 0.02, Math.PI * 0.98); ctx.stroke();
        ctx.strokeStyle = shade('#e08a4a', 0.15 * (1 - k)); ctx.lineWidth = s * 0.028;
        ctx.beginPath(); ctx.ellipse(x, yy, rx, ry, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,214,170,.55)'; ctx.lineWidth = s * 0.008;
      for (let i = 0; i < n; i += 2) { ctx.beginPath(); ctx.ellipse(x, y - s * 0.12 + i * s * 0.035, rx, ry, 0, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke(); }
      // 풀린 끝
      ctx.strokeStyle = '#d07a3c'; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + rx, y + s * 0.2); ctx.bezierCurveTo(x + rx + s * 0.12, y + s * 0.26, x + rx + s * 0.02, y + s * 0.36, x + rx + s * 0.14, y + s * 0.38); ctx.stroke();
    },
    plastic(ctx, x, y, s, t) {
      const w = s * 0.32, top = y - s * 0.44, bot = y + s * 0.42;
      contact(ctx, x, bot + 3, s * 0.55, 0.2);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.28, top + s * 0.08); ctx.lineTo(x - w * 0.28, top + s * 0.13);
      ctx.bezierCurveTo(x - w * 0.5, top + s * 0.2, x - w / 2, top + s * 0.24, x - w / 2, top + s * 0.32);
      ctx.lineTo(x - w / 2, bot - s * 0.04); ctx.quadraticCurveTo(x - w / 2, bot, x - w * 0.4, bot); ctx.lineTo(x + w * 0.4, bot); ctx.quadraticCurveTo(x + w / 2, bot, x + w / 2, bot - s * 0.04);
      ctx.lineTo(x + w / 2, top + s * 0.32); ctx.bezierCurveTo(x + w / 2, top + s * 0.24, x + w * 0.5, top + s * 0.2, x + w * 0.28, top + s * 0.13); ctx.lineTo(x + w * 0.28, top + s * 0.08); ctx.closePath();
      let g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, 'rgba(160,205,235,.75)'); g.addColorStop(0.35, 'rgba(232,245,253,.7)'); g.addColorStop(1, 'rgba(130,185,225,.8)');
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(80,130,175,.7)'; ctx.lineWidth = 1.3; ctx.stroke();
      // 물
      ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(90,165,225,.28)'; ctx.fillRect(x - w, top + s * 0.38, w * 2, s); ctx.restore();
      // 띠 상표
      ctx.fillStyle = '#18a39a'; ctx.fillRect(x - w / 2, y + s * 0.02, w, s * 0.16); ctx.fillStyle = '#f2c94c'; ctx.fillRect(x - w / 2, y + s * 0.07, w, s * 0.03);
      ctx.strokeStyle = 'rgba(80,130,175,.4)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2, y + s * 0.26 + i * s * 0.035); ctx.lineTo(x + w / 2, y + s * 0.26 + i * s * 0.035); ctx.stroke(); }
      // 뚜껑
      g = ctx.createLinearGradient(x - w * 0.3, 0, x + w * 0.3, 0); g.addColorStop(0, '#1d5fae'); g.addColorStop(0.4, '#4d93df'); g.addColorStop(1, '#174e90');
      ctx.fillStyle = g; rr(ctx, x - w * 0.32, top - s * 0.02, w * 0.64, s * 0.1, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; for (let i = 1; i < 6; i++) { const xx = x - w * 0.32 + i * w * 0.64 / 6; ctx.beginPath(); ctx.moveTo(xx, top); ctx.lineTo(xx, top + s * 0.07); ctx.stroke(); }
    },
    glass(ctx, x, y, s) {
      const wt = s * 0.27, wb = s * 0.21, top = y - s * 0.36, bot = y + s * 0.38;
      contact(ctx, x, bot + 3, s * 0.6, 0.2);
      ctx.beginPath(); ctx.moveTo(x - wt, top); ctx.lineTo(x - wb, bot); ctx.lineTo(x + wb, bot); ctx.lineTo(x + wt, top); ctx.closePath();
      const g = ctx.createLinearGradient(x - wt, 0, x + wt, 0); g.addColorStop(0, 'rgba(178,212,214,.55)'); g.addColorStop(0.3, 'rgba(240,250,250,.4)'); g.addColorStop(0.75, 'rgba(210,235,236,.35)'); g.addColorStop(1, 'rgba(150,196,200,.6)');
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(70,128,134,.7)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(140,190,195,.55)'; ctx.beginPath(); ctx.moveTo(x - wb - 1, bot - s * 0.09); ctx.lineTo(x + wb + 1, bot - s * 0.09); ctx.lineTo(x + wb, bot); ctx.lineTo(x - wb, bot); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(70,128,134,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, top, wt, s * 0.05, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = s * 0.025; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - wt * 0.7, top + s * 0.1); ctx.lineTo(x - wb * 0.72, bot - s * 0.14); ctx.stroke();
    },
    soap(ctx, x, y, s, t) {
      const w = s * 0.62, h = s * 0.26, d = s * 0.16;
      contact(ctx, x, y + h * 0.9, s * 0.95, 0.2);
      // 윗면
      ctx.fillStyle = '#bfe8dc'; rr(ctx, x - w / 2 + d * 0.5, y - h / 2 - d * 0.6, w, d * 1.2, d * 0.5); ctx.fill();
      let g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, '#9ad8c6'); g.addColorStop(1, '#5fb7a0');
      ctx.fillStyle = g; rr(ctx, x - w / 2, y - h / 2, w, h, d * 0.55); ctx.fill();
      ctx.fillStyle = '#d6f2ea'; rr(ctx, x - w / 2 + d * 0.3, y - h / 2 - d * 0.45, w - d * 0.2, d * 0.75, d * 0.4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; rr(ctx, x - w * 0.18, y - h * 0.1, w * 0.36, h * 0.3, 4); ctx.fill();
      // 거품
      const R = rng(4);
      for (let i = 0; i < 9; i++) {
        const bx = x + w * 0.18 + R() * w * 0.3, by = y - h * 0.62 - R() * s * 0.16 + Math.sin(t * 2 + i) * 1.2, br = s * (0.025 + R() * 0.04);
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.strokeStyle = 'rgba(120,170,200,.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill(); ctx.stroke();
      }
    },
    dryice(ctx, x, y, s, t) {
      contact(ctx, x, y + s * 0.26, s * 1, 0.22);
      const R = rng(12), list = [];
      for (let i = 0; i < 7; i++) list.push([x + (R() - 0.5) * s * 0.62, y + s * 0.05 + (R() - 0.5) * s * 0.2, s * (0.14 + R() * 0.06), Math.floor(R() * 1e5)]);
      list.sort((p, q) => p[1] - q[1]).forEach(([cx, cy, r, sd]) => {
        // 둥근 막대 모양 알갱이
        const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c9d6e2');
        ctx.fillStyle = g; rr(ctx, cx - r, cy - r * 0.45, r * 2, r * 0.9, r * 0.42); ctx.fill();
        ctx.fillStyle = '#eef3f8'; ctx.beginPath(); ctx.ellipse(cx - r + r * 0.42, cy, r * 0.32, r * 0.42, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(120,140,160,.4)'; ctx.lineWidth = 1; rr(ctx, cx - r, cy - r * 0.45, r * 2, r * 0.9, r * 0.42); ctx.stroke();
      });
      fog(ctx, x, y - s * 0.02, s, t, 0.55);
    },
    salt(ctx, x, y, s) {
      // 짙은 접시 위 흰 결정 더미
      contact(ctx, x, y + s * 0.3, s * 1, 0.22);
      let g = ctx.createLinearGradient(0, y + s * 0.1, 0, y + s * 0.32); g.addColorStop(0, '#3f5a78'); g.addColorStop(1, '#22364c');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y + s * 0.2, s * 0.44, s * 0.12, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#4e6b8b'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.17, s * 0.38, s * 0.09, 0, 0, TAU); ctx.fill();
      g = ctx.createRadialGradient(x - s * 0.08, y - s * 0.05, s * 0.02, x, y + s * 0.1, s * 0.34); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d4dde6');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - s * 0.32, y + s * 0.18); ctx.quadraticCurveTo(x - s * 0.12, y - s * 0.22, x, y - s * 0.2); ctx.quadraticCurveTo(x + s * 0.14, y - s * 0.2, x + s * 0.32, y + s * 0.18); ctx.closePath(); ctx.fill();
      const R = rng(21);
      for (let i = 0; i < 40; i++) {
        const k = R(), xx = x + (R() - 0.5) * s * 0.55 * (1 - k * 0.6), yy = y + s * 0.15 - k * s * 0.32, c = s * (0.018 + R() * 0.018);
        ctx.fillStyle = R() > 0.5 ? '#ffffff' : '#e3e9ef'; ctx.fillRect(xx - c, yy - c, c * 2, c * 2);
        ctx.strokeStyle = 'rgba(120,140,160,.35)'; ctx.lineWidth = 0.6; ctx.strokeRect(xx - c, yy - c, c * 2, c * 2);
      }
    },
    water(ctx, x, y, s, t) {
      // 물방울 하나와 아래 물웅덩이 물결
      contact(ctx, x, y + s * 0.36, s * 0.9, 0.12);
      const k = (t * 0.45) % 1;
      ctx.strokeStyle = `rgba(40,130,210,${0.5 * (1 - k)})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x, y + s * 0.34, s * (0.12 + k * 0.32), s * (0.03 + k * 0.07), 0, 0, TAU); ctx.stroke();
      const g = ctx.createRadialGradient(x - s * 0.08, y + s * 0.02, s * 0.02, x, y + s * 0.06, s * 0.3);
      g.addColorStop(0, '#bfe3fb'); g.addColorStop(0.6, '#4aa3e6'); g.addColorStop(1, '#1f6fb8');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y - s * 0.38);
      ctx.bezierCurveTo(x + s * 0.06, y - s * 0.24, x + s * 0.26, y - s * 0.04, x + s * 0.24, y + s * 0.1);
      ctx.bezierCurveTo(x + s * 0.22, y + s * 0.28, x - s * 0.22, y + s * 0.28, x - s * 0.24, y + s * 0.1);
      ctx.bezierCurveTo(x - s * 0.26, y - s * 0.04, x - s * 0.06, y - s * 0.24, x, y - s * 0.38); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x - s * 0.04, y + s * 0.08, s * 0.13, Math.PI * 1.05, Math.PI * 1.4); ctx.stroke();
    },
  };
  function lerp2(a, b, k) { return a + (b - a) * k; }

  EL.ITEMS = [
    { id: 'diamond', name: '다이아몬드', kind: 'el', els: ['C'], draw: D.diamond, sw: { state: 'solid', mix: ['C'], lattice: 'hex', gap: 2.35, r: 0.085 } },
    { id: 'capsule', name: '알루미늄 커피 캡슐', kind: 'el', els: ['Al'], draw: D.capsule, sw: { state: 'solid', mix: ['Al'], lattice: 'hex', gap: 2.05, r: 0.095 } },
    { id: 'balloon', name: '헬륨 풍선', kind: 'el', els: ['He'], draw: D.balloons, sw: { state: 'gas', unit: 'He', n: 11, r: 0.1, speed: 0.7 } },
    { id: 'copper', name: '구리선', kind: 'el', els: ['Cu'], draw: D.copper, sw: { state: 'solid', mix: ['Cu'], lattice: 'hex', gap: 2.05, r: 0.095 } },
    { id: 'plastic', name: '플라스틱', kind: 'cp', els: ['C', 'H', 'O'], etc: true, draw: D.plastic, sw: { state: 'chain', chains: [['H', 'C', 'C', 'O', 'C', 'C', 'O', 'C', 'C', 'H'], ['H', 'C', 'C', 'O', 'C', 'C', 'O', 'C', 'C', 'H'], ['H', 'C', 'C', 'O', 'C', 'C', 'O', 'C', 'H'], ['H', 'C', 'C', 'O', 'C', 'C', 'O', 'C', 'C', 'H'], ['H', 'C', 'C', 'O', 'C', 'C', 'O', 'C', 'H']], r: 0.075, seed: 4 } },
    { id: 'glass', name: '유리', kind: 'cp', els: ['Si', 'O'], etc: true, draw: D.glass, sw: { state: 'solid', mix: ['Si', 'O'], lattice: 'square', gap: 2.05, r: 0.085, jitter: 0.25 } },
    { id: 'soap', name: '비누', kind: 'cp', els: ['C', 'H', 'O', 'Na'], etc: true, draw: D.soap, sw: { state: 'chain', chains: [['Na', 'O', 'C', 'C', 'C', 'C', 'C', 'C', 'H'], ['Na', 'O', 'C', 'C', 'C', 'C', 'C', 'H'], ['Na', 'O', 'C', 'C', 'C', 'C', 'C', 'C', 'H'], ['Na', 'O', 'C', 'C', 'C', 'C', 'C', 'H'], ['Na', 'O', 'C', 'C', 'C', 'C', 'C', 'C', 'H']], r: 0.075, seed: 8 } },
    { id: 'dryice', name: '드라이아이스', kind: 'cp', els: ['C', 'O'], draw: D.dryice, sw: { state: 'solid', unit: 'CO2', lattice: 'square', gap: 3.5, r: 0.08, rot: true } },
    { id: 'salt', name: '염화 나트륨', kind: 'cp', els: ['Cl', 'Na'], draw: D.salt, sw: { state: 'solid', mix: ['Na', 'Cl'], lattice: 'square', gap: 2.15, r: 0.09 } },
    { id: 'water', name: '물', kind: 'cp', els: ['H', 'O'], draw: D.water, sw: { state: 'liquid', unit: 'H2O', n: 22, r: 0.095 } },
  ];

  /* ---- 원소 표본 (그림 Ⅳ-2와 원소 기호 규칙) ---- */
  EL.SAMPLE = {
    H: (ctx, x, y, s) => flask(ctx, x, y, s, null),
    He: (ctx, x, y, s, t) => { contact(ctx, x, y + s * 0.44, s * 0.3, 0.14); balloon(ctx, x, y - s * 0.12 + Math.sin(t * 1.2) * s * 0.01, s * 0.28, '#3cbfc9', x + s * 0.04, y + s * 0.44); },
    Li: (ctx, x, y, s) => heap(ctx, x, y, s, '#b9c0c8', 11, 6, { shine: 1.3 }),
    Be: (ctx, x, y, s) => heap(ctx, x, y, s, '#8d969f', 23, 5),
    C: (ctx, x, y, s) => heap(ctx, x, y, s, '#2e3237', 31, 6, { shine: 0.6 }),
    N: (ctx, x, y, s) => flask(ctx, x, y, s, null),
    O: (ctx, x, y, s) => flask(ctx, x, y, s, null),
    Ne: (ctx, x, y, s, t) => {
      // 네온 기체를 넣은 유리관에 전기를 흘린 모습
      const f = 0.9 + 0.1 * Math.sin(t * 13);
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const path = () => { ctx.beginPath(); ctx.moveTo(x - s * 0.34, y + s * 0.24); ctx.lineTo(x - s * 0.34, y - s * 0.18); ctx.quadraticCurveTo(x - s * 0.34, y - s * 0.32, x - s * 0.2, y - s * 0.32); ctx.quadraticCurveTo(x - s * 0.06, y - s * 0.32, x - s * 0.06, y - s * 0.18); ctx.lineTo(x - s * 0.06, y + s * 0.1); ctx.quadraticCurveTo(x - s * 0.06, y + s * 0.24, x + s * 0.08, y + s * 0.24); ctx.quadraticCurveTo(x + s * 0.22, y + s * 0.24, x + s * 0.22, y + s * 0.1); ctx.lineTo(x + s * 0.22, y - s * 0.3); ctx.lineTo(x + s * 0.36, y - s * 0.3); };
      ctx.strokeStyle = `rgba(255,90,50,${0.25 * f})`; ctx.lineWidth = s * 0.16; path(); ctx.stroke();
      ctx.strokeStyle = '#ff6a3d'; ctx.lineWidth = s * 0.06; path(); ctx.stroke();
      ctx.strokeStyle = '#ffd3b8'; ctx.lineWidth = s * 0.022; path(); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#5b6672'; ctx.fillRect(x - s * 0.38, y + s * 0.24, s * 0.08, s * 0.08); ctx.fillRect(x + s * 0.34, y - s * 0.34, s * 0.08, s * 0.08);
    },
    Na: (ctx, x, y, s) => { contact(ctx, x, y + s * 0.26, s * 0.8, 0.2); chunk(ctx, x - s * 0.08, y + s * 0.04, s * 0.26, '#c4cbd2', 41, { flat: 0.7, grain: 'rgba(120,120,110,.4)' }); chunk(ctx, x + s * 0.2, y + s * 0.1, s * 0.16, '#b7bec6', 42, { flat: 0.7 }); },
    Mg: (ctx, x, y, s) => {
      // 리본 모양 마그네슘을 감은 모습
      contact(ctx, x, y + s * 0.3, s * 0.8, 0.18);
      for (let i = 0; i < 4; i++) {
        const yy = y + s * 0.2 - i * s * 0.12;
        const g = ctx.createLinearGradient(x - s * 0.3, yy, x + s * 0.3, yy); g.addColorStop(0, '#7f8993'); g.addColorStop(0.45, '#e6eaee'); g.addColorStop(1, '#8f99a3');
        ctx.strokeStyle = g; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.ellipse(x, yy, s * 0.3, s * 0.08, -0.12, 0, TAU); ctx.stroke();
      }
    },
    Al: (ctx, x, y, s) => { contact(ctx, x, y + s * 0.26, s * 0.9, 0.18); chunk(ctx, x - s * 0.12, y + s * 0.06, s * 0.22, '#c6ced6', 51, { shine: 1.4 }); chunk(ctx, x + s * 0.14, y + s * 0.02, s * 0.24, '#b4bdc6', 52, { shine: 1.4 }); chunk(ctx, x + s * 0.02, y + s * 0.16, s * 0.16, '#d0d7de', 53, { shine: 1.4 }); },
    Si: (ctx, x, y, s) => heap(ctx, x, y, s, '#5d6977', 61, 5, { shine: 1.6 }),
    S: (ctx, x, y, s) => {
      // 유리 접시 위 노란 가루
      contact(ctx, x, y + s * 0.28, s * 1, 0.18);
      ctx.fillStyle = 'rgba(214,226,238,.7)'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.2, s * 0.44, s * 0.11, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(96,120,146,.6)'; ctx.stroke();
      const g = ctx.createRadialGradient(x - s * 0.08, y - s * 0.04, s * 0.02, x, y + s * 0.1, s * 0.34); g.addColorStop(0, '#fff07a'); g.addColorStop(0.6, '#f2d22b'); g.addColorStop(1, '#c9a50f');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - s * 0.34, y + s * 0.2); ctx.quadraticCurveTo(x - s * 0.14, y - s * 0.2, x + s * 0.02, y - s * 0.18); ctx.quadraticCurveTo(x + s * 0.18, y - s * 0.16, x + s * 0.34, y + s * 0.2); ctx.closePath(); ctx.fill();
      const R = rng(71); for (let i = 0; i < 50; i++) { const k = R(); ctx.fillStyle = R() > 0.5 ? '#fff6a8' : '#d9b51a'; ctx.fillRect(x + (R() - 0.5) * s * 0.56 * (1 - k * 0.6), y + s * 0.17 - k * s * 0.32, 2, 2); }
    },
    Cl: (ctx, x, y, s) => flask(ctx, x, y, s, '#b8d84a'),
    Ca: (ctx, x, y, s) => heap(ctx, x, y, s, '#9a9f97', 81, 12, { grain: 'rgba(60,60,50,.35)', shine: 0.7 }),
    Fe: (ctx, x, y, s) => heap(ctx, x, y, s, '#565e66', 91, 6, { shine: 0.9 }),
    Cu: (ctx, x, y, s) => { contact(ctx, x, y + s * 0.26, s * 0.9, 0.2); chunk(ctx, x - s * 0.14, y + s * 0.06, s * 0.24, '#c4683a', 101, { shine: 1.2 }); chunk(ctx, x + s * 0.16, y + s * 0.02, s * 0.2, '#b65a2e', 102, { shine: 1.2 }); },
    Hg: (ctx, x, y, s) => {
      contact(ctx, x, y + s * 0.18, s * 0.9, 0.14);
      [[0, 0.06, 0.2], [0.27, 0.12, 0.1], [-0.27, 0.13, 0.08], [0.1, 0.2, 0.05], [-0.12, -0.02, 0.05]].forEach(([dx, dy, r]) => {
        const cx = x + dx * s, cy = y + dy * s, R2 = r * s;
        const g = ctx.createLinearGradient(cx, cy - R2 * 0.6, cx, cy + R2 * 0.6); g.addColorStop(0, '#f4f6f8'); g.addColorStop(0.45, '#8a949e'); g.addColorStop(0.55, '#3d454d'); g.addColorStop(1, '#b8c0c8');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, R2, R2 * 0.62, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(40,48,56,.4)'; ctx.lineWidth = 1; ctx.stroke();
      });
    },
  };

  // 작은 캔버스에 그림 하나. o.anim이면 계속 다시 그림
  EL.thumb = (cv, draw, o = {}) => {
    const ctx = cv.getContext('2d');
    function paint(t) {
      const r = cv.getBoundingClientRect(); if (r.width < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(r.width * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
      const s = Math.min(r.width, r.height) * (o.scale || 0.86);
      draw(ctx, r.width / 2, r.height / 2 + (o.dy || 0) * s, s, t);
    }
    let t = 0;
    if (o.anim && !EL.reduce) addLoop(cv, (dt) => { t += dt; paint(t); }); else { paint(0.8); if (window.ResizeObserver) new ResizeObserver(() => paint(0.8)).observe(cv); }
    return { paint };
  };
})();
