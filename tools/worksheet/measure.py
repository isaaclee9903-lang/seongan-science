"""종이 학습지 높이 재기: 쪽(.page)·문제 단(.qcols>div)·문제(.q)마다 높이(mm)

쓰는 법: python tools/worksheet/measure.py worksheets/<이름>/index.html
두 단 높이가 비슷한지, 어느 쪽이 넘치는지 볼 때 쓴다. 단 높이는 두 단 중 긴 쪽에 맞춰 늘어나므로 문제 높이를 더해 비교한다.
"""
import sys, pathlib
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright
src = pathlib.Path(sys.argv[1]).resolve().as_uri()
JS = """() => { const mm=96/25.4; const r=e=>e.getBoundingClientRect();
 const out=[]; document.querySelectorAll('.page').forEach((p,i)=>{
   [...p.children].forEach(c=>{ out.push([i+1, (c.querySelector('h2')||c).textContent.trim().slice(0,18), Math.round(r(c).height/mm)]);
     c.querySelectorAll(':scope .qcols>div').forEach((col,k)=>out.push([i+1,'  단'+(k+1)+' '+[...col.querySelectorAll('.qn')].map(q=>q.textContent).join(''), Math.round(r(col).height/mm)]));
     c.querySelectorAll(':scope .q').forEach(q=>out.push([i+1,'    문제 '+q.querySelector('.qn').textContent, Math.round(r(q).height/mm)]));
   });}); return out; }"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); pg.goto(src); pg.wait_for_timeout(800)
    for row in pg.evaluate(JS): print(*row)
    b.close()
