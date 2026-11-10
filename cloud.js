(function (MS) {
  'use strict';
  var C = MS.CFG || {}, S = MS.Store;
  var on = !!(C.url && C.key);
  var SK = 'ms_sess', timer = null;
  MS.cloudOn = on;
  var cloud = MS.cloud = { on: on };
  if (!on) return;

  var base = C.url.replace(/\/+$/, '');
  function sess() { try { return JSON.parse(localStorage.getItem(SK) || 'null'); } catch (e) { return null; } }
  function setSess(s) { try { s ? localStorage.setItem(SK, JSON.stringify(s)) : localStorage.removeItem(SK); } catch (e) {} }
  function req(method, path, body, extra) {
    var s = sess();
    var h = { apikey: C.key, 'Content-Type': 'application/json', Authorization: 'Bearer ' + (s ? s.access_token : C.key) };
    for (var k in (extra || {})) h[k] = extra[k];
    return fetch(base + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      if (r.status === 401 && s && s.refresh_token && !req.retry) {
        req.retry = 1;
        return cloud.refresh().then(function () { req.retry = 0; return req(method, path, body, extra); }, function () { req.retry = 0; throw new Error('auth'); });
      }
      if (!r.ok) return r.text().then(function (t) { throw new Error(r.status + ' ' + t); });
      return r.status === 204 ? null : r.json().catch(function () { return null; });
    });
  }
  cloud.refresh = function () {
    var s = sess(); if (!s) return Promise.reject();
    return fetch(base + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: C.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token }) })
      .then(function (r) { if (!r.ok) throw new Error('refresh'); return r.json(); })
      .then(function (j) { setSess({ access_token: j.access_token, refresh_token: j.refresh_token }); });
  };
  cloud.login = function (email, pw) {
    return fetch(base + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: C.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: pw }) })
      .then(function (r) { if (!r.ok) throw new Error('login'); return r.json(); })
      .then(function (j) { setSess({ access_token: j.access_token, refresh_token: j.refresh_token }); return cloud.pull(true); });
  };
  cloud.logout = function () { setSess(null); };
  cloud.isAdmin = function () { return !!sess(); };

  function publicData() {
    var d = JSON.parse(JSON.stringify(S.data));
    delete d.orders; if (d.settings) { delete d.settings.pw; delete d.settings.pwDefault; }
    return d;
  }
  // Shop-Daten + (als Admin) Bestellungen laden
  cloud.pull = function (withOrders) {
    return req('GET', '/rest/v1/shop_data?id=eq.main&select=data').then(function (rows) {
      if (rows && rows[0] && rows[0].data) {
        var cur = S.data, d = rows[0].data;
        d.orders = cur.orders || []; d.settings = Object.assign({}, d.settings, { pw: cur.settings.pw, pwDefault: false });
        S.data = d; S.store('data', d);
      }
      if (withOrders && sess()) return req('GET', '/rest/v1/orders?select=data&order=created_at.desc').then(function (r) { S.data.orders = (r || []).map(function (x) { return x.data; }); S.store('data', S.data); });
    });
  };
  // Admin: Änderungen hochladen (mit kurzer Verzögerung)
  cloud.push = function () {
    if (!sess()) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      req('POST', '/rest/v1/shop_data?on_conflict=id', [{ id: 'main', data: publicData(), updated_at: new Date().toISOString() }], { Prefer: 'resolution=merge-duplicates,return=minimal' })
        .then(function () {
          var os = (S.data.orders || []).map(function (o) { return { id: o.id, data: o }; });
          if (os.length) return req('POST', '/rest/v1/orders?on_conflict=id', os, { Prefer: 'resolution=merge-duplicates,return=minimal' });
        })
        .then(function () { MS.toast && MS.toast('☁ ✓'); })
        .catch(function () { MS.toast && MS.toast('☁ ✗ (Speichern in der Cloud fehlgeschlagen)'); });
    }, 600);
  };
  // Kunde: Bestellung senden
  cloud.order = function (o) {
    return req('POST', '/rest/v1/orders', [{ id: o.id, data: o }], { Prefer: 'return=minimal' }).catch(function () {});
  };

  var orig = S.save;
  S.save = function () { var r = orig.apply(S, arguments); cloud.push(); return r; };
  var origReset = S.reset;

  cloud.boot = function () {
    cloud.pull(!!sess()).then(function () { MS.render(); }).catch(function () {});
  };
})(window.MS);
