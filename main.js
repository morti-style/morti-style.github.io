(function (MS) {
  'use strict';
  MS.boot = function () {
    MS.Store.init();
    var l = MS.Store.load('lang', 'fa');
    MS.lang = (l === 'en' || l === 'de' || l === 'fa') ? l : 'fa';
    MS.bind();
    MS.render();
  };
  if (typeof document !== 'undefined' && document.getElementById('app')) MS.boot();
})(window.MS);
