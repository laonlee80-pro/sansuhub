/* 산수허브 웹 계산기 공통 — 입력 읽기·검증, 링크 공유, 인쇄, 통계, 수식 표기 도우미 */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function f(x, k) {
    if (typeof x !== 'number' || !isFinite(x)) return '–';
    var a = Math.abs(x);
    var d = k != null ? k : (a >= 1000 ? 1 : a >= 100 ? 2 : a >= 1 ? 3 : a >= 0.01 ? 4 : 6);
    return Number(x.toFixed(d)).toLocaleString('ko-KR', { maximumFractionDigits: d });
  }
  function v(x, k, u) { return '<span class="v">' + f(x, k) + '</span>' + (u ? '<span class="un">' + u + '</span>' : ''); }
  function V(n, sub) { return '<var>' + n + (sub ? '<sub>' + sub + '</sub>' : '') + '</var>'; }
  function eq(name, body) { return '<div class="eq"><span class="n">' + name + '</span><span class="f">' + body + '</span></div>'; }
  function chk(ok, text, cls) { return '<div class="chk ' + (cls || (ok ? 'ok' : 'ng')) + '">' + text + '</div>'; }
  function step(title, ref, body) { return '<div class="step"><h3>' + title + (ref ? ' <span class="ref">' + ref + '</span>' : '') + '</h3>' + body + '</div>'; }
  function toast(m) { var t = $('toast'); if (!t) return; t.textContent = m; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 1800); }

  /* cfg: { id:'RC-B1', fields:{Mu:{def:250, int:false, allowZero:false}, ...}, run:function(p){...} } */
  function init(cfg) {
    var ids = Object.keys(cfg.fields), sent = false, timer = null;
    function read() {
      var p = {}, bad = false;
      ids.forEach(function (id) {
        var el = $(id), fd = cfg.fields[id], raw = String(el.value).replace(/,/g, '').trim();
        var x = parseFloat(raw);
        var ok = raw !== '' && isFinite(x) && (fd.any ? true : fd.allowZero ? x >= 0 : x > 0) && (!fd.int || Math.floor(x) === x);
        if (fd.min != null && x < fd.min) ok = false;
        if (fd.max != null && x > fd.max) ok = false;
        el.classList.toggle('bad', !ok); if (!ok) bad = true; p[id] = x;
      });
      return bad ? null : p;
    }
    function go() {
      var p = read();
      if (!p) {
        var vd = $('verdict'); vd.className = 'verdict err';
        vd.innerHTML = '<div class="big">입력 확인</div><div class="msg">빨간 칸의 값을 확인해 주세요. ' + (cfg.inputHint || '0보다 큰 숫자를 넣어 주세요.') + '</div>';
        return;
      }
      var res = cfg.run(p);
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (window.gtag) { gtag('event', 'sansuhub_webcalc', { example_id: cfg.id, verdict: res && res.verdict || '-', first: sent ? 'n' : 'y' }); sent = true; }
      }, 2500);
    }
    var q = new URLSearchParams(location.search);
    ids.forEach(function (id) { if (q.has(id)) $(id).value = q.get(id); $(id).addEventListener('input', go); $(id).addEventListener('change', go); });
    $('reset').onclick = function () { ids.forEach(function (id) { $(id).value = cfg.fields[id].def; }); history.replaceState(null, '', location.pathname); go(); };
    $('print').onclick = function () { window.print(); };
    $('share').onclick = function () {
      var qs = new URLSearchParams(); ids.forEach(function (id) { qs.set(id, $(id).value); });
      history.replaceState(null, '', '?' + qs.toString());
      var url = location.origin + location.pathname + '?' + qs.toString();
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('입력값이 담긴 링크를 복사했습니다'); }, function () { toast('주소창의 링크를 복사해 주세요'); });
      else toast('주소창의 링크를 복사해 주세요');
    };
    var rz = null; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(go, 200); });
    go();
  }

  /* 간단한 XY 그래프 (SVG) — series:[{pts:[[x,y]...], color, width, dash, fill}], marks:[{x,y,color,label,shape}] */
  function plot(el, o) {
    var W = Math.max(300, Math.min(900, el.clientWidth || 640)), H = Math.round(Math.max(240, (o.h || 400) * Math.min(1, W / 640) + (W < 480 ? 40 : 0))), L = W < 480 ? 50 : 64, R = 12, T = 14, B = 46;
    var xs = [], ys = [];
    o.series.forEach(function (s) { s.pts.forEach(function (p) { if (isFinite(p[0]) && isFinite(p[1])) { xs.push(p[0]); ys.push(p[1]); } }); });
    (o.marks || []).forEach(function (m) { xs.push(m.x); ys.push(m.y); });
    var x0 = o.xmin != null ? o.xmin : Math.min.apply(null, xs), x1 = o.xmax != null ? o.xmax : Math.max.apply(null, xs);
    var y0 = o.ymin != null ? o.ymin : Math.min.apply(null, ys), y1 = o.ymax != null ? o.ymax : Math.max.apply(null, ys);
    function nice(lo, hi) { var span = hi - lo || 1, st = Math.pow(10, Math.floor(Math.log10(span / 5))), m = span / 5 / st; st *= m > 5 ? 10 : m > 2 ? 5 : m > 1 ? 2 : 1; return [Math.floor(lo / st) * st, Math.ceil(hi / st) * st, st]; }
    var nx = nice(x0, x1), ny = nice(y0, y1); x0 = nx[0]; x1 = nx[1]; y0 = ny[0]; y1 = ny[1];
    var X = function (x) { return L + (x - x0) / (x1 - x0) * (W - L - R); }, Y = function (y) { return H - B - (y - y0) / (y1 - y0) * (H - T - B); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (o.label || '그래프') + '">';
    for (var gx = x0; gx <= x1 + 1e-9; gx += nx[2]) s += '<line x1="' + X(gx) + '" y1="' + T + '" x2="' + X(gx) + '" y2="' + (H - B) + '" stroke="#eef0f3"/><text x="' + X(gx) + '" y="' + (H - B + 16) + '" font-size="11" text-anchor="middle" fill="#6b7682">' + f(gx, Math.max(0, -Math.floor(Math.log10(nx[2])))) + '</text>';
    for (var gy = y0; gy <= y1 + 1e-9; gy += ny[2]) s += '<line x1="' + L + '" y1="' + Y(gy) + '" x2="' + (W - R) + '" y2="' + Y(gy) + '" stroke="#eef0f3"/><text x="' + (L - 6) + '" y="' + (Y(gy) + 4) + '" font-size="11" text-anchor="end" fill="#6b7682">' + f(gy, Math.max(0, -Math.floor(Math.log10(ny[2])))) + '</text>';
    if (x0 < 0 && x1 > 0) s += '<line x1="' + X(0) + '" y1="' + T + '" x2="' + X(0) + '" y2="' + (H - B) + '" stroke="#9aa4ad"/>';
    if (y0 < 0 && y1 > 0) s += '<line x1="' + L + '" y1="' + Y(0) + '" x2="' + (W - R) + '" y2="' + Y(0) + '" stroke="#9aa4ad"/>';
    s += '<rect x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '" fill="none" stroke="#c9d0d8"/>';
    o.series.forEach(function (sr) {
      var d = ''; sr.pts.forEach(function (p, i) { if (isFinite(p[0]) && isFinite(p[1])) d += (d ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); });
      if (sr.fill) s += '<path d="' + d + 'L' + X(sr.pts[sr.pts.length - 1][0]) + ' ' + Y(0) + 'L' + X(sr.pts[0][0]) + ' ' + Y(0) + 'Z" fill="' + sr.fill + '" stroke="none"/>';
      s += '<path d="' + d + '" fill="none" stroke="' + sr.color + '" stroke-width="' + (sr.width || 2) + '"' + (sr.dash ? ' stroke-dasharray="' + sr.dash + '"' : '') + '/>';
    });
    (o.marks || []).forEach(function (m) {
      var cx = X(m.x), cy = Y(m.y);
      if (m.shape === 'plus') s += '<path d="M' + (cx - 9) + ' ' + cy + 'H' + (cx + 9) + 'M' + cx + ' ' + (cy - 9) + 'V' + (cy + 9) + '" stroke="' + m.color + '" stroke-width="3"/>';
      else s += '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="' + (m.fillc || '#fff') + '" stroke="' + m.color + '" stroke-width="2.2"/>';
      if (m.label) s += '<text x="' + (cx + 10) + '" y="' + (m.shape === 'plus' ? cy + 20 : cy - 8) + '" font-size="12" font-weight="700" fill="' + m.color + '">' + m.label + '</text>';
    });
    s += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 8) + '" font-size="12" text-anchor="middle" fill="#46525e">' + o.xlabel + '</text>';
    s += '<text transform="translate(14 ' + ((T + H - B) / 2) + ') rotate(-90)" font-size="12" text-anchor="middle" fill="#46525e">' + o.ylabel + '</text></svg>';
    el.innerHTML = s;
  }
  window.WC = { $: $, f: f, v: v, V: V, eq: eq, chk: chk, step: step, init: init, plot: plot };
})();
