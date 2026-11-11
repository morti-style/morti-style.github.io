(function (MS) {
  'use strict';
  var t = function (k) { return MS.t(k); };
  var esc = MS.esc, S = MS.Store, H = MS.h, ic = MS.ic;
  var D = function () { return S.data; };
  var $ = function (s, r) { return (r || document).querySelector(s); };

  var authMem = false;
  function authed() { if (MS.cloud && MS.cloud.on) return MS.cloud.isAdmin(); try { return localStorage.getItem('ms_admin') === '1'; } catch (e) { return authMem; } }
  function setAuth(v) { authMem = v; try { if (v) localStorage.setItem('ms_admin', '1'); else localStorage.removeItem('ms_admin'); } catch (e) { } }

  var draft = { id: '', images: [] };
  var STATUS = ['pending', 'paid', 'shipped', 'done', 'cancelled'];
  var SKEY = { pending: 'a_pending', paid: 'a_paid', shipped: 'a_shipped', done: 'a_done', cancelled: 'a_cancelled' };

  function saved(ok) { if (ok === false) MS.toast(t('a_storageFull'), true); else MS.toast(t('a_saved')); }
  function lbl(label, inner, cls) { return '<label class="fl ' + (cls || '') + '"><span>' + t(label) + '</span>' + inner + '</label>'; }
  function inp(name, label, val, extra, type) { return lbl(label, '<input class="in" name="' + name + '" type="' + (type || 'text') + '" value="' + esc(val == null ? '' : val) + '" ' + (extra || '') + '>'); }

  // ---------- login + layout
  function loginView() {
    return '<div class="login"><div class="lc"><div class="lw">' + MS.wordmark(30) + '</div>' + MS.emblem(84) + '<h1>' + t('a_login') + '</h1>' +
      '<form data-form="alogin">' + ((MS.cloud && MS.cloud.on) ? lbl('E-Mail', '<input class="in" type="email" name="email" autocomplete="username" autofocus>').replace('<span>E-Mail</span>','<span>E-Mail</span>') : '') + lbl('a_password', '<input class="in" type="password" name="pw" autocomplete="current-password" autofocus>') +
      '<p class="err" id="lerr" role="alert"></p><button class="btn full" type="submit">' + t('a_signin') + '</button></form>' +
      (D().settings.pwDefault && !(MS.cloud && MS.cloud.on) ? '<p class="hint">' + t('a_demoPw') + '</p>' : '') + '<p><a class="lnk" href="#/">' + t('a_toShop') + '</a></p></div></div>';
  }
  function layout(sec, body) {
    var nav = [['dash', 'a_dash'], ['products', 'a_products'], ['cats', 'a_cats'], ['brands', 'a_brands'], ['orders', 'a_orders'], ['banners', 'a_banners'], ['coupons', 'a_coupons'], ['subs', 'a_subs'], ['settings', 'a_settings']].map(function (x) {
      return '<a class="an' + (sec === x[0] ? ' on' : '') + '" href="#/admin/' + x[0] + '">' + t(x[1]) + '</a>';
    }).join('');
    return '<div class="adm"><aside class="as"><div class="al">' + MS.emblem(34) + '<b>ADMIN</b></div><nav>' + nav + '</nav>' +
      '<div class="ab"><a class="an" href="#/">← ' + t('a_toShop') + '</a><button class="an" data-act="alogout">' + t('a_logout') + '</button></div></aside>' +
      '<section class="am">' + body + ((MS.cloud && MS.cloud.on) ? '<p class="mut note" id="cstat">' + t(MS.cloud.state === 'ok' ? 'a_cloudSaved' : MS.cloud.state === 'err' ? 'a_cloudErr' : 'a_cloudOk') + '</p>' : '<p class="mut note">' + t('a_localNote') + '</p>') + '</section></div>';
  }

  // ---------- views
  function vDash() {
    var d = D(), O = d.orders.filter(function (o) { return o.status !== 'cancelled'; });
    var rev = O.reduce(function (a, o) { return a + o.total; }, 0);
    var low = d.products.filter(function (p) { return p.stock <= 5; });
    var rec = d.orders.slice(0, 5).map(orderRow).join('') || '<p class="mut">' + t('a_noOrders') + '</p>';
    return '<h1>' + t('a_dash') + '</h1><div class="stats">' +
      '<div class="st"><span>' + t('a_products') + '</span><b>' + d.products.length + '</b></div>' +
      '<div class="st"><span>' + t('a_orders') + '</span><b>' + d.orders.length + '</b></div>' +
      '<div class="st"><span>' + t('a_revenue') + '</span><b>' + H.money(rev) + '</b></div>' +
      '<div class="st"><span>' + t('a_lowStock') + '</span><b>' + low.length + '</b></div></div>' +
      (low.length ? '<h3>' + t('a_lowStock') + '</h3><div class="alist">' + low.map(function (p) { return '<a class="arow" href="#/admin/products/' + esc(p.id) + '"><span>' + esc(p.name) + '</span><b>' + p.stock + '</b></a>'; }).join('') + '</div>' : '') +
      '<h3>' + t('a_recent') + '</h3>' + rec;
  }

  function vProducts() {
    var d = D();
    var rows = d.products.map(function (p) {
      var c = H.catOf(p.cat), b = H.brandOf(p.brand);
      return '<div class="arow p"><img src="' + esc(H.imgs(p)[0]) + '" alt=""><div class="ai"><b>' + esc(p.name) + '</b><small class="mut">' + esc((c ? H.nm(c) : '') + ' · ' + (b ? b.name : '')) + '</small></div>' +
        '<span class="ap">' + H.money(H.eff(p)) + '</span><span class="as2' + (p.stock <= 5 ? ' low' : '') + '">' + t('a_stock') + ': ' + p.stock + '</span>' +
        '<div class="aa"><a class="sbtn" href="#/admin/products/' + esc(p.id) + '">' + ic('edit', 16) + ' ' + t('a_edit') + '</a><button class="sbtn danger" data-act="adel" data-kind="product" data-id="' + esc(p.id) + '">' + ic('trash', 16) + ' ' + t('a_delete') + '</button></div></div>';
    }).join('');
    return '<div class="ah"><h1>' + t('a_products') + '</h1><a class="btn" href="#/admin/products/new">' + ic('plus', 18) + ' ' + t('a_add') + '</a></div><div class="alist">' + (rows || '<p class="mut">' + t('a_noItems') + '</p>') + '</div>';
  }

  function imgGrid() {
    if (!draft.images.length) return '<p class="mut">' + t('a_noPhotos') + '</p>';
    return draft.images.map(function (src, i) {
      return '<div class="it' + (i === 0 ? ' main' : '') + '"><img src="' + esc(src) + '" alt="">' + (i === 0 ? '<span class="tag">' + t('a_main') + '</span>' : '') +
        '<div class="ib"><button type="button" data-act="imgl" data-i="' + i + '" aria-label="Move earlier">' + ic('left', 16) + '</button><button type="button" data-act="imgr" data-i="' + i + '" aria-label="Move later">' + ic('right', 16) + '</button>' +
        (i > 0 ? '<button type="button" data-act="imgm" data-i="' + i + '" aria-label="' + t('a_makeMain') + '" title="' + t('a_makeMain') + '">' + ic('check', 16) + '</button>' : '') +
        '<button type="button" class="danger" data-act="imgd" data-i="' + i + '" aria-label="' + t('a_delete') + '">' + ic('trash', 16) + '</button></div></div>';
    }).join('');
  }

  function vProductForm(id) {
    var d = D(), p = id === 'new' ? null : H.prodOf(id);
    if (id !== 'new' && !p) return '<p class="empty">' + t('notFound') + '</p>';
    var isNew = !p;
    p = p || { id: '', name: '', price: '', sale: '', cat: d.categories[0] && d.categories[0].id, brand: d.brands[0] && d.brands[0].id, desc: '', sizes: [], colors: [], stock: 10, featured: false, images: [] };
    draft = { id: p.id, images: p.images.slice() };
    var catOpts = d.categories.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === p.cat ? ' selected' : '') + '>' + esc(H.nm(c)) + '</option>'; }).join('');
    var brOpts = d.brands.map(function (b) { return '<option value="' + esc(b.id) + '"' + (b.id === p.brand ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('');
    return '<div class="ah"><h1>' + (isNew ? t('a_newProduct') : esc(p.name)) + '</h1><a class="lnk" href="#/admin/products">← ' + t('a_products') + '</a></div>' +
      '<form class="af" data-form="saveProduct" data-id="' + esc(p.id) + '" novalidate>' +
      '<div class="box"><h3>' + t('a_photos') + '</h3><div class="imgs" id="imgs">' + imgGrid() + '</div>' +
      '<div class="pick"><button type="button" class="btn ghost" data-act="pickcam">' + ic('camera', 20) + ' ' + t('a_camera') + '</button><button type="button" class="btn ghost" data-act="pickgal">' + ic('image', 20) + ' ' + t('a_gallery') + '</button></div>' +
      '<input type="file" id="fcam" accept="image/*" capture="environment" hidden data-change="addimg"><input type="file" id="fgal" accept="image/*" multiple hidden data-change="addimg"></div>' +
      '<div class="box fg">' + inp('name', 'a_name', p.name, 'required') + inp('price', 'a_price', p.price, 'inputmode="decimal"') + inp('sale', 'a_salePrice', p.sale || '', 'inputmode="decimal"') + inp('stock', 'a_stock', p.stock, 'inputmode="numeric"') +
      lbl('a_category', '<select class="in" name="cat">' + catOpts + '</select>') + lbl('a_brand', '<select class="in" name="brand">' + brOpts + '</select>') +
      inp('sizes', 'a_sizes', (p.sizes || []).join(', ')) + inp('colors', 'a_colors', (p.colors || []).join(', ')) +
      lbl('a_desc', '<textarea class="in" name="desc" rows="4">' + esc(p.desc || '') + '</textarea>', 'wide') +
      '<label class="chk wide"><input type="checkbox" name="featured"' + (p.featured ? ' checked' : '') + '><span>' + t('a_featured') + '</span></label></div>' +
      '<p class="err" id="aerr" role="alert"></p><div class="pick"><button class="btn" type="submit">' + t('a_save') + '</button><a class="btn ghost" href="#/admin/products">' + t('a_cancel') + '</a></div></form>';
  }

  function catForm(c) {
    var isNew = !c;
    c = c || { id: '', icon: 'clothing', names: { en: '', fa: '', de: '' }, color: '#d4af37' };
    var icons = MS.iconKeys.map(function (k) { return '<option value="' + k + '"' + (k === c.icon ? ' selected' : '') + '>' + k + '</option>'; }).join('');
    return '<form class="af fg" data-form="saveCat" data-id="' + esc(c.id) + '" novalidate>' + inp('n_en', 'a_nameEn', c.names.en) + inp('n_fa', 'a_nameFa', c.names.fa) + inp('n_de', 'a_nameDe', c.names.de) +
      lbl('a_icon', '<select class="in" name="icon">' + icons + '</select>') + inp('color', 'a_color', H.safeColor(c.color), '', 'color') +
      '<div class="pick wide"><button class="btn" type="submit">' + t('a_save') + '</button>' +
      (isNew ? '' : '<button type="button" class="btn ghost danger" data-act="adel" data-kind="cat" data-id="' + esc(c.id) + '">' + t('a_delete') + '</button>') + '</div></form>';
  }
  function vCats() {
    var rows = D().categories.map(function (c) {
      return '<details class="dt"><summary><span class="ic">' + MS.catIcon(c, 28) + '</span><b>' + esc(H.nm(c)) + '</b></summary>' + catForm(c) + '</details>';
    }).join('');
    return '<h1>' + t('a_cats') + '</h1><details class="dt add"><summary>' + ic('plus', 18) + ' ' + t('a_newCat') + '</summary>' + catForm(null) + '</details>' + rows;
  }

  function brandForm(b) {
    var isNew = !b;
    b = b || { id: '', name: '', tagline: '', color: '#d4af37' };
    return '<form class="af fg" data-form="saveBrand" data-id="' + esc(b.id) + '" novalidate>' + inp('name', 'a_name', b.name) + inp('tagline', 'a_tagline', b.tagline) + inp('color', 'a_color', H.safeColor(b.color), '', 'color') +
      '<div class="pick wide"><button class="btn" type="submit">' + t('a_save') + '</button>' +
      (isNew ? '' : '<button type="button" class="btn ghost danger" data-act="adel" data-kind="brand" data-id="' + esc(b.id) + '">' + t('a_delete') + '</button>') + '</div></form>';
  }
  function vBrands() {
    var rows = D().brands.map(function (b) {
      return '<details class="dt"><summary><span class="bm sm" style="--c:' + H.safeColor(b.color) + '">' + esc(H.mono(b.name)) + '</span><b>' + esc(b.name) + '</b></summary>' + brandForm(b) + '</details>';
    }).join('');
    return '<h1>' + t('a_brands') + '</h1><details class="dt add"><summary>' + ic('plus', 18) + ' ' + t('a_newBrand') + '</summary>' + brandForm(null) + '</details>' + rows;
  }


  // ---------- banners / coupons / newsletter
  var bdraft = { img: '' };
  function rin(name, text, val, extra, type) { return '<label class="fl"><span>' + esc(text) + '</span><input class="in" name="' + name + '" type="' + (type || 'text') + '" value="' + esc(val == null ? '' : val) + '" ' + (extra || '') + '></label>'; }
  function bannerForm(b) {
    var isNew = !b;
    b = b || { id: '', on: true, img: '', title: {}, text: {}, btn: {}, link: '#/new' };
    var im = isNew ? bdraft.img : b.img, L = ['en', 'fa', 'de'], f = '';
    L.forEach(function (l) { f += rin('title_' + l, t('a_title') + ' (' + l.toUpperCase() + ')', (b.title || {})[l]); });
    L.forEach(function (l) { f += rin('text_' + l, t('a_text') + ' (' + l.toUpperCase() + ')', (b.text || {})[l]); });
    L.forEach(function (l) { f += rin('btn_' + l, t('a_btn') + ' (' + l.toUpperCase() + ')', (b.btn || {})[l]); });
    var sid = isNew ? 'new' : b.id;
    return '<form class="af fg" data-form="saveBanner" data-id="' + esc(b.id) + '" novalidate>' +
      '<div class="wide"><span class="mut">' + t('a_bannerImg') + '</span><div class="bthumb" id="bth-' + esc(sid) + '"' + (im && /^(data:image|https:)/.test(im) ? ' style="background-image:url(' + esc(im) + ')"' : '') + '></div>' +
      '<div class="pick"><button type="button" class="btn ghost" data-act="pickbimg" data-id="' + esc(sid) + '">' + ic('image', 18) + ' ' + t('a_gallery') + '</button><button type="button" class="btn ghost" data-act="rmbimg" data-id="' + esc(sid) + '">' + t('a_removeImg') + '</button></div>' +
      '<input type="file" accept="image/*" hidden id="bf-' + esc(sid) + '" data-change="bannerimg" data-id="' + esc(sid) + '"></div>' + f +
      rin('link', t('a_link'), b.link, 'dir="ltr"') + '<label class="fl chk"><input type="checkbox" name="on"' + (b.on !== false ? ' checked' : '') + '><span>' + t('a_active') + '</span></label>' +
      '<div class="pick wide"><button class="btn" type="submit">' + t('a_save') + '</button>' +
      (isNew ? '' : '<button type="button" class="btn ghost" data-act="bmove" data-id="' + esc(b.id) + '" data-d="-1">↑</button><button type="button" class="btn ghost" data-act="bmove" data-id="' + esc(b.id) + '" data-d="1">↓</button><button type="button" class="btn ghost danger" data-act="adel" data-kind="banner" data-id="' + esc(b.id) + '">' + t('a_delete') + '</button>') + '</div></form>';
  }
  function vBanners() {
    var rows = (D().banners || []).map(function (b) {
      return '<details class="dt"><summary><b>' + esc(H.ml(b.title) || '—') + '</b>' + (b.on === false ? ' <span class="mut">(off)</span>' : '') + '</summary>' + bannerForm(b) + '</details>';
    }).join('');
    return '<h1>' + t('a_banners') + '</h1><details class="dt add"><summary>' + ic('plus', 18) + ' ' + t('a_newBanner') + '</summary>' + bannerForm(null) + '</details>' + (rows || '<p class="mut">' + t('a_noItems') + '</p>');
  }
  function couponForm(c) {
    var isNew = !c; c = c || { code: '', type: 'pct', value: 10, min: 0, expires: '', on: true };
    return '<form class="af fg" data-form="saveCoupon" data-id="' + esc(c.code) + '" novalidate>' + inp('code', 'a_code', c.code, 'autocapitalize="characters" dir="ltr"') +
      lbl('a_type', '<select class="in" name="type"><option value="pct"' + (c.type !== 'fix' ? ' selected' : '') + '>' + t('a_pct') + '</option><option value="fix"' + (c.type === 'fix' ? ' selected' : '') + '>' + t('a_fix') + '</option></select>') +
      inp('value', 'a_value', c.value, 'inputmode="decimal"') + inp('min', 'a_min', c.min || 0, 'inputmode="decimal"') + inp('expires', 'a_expires', c.expires || '', '', 'date') +
      '<label class="fl chk"><input type="checkbox" name="on"' + (c.on !== false ? ' checked' : '') + '><span>' + t('a_active') + '</span></label>' +
      '<div class="pick wide"><button class="btn" type="submit">' + t('a_save') + '</button>' + (isNew ? '' : '<button type="button" class="btn ghost danger" data-act="adel" data-kind="coupon" data-id="' + esc(c.code) + '">' + t('a_delete') + '</button>') + '</div></form>';
  }
  function vCoupons() {
    var rows = (D().coupons || []).map(function (c) {
      return '<details class="dt"><summary><b>' + esc(c.code) + '</b> <span class="mut">' + (c.type === 'fix' ? H.money(c.value) : H.num(c.value) + '%') + (c.on === false ? ' (off)' : '') + '</span></summary>' + couponForm(c) + '</details>';
    }).join('');
    return '<h1>' + t('a_coupons') + '</h1><details class="dt add"><summary>' + ic('plus', 18) + ' ' + t('a_newCoupon') + '</summary>' + couponForm(null) + '</details>' + (rows || '<p class="mut">' + t('a_noItems') + '</p>');
  }
  function vSubs() {
    var L = D().subscribers || [];
    return '<h1>' + t('a_subs') + ' (' + L.length + ')</h1><div class="pick"><button class="btn ghost" data-act="subcsv">' + t('a_csv') + '</button></div><div class="subl">' +
      (L.map(function (x) { return '<div><span>' + esc(x.email) + '</span><span class="mut">' + esc(String(x.created_at || '').slice(0, 10)) + '</span></div>'; }).join('') || '<p class="mut">' + t('a_noSubs') + '</p>') + '</div>';
  }

  function orderRow(o) {
    var c = o.customer || {};
    var opts = STATUS.map(function (s) { return '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + t(SKEY[s]) + '</option>'; }).join('');
    return '<details class="dt ord"><summary><b>' + esc(o.id) + '</b><span class="mut">' + new Date(o.date).toLocaleString(MS.lang === 'fa' ? 'fa-IR' : MS.lang) + '</span><span class="pill ' + esc(o.status) + '">' + t(SKEY[o.status] || 'a_pending') + '</span><b>' + (o.currency || '') + H.num(o.total) + '</b></summary>' +
      '<div class="ob"><div><h4>' + t('a_customer') + '</h4><p>' + esc(c.name) + '<br>' + esc(c.email) + (c.phone ? '<br>' + esc(c.phone) : '') + '<br>' + esc(c.address) + ', ' + esc(c.zip) + ' ' + esc(c.city) + ', ' + esc(c.country) + '</p><p class="mut">' + t('payment') + ': ' + esc(o.pay) + '</p></div>' +
      '<div><h4>' + t('a_items') + '</h4>' + o.items.map(function (i) { return '<div class="sr"><span>' + esc(i.name) + ' × ' + i.qty + (i.size ? ' · ' + esc(i.size) : '') + (i.color ? ' · ' + esc(i.color) : '') + '</span><b>' + (o.currency || '') + H.num(i.price * i.qty) + '</b></div>'; }).join('') + '</div>' +
      lbl('a_status', '<select class="in" data-change="ostatus" data-id="' + esc(o.id) + '">' + opts + '</select>') + '</div></details>';
  }
  function vOrders() { return '<h1>' + t('a_orders') + '</h1>' + (D().orders.map(orderRow).join('') || '<p class="mut">' + t('a_noOrders') + '</p>'); }

  function ml3(name, label, o) {
    return '<fieldset class="box"><legend>' + t(label) + '</legend>' + ['en', 'fa', 'de'].map(function (l) { return '<label class="fl"><span>' + l.toUpperCase() + '</span><input class="in" name="' + name + '_' + l + '" value="' + esc((o || {})[l] || '') + '"></label>'; }).join('') + '</fieldset>';
  }
  function vSettings() {
    var s = D().settings, pg = s.pages || {};
    return '<h1>' + t('a_settings') + '</h1><form class="af" data-form="saveSettings" novalidate>' +
      '<div class="box fg">' + inp('currency', 'a_currency', s.currency) + inp('shipFee', 'a_shipFee', s.shipFee, 'inputmode="decimal"') + inp('freeFrom', 'a_freeFrom', s.freeFrom, 'inputmode="decimal"') + inp('pw', 'a_newPw', '', 'autocomplete="new-password"', 'password') + '</div>' +
      ml3('announce', 'a_announce', s.announce) +
      '<div class="box"><label class="fl"><span>' + t('a_annColor') + '</span><input class="in" type="color" name="annColor" id="annc" value="' + H.safeColor(s.annColor || '#0b0b0b') + '"></label><div class="pick">' + ['#0b0b0b', '#ffffff', '#7a0019', '#0a2a6b', '#4a2a00'].map(function (c) { return '<button type="button" class="btn ghost" data-act="annsw" data-c="' + c + '" style="background:' + c + ';min-width:44px;min-height:44px;padding:0" aria-label="' + c + '"></button>'; }).join('') + '</div>' +
      lbl('a_annSpeed', '<select class="in" name="annSpeed">' + [['off', 'a_spOff'], ['slow', 'a_spSlow'], ['normal', 'a_spNormal'], ['fast', 'a_spFast']].map(function (o) { return '<option value="' + o[0] + '"' + ((s.annSpeed || 'normal') === o[0] ? ' selected' : '') + '>' + t(o[1]) + '</option>'; }).join('') + '</select>') +
      '<label class="fl chk"><input type="checkbox" name="annShake"' + (s.annShake !== false ? ' checked' : '') + '><span>' + t('a_annShake') + '</span></label></div>' + ml3('heroTitle', 'a_hero', s.heroTitle) + ml3('heroSub', 'a_heroSub', s.heroSub) +
      '<fieldset class="box"><legend>' + t('a_pages') + '</legend>' + ['about', 'imprint', 'privacy', 'terms', 'shipping', 'returns'].map(function (k) { return '<label class="fl"><span>' + k + '</span><textarea class="in" name="pg_' + k + '" rows="' + (k === 'about' ? 6 : 3) + '">' + esc(pg[k] || '') + '</textarea></label>'; }).join('') + '</fieldset>' +
      '<div class="pick"><button class="btn" type="submit">' + t('a_save') + '</button></div></form>' +
      '<div class="box"><h3>' + t('a_backup') + '</h3><div class="pick"><button class="btn ghost" data-act="aexport">' + t('a_export') + '</button><button class="btn ghost" data-act="aimport">' + t('a_import') + '</button><button class="btn ghost danger" data-act="areset">' + t('a_reset') + '</button></div>' +
      '<input type="file" id="fimp" accept="application/json,.json" hidden data-change="importfile"></div>';
  }

  MS.admin = {
    render: function (parts) {
      if (!authed()) return loginView();
      var sec = parts[1] || 'dash', body;
      switch (sec) {
        case 'dash': body = vDash(); break;
        case 'products': body = parts[2] ? vProductForm(parts[2]) : vProducts(); break;
        case 'cats': body = vCats(); break;
        case 'brands': body = vBrands(); break;
        case 'orders': body = vOrders(); break;
        case 'banners': body = vBanners(); break;
        case 'coupons': body = vCoupons(); break;
        case 'subs': body = vSubs(); break;
        case 'settings': body = vSettings(); break;
        default: body = '<p class="empty">' + t('notFound') + '</p>';
      }
      return layout(sec, body);
    }
  };

  // ---------- actions
  var acts = MS.acts, forms = MS.forms, changes = MS.changes;
  var armed = {};
  function refreshImgs() { var g = $('#imgs'); if (g) g.innerHTML = imgGrid(); }

  acts.alogout = function () { if (MS.cloud && MS.cloud.on) MS.cloud.logout(); setAuth(false); location.hash = '#/'; MS.render(); };
  acts.pickcam = function () { var i = $('#fcam'); if (i) i.click(); };
  acts.pickgal = function () { var i = $('#fgal'); if (i) i.click(); };
  acts.imgl = function (el) { var i = +el.dataset.i; if (i > 0) { var a = draft.images; var x = a[i]; a[i] = a[i - 1]; a[i - 1] = x; refreshImgs(); } };
  acts.imgr = function (el) { var i = +el.dataset.i, a = draft.images; if (i < a.length - 1) { var x = a[i]; a[i] = a[i + 1]; a[i + 1] = x; refreshImgs(); } };
  acts.imgm = function (el) { var i = +el.dataset.i, a = draft.images; var x = a.splice(i, 1)[0]; a.unshift(x); refreshImgs(); };
  acts.imgd = function (el) { draft.images.splice(+el.dataset.i, 1); refreshImgs(); };

  acts.adel = function (el) {
    var key = el.dataset.kind + ':' + el.dataset.id;
    if (!armed[key]) {
      armed[key] = 1; el.dataset.orig = el.innerHTML; el.textContent = t('a_sure'); el.classList.add('armed');
      setTimeout(function () { delete armed[key]; if (el.isConnected) { el.innerHTML = el.dataset.orig; el.classList.remove('armed'); } }, 3000);
      return;
    }
    delete armed[key];
    var d = D(), id = el.dataset.id;
    if (el.dataset.kind === 'product') d.products = d.products.filter(function (p) { return p.id !== id; });
    else if (el.dataset.kind === 'cat') {
      if (d.products.some(function (p) { return p.cat === id; })) return MS.toast(t('a_catInUse'), true);
      d.categories = d.categories.filter(function (c) { return c.id !== id; });
    } else if (el.dataset.kind === 'banner') { d.banners = (d.banners || []).filter(function (b) { return b.id !== id; });
    } else if (el.dataset.kind === 'coupon') { d.coupons = (d.coupons || []).filter(function (c) { return c.code !== id; });
    } else if (el.dataset.kind === 'brand') {
      if (d.products.some(function (p) { return p.brand === id; })) return MS.toast(t('a_catInUse'), true);
      d.brands = d.brands.filter(function (b) { return b.id !== id; });
    }
    S.save(); MS.toast(t('a_deleted')); MS.render();
  };

  acts.aexport = function () {
    var blob = new Blob([JSON.stringify(D())], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'morti-style-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };
  acts.aimport = function () { var i = $('#fimp'); if (i) i.click(); };
  acts.areset = function (el) {
    if (!armed.reset) { armed.reset = 1; el.dataset.orig = el.textContent; el.textContent = t('a_sure'); el.classList.add('armed'); setTimeout(function () { armed.reset = 0; if (el.isConnected) { el.textContent = el.dataset.orig; el.classList.remove('armed'); } }, 3000); return; }
    armed.reset = 0; saved(S.reset()); MS.render();
  };

  changes.addimg = function (el) {
    var files = Array.prototype.slice.call(el.files || []);
    var chain = Promise.resolve();
    files.forEach(function (f) {
      chain = chain.then(function () { return MS.compress(f).then(function (src) { draft.images.push(src); refreshImgs(); }, function () { MS.toast(t('a_tooBig'), true); }); });
    });
    chain.then(function () { el.value = ''; });
  };
  changes.ostatus = function (el) {
    var o = D().orders.filter(function (x) { return x.id === el.dataset.id; })[0];
    if (o) { o.status = el.value; saved(S.save()); MS.render(); }
  };
  changes.importfile = function (el) {
    var f = el.files && el.files[0]; if (!f) return;
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var d = JSON.parse(fr.result);
        if (!d || !Array.isArray(d.products) || !Array.isArray(d.categories) || !Array.isArray(d.brands) || !d.settings) throw new Error('bad');
        d.orders = Array.isArray(d.orders) ? d.orders : [];
        S.data = d; saved(S.save()); MS.toast(t('a_imported')); MS.render();
      } catch (e) { MS.toast(t('a_badFile'), true); }
    };
    fr.readAsText(f); el.value = '';
  };

  // ---------- forms
  forms.alogin = function (f) {
    var fdl = new FormData(f), pw = String(fdl.get('pw') || '');
    if (MS.cloud && MS.cloud.on) {
      MS.cloud.login(String(fdl.get('email') || '').trim(), pw).then(function () { MS.render(); }, function () { var e = $('#lerr'); if (e) e.textContent = t('a_wrong'); });
      return;
    }
    if (pw && pw === String(D().settings.pw)) { setAuth(true); MS.render(); }
    else { var e = $('#lerr'); if (e) e.textContent = t('a_wrong'); }
  };
  var list = function (s) { return String(s || '').split(/[,،]/).map(function (x) { return x.trim(); }).filter(Boolean); };
  var slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || S.uid(); };

  forms.saveProduct = function (f) {
    var fd = {}; new FormData(f).forEach(function (v, k) { fd[k] = String(v).trim(); });
    var price = parseFloat(String(fd.price).replace(',', '.')), sale = parseFloat(String(fd.sale).replace(',', '.'));
    var err = $('#aerr');
    if (!fd.name || !(price > 0)) { err.textContent = t('a_needName'); return; }
    var id = f.dataset.id, d = D();
    var p = id ? H.prodOf(id) : null;
    var isNew = !p;
    if (isNew) { p = { id: 'p' + S.uid(), created: Date.now() }; d.products.unshift(p); }
    p.name = fd.name; p.price = price; p.sale = sale > 0 && sale < price ? sale : null;
    p.stock = Math.max(0, parseInt(fd.stock, 10) || 0); p.cat = fd.cat; p.brand = fd.brand; p.desc = fd.desc;
    p.sizes = list(fd.sizes); p.colors = list(fd.colors); p.featured = !!f.elements.featured.checked; p.images = draft.images.slice();
    var ok = S.save(); saved(ok);
    if (ok !== false) location.hash = '#/admin/products';
  };

  acts.annsw = function (el) { var i = document.getElementById('annc'); if (i) i.value = el.dataset.c; };
  acts.pickbimg = function (el) { var i = document.getElementById('bf-' + el.dataset.id); if (i) i.click(); };
  acts.rmbimg = function (el) {
    var id = el.dataset.id, th = document.getElementById('bth-' + id);
    if (id === 'new') bdraft.img = ''; else { var b = (D().banners || []).filter(function (x) { return x.id === id; })[0]; if (b) { b.img = ''; saved(S.save()); } }
    if (th) th.style.backgroundImage = '';
  };
  acts.bmove = function (el) {
    var a = D().banners, i = a.findIndex(function (x) { return x.id === el.dataset.id; }), j = i + (+el.dataset.d);
    if (i < 0 || j < 0 || j >= a.length) return;
    var x = a[i]; a[i] = a[j]; a[j] = x; saved(S.save()); MS.render();
  };
  acts.subcsv = function () {
    var csv = 'email,date\n' + (D().subscribers || []).map(function (x) { return '"' + String(x.email).replace(/"/g, '') + '","' + String(x.created_at || '').slice(0, 10) + '"'; }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'newsletter.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };
  changes.bannerimg = function (el) {
    var f = el.files && el.files[0]; if (!f) return; var id = el.dataset.id;
    MS.compress(f, 1400, 0.8).then(function (src) {
      if (id === 'new') bdraft.img = src; else { var b = (D().banners || []).filter(function (x) { return x.id === id; })[0]; if (b) { b.img = src; saved(S.save()); } }
      var th = document.getElementById('bth-' + id); if (th) th.style.backgroundImage = 'url(' + src + ')';
    }, function () { MS.toast(t('a_tooBig'), true); });
    el.value = '';
  };
  forms.saveBanner = function (f) {
    var fd = new FormData(f), d = D(), id = f.dataset.id, b = id ? (d.banners || []).filter(function (x) { return x.id === id; })[0] : null;
    var g = function (k) { return String(fd.get(k) || '').trim(); };
    var title = { en: g('title_en'), fa: g('title_fa'), de: g('title_de') };
    if (!title.en && !title.fa && !title.de) return MS.toast(t('a_needName'), true);
    title.en = title.en || title.fa || title.de; title.fa = title.fa || title.en; title.de = title.de || title.en;
    if (!b) { b = { id: S.uid(), img: bdraft.img }; d.banners = d.banners || []; d.banners.push(b); bdraft.img = ''; }
    b.title = title; b.text = { en: g('text_en'), fa: g('text_fa') || g('text_en'), de: g('text_de') || g('text_en') };
    b.btn = { en: g('btn_en'), fa: g('btn_fa') || g('btn_en'), de: g('btn_de') || g('btn_en') };
    b.link = g('link') || '#/'; b.on = !!fd.get('on');
    saved(S.save()); MS.render();
  };
  forms.saveCoupon = function (f) {
    var fd = new FormData(f), d = D(); d.coupons = d.coupons || [];
    var code = String(fd.get('code') || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ''), val = parseFloat(String(fd.get('value')).replace(',', '.'));
    if (!code || !(val > 0)) return MS.toast(t('a_needCode'), true);
    var old = f.dataset.id, c = d.coupons.filter(function (x) { return x.code === (old || code); })[0];
    if (!c) { c = { code: code }; d.coupons.push(c); } else c.code = code;
    c.type = fd.get('type') === 'fix' ? 'fix' : 'pct'; c.value = c.type === 'pct' ? Math.min(100, val) : val;
    c.min = Math.max(0, parseFloat(String(fd.get('min')).replace(',', '.')) || 0); c.expires = String(fd.get('expires') || ''); c.on = !!fd.get('on');
    saved(S.save()); MS.render();
  };
  forms.saveCat = function (f) {
    var fd = {}; new FormData(f).forEach(function (v, k) { fd[k] = String(v).trim(); });
    if (!fd.n_en && !fd.n_fa && !fd.n_de) return MS.toast(t('a_needName'), true);
    var d = D(), id = f.dataset.id, c = id ? H.catOf(id) : null;
    var en = fd.n_en || fd.n_fa || fd.n_de;
    if (!c) { var nid = slug(en); while (H.catOf(nid)) nid += '-' + S.uid().slice(-3); c = { id: nid }; d.categories.push(c); }
    c.names = { en: en, fa: fd.n_fa || en, de: fd.n_de || en }; c.icon = fd.icon; c.color = fd.color || '#d4af37';
    saved(S.save()); MS.render();
  };
  forms.saveBrand = function (f) {
    var fd = {}; new FormData(f).forEach(function (v, k) { fd[k] = String(v).trim(); });
    if (!fd.name) return MS.toast(t('a_needName'), true);
    var d = D(), id = f.dataset.id, b = id ? H.brandOf(id) : null;
    if (!b) { var nid = slug(fd.name); while (H.brandOf(nid)) nid += '-' + S.uid().slice(-3); b = { id: nid }; d.brands.push(b); }
    b.name = fd.name; b.tagline = fd.tagline; b.color = fd.color || '#d4af37';
    saved(S.save()); MS.render();
  };
  forms.saveSettings = function (f) {
    var fd = {}; new FormData(f).forEach(function (v, k) { fd[k] = String(v); });
    var s = D().settings;
    s.currency = fd.currency.trim() || '€';
    s.shipFee = Math.max(0, parseFloat(String(fd.shipFee).replace(',', '.')) || 0);
    s.freeFrom = Math.max(0, parseFloat(String(fd.freeFrom).replace(',', '.')) || 0);
    ['announce', 'heroTitle', 'heroSub'].forEach(function (k) { s[k] = { en: fd[k + '_en'], fa: fd[k + '_fa'], de: fd[k + '_de'] }; });
    s.annColor = H.safeColor(fd.annColor || '#0b0b0b');
    s.annSpeed = ['off', 'slow', 'normal', 'fast'].indexOf(fd.annSpeed) > -1 ? fd.annSpeed : 'normal';
    s.annShake = !!fd.annShake;
    s.pages = s.pages || {};
    ['about', 'imprint', 'privacy', 'terms', 'shipping', 'returns'].forEach(function (k) { s.pages[k] = fd['pg_' + k]; });
    if (fd.pw && fd.pw.length >= 6) { s.pw = fd.pw; s.pwDefault = false; }
    saved(S.save()); MS.render();
  };
})(window.MS);
