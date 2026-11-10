(function (MS) {
  'use strict';
  var t = function (k) { return MS.t(k); };
  var esc = MS.esc, S = MS.Store;
  var D = function () { return S.data; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var ml = function (o) { return o ? (typeof o === 'string' ? o : (o[MS.lang] || o.en || '')) : ''; };
  var nm = function (c) { return ml(c.names); };
  var num = function (n) { return Number(n).toFixed(2).replace(/\.00$/, ''); };
  var money = function (n) { return (D().settings.currency || '€') + num(n); };
  var eff = function (p) { return (p.sale > 0 && p.sale < p.price) ? p.sale : p.price; };
  var catOf = function (id) { return D().categories.filter(function (c) { return c.id === id; })[0]; };
  var brandOf = function (id) { return D().brands.filter(function (b) { return b.id === id; })[0]; };
  var prodOf = function (id) { return D().products.filter(function (p) { return p.id === id; })[0]; };
  var hash = function (s) { var a = 0; String(s).split('').forEach(function (c) { a += c.charCodeAt(0); }); return a; };
  var imgs = function (p) { return (p.images && p.images.length) ? p.images : [MS.art((catOf(p.cat) || {}).icon || 'clothing', hash(p.id))]; };
  var mono = function (n) { var m = String(n).replace(/[^A-Za-z0-9 ]/g, '').split(' ').map(function (w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase(); return m || 'M'; };
  var qsafe = function (s) { return encodeURIComponent(s); };
  var safeColor = function (c) { return /^#[0-9a-fA-F]{3,8}$/.test(c || '') ? c : '#d4af37'; };

  MS.h = { ml: ml, nm: nm, num: num, money: money, eff: eff, catOf: catOf, brandOf: brandOf, prodOf: prodOf, imgs: imgs, mono: mono, safeColor: safeColor };

  var IC = {
    search: '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>',
    heart: '<path d="M12 20 C4 14 3 9 6 6 C8.5 4 11 5.5 12 7.5 C13 5.5 15.5 4 18 6 C21 9 20 14 12 20 Z"/>',
    bag: '<path d="M5 8 H19 L20 21 H4 Z"/><path d="M9 8 V6 A3 3 0 0 1 15 6 V8"/>',
    menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
    close: '<line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>',
    home: '<path d="M4 11 L12 4 L20 11 V20 H4 Z"/>',
    grid: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
    trash: '<path d="M4 7 H20 M9 7 V4 H15 V7 M6 7 L7 20 H17 L18 7"/>',
    camera: '<path d="M4 8 H8 L10 5 H14 L16 8 H20 V19 H4 Z"/><circle cx="12" cy="13" r="3.5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 18 L9 13 L13 17 L16 14 L21 19"/>',
    left: '<path d="M15 5 L8 12 L15 19"/>',
    right: '<path d="M9 5 L16 12 L9 19"/>',
    edit: '<path d="M4 20 L5 15 L16 4 L20 8 L9 19 Z"/>',
    check: '<path d="M5 12 L10 17 L19 7"/>'
  };
  var ic = function (n, s, fill) {
    s = s || 22;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="' + (fill ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>';
  };
  MS.ic = ic;

  function catIcon(c, s) {
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 64 64" aria-hidden="true"><g stroke="url(#gold)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">' + (MS.ICONS[c.icon] || MS.ICONS.clothing) + '</g></svg>';
  }
  MS.catIcon = catIcon;

  // ---------- state: cart & favorites
  var Cart = { items: S.load('cart', []), save: function () { S.store('cart', this.items); }, count: function () { return this.items.reduce(function (a, i) { return a + i.qty; }, 0); } };
  var Fav = { list: S.load('favs', []), has: function (id) { return this.list.indexOf(id) > -1; }, toggle: function (id) { var i = this.list.indexOf(id); if (i > -1) this.list.splice(i, 1); else this.list.push(id); S.store('favs', this.list); } };
  MS.Cart = Cart; MS.Fav = Fav;

  function lines() {
    return Cart.items.map(function (i) { var p = prodOf(i.pid); return p ? { pid: i.pid, size: i.size, color: i.color, qty: i.qty, p: p } : null; }).filter(Boolean);
  }
  var Coupon = { code: S.load('coupon', '') };
  function couponCalc(code, sub) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return { none: true, disc: 0 };
    var c = (D().coupons || []).filter(function (x) { return String(x.code).toUpperCase() === code; })[0];
    if (!c || !c.on) return { err: 'couponBad', disc: 0 };
    if (c.expires) { var e = new Date(c.expires + 'T23:59:59'); if (!isNaN(e) && e < new Date()) return { err: 'couponExp', disc: 0 }; }
    if (Number(c.min) > sub) return { err: 'couponMin', disc: 0 };
    var d = c.type === 'fix' ? Number(c.value) : sub * Number(c.value) / 100;
    d = Math.min(sub, Math.max(0, Math.round((d || 0) * 100) / 100));
    return { ok: true, disc: d, code: c.code };
  }
  function totals() {
    var L = lines();
    var sub = L.reduce(function (a, l) { return a + eff(l.p) * l.qty; }, 0);
    var s = D().settings;
    var cp = couponCalc(Coupon.code, sub);
    var net = sub - cp.disc;
    var ship = (!sub || net >= Number(s.freeFrom)) ? 0 : Number(s.shipFee);
    return { L: L, sub: sub, disc: cp.disc, coupon: cp, ship: ship, total: net + ship };
  }
  MS.totals = totals;

  function toast(msg, bad) {
    var el = $('#toast'); if (!el) return;
    var d = document.createElement('div');
    d.className = 'tt' + (bad ? ' bad' : '');
    d.textContent = msg;
    el.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 2600);
  }
  MS.toast = toast;

  // ---------- routing helpers
  function parse() {
    var h = location.hash.replace(/^#\/?/, '');
    var i = h.indexOf('?');
    var path = i > -1 ? h.slice(0, i) : h, qs = i > -1 ? h.slice(i + 1) : '';
    var q = {};
    qs.split('&').forEach(function (kv) { if (!kv) return; var a = kv.split('='); try { q[decodeURIComponent(a[0])] = decodeURIComponent((a[1] || '').replace(/\+/g, ' ')); } catch (e) { } });
    return { parts: path.split('/').filter(Boolean), q: q };
  }
  function href(base, q) {
    var qs = Object.keys(q).filter(function (k) { return q[k]; }).map(function (k) { return qsafe(k) + '=' + qsafe(q[k]); }).join('&');
    return base + (qs ? '?' + qs : '');
  }
  var curQ = {};

  // ---------- pieces
  function brandsIn(catId) {
    var ids = {};
    D().products.forEach(function (p) { if (!catId || p.cat === catId) ids[p.brand] = 1; });
    return D().brands.filter(function (b) { return ids[b.id]; });
  }

  function card(p) {
    var b = brandOf(p.brand), im = imgs(p)[0], on = Fav.has(p.id), sale = eff(p) < p.price;
    var badge = p.stock <= 0 ? '<span class="badge dark">' + t('outStock') + '</span>' : (sale ? '<span class="badge">-' + Math.round((1 - eff(p) / p.price) * 100) + '%</span>' : '');
    return '<article class="card"><a class="ph" href="#/p/' + esc(p.id) + '"><img src="' + esc(im) + '" alt="' + esc(p.name) + '" loading="lazy">' + badge + '</a>' +
      '<button class="fav' + (on ? ' on' : '') + '" data-act="fav" data-id="' + esc(p.id) + '" aria-label="' + t('favorites') + '" aria-pressed="' + on + '">' + ic('heart', 20, on) + '</button>' +
      '<div class="cb"><span class="bn">' + esc(b ? b.name : '') + '</span><a class="pn" href="#/p/' + esc(p.id) + '">' + esc(p.name) + '</a>' +
      '<div class="pr"><span class="pv">' + (sale ? '<s>' + money(p.price) + '</s> ' : '') + '<b>' + money(eff(p)) + '</b></span>' +
      '<button class="add" data-act="quick" data-id="' + esc(p.id) + '" aria-label="' + t('addCart') + '"' + (p.stock <= 0 ? ' disabled' : '') + '>' + ic('plus', 20) + '</button></div></div></article>';
  }
  function grid(list) {
    return list.length ? '<div class="grid">' + list.map(card).join('') + '</div>' : '<p class="empty">' + t('noResults') + '</p>';
  }
  function sortList(list, s) {
    var a = list.slice();
    if (s === 'low') a.sort(function (x, y) { return eff(x) - eff(y); });
    else if (s === 'high') a.sort(function (x, y) { return eff(y) - eff(x); });
    else a.sort(function (x, y) { return (y.created || 0) - (x.created || 0); });
    return a;
  }
  function matchQ(p, q) {
    q = q.toLowerCase();
    var b = brandOf(p.brand), c = catOf(p.cat);
    var hay = [p.name, p.desc, b && b.name, c && nm(c), c && c.names && (c.names.en + ' ' + c.names.fa + ' ' + c.names.de)].join(' ').toLowerCase();
    return hay.indexOf(q) > -1;
  }
  function toolbar(base, q, extraKey) {
    var s = q.s || '';
    return '<form class="tb" data-form="filter" data-base="' + esc(base) + '">' +
      (extraKey && q[extraKey] ? '<input type="hidden" name="' + extraKey + '" value="' + esc(q[extraKey]) + '">' : '') +
      '<input class="in" type="search" name="q" value="' + esc(q.q || '') + '" placeholder="' + t('searchPh') + '" aria-label="' + t('search') + '">' +
      '<select class="in" name="s" data-change="submitform" aria-label="Sort">' +
      '<option value=""' + (!s ? ' selected' : '') + '>' + t('sortNew') + '</option>' +
      '<option value="low"' + (s === 'low' ? ' selected' : '') + '>' + t('sortLow') + '</option>' +
      '<option value="high"' + (s === 'high' ? ' selected' : '') + '>' + t('sortHigh') + '</option></select></form>';
  }
  function crumbs(arr) {
    return '<nav class="crumbs" aria-label="Breadcrumb"><a href="#/">' + t('home') + '</a>' + arr.map(function (x) { return '<span>›</span>' + (x.h ? '<a href="' + x.h + '">' + esc(x.n) + '</a>' : '<span class="cur">' + esc(x.n) + '</span>'); }).join('') + '</nav>';
  }
  function pageHead(title, sub) {
    return '<div class="ph1"><h1>' + esc(title) + '</h1>' + (sub ? '<p class="mut">' + esc(sub) + '</p>' : '') + '</div>';
  }

  // ---------- views
  function vNF() { return '<div class="wrap pg"><p class="empty">' + t('notFound') + '</p><p class="c"><a class="btn" href="#/">' + t('home') + '</a></p></div>'; }

  function safeLink(l) { l = String(l || ''); return (l.indexOf('#/') === 0 || /^https:\/\//.test(l)) ? l : '#/'; }
  function safeImg(u) { u = String(u || ''); return (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(u) || /^https:\/\/[^\s"'()<>]+$/.test(u)) ? u : ''; }
  var slTimer = null;
  function vSlider() {
    var B = (D().banners || []).filter(function (b) { return b.on !== false; });
    if (!B.length) return '';
    var slides = B.map(function (b, i) {
      var im = safeImg(b.img);
      return '<div class="sld' + (i ? '' : ' on') + (im ? ' has' : '') + '"' + (im ? ' style="background-image:url(' + im + ')"' : '') + '>' + (im ? '' : '<span class="sle" aria-hidden="true">' + MS.emblem(220) + '</span>') +
        '<div class="slc"><h2>' + esc(ml(b.title)) + '</h2>' + (ml(b.text) ? '<p>' + esc(ml(b.text)) + '</p>' : '') + (ml(b.btn) ? '<a class="btn" href="' + esc(safeLink(b.link)) + '">' + esc(ml(b.btn)) + '</a>' : '') + '</div></div>';
    }).join('');
    var nav = B.length > 1 ? '<button type="button" class="slb prev" data-act="slide" data-d="-1" aria-label="Prev">' + ic('left', 22) + '</button><button type="button" class="slb next" data-act="slide" data-d="1" aria-label="Next">' + ic('right', 22) + '</button><div class="sldots">' + B.map(function (b, i) { return '<button type="button" class="' + (i ? '' : 'on') + '" data-act="slide" data-i="' + i + '" aria-label="' + (i + 1) + '"></button>'; }).join('') + '</div>' : '';
    return '<section class="wrap slw"><div class="sl" id="sl">' + slides + nav + '</div></section>';
  }
  function slideTo(i, user) {
    var sl = $('#sl'); if (!sl) return;
    var a = $$('.sld', sl), n = a.length; if (n < 2) return;
    i = (i % n + n) % n;
    a.forEach(function (e, k) { e.classList.toggle('on', k === i); });
    $$('.sldots button', sl).forEach(function (e, k) { e.classList.toggle('on', k === i); });
    sl.dataset.i = i;
    if (user) initSlider();
  }
  function initSlider() {
    clearInterval(slTimer); slTimer = null;
    var sl = $('#sl'); if (!sl || $$('.sld', sl).length < 2) return;
    slTimer = setInterval(function () { if (!document.getElementById('sl')) { clearInterval(slTimer); return; } slideTo((+sl.dataset.i || 0) + 1); }, 5500);
    if (sl.dataset.bound) return; sl.dataset.bound = 1;
    var x0 = null;
    sl.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    sl.addEventListener('touchend', function (e) {
      if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) slideTo((+sl.dataset.i || 0) + ((dx < 0) === (MS.lang !== 'fa') ? 1 : -1), true);
    }, { passive: true });
  }

  function newsletterBox() {
    return '<div class="nl"><div><b>' + t('nlTitle') + '</b><span class="mut">' + t('nlSub') + '</span></div>' +
      '<form data-form="newsletter" novalidate id="nlf"><div class="nlr"><input class="in" type="email" name="email" autocomplete="email" placeholder="' + esc(t('email')) + '"><button class="btn" type="submit">' + t('nlJoin') + '</button></div>' +
      '<label class="nlc"><input type="checkbox" name="consent"><span>' + t('nlConsent') + ' <a href="#/page/privacy" class="lnk">' + t('privacy') + '</a></span></label><p class="nlm" id="nlm" role="status"></p></form></div>';
  }
  function vHome() {
    var d = D(), s = d.settings;
    var ht = (ml(s.heroTitle) || '').split('|');
    var feat = d.products.filter(function (p) { return p.featured; }).slice(0, 8);
    var list = feat.length ? feat : d.products.slice(0, 8);
    var sales = d.products.filter(function (p) { return eff(p) < p.price; });
    var maxOff = sales.reduce(function (a, p) { return Math.max(a, Math.round((1 - eff(p) / p.price) * 100)); }, 0);
    var cats = d.categories.map(function (c) {
      return '<a class="ct" href="#/c/' + esc(c.id) + '"><span class="cc">' + catIcon(c, 56) + '</span><span class="cn">' + esc(nm(c)) + '</span></a>';
    }).join('');
    var brands = d.brands.map(function (b) {
      return '<a class="bt" href="#/b/' + esc(b.id) + '" style="--c:' + safeColor(b.color) + '"><span class="bm">' + esc(mono(b.name)) + '</span><b>' + esc(b.name) + '</b><small>' + esc(b.tagline || '') + '</small></a>';
    }).join('');
    return vSlider() + '<section class="hero wrap"><div class="hl"><span class="kick">' + t('newSeason') + '</span>' +
      '<h1>' + esc(ht[0] || '') + (ht[1] ? '<br><span class="gold">' + esc(ht[1]) + '</span>' : '') + '</h1>' +
      '<p class="lead">' + esc(ml(s.heroSub)) + '</p>' +
      '<div class="cta"><a class="btn" href="#/new">' + t('shopNow') + '</a>' + (sales.length ? '<a class="btn ghost" href="#/sale">' + t('viewSale') + '</a>' : '') + '</div></div>' +
      '<div class="hr" aria-hidden="true">' + MS.emblem(320) + '</div></section>' +
      '<section class="wrap sec"><h2>' + t('shopByCat') + '</h2><div class="cts">' + cats + '</div></section>' +
      '<section class="wrap sec"><h2>' + t('topBrands') + '</h2><div class="bts">' + brands + '</div></section>' +
      '<section class="wrap sec"><div class="sh"><h2>' + t('trending') + '</h2><a class="more" href="#/new">' + t('viewAll') + '</a></div>' + grid(list) + '</section>' +
      (sales.length ? '<section class="wrap sec"><div class="promo"><div><span class="kick">' + t('limited') + '</span><div class="big">' + t('upTo') + ' ' + maxOff + '% ' + t('off') + '</div><p class="mut">' + t('offerText') + '</p></div><a class="btn light" href="#/sale">' + t('seeOffers') + '</a></div></section>' : '') +
      '<section class="feat">' + [['fastShip', 'fastShipD'], ['easyRet', 'easyRetD'], ['securePay', 'securePayD'], ['support', 'supportD']].map(function (k) { return '<div><b>' + t(k[0]) + '</b><span>' + t(k[1]) + '</span></div>'; }).join('') + '</section>';
  }

  function vCat(id, q) {
    var c = catOf(id); if (!c) return vNF();
    var all = D().products.filter(function (p) { return p.cat === id; });
    var list = all.slice();
    if (q.b) list = list.filter(function (p) { return p.brand === q.b; });
    if (q.q) list = list.filter(function (p) { return matchQ(p, q.q); });
    list = sortList(list, q.s);
    var base = '#/c/' + id;
    var chips = '<div class="chips" role="list"><a role="listitem" class="chip' + (!q.b ? ' on' : '') + '" href="' + href(base, { s: q.s, q: q.q }) + '">' + t('all') + '</a>' +
      brandsIn(id).map(function (b) { return '<a role="listitem" class="chip' + (q.b === b.id ? ' on' : '') + '" href="' + href(base, { b: b.id, s: q.s, q: q.q }) + '">' + esc(b.name) + '</a>'; }).join('') + '</div>';
    return '<div class="wrap pg">' + crumbs([{ n: nm(c) }]) +
      '<div class="banner" style="--c:' + safeColor(c.color) + '"><span class="bic">' + catIcon(c, 88) + '</span><div><h1>' + esc(nm(c)) + '</h1><p class="mut">' + all.length + ' ' + t('products') + '</p></div></div>' +
      chips + toolbar(base, q, 'b') + grid(list) + '</div>';
  }

  function vBrand(id, q) {
    var b = brandOf(id); if (!b) return vNF();
    var all = D().products.filter(function (p) { return p.brand === id; });
    var list = all.slice();
    if (q.c) list = list.filter(function (p) { return p.cat === q.c; });
    if (q.q) list = list.filter(function (p) { return matchQ(p, q.q); });
    list = sortList(list, q.s);
    var cids = {}; all.forEach(function (p) { cids[p.cat] = 1; });
    var base = '#/b/' + id;
    var chips = '<div class="chips" role="list"><a role="listitem" class="chip' + (!q.c ? ' on' : '') + '" href="' + href(base, { s: q.s, q: q.q }) + '">' + t('all') + '</a>' +
      D().categories.filter(function (c) { return cids[c.id]; }).map(function (c) { return '<a role="listitem" class="chip' + (q.c === c.id ? ' on' : '') + '" href="' + href(base, { c: c.id, s: q.s, q: q.q }) + '">' + esc(nm(c)) + '</a>'; }).join('') + '</div>';
    return '<div class="wrap pg">' + crumbs([{ n: b.name }]) +
      '<div class="banner brand" style="--c:' + safeColor(b.color) + '"><span class="bm big">' + esc(mono(b.name)) + '</span><div><h1>' + esc(b.name) + '</h1><p class="mut">' + esc(b.tagline || '') + ' · ' + all.length + ' ' + t('products') + '</p></div></div>' +
      chips + toolbar(base, q, 'c') + grid(list) + '</div>';
  }

  function vList(title, list, q, base) {
    q = q || {};
    var l = list.slice();
    if (q.q) l = l.filter(function (p) { return matchQ(p, q.q); });
    l = sortList(l, q.s);
    return '<div class="wrap pg">' + crumbs([{ n: title }]) + pageHead(title) + (base ? toolbar(base, q) : '') + grid(l) + '</div>';
  }

  var sel = { size: null, color: null, qty: 1 };
  function vProduct(id) {
    var p = prodOf(id); if (!p) return vNF();
    sel = { size: p.sizes && p.sizes.length === 1 ? p.sizes[0] : null, color: p.colors && p.colors.length === 1 ? p.colors[0] : null, qty: 1 };
    var b = brandOf(p.brand), c = catOf(p.cat), im = imgs(p), on = Fav.has(p.id), sale = eff(p) < p.price;
    var stock = p.stock <= 0 ? '<span class="stk out">' + t('outStock') + '</span>' : (p.stock <= 5 ? '<span class="stk low">' + t('lowStock') + '</span>' : '<span class="stk">' + t('inStock') + '</span>');
    var thumbs = im.length > 1 ? '<div class="thumbs">' + im.map(function (s, i) { return '<button type="button" class="th' + (i === 0 ? ' on' : '') + '" data-act="thumb" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + esc(s) + '" alt=""></button>'; }).join('') + '</div>' : '';
    var sizes = (p.sizes && p.sizes.length) ? '<div class="opts"><b>' + t('size') + '</b><div>' + p.sizes.map(function (s) { return '<button type="button" class="opt' + (sel.size === s ? ' on' : '') + '" data-act="size" data-v="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div></div>' : '';
    var colors = (p.colors && p.colors.length) ? '<div class="opts"><b>' + t('color') + '</b><div>' + p.colors.map(function (s) { return '<button type="button" class="opt' + (sel.color === s ? ' on' : '') + '" data-act="color" data-v="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div></div>' : '';
    var sim = D().products.filter(function (x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);
    return '<div class="wrap pg">' + crumbs([c ? { n: nm(c), h: '#/c/' + c.id } : { n: '' }, { n: p.name }]) +
      '<div class="pp"><div class="gal"><div class="mainimg"><img id="mainimg" src="' + esc(im[0]) + '" alt="' + esc(p.name) + '"></div>' + thumbs + '</div>' +
      '<div class="inf">' + (b ? '<a class="bn" href="#/b/' + esc(b.id) + '">' + esc(b.name) + '</a>' : '') +
      '<h1>' + esc(p.name) + '</h1><div class="ppr">' + (sale ? '<s>' + money(p.price) + '</s> ' : '') + '<b>' + money(eff(p)) + '</b></div>' + stock +
      '<p class="desc">' + esc(p.desc || '') + '</p>' + sizes + colors +
      '<div class="opts"><b>' + t('qty') + '</b><div class="qty"><button type="button" data-act="pq" data-d="-1" aria-label="-">' + ic('minus', 18) + '</button><span id="pqv">1</span><button type="button" data-act="pq" data-d="1" aria-label="+">' + ic('plus', 18) + '</button></div></div>' +
      '<div class="buy"><button class="btn" data-act="addcart" data-id="' + esc(p.id) + '"' + (p.stock <= 0 ? ' disabled' : '') + '>' + t('addCart') + '</button>' +
      '<button class="ibtn big' + (on ? ' on' : '') + '" data-act="fav" data-id="' + esc(p.id) + '" aria-label="' + t('favorites') + '" aria-pressed="' + on + '">' + ic('heart', 22, on) + '</button></div></div></div>' +
      (sim.length ? '<section class="sec"><h2>' + t('similar') + '</h2>' + grid(sim) + '</section>' : '') + '</div>';
  }

  function vCart() {
    var T = totals();
    if (!T.L.length) return '<div class="wrap pg">' + pageHead(t('cart')) + '<p class="empty">' + t('cartEmpty') + '</p><p class="c"><a class="btn" href="#/">' + t('continue') + '</a></p></div>';
    var rows = Cart.items.map(function (it, k) {
      var p = prodOf(it.pid); if (!p) return '';
      return '<div class="cl"><a class="cim" href="#/p/' + esc(p.id) + '"><img src="' + esc(imgs(p)[0]) + '" alt=""></a><div class="ci"><a class="pn" href="#/p/' + esc(p.id) + '">' + esc(p.name) + '</a>' +
        '<small class="mut">' + [it.size ? t('size') + ': ' + esc(it.size) : '', it.color ? t('color') + ': ' + esc(it.color) : ''].filter(Boolean).join(' · ') + '</small>' +
        '<div class="qty"><button type="button" data-act="cq" data-k="' + k + '" data-d="-1" aria-label="-">' + ic('minus', 18) + '</button><span>' + it.qty + '</span><button type="button" data-act="cq" data-k="' + k + '" data-d="1" aria-label="+">' + ic('plus', 18) + '</button></div></div>' +
        '<div class="cp"><b>' + money(eff(p) * it.qty) + '</b><button type="button" class="lnk" data-act="cd" data-k="' + k + '">' + t('remove') + '</button></div></div>';
    }).join('');
    return '<div class="wrap pg">' + pageHead(t('cart')) + '<div class="two"><div class="cls">' + rows + '</div>' + summary(T, true) + '</div></div>';
  }
  function sumRows(T, items) {
    return (items ? T.L.map(function (l) { return '<div class="sr"><span>' + esc(l.p.name) + ' × ' + l.qty + '</span><b>' + money(eff(l.p) * l.qty) + '</b></div>'; }).join('') : '<div class="sr"><span>' + t('subtotal') + '</span><b>' + money(T.sub) + '</b></div>') +
      (T.disc ? '<div class="sr disc"><span>' + t('discount') + ' (' + esc(T.coupon.code) + ')</span><b>−' + money(T.disc) + '</b></div>' : '') +
      '<div class="sr"><span>' + t('shipping') + '</span><b>' + (T.ship ? money(T.ship) : t('free')) + '</b></div><div class="sr tot"><span>' + t('total') + '</span><b>' + money(T.total) + '</b></div>';
  }
  function couponBox(T) {
    var msg = T.coupon.ok ? '<small class="cok">✓ ' + t('couponOk') + ' <button type="button" class="lnk" data-act="clearcoupon">' + t('remove') + '</button></small>' : (T.coupon.err ? '<small class="cerr">' + t(T.coupon.err) + '</small>' : '');
    return '<div class="cpn"><input class="in" id="cpin" type="text" autocomplete="off" autocapitalize="characters" placeholder="' + esc(t('coupon')) + '" value="' + esc(Coupon.code || '') + '"><button type="button" class="btn ghost" data-act="applycoupon">' + t('couponApply') + '</button></div>' + msg;
  }
  function summary(T, btn) {
    return '<aside class="sum"><div id="sumrows">' + sumRows(T, false) + '</div><div id="cpbox">' + couponBox(T) + '</div>' + (btn ? '<a class="btn full" href="#/checkout">' + t('checkout') + '</a>' : '') + '</aside>';
  }
  function refreshSum(items) {
    var T = totals(), a = $('#sumrows'), b = $('#cpbox'), pb = $('#paybtn');
    if (a) a.innerHTML = sumRows(T, items); if (b) b.innerHTML = couponBox(T);
    if (pb) pb.textContent = t('payNow') + ' · ' + money(T.total);
    return T;
  }

  function field(name, label, type, extra, req) {
    return '<label class="fl"><span>' + t(label) + (req ? ' *' : '') + '</span><input class="in" name="' + name + '" type="' + (type || 'text') + '" ' + (extra || '') + (req ? ' required' : '') + '></label>';
  }
  function vCheckout() {
    var T = totals();
    if (!T.L.length) return vCart();
    return '<div class="wrap pg">' + pageHead(t('checkout')) + '<form class="two" data-form="checkout" novalidate><div class="cform">' +
      '<h3>' + t('contact') + '</h3><div class="fg">' + field('name', 'fullName', 'text', 'autocomplete="name"', 1) + field('email', 'email', 'email', 'autocomplete="email"', 1) + field('phone', 'phone', 'tel', 'autocomplete="tel"') + '</div>' +
      '<h3>' + t('address') + '</h3><div class="fg">' + field('address', 'address', 'text', 'autocomplete="street-address"', 1) + field('city', 'city', 'text', 'autocomplete="address-level2"', 1) + field('zip', 'zip', 'text', 'autocomplete="postal-code"', 1) + field('country', 'country', 'text', 'autocomplete="country-name" value="Deutschland"', 1) + '</div>' +
      '<h3>' + t('payment') + '</h3><div class="pm">' +
      '<label class="pmo"><input type="radio" name="pay" value="card" checked data-change="paym"><span>' + t('payCard') + '</span></label>' +
      '<label class="pmo"><input type="radio" name="pay" value="paypal" data-change="paym"><span>' + t('payPaypal') + '</span></label>' +
      '<label class="pmo"><input type="radio" name="pay" value="cod" data-change="paym"><span>' + t('payCod') + '</span></label></div>' +
      '<div id="cardbox" class="fg"><p class="hint">' + t('testHint') + '</p>' + field('card', 'cardNo', 'text', 'inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242" maxlength="23"') + field('exp', 'expiry', 'text', 'inputmode="numeric" autocomplete="off" placeholder="12/30" maxlength="7"') + field('cvc', 'cvc', 'text', 'inputmode="numeric" autocomplete="off" placeholder="123" maxlength="4"') + '</div>' +
      '<p class="err" id="cerr" role="alert"></p></div>' +
      '<aside class="sum"><div id="sumrows">' + sumRows(T, true) + '</div><div id="cpbox">' + couponBox(T) + '</div>' +
      '<button class="btn full" type="submit" id="paybtn">' + t('payNow') + ' · ' + money(T.total) + '</button></aside></form></div>';
  }

  function vOrder(id) {
    var o = D().orders.filter(function (x) { return x.id === id; })[0]; if (!o) return vNF();
    return '<div class="wrap pg c"><div class="ok">' + ic('check', 44) + '</div><h1>' + t('thanks') + '</h1><p>' + t('orderNo') + ': <b>' + esc(o.id) + '</b></p><p class="mut">' + t('testOrderNote') + '</p><p><a class="btn" href="#/">' + t('continue') + '</a></p></div>';
  }
  function vInfo(k) {
    var pages = D().settings.pages || {};
    if (!(k in pages)) return vNF();
    var title = { imprint: t('imprint'), privacy: t('privacy'), terms: t('terms'), shipping: t('shippingP'), returns: t('returnsP') }[k] || k;
    return '<div class="wrap pg">' + crumbs([{ n: title }]) + pageHead(title) + '<div class="txt">' + esc(pages[k]).replace(/\n/g, '<br>') + '</div></div>';
  }

  // ---------- shell
  function header() {
    var d = D(), s = d.settings;
    var nav = '<a class="nl" href="#/new">' + t('new') + '</a>' + d.categories.map(function (c) {
      var bs = brandsIn(c.id);
      return '<div class="nv"><a class="nl" href="#/c/' + esc(c.id) + '">' + esc(nm(c)) + '</a><div class="mega"><div class="mcol"><b>' + t('brandsIn') + '</b>' +
        (bs.map(function (b) { return '<a href="#/b/' + esc(b.id) + '?c=' + esc(c.id) + '">' + esc(b.name) + '</a>'; }).join('') || '<span class="mut">—</span>') +
        '</div><a class="mall" href="#/c/' + esc(c.id) + '">' + t('viewAll') + ' →</a></div></div>';
    }).join('') + '<a class="nl sale" href="#/sale">' + t('sale') + '</a>';
    $('#hdr').innerHTML = '<div class="ann" style="color:' + safeColor(s.annColor || '#0b0b0b') + '"><span class="annt">' + esc(ml(s.announce)) + '</span><i class="annf" aria-hidden="true"></i></div>' +
      '<div class="hbar wrap"><button class="ibtn onlym" data-act="menu" aria-label="' + t('menu') + '" aria-expanded="false" aria-controls="mm">' + ic('menu') + '</button>' +
      '<a class="logo" href="#/" aria-label="MORTI STYLE">' + MS.emblem(40) + MS.wordmark(20) + '</a>' +
      '<nav class="nav" aria-label="Main">' + nav + '</nav>' +
      '<div class="hact"><select class="lang" data-change="lang" aria-label="Language"><option value="fa"' + (MS.lang === 'fa' ? ' selected' : '') + '>فارسی</option><option value="de"' + (MS.lang === 'de' ? ' selected' : '') + '>Deutsch</option><option value="en"' + (MS.lang === 'en' ? ' selected' : '') + '>English</option></select>' +
      '<button class="ibtn" data-act="srch" aria-label="' + t('search') + '">' + ic('search') + '</button>' +
      '<a class="ibtn hidem" href="#/favs" aria-label="' + t('favorites') + '">' + ic('heart') + '<i class="bdg" data-favcount>' + Fav.list.length + '</i></a>' +
      '<a class="ibtn hidem" href="#/cart" aria-label="' + t('cart') + '">' + ic('bag') + '<i class="bdg" data-cartcount>' + Cart.count() + '</i></a></div></div>' +
      '<form class="sbar" id="sbar" data-form="search" hidden><div class="wrap"><input class="in" type="search" name="q" placeholder="' + t('searchPh') + '" aria-label="' + t('search') + '"></div></form>';
  }
  function menuPanel() {
    var d = D();
    $('#mm').innerHTML = '<div class="mmh"><span>' + t('menu') + '</span><button class="ibtn" data-act="menu" aria-label="Close">' + ic('close') + '</button></div><div class="mmb">' +
      '<a href="#/new">' + t('new') + '</a>' + d.categories.map(function (c) { return '<a href="#/c/' + esc(c.id) + '">' + esc(nm(c)) + '</a>'; }).join('') + '<a class="sale" href="#/sale">' + t('sale') + '</a>' +
      '<b class="mt">' + t('topBrands') + '</b>' + d.brands.map(function (b) { return '<a href="#/b/' + esc(b.id) + '">' + esc(b.name) + '</a>'; }).join('') +
      '<b class="mt">Language</b><div class="langs">' + [['fa', 'فارسی'], ['de', 'Deutsch'], ['en', 'English']].map(function (l) { return '<button type="button" data-act="setlang" data-v="' + l[0] + '"' + (MS.lang === l[0] ? ' class="on"' : '') + '>' + l[1] + '</button>'; }).join('') + '</div><a class="mut" href="#/admin" style="margin-top:18px;font-size:13px">' + t('admin') + '</a></div>';
  }
  function tabs() {
    var h = location.hash || '#/';
    var tab = function (l, icn, hr, act, extra) { return '<' + (act ? 'button data-act="' + act + '"' : 'a href="' + hr + '"') + ' class="tab' + (!act && (hr === '#/' ? (h === '#/' || h === '' || h === '#') : h.indexOf(hr) === 0) ? ' on' : '') + '" aria-label="' + l + '">' + ic(icn) + '<span>' + l + '</span>' + (extra || '') + '</' + (act ? 'button' : 'a') + '>'; };
    $('#tabs').innerHTML = tab(t('home'), 'home', '#/') + tab(t('categories'), 'grid', '', 'menu') + tab(t('favorites'), 'heart', '#/favs', '', '<i class="bdg" data-favcount>' + Fav.list.length + '</i>') + tab(t('cart'), 'bag', '#/cart', '', '<i class="bdg" data-cartcount>' + Cart.count() + '</i>');
  }
  function footer() {
    var d = D();
    $('#ftr').innerHTML = '<div class="wrap">' + newsletterBox() + '</div><div class="wrap fw"><div class="fb">' + MS.wordmark(20) + '<span class="mut">© ' + new Date().getFullYear() + ' MORTI///STYLE · ' + t('rights') + '</span></div>' +
      '<div class="fc"><b>' + t('shop') + '</b>' + d.categories.slice(0, 4).map(function (c) { return '<a href="#/c/' + esc(c.id) + '">' + esc(nm(c)) + '</a>'; }).join('') + '</div>' +
      '<div class="fc"><b>' + t('help') + '</b><a href="#/page/shipping">' + t('shippingP') + '</a><a href="#/page/returns">' + t('returnsP') + '</a><a href="#/cart">' + t('cart') + '</a></div>' +
      '<div class="fc"><b>' + t('legal') + '</b><a href="#/page/imprint">' + t('imprint') + '</a><a href="#/page/privacy">' + t('privacy') + '</a><a href="#/page/terms">' + t('terms') + '</a><a href="#/admin">' + t('admin') + '</a></div></div>';
  }
  function updateBadges() {
    $$('[data-cartcount]').forEach(function (e) { e.textContent = Cart.count(); });
    $$('[data-favcount]').forEach(function (e) { e.textContent = Fav.list.length; });
  }

  function closeMenu() { var m = $('#mm'); if (m) m.hidden = true; document.body.classList.remove('lock'); }

  function render() {
    var r = parse(), p = r.parts, html = '';
    curQ = r.q;
    var isAdmin = p[0] === 'admin';
    document.body.classList.toggle('is-admin', isAdmin);
    closeMenu();
    try {
      if (isAdmin) html = MS.admin.render(p, r.q);
      else {
        switch (p[0]) {
          case undefined: html = vHome(); break;
          case 'c': html = vCat(p[1], r.q); break;
          case 'b': html = vBrand(p[1], r.q); break;
          case 'p': html = vProduct(p[1]); break;
          case 'new': html = vList(t('new'), D().products, r.q, '#/new'); break;
          case 'sale': html = vList(t('sale'), D().products.filter(function (x) { return eff(x) < x.price; }), r.q, '#/sale'); break;
          case 'search': html = vList(t('search') + ': ' + (r.q.q || ''), D().products.filter(function (x) { return matchQ(x, r.q.q || ''); }), { s: r.q.s }, ''); break;
          case 'favs': html = '<div class="wrap pg">' + pageHead(t('favorites')) + grid(D().products.filter(function (x) { return Fav.has(x.id); })) + '</div>'; break;
          case 'cart': html = vCart(); break;
          case 'checkout': html = vCheckout(); break;
          case 'order': html = vOrder(p[1]); break;
          case 'page': html = vInfo(p[1]); break;
          default: html = vNF();
        }
      }
    } catch (e) { if (window.console) console.error(e); html = vNF(); }
    $('#app').innerHTML = html;
    header(); menuPanel(); tabs(); footer(); initSlider();
    document.documentElement.lang = MS.lang;
    document.documentElement.dir = MS.lang === 'fa' ? 'rtl' : 'ltr';
    window.scrollTo(0, 0);
  }
  MS.render = render;
  MS.setLang = function (l) { MS.lang = l; S.store('lang', l); render(); };

  // ---------- actions
  var acts = MS.acts = {};
  var forms = MS.forms = {};
  acts.slide = function (el) { var sl = $('#sl'); if (!sl) return; var cur = +sl.dataset.i || 0; slideTo(el.dataset.i != null ? +el.dataset.i : cur + (+el.dataset.d), true); };
  forms.newsletter = function (f) {
    var fd = new FormData(f), em = String(fd.get('email') || '').trim().toLowerCase(), m = $('#nlm');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em) || !fd.get('consent')) { if (m) { m.className = 'nlm bad'; m.textContent = t('nlNeed'); } return; }
    var done = function () {
      var c = (D().coupons || []).filter(function (x) { return x.code === 'WELCOME10' && x.on; })[0];
      if (m) { m.className = 'nlm ok'; m.textContent = t('nlThanks') + (c ? ' ' + t('coupon') + ': WELCOME10' : ''); }
      f.reset();
    };
    if (MS.cloud && MS.cloud.on) { MS.cloud.subscribe(em).then(done, function () { if (m) { m.className = 'nlm bad'; m.textContent = t('nlNeed'); } }); }
    else {
      var d = D(); d.subscribers = d.subscribers || [];
      if (!d.subscribers.some(function (x) { return x.email === em; })) d.subscribers.unshift({ email: em, created_at: new Date().toISOString() });
      S.save(); done();
    }
  };

  var changes = MS.changes = {};

  acts.fav = function (el) {
    Fav.toggle(el.dataset.id);
    var on = Fav.has(el.dataset.id);
    el.classList.toggle('on', on); el.setAttribute('aria-pressed', on);
    el.innerHTML = ic('heart', el.classList.contains('big') ? 22 : 20, on);
    updateBadges();
    if (parse().parts[0] === 'favs') render();
  };
  acts.quick = function (el) {
    var p = prodOf(el.dataset.id); if (!p) return;
    if ((p.sizes && p.sizes.length) || (p.colors && p.colors.length > 1)) { location.hash = '#/p/' + p.id; return; }
    addToCart(p, null, p.colors && p.colors[0] || null, 1);
  };
  function addToCart(p, size, color, qty) {
    if (p.stock <= 0) return;
    var it = Cart.items.filter(function (i) { return i.pid === p.id && (i.size || null) === (size || null) && (i.color || null) === (color || null); })[0];
    if (it) it.qty = Math.min(p.stock, it.qty + qty); else Cart.items.push({ pid: p.id, size: size, color: color, qty: Math.min(p.stock, qty) });
    Cart.save(); updateBadges(); toast(t('added'));
  }
  acts.thumb = function (el) {
    var p = prodOf(parse().parts[1]); if (!p) return;
    var im = imgs(p), i = Number(el.dataset.i);
    $('#mainimg').src = im[i];
    $$('.th').forEach(function (b) { b.classList.remove('on'); }); el.classList.add('on');
  };
  function pick(key) { return function (el) { sel[key] = el.dataset.v; $$('[data-act="' + (key === 'size' ? 'size' : 'color') + '"]').forEach(function (b) { b.classList.toggle('on', b === el); }); }; }
  acts.size = pick('size'); acts.color = pick('color');
  acts.pq = function (el) {
    var p = prodOf(parse().parts[1]); var max = p ? Math.max(1, p.stock) : 99;
    sel.qty = Math.max(1, Math.min(max, sel.qty + Number(el.dataset.d)));
    $('#pqv').textContent = sel.qty;
  };
  acts.addcart = function (el) {
    var p = prodOf(el.dataset.id); if (!p) return;
    if ((p.sizes && p.sizes.length && !sel.size) || (p.colors && p.colors.length && !sel.color)) { toast(t('chooseOpt'), true); return; }
    addToCart(p, sel.size, sel.color, sel.qty);
  };
  acts.cq = function (el) {
    var it = Cart.items[Number(el.dataset.k)]; if (!it) return;
    var p = prodOf(it.pid);
    it.qty = Math.max(1, Math.min(p ? Math.max(1, p.stock) : 99, it.qty + Number(el.dataset.d)));
    Cart.save(); render();
  };
  acts.applycoupon = function () {
    var i = $('#cpin'); if (!i) return;
    Coupon.code = String(i.value || '').trim().toUpperCase(); S.store('coupon', Coupon.code);
    var T = refreshSum(!!$('#paybtn'));
    if (Coupon.code && T.coupon.err) toast(t(T.coupon.err), true); else if (T.coupon.ok) toast(t('couponOk'));
  };
  acts.clearcoupon = function () { Coupon.code = ''; S.store('coupon', ''); refreshSum(!!$('#paybtn')); };
  acts.cd = function (el) { Cart.items.splice(Number(el.dataset.k), 1); Cart.save(); render(); };
  acts.menu = function () {
    var m = $('#mm'); m.hidden = !m.hidden; document.body.classList.toggle('lock', !m.hidden);
    $$('[data-act="menu"]').forEach(function (b) { b.setAttribute('aria-expanded', String(!m.hidden)); });
  };
  acts.setlang = function (el) { MS.setLang(el.dataset.v); };
  acts.srch = function () { var b = $('#sbar'); b.hidden = !b.hidden; if (!b.hidden) { var i = $('input', b); if (i) i.focus(); } };

  changes.lang = function (el) { MS.setLang(el.value); };
  changes.submitform = function (el) { var f = el.form; if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); };
  changes.paym = function (el) { var b = $('#cardbox'); if (b) b.hidden = el.value !== 'card'; };

  forms.search = function (f) { var q = (new FormData(f).get('q') || '').trim(); if (q) location.hash = '#/search?q=' + qsafe(q); };
  forms.filter = function (f) {
    var fd = new FormData(f), q = {};
    fd.forEach(function (v, k) { if (String(v).trim()) q[k] = String(v).trim(); });
    location.hash = href(f.dataset.base, q);
  };

  function luhn(n) { var s = 0, alt = false; for (var i = n.length - 1; i >= 0; i--) { var d = Number(n[i]); if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; } return s % 10 === 0; }
  forms.checkout = function (f) {
    var fd = {}; new FormData(f).forEach(function (v, k) { fd[k] = String(v).trim(); });
    var err = $('#cerr'); var fail = function (m) { err.textContent = t(m); toast(t(m), true); };
    err.textContent = '';
    if (!fd.name || !fd.email || !fd.address || !fd.city || !fd.zip || !fd.country || fd.email.indexOf('@') < 1) return fail('fillAll');
    var last4 = '';
    if (fd.pay === 'card') {
      var n = (fd.card || '').replace(/\D/g, ''), ex = /^(\d{1,2})\s*\/\s*(\d{2})$/.exec(fd.exp || ''), cv = /^\d{3,4}$/.test(fd.cvc || '');
      if (n.length < 13 || n.length > 19 || !luhn(n) || !ex || !cv || +ex[1] < 1 || +ex[1] > 12) return fail('badCard');
      if (new Date(2000 + (+ex[2]), +ex[1], 0, 23, 59) < new Date()) return fail('badCard');
      if (n === '4000000000000002') return fail('declined');
      last4 = n.slice(-4);
    }
    var T = totals(); if (!T.L.length) return;
    var btn = $('#paybtn'); btn.disabled = true; btn.textContent = t('processing');
    setTimeout(function () {
      var o = {
        id: 'MS-' + Date.now().toString(36).toUpperCase(), date: Date.now(), status: fd.pay === 'cod' ? 'pending' : 'paid',
        pay: fd.pay + (last4 ? ' ****' + last4 : ''), sub: T.sub, discount: T.disc || 0, coupon: T.disc ? T.coupon.code : '', ship: T.ship, total: T.total, currency: D().settings.currency,
        customer: { name: fd.name, email: fd.email, phone: fd.phone || '', address: fd.address, city: fd.city, zip: fd.zip, country: fd.country },
        items: T.L.map(function (l) { return { id: l.p.id, name: l.p.name, price: eff(l.p), qty: l.qty, size: l.size || '', color: l.color || '' }; })
      };
      T.L.forEach(function (l) { l.p.stock = Math.max(0, l.p.stock - l.qty); });
      D().orders.unshift(o); S.save(); if (MS.cloud && MS.cloud.on) MS.cloud.order(o);
      Cart.items = []; Cart.save(); Coupon.code = ''; S.store('coupon', '');
      location.hash = '#/order/' + o.id;
    }, 1100);
  };

  // ---------- global events
  MS.bind = function () {
    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!el) return;
      var a = acts[el.dataset.act];
      if (a) { if (el.tagName === 'BUTTON' && el.type !== 'submit') e.preventDefault(); a(el, e); }
    });
    document.addEventListener('submit', function (e) {
      var f = e.target.closest ? e.target.closest('[data-form]') : null;
      if (!f) return;
      e.preventDefault();
      var h = forms[f.dataset.form]; if (h) h(f, e);
    });
    document.addEventListener('change', function (e) {
      var el = e.target.closest ? e.target.closest('[data-change]') : null;
      if (!el) return;
      var h = changes[el.dataset.change]; if (h) h(el, e);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); if (e.key === 'Enter' && e.target && e.target.id === 'cpin') { e.preventDefault(); acts.applycoupon(); } });
    window.addEventListener('hashchange', render);
  };
})(window.MS);
