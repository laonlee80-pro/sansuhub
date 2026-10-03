/* 산수허브 방문·다운로드 통계 (Google Analytics 4)
 * ▶ 측정 ID를 아래 한 곳에만 넣으면 전 페이지에 적용됩니다.
 *   Google Analytics → 관리 → 데이터 스트림 → 웹 → 측정 ID (G-로 시작)
 * ▶ ID가 G-XXXXXXXXXX 그대로이면 아무것도 보내지 않습니다.
 */
(function () {
  var GA_ID = 'G-ZJ8LQDSKT3';

  if (!/^G-[A-Z0-9]{6,}$/.test(GA_ID) || GA_ID === 'G-XXXXXXXXXX') return;
  if (/^(localhost|127\.|file:)/.test(location.hostname || 'file:')) return; // 내 PC에서 열어 볼 때는 집계하지 않음

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);

  /* 다운로드 집계: 계산파일(.cpd)·PDF·엑셀 링크를 누를 때 'sansuhub_download' 이벤트 기록
   *   example_id : 예제 번호 (RC-B1, 4.7 …) — 목록 밖 링크는 '-'
   *   file_name  : 파일 이름
   *   file_type  : cpd / pdf / xlsx
   *   section    : 콘크리트 / 동바리 / 자료실 / 기타
   */
  var EXT = /\.(cpd|pdf|xlsx?|hwpx?|docx?|zip)(?:[?#]|$)/i;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var m = href.match(EXT);
    if (!m) return;
    var file = decodeURIComponent(href.split('#')[0].split('?')[0].split('/').pop());
    var item = a.closest('.item');
    var id = item ? item.id.replace(/^ex/, '') : '-';
    var p = location.pathname;
    var section = /\/calc\/rc\//.test(p) ? '콘크리트' : /\/calc\/dongbari\//.test(p) ? '동바리' : /\/forms\//.test(p) ? '자료실' : '기타';
    gtag('event', 'sansuhub_download', {
      example_id: id, file_name: file, file_type: m[1].toLowerCase(), section: section,
      transport_type: 'beacon'
    });
  }, true);
})();
