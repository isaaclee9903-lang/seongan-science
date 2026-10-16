/* ===== ART: 악기 그림 (SVG) =====
   ART.svg(id, key): 악기 하나를 그린 SVG 글자. key는 그라디언트 이름이 겹치지 않게 붙이는 꼬리표.
   - 빛은 왼쪽 위에서. 매트한 재질, 얇은 선, 바닥 그림자 하나.
   - 진동하는 부분은 class="vbp"(줄·막대·막), 관악기의 소리 나오는 곳은 class="air" 무리(소리 날 때만 보임) */
(() => {
  'use strict';
  const lg = (id, stops, x1 = 0, y1 = 0, x2 = 1, y2 = 0) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const rg = (id, stops, cx = 0.35, cy = 0.3, r = 0.8) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`;
  const shadow = (cx, cy, rx, ry = 4.5) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#14263b" opacity=".10"/>`;
  // 공기 진동 표시: (x,y)에서 각도 a(도) 쪽으로 퍼지는 얇은 호 세 개
  const air = (x, y, a, r0 = 10) => `<g class="air" transform="translate(${x} ${y}) rotate(${a})">${[0, 1, 2].map((i) => `<path d="M${r0 + i * 7} -${6 + i * 3}A${r0 + i * 7} ${r0 + i * 7} 0 0 1 ${r0 + i * 7} ${6 + i * 3}" style="animation-delay:${i * 0.18}s"/>`).join('')}</g>`;

  // 바이올린 무리 몸통: 가운데 x, 위 T, 높이 H, 위·아래 너비 반, 허리 반, 어깨 기울기(콘트라베이스)
  function vbody(x, T, H, ub, lb, wa, slope = 0) {
    const R = (dx, dy) => `${(x + dx).toFixed(1)} ${(T + dy).toFixed(1)}`;
    const L = (dx, dy) => `${(x - dx).toFixed(1)} ${(T + dy).toFixed(1)}`;
    const s = slope * H;
    return `M${R(0, 0)}C${R(ub * 0.55 - s * 0.2, 0)} ${R(ub, H * 0.06 + s)} ${R(ub, H * 0.2 + s * 0.6)}` +
      `C${R(ub, H * 0.31)} ${R(ub * 0.92, H * 0.34)} ${R(ub * 0.9, H * 0.36)}` +
      `C${R(wa, H * 0.4)} ${R(wa, H * 0.56)} ${R(lb * 0.9, H * 0.6)}` +
      `C${R(lb * 1.02, H * 0.64)} ${R(lb, H * 0.7)} ${R(lb, H * 0.78)}` +
      `C${R(lb, H * 0.93)} ${R(lb * 0.55, H)} ${R(0, H)}` +
      `C${L(lb * 0.55, H)} ${L(lb, H * 0.93)} ${L(lb, H * 0.78)}` +
      `C${L(lb, H * 0.7)} ${L(lb * 1.02, H * 0.64)} ${L(lb * 0.9, H * 0.6)}` +
      `C${L(wa, H * 0.56)} ${L(wa, H * 0.4)} ${L(ub * 0.9, H * 0.36)}` +
      `C${L(ub * 0.92, H * 0.34)} ${L(ub, H * 0.31)} ${L(ub, H * 0.2 + s * 0.6)}` +
      `C${L(ub, H * 0.06 + s)} ${L(ub * 0.55 - s * 0.2, 0)} ${L(0, 0)}Z`;
  }
  function strings(k, o) {
    const { x, T, H, ub, lb, wa, top, slope, pin, bow } = o;
    const fh = (sx) => `<path d="M${x + sx * wa * 0.62} ${T + H * 0.4}c${sx * -2} ${H * 0.05} ${sx * 3} ${H * 0.1} ${sx * 1} ${H * 0.17}" fill="none" stroke="#3b1c0c" stroke-width="${Math.max(1.1, H * 0.016)}" stroke-linecap="round"/>`;
    const nw = Math.max(3, ub * 0.16);
    return `<defs>${lg(k + 'w', [[0, '#c98552'], [0.45, '#a75a2c'], [1, '#6e3418']], 0, 0, 1, 1)}${rg(k + 'h', [[0, 'rgba(255,240,220,.38)'], [1, 'rgba(255,240,220,0)']], 0.32, 0.28, 0.55)}${lg(k + 'n', [[0, '#3a3330'], [1, '#191514']])}</defs>` +
      shadow(x, T + H + (pin ? 9 : 4), lb * 0.95) +
      (pin ? `<line x1="${x}" y1="${T + H}" x2="${x}" y2="${T + H + 8}" stroke="#7d8793" stroke-width="1.6" stroke-linecap="round"/>` : '') +
      // 목과 머리(스크롤)
      `<path d="M${x - nw * 0.8} ${T + 4}L${x - nw * 0.62} ${top + 14}L${x + nw * 0.62} ${top + 14}L${x + nw * 0.8} ${T + 4}Z" fill="#8a4a24"/>` +
      `<path d="M${x - nw * 0.7} ${top + 16}q-${nw * 0.4} -6 0 -12M${x + nw * 0.7} ${top + 16}q${nw * 0.4} -6 0 -12" stroke="#2b211c" stroke-width="2" fill="none" stroke-linecap="round"/>` +
      `<circle cx="${x}" cy="${top + 5}" r="${nw * 0.95}" fill="url(#${k}w)"/><path d="M${x + nw * 0.5} ${top + 5}a${nw * 0.5} ${nw * 0.5} 0 1 1 -${nw * 0.4} -${nw * 0.35}" stroke="#5a2a12" stroke-width="1.1" fill="none"/>` +
      // 몸통
      `<path d="${vbody(x, T, H, ub, lb, wa, slope || 0)}" fill="url(#${k}w)" stroke="#5a2a12" stroke-width="1"/>` +
      `<path d="${vbody(x, T, H, ub, lb, wa, slope || 0)}" fill="url(#${k}h)"/>` +
      `<path d="${vbody(x, T + 1.6, H - 3.2, ub - 1.6, lb - 1.6, wa - 1.2, slope || 0)}" fill="none" stroke="#3b1c0c" stroke-opacity=".45" stroke-width=".8"/>` +
      fh(-1) + fh(1) +
      // 지판·줄받침·줄걸이
      `<path d="M${x - nw * 0.62} ${top + 15}L${x + nw * 0.62} ${top + 15}L${x + nw * 1.1} ${T + H * 0.55}L${x - nw * 1.1} ${T + H * 0.55}Z" fill="url(#${k}n)"/>` +
      `<path d="M${x - nw * 1.25} ${T + H * 0.64}h${nw * 2.5}" stroke="#e8d6b2" stroke-width="${Math.max(2, H * 0.03)}" stroke-linecap="round"/>` +
      `<path d="M${x - nw * 0.9} ${T + H * 0.72}L${x + nw * 0.9} ${T + H * 0.72}L${x + nw * 0.5} ${T + H * 0.95}L${x - nw * 0.5} ${T + H * 0.95}Z" fill="#221c19"/>` +
      `<g class="vbp">${[-0.75, -0.25, 0.25, 0.75].map((f) => `<line x1="${x + f * nw * 0.9}" y1="${top + 15}" x2="${x + f * nw * 1.2}" y2="${T + H * 0.73}" stroke="#efe6d2" stroke-width=".7"/>`).join('')}</g>` +
      (bow ? `<g transform="rotate(${bow.a} ${x} ${T + H * 0.5})"><line x1="${x - bow.l}" y1="${T + H * 0.5}" x2="${x + bow.l}" y2="${T + H * 0.5}" stroke="#5a3a22" stroke-width="2" stroke-linecap="round"/><line x1="${x - bow.l + 3}" y1="${T + H * 0.5 + 2.4}" x2="${x + bow.l - 6}" y2="${T + H * 0.5 + 2.4}" stroke="#ece5d6" stroke-width="1"/><rect x="${x + bow.l - 9}" y="${T + H * 0.5 - 1}" width="7" height="5" rx="1.2" fill="#1f1a18"/></g>` : '');
  }

  const BR = (k) => `${lg(k + 'b', [[0, '#f0d38a'], [0.45, '#d4a447'], [1, '#9c6c1d']], 0, 0, 0, 1)}${lg(k + 'bh', [[0, '#f6e2a8'], [0.5, '#d9ab4e'], [1, '#a77526']], 0, 0, 1, 0)}${rg(k + 'bm', [[0, '#8a5f1c'], [0.6, '#b8862f'], [1, '#e7c574']], 0.5, 0.5, 0.6)}`;
  const tube = (d, k, w, col) => `<path d="${d}" fill="none" stroke="#7d5414" stroke-width="${w + 1.6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col || `url(#${k}bh)`}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fbeec8" stroke-opacity=".55" stroke-width="${Math.max(0.6, w * 0.22)}" stroke-linecap="round" transform="translate(-${w * 0.18} -${w * 0.2})"/>`;

  const DRAW = {
    violin: (k) => ({ vb: '0 0 120 160', g: strings(k, { x: 60, T: 70, H: 76, ub: 19, lb: 23, wa: 13.5, top: 8, bow: { a: -24, l: 44 } }) }),
    cello: (k) => ({ vb: '0 0 120 160', g: strings(k, { x: 60, T: 52, H: 90, ub: 24, lb: 29, wa: 17, top: 6, pin: 1 }) }),
    contrabass: (k) => ({ vb: '0 0 120 160', g: strings(k, { x: 60, T: 44, H: 98, ub: 21, lb: 33, wa: 20, top: 3, pin: 1, slope: 0.1 }) }),
    harp: (k) => {
      const str = []; for (let i = 0; i < 12; i++) { const x = 36 + i * 5.2, yb = 142 - (x - 39) * (104 / 59) - 1, yt = 27 + Math.sin(((x - 24) / 76) * Math.PI * 2) * -4 + (x - 24) * 0.12; if (yb - yt > 6) str.push(`<line x1="${x.toFixed(1)}" y1="${yt.toFixed(1)}" x2="${x.toFixed(1)}" y2="${yb.toFixed(1)}" stroke="${i % 7 === 0 ? '#b5482f' : '#efe7d6'}" stroke-width="${i < 4 ? 0.95 : 0.75}"/>`); }
      return { vb: '0 0 120 160', g: `<defs>${lg(k + 'c', [[0, '#e0b06d'], [0.5, '#c08245'], [1, '#8a5428']])}${lg(k + 's', [[0, '#d39a5c'], [1, '#9a5f2e']], 0, 0, 1, 1)}</defs>` +
        shadow(64, 150, 34) +
        `<path d="M30 147h40l-4 -6h-32z" fill="#9a5f2e"/>` +
        `<path d="M34 142L44 142L100 40L96 36Z" fill="url(#${k}s)" stroke="#6d3e1c" stroke-width=".9"/>` +
        `<g class="vbp">${str.join('')}</g>` +
        `<path d="M24 146L24 30" stroke="#7d4a22" stroke-width="9" stroke-linecap="round"/><path d="M24 146L24 30" stroke="url(#${k}c)" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M20 26q8 -12 22 -4q14 10 28 2q18 -10 30 10q2 6 -4 6q-12 -12 -26 -4q-14 8 -30 0q-10 -5 -16 4z" fill="url(#${k}c)" stroke="#6d3e1c" stroke-width=".9"/>` +
        `<path d="M18 26a7 7 0 1 1 12 -6" fill="none" stroke="#c99a52" stroke-width="3"/>` };
    },
    flute: (k) => ({ vb: '0 0 120 160', g: `<defs>${lg(k + 'f', [[0, '#f4f6f8'], [0.45, '#cfd6dd'], [1, '#8e99a5']], 0, 0, 0, 1)}</defs>` + shadow(60, 150, 40) +
      `<g transform="translate(60 80) rotate(-56)"><rect x="-74" y="-4.5" width="148" height="9" rx="4.5" fill="url(#${k}f)" stroke="#7a8592" stroke-width=".8"/>` +
      `<rect x="-62" y="-6" width="14" height="12" rx="3" fill="url(#${k}f)" stroke="#7a8592" stroke-width=".8"/><ellipse cx="-55" cy="0" rx="3.2" ry="2.2" fill="#3a4450"/>` +
      [-30, -21, -12, 4, 13, 22, 31, 46].map((x) => `<circle cx="${x}" cy="-1" r="3.3" fill="#e6eaee" stroke="#7a8592" stroke-width=".8"/>`).join('') +
      `<line x1="-36" y1="3.6" x2="58" y2="3.6" stroke="#8e99a5" stroke-width=".8"/>` + `</g>` + air(98, 22, -56, 8) }),
    clarinet: (k) => ({ vb: '0 0 120 160', g: `<defs>${lg(k + 'e', [[0, '#4a515b'], [0.4, '#2a2f36'], [1, '#14171b']])}${lg(k + 'm', [[0, '#f2f4f6'], [1, '#9aa5b1']])}</defs>` + shadow(60, 151, 20) +
      `<path d="M57.6 8L62.4 8L63.4 26L56.6 26Z" fill="#1a1d21"/><rect x="56.4" y="12" width="7.2" height="3" rx="1" fill="url(#${k}m)"/>` +
      `<rect x="55.5" y="26" width="9" height="12" rx="2" fill="url(#${k}e)"/>` +
      `<path d="M55.8 38L64.2 38L64.6 124L55.4 124Z" fill="url(#${k}e)"/>` +
      `<path d="M55.4 124L64.6 124Q67 136 74 146L46 146Q53 136 55.4 124Z" fill="url(#${k}e)"/><ellipse cx="60" cy="146" rx="14" ry="3.2" fill="#0d0f12"/>` +
      [38, 80, 124].map((y) => `<rect x="54.6" y="${y - 1.6}" width="10.8" height="3.2" rx="1" fill="url(#${k}m)"/>`).join('') +
      [48, 56, 64, 90, 98, 106].map((y) => `<circle cx="60" cy="${y}" r="2.3" fill="url(#${k}m)" stroke="#5f6b77" stroke-width=".5"/>`).join('') +
      `<path d="M66 50v18M66 92v22" stroke="#c4ccd4" stroke-width="1.1"/>` + air(60, 150, 90, 6) }),
    bassoon: (k) => ({ vb: '0 0 120 160', g: `<defs>${lg(k + 'r', [[0, '#c26a3c'], [0.45, '#94461f'], [1, '#5e2a12']])}${lg(k + 'm', [[0, '#f2f4f6'], [1, '#9aa5b1']])}</defs>` + shadow(62, 151, 22) +
      `<rect x="52" y="22" width="15" height="126" rx="5" fill="url(#${k}r)"/>` + `<rect x="66" y="58" width="10" height="90" rx="4" fill="url(#${k}r)"/>` +
      `<path d="M52 136h24v8a5 5 0 0 1 -5 5h-14a5 5 0 0 1 -5 -5z" fill="#5e2a12"/>` +
      `<rect x="51" y="20" width="17" height="5" rx="2" fill="#efe6d4"/><ellipse cx="59.5" cy="20.5" rx="7.5" ry="2" fill="#2a1a12"/>` +
      [56, 98].map((y) => `<rect x="51" y="${y}" width="17" height="3" rx="1" fill="url(#${k}m)"/>`).join('') + `<rect x="65" y="56" width="12" height="3" rx="1" fill="url(#${k}m)"/>` +
      `<path d="M66 70q12 -6 12 -22q0 -10 -12 -14q-8 -2 -14 2" fill="none" stroke="url(#${k}m)" stroke-width="2.2" stroke-linecap="round"/><path d="M52 36l-4 -3" stroke="#d9c49a" stroke-width="3" stroke-linecap="round"/>` +
      [70, 80, 90, 110, 120].map((y) => `<circle cx="59.5" cy="${y}" r="1.9" fill="#2a160c"/>`).join('') + air(59.5, 16, -90, 6) }),
    recorder: (k) => ({ vb: '0 0 120 160', g: `<defs>${lg(k + 'i', [[0, '#fbf8f0'], [0.5, '#e9e1cd'], [1, '#bfb49a']])}${lg(k + 'j', [[0, '#cfe0ec'], [0.5, '#9fbcd2'], [1, '#6f8ea6']])}</defs>` + shadow(60, 151, 17) +
      `<path d="M56 8h8l1.5 26h-11z" fill="url(#${k}j)"/><rect x="55" y="26" width="10" height="5" rx="1" fill="#2b3a48"/>` +
      `<rect x="54" y="31" width="12" height="12" rx="3" fill="url(#${k}j)"/>` +
      `<path d="M55.2 43L64.8 43L64.2 118L55.8 118Z" fill="url(#${k}i)"/>` +
      `<rect x="54" y="116" width="12" height="10" rx="3" fill="url(#${k}j)"/>` +
      `<path d="M55.4 126L64.6 126Q66 138 69 146L51 146Q54 138 55.4 126Z" fill="url(#${k}i)"/><ellipse cx="60" cy="146" rx="9" ry="2.2" fill="#a59a80"/>` +
      [52, 61, 70, 84, 93, 102, 111].map((y) => `<ellipse cx="60" cy="${y}" rx="1.9" ry="1.6" fill="#4b4436"/>`).join('') + air(60, 150, 90, 6) }),
    trumpet: (k) => ({ vb: '0 0 120 160', g: `<defs>${BR(k)}</defs>` + shadow(60, 116, 46) +
      `<g transform="translate(0 6) rotate(-8 60 80)">` +
      tube('M14 72L42 72', k, 3.4) + tube('M42 72Q42 98 66 98L82 98Q92 98 92 86L92 80', k, 4) + tube('M40 80L88 80', k, 4.6) +
      `<path d="M86 74L108 58Q114 80 108 102L86 86Z" fill="url(#${k}bh)" stroke="#7d5414" stroke-width=".9"/><ellipse cx="108" cy="80" rx="5.5" ry="22" fill="url(#${k}bm)" stroke="#7d5414" stroke-width=".9"/>` +
      [52, 61, 70].map((x) => `<rect x="${x - 3.6}" y="66" width="7.2" height="26" rx="2.4" fill="url(#${k}bh)" stroke="#7d5414" stroke-width=".8"/><rect x="${x - 2.4}" y="58" width="4.8" height="8" fill="#c9ccd0"/><ellipse cx="${x}" cy="57" rx="4.6" ry="1.9" fill="#eef0f2" stroke="#8e99a5" stroke-width=".7"/>`).join('') +
      `<path d="M8 70l7 2l-7 2z" fill="#c9ccd0" stroke="#8e99a5" stroke-width=".6"/>` + air(112, 80, 0, 6) + `</g>` }),
    horn: (k) => ({ vb: '0 0 120 160', g: `<defs>${BR(k)}</defs>` + shadow(62, 140, 44) +
      `<circle cx="56" cy="76" r="36" fill="none" stroke="#7d5414" stroke-width="8.6"/><circle cx="56" cy="76" r="36" fill="none" stroke="url(#${k}b)" stroke-width="7"/>` +
      `<circle cx="56" cy="76" r="26" fill="none" stroke="#7d5414" stroke-width="5.6"/><circle cx="56" cy="76" r="26" fill="none" stroke="url(#${k}b)" stroke-width="4.2"/>` +
      tube('M56 50Q40 50 34 62', k, 3) + tube('M30 70L8 64', k, 2.4) +
      [[40, 66], [46, 76], [40, 86]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="url(#${k}bh)" stroke="#7d5414" stroke-width=".8"/><circle cx="${x}" cy="${y}" r="2" fill="#c9ccd0"/>`).join('') +
      `<path d="M79 96C91 105 108 112 116.3 121.7L91.7 142.3C88 128 80 113 71 104Z" fill="url(#${k}bh)" stroke="#7d5414" stroke-width=".9"/><ellipse cx="104" cy="132" rx="16" ry="6" transform="rotate(-40 104 132)" fill="url(#${k}bm)" stroke="#7d5414" stroke-width=".9"/>` +
      air(108, 137, 50, 7) }),
    trombone: (k) => ({ vb: '0 0 120 160', g: `<defs>${BR(k)}</defs>` + shadow(60, 150, 44) +
      `<g transform="translate(60 84) rotate(-40)">` +
      tube('M-66 6L40 6', k, 2.6) + tube('M-66 14L34 14', k, 2.6) + tube('M-66 6Q-72 10 -66 14', k, 2.6) +
      tube('M48 -6Q58 -6 58 2Q58 10 46 10L40 10', k, 3) + tube('M-12 -6L48 -6', k, 3.4) +
      `<path d="M-12 -9L-44 -24Q-48 -6 -44 12L-12 -3Z" fill="url(#${k}bh)" stroke="#7d5414" stroke-width=".9"/><ellipse cx="-44" cy="-6" rx="5" ry="18" fill="url(#${k}bm)" stroke="#7d5414" stroke-width=".9"/>` +
      `<rect x="20" y="4" width="4" height="12" rx="1" fill="#c9ccd0"/><path d="M40 10l8 0" stroke="#c9ccd0" stroke-width="2.4"/>` + air(-48, -6, 180, 6) + `</g>` }),
    tuba: (k) => ({ vb: '0 0 120 160', g: `<defs>${BR(k)}</defs>` + shadow(60, 150, 36) +
      `<path d="M44 140Q30 140 30 120L30 92Q30 78 44 78" fill="none" stroke="#7d5414" stroke-width="13.6" stroke-linecap="round"/><path d="M44 140Q30 140 30 120L30 92Q30 78 44 78" fill="none" stroke="url(#${k}bh)" stroke-width="12" stroke-linecap="round"/>` +
      `<path d="M44 146Q78 148 80 120L84 40L56 40L60 112Q60 128 44 132Z" fill="url(#${k}bh)" stroke="#7d5414" stroke-width=".9"/>` +
      `<path d="M54 40Q50 14 40 10L102 10Q90 14 86 40Z" fill="url(#${k}bh)" stroke="#7d5414" stroke-width=".9"/><ellipse cx="71" cy="10" rx="31" ry="6" fill="url(#${k}bm)" stroke="#7d5414" stroke-width=".9"/>` +
      [[38, 92], [46, 96], [54, 100]].map(([x, y]) => `<rect x="${x - 3.6}" y="${y - 14}" width="7.2" height="26" rx="2.4" fill="url(#${k}bh)" stroke="#7d5414" stroke-width=".8"/><ellipse cx="${x}" cy="${y - 15}" rx="4.4" ry="1.8" fill="#eef0f2" stroke="#8e99a5" stroke-width=".7"/>`).join('') +
      tube('M34 104L14 96', k, 2.4) + air(71, 6, -90, 7) }),
    xylophone: (k) => {
      const bars = []; const n = 10;
      for (let i = 0; i < n; i++) { const x = 12 + i * 10.2, L = 66 - i * 3.6, y = 70 - L / 2 + i * 1.2; bars.push(`<rect x="${x}" y="${y + 3}" width="8.6" height="${L}" rx="1.6" fill="#5e2e14"/><rect x="${x}" y="${y}" width="8.6" height="${L}" rx="1.6" fill="url(#${k}x)"/><circle cx="${x + 4.3}" cy="${y + L * 0.22}" r=".9" fill="#2a160c"/><circle cx="${x + 4.3}" cy="${y + L * 0.78}" r=".9" fill="#2a160c"/>`); }
      return { vb: '0 0 120 160', g: `<defs>${lg(k + 'x', [[0, '#b8693a'], [0.5, '#9b5129'], [1, '#7a3b1b']])}${lg(k + 'f', [[0, '#4a3a30'], [1, '#2a1f19']])}</defs>` + shadow(62, 122, 54) +
        `<path d="M8 44L114 52L114 58L8 50Z" fill="url(#${k}f)"/><path d="M8 92L114 88L114 94L8 98Z" fill="url(#${k}f)"/>` +
        `<g class="vbp">${bars.join('')}</g>` +
        `<line x1="44" y1="136" x2="72" y2="92" stroke="#cfb38a" stroke-width="2" stroke-linecap="round"/><circle cx="73.5" cy="89.6" r="4.6" fill="#3b4c63"/>` +
        `<line x1="86" y1="140" x2="88" y2="96" stroke="#cfb38a" stroke-width="2" stroke-linecap="round"/><circle cx="88.2" cy="92.6" r="4.6" fill="#3b4c63"/>` };
    },
    timpani: (k) => ({ vb: '0 0 120 160', g: `<defs>${lg(k + 'k', [[0, '#e0a072'], [0.4, '#b86a3c'], [1, '#6e3519']])}${rg(k + 'm', [[0, '#fbf7ee'], [1, '#ddd3be']], 0.4, 0.35, 0.8)}</defs>` + shadow(60, 146, 46) +
      `<path d="M14 64Q16 122 60 128Q104 122 106 64Z" fill="url(#${k}k)" stroke="#5e2c12" stroke-width=".9"/>` +
      `<path d="M30 124L22 144M90 124L98 144M60 128L60 146" stroke="#4a515b" stroke-width="2.4" stroke-linecap="round"/>` +
      `<ellipse cx="60" cy="64" rx="47" ry="13" fill="#9aa5b1"/><ellipse class="vbp" cx="60" cy="62.5" rx="44" ry="11.5" fill="url(#${k}m)"/>` +
      [22, 40, 60, 80, 98].map((x) => `<line x1="${x}" y1="${70 + Math.abs(60 - x) * -0.1}" x2="${x}" y2="${84 - Math.abs(60 - x) * 0.25}" stroke="#c9ccd0" stroke-width="1.6"/>`).join('') +
      `<line x1="70" y1="40" x2="104" y2="22" stroke="#cfb38a" stroke-width="2" stroke-linecap="round"/><circle cx="68" cy="41.5" r="4.4" fill="#e9e3d6" stroke="#b7ad98" stroke-width=".8"/>` }),
  };

  let seq = 0;
  function svg(id, key) {
    const k = 'i' + (key || ++seq) + id;
    const d = DRAW[id](k);
    return `<svg class="inst-svg" viewBox="${d.vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${d.g}</svg>`;
  }
  window.ART = { svg, ids: Object.keys(DRAW) };
})();
