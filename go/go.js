/* 여백의 지도 — 여행별 신청 페이지: 유입 추적(어떤 릴스에서 왔는지) + 2칸 신청 폼 */
(function () {
  var NS = "https://abacus.jasoncameron.dev/hit/lifejunjun-stats/";
  var body = document.body, slug = body.getAttribute("data-trip") || "x", tripKo = body.getAttribute("data-trip-name") || slug;
  var d = new Date(Date.now() + 324e5).toISOString().slice(0, 10).replace(/-/g, "");
  function clean(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40); }
  function hit(k) { try { fetch(NS + k, { keepalive: true, mode: "cors" }).catch(function () {}); } catch (e) {} }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* 1. 유입: ?r=릴스ID (짧은 태그) 또는 utm_source/utm_content */
  var q = new URLSearchParams(location.search), ref = document.referrer || "", ua = navigator.userAgent || "";
  var ig = /instagram\.com|facebook\.com/i.test(ref) || /Instagram|FBAN|FBAV/.test(ua) || /fbclid=/.test(location.search);
  var chan = clean(q.get("utm_source") || (ig ? "ig" : (ref && ref.indexOf(location.host) < 0 ? "web" : "")));
  var tag = clean(q.get("r") || q.get("utm_content") || q.get("utm_campaign") || "");
  var src = tag ? clean((chan || "ig") + "-" + tag) : "";
  if (src) { ls("_ybsrc", src); if (!ls("_ybsrc0")) ls("_ybsrc0", src); }
  var cur = src || ls("_ybsrc") || (chan ? chan + "-none" : "direct");
  var first = ls("_ybsrc0") || cur;

  /* 2. 집계 (화면 표시 없음) — 사이트 전체 숫자와 같은 키 + 여행별·릴스별 */
  var seen = ls("_vyb");
  hit("yb_pv_" + d); hit("go_" + slug + "_pv_" + d);
  if (seen !== d) { hit("yb_uv_" + d); if (ig || /^ig|^instagram|^fb|^meta/.test(chan)) hit("yb_sns_" + d); ls("_vyb", d); }
  if (ls("_vgo_" + slug) !== d) { hit("go_" + slug + "_uv_" + d); ls("_vgo_" + slug, d); }
  if (src && ls("_vr_" + src) !== "1") { hit("r_" + src); ls("_vr_" + src, "1"); }

  /* 페이지 안 다른 여행·메인 링크에도 태그 유지 */
  if (src) Array.prototype.forEach.call(document.querySelectorAll("a[data-keep]"), function (a) {
    var h = a.getAttribute("href"); if (!h || h.indexOf("?") > -1) return;
    var i = h.indexOf("#"); a.setAttribute("href", (i < 0 ? h : h.slice(0, i)) + "?r=" + encodeURIComponent(tag) + (chan ? "&utm_source=" + encodeURIComponent(chan) : "") + (i < 0 ? "" : h.slice(i)));
  });

  /* 3. 신청 폼 */
  var f = document.getElementById("goForm"); if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("gName").value.trim(), contact = $("gContact").value.trim(), err = $("gErr");
    if (!name) { err.textContent = "이름이나 닉네임을 적어주세요."; $("gName").focus(); return; }
    if (contact.length < 3) { err.textContent = "답장 받을 이메일이나 카카오톡 ID를 적어주세요."; $("gContact").focus(); return; }
    if (!$("gConsent").checked) { err.textContent = "연락을 위한 동의에 체크해 주세요."; return; }
    err.textContent = "";
    if ($("gHp").value) { show(true); return; }
    var btn = $("gSend"); btn.disabled = true; btn.textContent = "보내는 중…";
    var isMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    var data = { _subject: "[여백의 지도 관심 신청] " + tripKo + " · " + name, _template: "box", _captcha: "false",
      브랜드: "여백의 지도", 관심여행: tripKo, 이름: name, 연락처: contact, 유입: cur, 첫유입: first,
      페이지: location.origin + location.pathname, 동의: "예 (연락 목적)" };
    if (isMail) data._replyto = contact;
    var text = ["[여백의 지도 · " + tripKo + " 관심 신청]", "이름: " + name, "연락처: " + contact].join("\n");
    $("gMail").href = "mailto:probe2928@gmail.com?subject=" + encodeURIComponent("여백의 지도 " + tripKo + " 관심 신청") + "&body=" + encodeURIComponent(text);
    fetch("https://formsubmit.co/ajax/probe2928@gmail.com", { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) { var ok = j && (j.success === true || j.success === "true"); if (ok) { hit("yb_apply_" + d); hit("go_" + slug + "_apply_" + d); hit("ra_" + cur); } show(ok); })
      .catch(function () { show(false); });
    function done() { btn.disabled = false; btn.textContent = "관심 신청하기"; }
    setTimeout(done, 15000);
  });
  function show(ok) {
    f.hidden = true; var el = ok ? $("gDone") : $("gFail"); el.hidden = false;
    try { el.focus({ preventScroll: true }); } catch (e) {} el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
})();
