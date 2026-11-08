/* 종이 학습지용 입체 선 그림 도구 (흑백 인쇄용 SVG)
   - 3D 좌표(x 오른쪽, y 위, z 보는 사람 쪽)를 비스듬히 내려다본 그림으로 바꿔 그린다.
   - 면은 빛 방향 하나(왼쪽 위 앞)로 회색 명암을 주고, 뒤를 향한 면은 그리지 않는다.
   - 그리는 차례 = 부른 차례(뒤에 있는 것부터 부른다). 한 덩어리(mesh) 안에서는 먼 면부터 그린다.
   쓰는 법: const s = W3.scene(svgEl, {yaw:35, pitch:16, scale:.8}); s.box(...); s.arrow(...); s.fit(2);
*/
(function(){
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, at, parent){ var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); if (parent) parent.appendChild(e); return e; }
  function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
  function cross(a,b){return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];}
  function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
  function norm(a){var l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];}
  function cen(pts){var c=[0,0,0];pts.forEach(function(p){c[0]+=p[0];c[1]+=p[1];c[2]+=p[2];});return [c[0]/pts.length,c[1]/pts.length,c[2]/pts.length];}
  function gray(l){ l=Math.max(0,Math.min(1,l)); var v=Math.round(255*l); var h=v.toString(16).padStart(2,'0'); return '#'+h+h+h; }
  function f(n){ return (Math.round(n*100)/100).toString(); }

  function scene(svg, o){
    o = o || {};
    var yaw=(o.yaw||35)*Math.PI/180, pit=(o.pitch||16)*Math.PI/180, S=o.scale||1;
    var cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pit), sp=Math.sin(pit);
    var L = norm(o.light || [-0.55, 1, 0.75]);
    var g = el('g', {}, svg);
    var box = [Infinity, Infinity, -Infinity, -Infinity];
    function grow(x,y,pad){ pad=pad||0; box[0]=Math.min(box[0],x-pad); box[1]=Math.min(box[1],y-pad); box[2]=Math.max(box[2],x+pad); box[3]=Math.max(box[3],y+pad); }
    function P(p){ var X1=p[0]*cy+p[2]*sy, Z1=-p[0]*sy+p[2]*cy; var Y2=p[1]*cp-Z1*sp, Z2=p[1]*sp+Z1*cp; return [X1*S, -Y2*S, Z2]; }
    function depthN(n){ var Z1=-n[0]*sy+n[2]*cy; return n[1]*sp+Z1*cp; }
    function pts2(ps, track){ return ps.map(function(p){ var q=P(p); if(track!==false) grow(q[0],q[1]); return f(q[0])+','+f(q[1]); }).join(' '); }

    var api = {
      g: g, P: P,
      layer: function(cls){ var l=el('g', cls?{'class':cls}:{}, g); return l; },
      /* 면 덩어리. faces: [{pts:[[x,y,z],..], tone:0~1(재질 밝기), n:[법선](없으면 center 기준으로 계산)}] */
      mesh: function(faces, opt){
        opt = opt || {};
        var parent = opt.parent || g, center = opt.center;
        var list = [];
        faces.forEach(function(fc){
          var n = fc.n;
          if(!n){ n = norm(cross(sub(fc.pts[1],fc.pts[0]), sub(fc.pts[2],fc.pts[0])));
            if(center){ var c=cen(fc.pts); if(dot(n, sub(c,center))<0) n=[-n[0],-n[1],-n[2]]; } }
          if(!opt.both && depthN(n) <= 0.001) return;
          var d = cen(fc.pts.map(P)); list.push({fc:fc, n:n, d:d[2]});
        });
        list.sort(function(a,b){return a.d-b.d;});
        list.forEach(function(it){
          var b = Math.max(0, dot(it.n, L));
          var tone = it.fc.tone==null ? (opt.tone==null?1:opt.tone) : it.fc.tone;
          var light = tone*(0.66 + 0.34*b) + (1-tone)*0.0;
          if(tone>=0.98) light = 0.80 + 0.20*b;              /* 흰 재질 */
          var at = {points: pts2(it.fc.pts), fill: it.fc.fill || gray(light), stroke: opt.stroke||'#111', 'stroke-width': opt.sw||0.3, 'stroke-linejoin':'round'};
          if(opt.alpha!=null) at['fill-opacity']=opt.alpha;
          el('polygon', at, parent);
        });
      },
      box: function(x0,x1,y0,y1,z0,z1,opt){
        var c=[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2];
        var v=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
        var F=[[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,7,4],[1,2,6,5]];
        opt = Object.assign({center:c}, opt||{});
        api.mesh(F.map(function(ix){return {pts: ix.map(function(i){return v[i];})};}), opt);
      },
      line: function(ps, opt){
        opt=opt||{};
        var at = {points: pts2(ps), fill:'none', stroke: opt.color||'#111', 'stroke-width': opt.w||0.35, 'stroke-linecap':'round', 'stroke-linejoin':'round'};
        if(opt.dash) at['stroke-dasharray']=opt.dash;
        if(opt.cls) at['class']=opt.cls;
        return el('polyline', at, opt.parent||g);
      },
      /* 구리선처럼 보이는 굵은 선(어두운 바깥 + 밝은 안쪽) */
      wire: function(ps, opt){
        opt=opt||{};
        api.line(ps, {w:(opt.w||1.5), color:'#111', parent:opt.parent});
        api.line(ps, {w:(opt.w||1.5)*0.42, color:'#9a9a9a', parent:opt.parent});
      },
      /* 화살표: 3D 두 점, 머리는 화면 위에서 그린다 */
      arrow: function(a, b, opt){
        opt=opt||{};
        var p=P(a), q=P(b), parent=opt.parent||g, col=opt.color||'#111', w=opt.w||0.45, h=opt.head||(1.6+w*1.6);
        var dx=q[0]-p[0], dy=q[1]-p[1], l=Math.hypot(dx,dy)||1, ux=dx/l, uy=dy/l;
        var bx=q[0]-ux*h, by=q[1]-uy*h, wx=-uy*h*0.42, wy=ux*h*0.42;
        grow(p[0],p[1]); grow(q[0],q[1]);
        var gg = el('g', opt.cls?{'class':opt.cls}:{}, parent);
        var ln = el('line', {x1:f(p[0]),y1:f(p[1]),x2:f(bx+ux*0.2),y2:f(by+uy*0.2),stroke:col,'stroke-width':w,'stroke-linecap':'round'}, gg);
        if(opt.dash) ln.setAttribute('stroke-dasharray', opt.dash);
        el('polygon', {points: f(q[0])+','+f(q[1])+' '+f(bx+wx)+','+f(by+wy)+' '+f(bx-wx)+','+f(by-wy), fill:col}, gg);
        return gg;
      },
      /* 굵은 힘 화살표(속 빈 화살표 모양) */
      fat: function(a, b, opt){
        opt=opt||{};
        var p=P(a), q=P(b), parent=opt.parent||g, col=opt.color||'#111', w=opt.w||1.6, h=opt.head||3.4;
        var dx=q[0]-p[0], dy=q[1]-p[1], l=Math.hypot(dx,dy)||1, ux=dx/l, uy=dy/l, nx=-uy, ny=ux;
        var bx=q[0]-ux*h, by=q[1]-uy*h;
        var pts=[[p[0]+nx*w/2,p[1]+ny*w/2],[bx+nx*w/2,by+ny*w/2],[bx+nx*h*0.62,by+ny*h*0.62],[q[0],q[1]],[bx-nx*h*0.62,by-ny*h*0.62],[bx-nx*w/2,by-ny*w/2],[p[0]-nx*w/2,p[1]-ny*w/2]];
        pts.forEach(function(t){grow(t[0],t[1]);});
        return el('polygon', {points: pts.map(function(t){return f(t[0])+','+f(t[1]);}).join(' '), fill: opt.fill||col, stroke: opt.stroke||col, 'stroke-width':0.3, 'stroke-linejoin':'round', 'class': opt.cls||''}, parent);
      },
      text: function(p, s, opt){
        opt=opt||{};
        var q = opt.screen ? p : P(p), size=opt.size||2.8, x=q[0]+(opt.dx||0), y=q[1]+(opt.dy||0);
        var anchor = opt.anchor||'start';
        var w = s.length*size*(opt.wf||0.92);
        var x0 = anchor==='middle'? x-w/2 : anchor==='end'? x-w : x;
        if(opt.track!==false){ grow(x0, y-size); grow(x0+w, y+size*0.3); }
        var parent = opt.parent||g;
        if(opt.bg){ el('rect', {x:f(x0-0.6), y:f(y-size*0.86), width:f(w+1.2), height:f(size*1.12), fill:'#fff', 'class':opt.cls||''}, parent); }
        var t = el('text', {x:f(x), y:f(y), 'font-size':size, 'font-weight':opt.weight||700, 'text-anchor':anchor, fill:opt.color||'#111', 'class':opt.cls||''}, parent);
        t.textContent = s; return t;
      },
      grow: grow,
      fit: function(pad){
        pad = pad==null?2:pad;
        var w=box[2]-box[0]+2*pad, h=box[3]-box[1]+2*pad;
        svg.setAttribute('viewBox', f(box[0]-pad)+' '+f(box[1]-pad)+' '+f(w)+' '+f(h));
        svg.style.aspectRatio = w+' / '+h;
        return [w,h];
      }
    };
    return api;
  }

  /* 반원 고리(말굽자석 굽은 곳): y-z 평면, 중심 (y=0, z=zc), x는 -w~w, 위쪽 반은 toneTop, 아래쪽 반은 toneBot */
  function horseshoeBend(s, w, zc, R, r, toneTop, toneBot, opt){
    var N=14, faces=[];
    function pt(x,t,rad){ return [x, rad*Math.cos(t), zc - rad*Math.sin(t)]; }
    for(var i=0;i<N;i++){
      var t0=Math.PI*i/N, t1=Math.PI*(i+1)/N, tm=(t0+t1)/2, tone = tm<Math.PI/2? toneTop: toneBot;
      var no=[0, Math.cos(tm), -Math.sin(tm)];
      faces.push({pts:[pt(-w,t0,R),pt(w,t0,R),pt(w,t1,R),pt(-w,t1,R)], n:no, tone:tone});
      faces.push({pts:[pt(-w,t0,r),pt(w,t0,r),pt(w,t1,r),pt(-w,t1,r)], n:[0,-no[1],-no[2]], tone:tone});
    }
    [-w,w].forEach(function(x){
      [[0,Math.PI/2,toneTop],[Math.PI/2,Math.PI,toneBot]].forEach(function(seg){
        var ps=[], k;
        for(k=0;k<=7;k++){ ps.push(pt(x, seg[0]+(seg[1]-seg[0])*k/7, R)); }
        for(k=7;k>=0;k--){ ps.push(pt(x, seg[0]+(seg[1]-seg[0])*k/7, r)); }
        faces.push({pts:ps, n:[x<0?-1:1,0,0], tone:seg[2]});
      });
    });
    s.mesh(faces, opt);
  }

  window.W3 = { scene: scene, horseshoeBend: horseshoeBend, el: el };
})();
