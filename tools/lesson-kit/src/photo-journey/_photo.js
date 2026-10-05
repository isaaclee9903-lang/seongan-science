/* ===== 사진 한 장 (여행하는 사진) =====
   해 질 녘 언덕 풍경을 캔버스로 그려요. 3D 장면에서 빛의 색, 센서가 받는 빛, 화면의 사진에 모두 이 그림을 써요. */
const PHOTO = (() => {
  const W = 480, H = 320;
  let cv = null, px = null;
  const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  function draw(g) {
    const sky = g.createLinearGradient(0, 0, 0, H * 0.62);
    sky.addColorStop(0, '#24427e'); sky.addColorStop(0.45, '#6f6bb0'); sky.addColorStop(0.78, '#f19a6b'); sky.addColorStop(1, '#ffd38f');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // 해와 햇무리
    const sx = W * 0.7, sy = H * 0.5;
    const halo = g.createRadialGradient(sx, sy, 0, sx, sy, 120); halo.addColorStop(0, 'rgba(255,240,190,.95)'); halo.addColorStop(0.25, 'rgba(255,205,120,.55)'); halo.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = halo; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff4cf'; g.beginPath(); g.arc(sx, sy, 24, 0, 7); g.fill();
    // 구름
    g.fillStyle = 'rgba(255,214,190,.55)';
    [[90, 70, 46], [128, 64, 34], [60, 78, 30], [330, 92, 40], [362, 86, 28]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(x, y, r, r * 0.42, 0, 0, 7); g.fill(); });
    // 먼 산
    const r1 = seeded(7);
    g.fillStyle = '#7a6aa6'; g.beginPath(); g.moveTo(0, H * 0.62);
    for (let x = 0; x <= W; x += 20) g.lineTo(x, H * 0.5 + Math.sin(x / 55) * 14 + Math.sin(x / 17) * 4 + r1() * 4);
    g.lineTo(W, H); g.lineTo(0, H); g.fill();
    // 가까운 언덕
    const hill = g.createLinearGradient(0, H * 0.58, 0, H); hill.addColorStop(0, '#4d8a4a'); hill.addColorStop(1, '#25552e');
    g.fillStyle = hill; g.beginPath(); g.moveTo(0, H * 0.68);
    for (let x = 0; x <= W; x += 16) g.lineTo(x, H * 0.64 + Math.sin(x / 90 + 1) * 18);
    g.lineTo(W, H); g.lineTo(0, H); g.fill();
    // 앞쪽 들판
    const fld = g.createLinearGradient(0, H * 0.78, 0, H); fld.addColorStop(0, '#79b64f'); fld.addColorStop(1, '#3f7f35');
    g.fillStyle = fld; g.beginPath(); g.moveTo(0, H * 0.84);
    for (let x = 0; x <= W; x += 16) g.lineTo(x, H * 0.8 + Math.sin(x / 70) * 8);
    g.lineTo(W, H); g.lineTo(0, H); g.fill();
    // 나무
    g.fillStyle = '#4a3121'; g.fillRect(92, 150, 12, 70);
    [[98, 140, 40, '#1f4d2b'], [78, 156, 28, '#2a5f34'], [120, 156, 28, '#2a5f34'], [98, 118, 26, '#2f6b3a']].forEach(([x, y, r, c]) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    // 꽃
    const r2 = seeded(42);
    for (let i = 0; i < 260; i++) {
      const x = r2() * W, y = H * 0.8 + r2() * H * 0.2, c = r2();
      g.fillStyle = c < 0.45 ? '#ff5d6c' : c < 0.75 ? '#ffd23f' : '#ffffff';
      g.beginPath(); g.arc(x, y, 2 + r2() * 2.6, 0, 7); g.fill();
    }
  }
  function canvas() {
    if (!cv) { cv = document.createElement('canvas'); cv.width = W; cv.height = H; draw(cv.getContext('2d')); px = cv.getContext('2d').getImageData(0, 0, W, H).data; }
    return cv;
  }
  // u: 왼쪽→오른쪽, v: 위→아래 (0~1)
  function sample(u, v) { canvas(); const x = Math.max(0, Math.min(W - 1, Math.floor(u * W))), y = Math.max(0, Math.min(H - 1, Math.floor(v * H))), i = (y * W + x) * 4; return [px[i], px[i + 1], px[i + 2]]; }
  function cell(u0, v0, u1, v1) {
    const a = [0, 0, 0]; let n = 0;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const s = sample(u0 + (u1 - u0) * (i + 0.5) / 4, v0 + (v1 - v0) * (j + 0.5) / 4); a[0] += s[0]; a[1] += s[1]; a[2] += s[2]; n++; }
    return a.map((x) => Math.round(x / n));
  }
  function tex(kind) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.drawImage(canvas(), 0, 0);
    if (kind === 'raw') { // 합치기 전 한 장: 어둡고 자글자글한 얼룩(노이즈)
      g.fillStyle = 'rgba(10,14,30,.38)'; g.fillRect(0, 0, W, H);
      const r = seeded(Math.floor(Math.random() * 9999) + 1);
      for (let i = 0; i < 5200; i++) { const v = r(); g.fillStyle = v < 0.5 ? `rgba(255,255,255,${0.1 + r() * 0.22})` : `rgba(0,0,0,${0.15 + r() * 0.25})`; g.fillRect(r() * W, r() * H, 2, 2); }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  // 휴대폰 화면: 사진 앱
  function screenTex() {
    const SW = 360, SH = 720, c = document.createElement('canvas'); c.width = SW; c.height = SH; const g = c.getContext('2d');
    g.fillStyle = '#05070c'; g.fillRect(0, 0, SW, SH);
    g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '700 22px Pretendard, sans-serif'; g.fillText('9:41', 22, 40);
    g.fillRect(SW - 62, 26, 34, 15); g.fillStyle = '#05070c'; g.fillRect(SW - 60, 28, 22, 11);
    const ph = (SW * H) / W; g.drawImage(canvas(), 0, (SH - ph) / 2 - 40, SW, ph);
    for (let i = 0; i < 4; i++) { g.globalAlpha = 0.85 - i * 0.12; g.drawImage(canvas(), 18 + i * 84, SH - 120, 74, 50); }
    g.globalAlpha = 1; g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(18, SH - 120, 74, 50);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  return { W, H, canvas, sample, cell, tex, screenTex, seeded };
})();
