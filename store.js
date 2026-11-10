(function (MS) {
  'use strict';
  var P = 'morti_style_';
  var mem = {};
  MS.persist = true;

  function load(k, def) {
    try {
      var v = localStorage.getItem(P + k);
      if (v == null) return k in mem ? mem[k] : def;
      return JSON.parse(v);
    } catch (e) { return k in mem ? mem[k] : def; }
  }
  function store(k, v) {
    mem[k] = v;
    try { localStorage.setItem(P + k, JSON.stringify(v)); MS.persist = true; return true; }
    catch (e) { MS.persist = false; return false; }
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

  function seed() {
    var now = Date.now();
    var cats = [
      ['clothing', 'Clothing', 'لباس', 'Kleidung', '#d4af37'],
      ['shoes', 'Shoes', 'کفش', 'Schuhe', '#c9a24a'],
      ['watches', 'Watches', 'ساعت', 'Uhren', '#e0c060'],
      ['eyewear', 'Eyewear', 'عینک', 'Brillen', '#d9b44f'],
      ['belts', 'Belts', 'کمربند', 'Gürtel', '#bf9a3a'],
      ['bags', 'Bags', 'کیف', 'Taschen', '#cfa844']
    ].map(function (c) {
      return { id: c[0], icon: c[0], names: { en: c[1], fa: c[2], de: c[3] }, color: c[4] };
    });
    var brands = [
      { id: 'aurum', name: 'AURUM', tagline: 'Timeless gold standard', color: '#d4af37' },
      { id: 'novacraft', name: 'NOVA CRAFT', tagline: 'Modern street essentials', color: '#8ab4f8' },
      { id: 'velluto', name: 'VELLUTO', tagline: 'Soft leather, clean lines', color: '#e0364f' },
      { id: 'kairos', name: 'KAIROS', tagline: 'Precision and time', color: '#7fd1a6' }
    ];
    var CL = ['S', 'M', 'L', 'XL'], SH = ['40', '41', '42', '43', '44'], BE = ['85', '95', '105'];
    var mk = function (i, name, price, sale, cat, brand, desc, sizes, colors, stock, feat) {
      return { id: 'p' + (100 + i), name: name, price: price, sale: sale || null, cat: cat, brand: brand, desc: desc, sizes: sizes, colors: colors, stock: stock, featured: !!feat, images: [], created: now - i * 864e5 };
    };
    var products = [
      mk(0, 'Classic Black Shirt', 59, null, 'clothing', 'velluto', 'Soft cotton shirt with a clean, modern cut.', CL, ['Black', 'White'], 24, 1),
      mk(1, 'Slim Fit Jacket', 189, 149, 'clothing', 'novacraft', 'Lightweight slim jacket for every season.', CL, ['Black', 'Navy'], 12, 1),
      mk(2, 'Essential Hoodie', 79, null, 'clothing', 'novacraft', 'Heavy cotton hoodie with a relaxed fit.', CL, ['Gray', 'Black'], 30, 0),
      mk(3, 'Urban Sneaker', 129, null, 'shoes', 'novacraft', 'Everyday sneaker with a cushioned sole.', SH, ['White', 'Black'], 18, 1),
      mk(4, 'Chelsea Boot', 139, 109, 'shoes', 'velluto', 'Leather boot with elastic side panels.', SH, ['Brown', 'Black'], 8, 0),
      mk(5, 'Runner Pro', 119, null, 'shoes', 'kairos', 'Light running shoe built for daily miles.', SH, ['Gray', 'Blue'], 20, 0),
      mk(6, 'Gold Chrono Watch', 249, null, 'watches', 'kairos', 'Chronograph watch with a gold-tone case.', [], ['Gold', 'Black'], 9, 1),
      mk(7, 'Minimal Steel Watch', 179, 139, 'watches', 'aurum', 'Slim steel watch with a clean dial.', [], ['Silver', 'Black'], 14, 0),
      mk(8, 'Classic Leather Watch', 199, null, 'watches', 'velluto', 'Classic watch with a genuine leather strap.', [], ['Brown', 'Black'], 6, 0),
      mk(9, 'Aviator Sunglasses', 89, 69, 'eyewear', 'aurum', 'Timeless aviator frame with UV400 lenses.', [], ['Gold', 'Black'], 25, 1),
      mk(10, 'Round Frame Glasses', 99, null, 'eyewear', 'kairos', 'Light round frame for daily wear.', [], ['Black', 'Tortoise'], 15, 0),
      mk(11, 'Sport Shades', 79, null, 'eyewear', 'novacraft', 'Wrap-around shades for active days.', [], ['Black'], 22, 0),
      mk(12, 'Leather Belt', 45, null, 'belts', 'velluto', 'Full-grain leather belt with a matte buckle.', BE, ['Black', 'Brown'], 40, 0),
      mk(13, 'Gold Buckle Belt', 65, null, 'belts', 'aurum', 'Statement belt with a gold-tone buckle.', BE, ['Black'], 16, 0),
      mk(14, 'Weekend Bag', 159, 129, 'bags', 'velluto', 'Roomy leather bag for short trips.', [], ['Brown', 'Black'], 7, 1),
      mk(15, 'City Backpack', 99, null, 'bags', 'novacraft', 'Water-resistant backpack with laptop sleeve.', [], ['Black', 'Gray'], 28, 0)
    ];
    return {
      v: 1,
      settings: {
        currency: '€', shipFee: 4.9, freeFrom: 100,
        announce: { en: 'FREE SHIPPING OVER €100 · TEST SHOP', fa: 'ارسال رایگان برای خرید بالای ۱۰۰ یورو · فروشگاه آزمایشی', de: 'GRATIS VERSAND AB 100 € · TESTSHOP' },
        heroTitle: { en: 'Your Style.|Your Rules.', fa: 'استایل تو.|قانون تو.', de: 'Dein Stil.|Deine Regeln.' },
        heroSub: {
          en: 'Clothing, shoes, watches, eyewear and more. Everything you wear, in one place.',
          fa: 'لباس، کفش، ساعت، عینک و بیشتر. هر چه می‌پوشید، در یک جا.',
          de: 'Kleidung, Schuhe, Uhren, Brillen und mehr. Alles, was du trägst, an einem Ort.'
        },
        pw: 'morti2026', pwDefault: true,
        pages: {
          imprint: 'Add your imprint (Impressum) here. Edit this text in Admin > Settings.',
          privacy: 'Add your privacy policy (Datenschutzerklärung) here. Edit this text in Admin > Settings.',
          terms: 'Add your terms and conditions (AGB) here. Edit this text in Admin > Settings.',
          shipping: 'Shipping takes 2-4 days. Free shipping over the amount shown in the top bar.',
          returns: 'You can return items within 14 days of delivery.'
        }
      },
      categories: cats, brands: brands, products: products, orders: []
    };
  }


  function migrate(d) {
    if (!Array.isArray(d.banners)) d.banners = [
      { id: 'b1', on: true, img: '', title: { en: 'New season. New style.', fa: 'فصل جدید. استایل جدید.', de: 'Neue Saison. Neuer Style.' }, text: { en: 'Discover the latest arrivals.', fa: 'تازه‌ترین کالاها را ببین.', de: 'Entdecke die neuesten Styles.' }, btn: { en: 'Shop now', fa: 'خرید کن', de: 'Jetzt shoppen' }, link: '#/new' },
      { id: 'b2', on: true, img: '', title: { en: 'Watches up to 30% off', fa: 'ساعت‌ها تا ۳۰٪ تخفیف', de: 'Uhren bis zu 30 % Rabatt' }, text: { en: 'Limited time only.', fa: 'فقط برای مدت محدود.', de: 'Nur für kurze Zeit.' }, btn: { en: 'See offers', fa: 'دیدن پیشنهادها', de: 'Angebote ansehen' }, link: '#/sale' },
      { id: 'b3', on: true, img: '', title: { en: 'First order: 10% off', fa: 'اولین خرید: ۱۰٪ تخفیف', de: 'Erste Bestellung: 10 % Rabatt' }, text: { en: 'Use code WELCOME10 at checkout.', fa: 'کد WELCOME10 را در پرداخت وارد کن.', de: 'Code WELCOME10 an der Kasse eingeben.' }, btn: { en: 'Start shopping', fa: 'شروع خرید', de: 'Jetzt starten' }, link: '#/new' }
    ];
    if (!Array.isArray(d.coupons)) d.coupons = [{ code: 'WELCOME10', type: 'pct', value: 10, min: 0, expires: '', on: true }];
    if (!Array.isArray(d.subscribers)) d.subscribers = [];
    if (!Array.isArray(d.orders)) d.orders = [];
    return d;
  }

  var S = {
    migrate: migrate,
    load: load, store: store, uid: uid, data: null,
    init: function () {
      var d = load('data', null);
      if (!d || !d.products || !d.categories || !d.brands || !d.settings) { d = seed(); store('data', d); }
      S.data = migrate(d);
    },
    save: function () { return store('data', S.data); },
    reset: function () { S.data = seed(); return S.save(); }
  };
  MS.Store = S;
})(window.MS);
