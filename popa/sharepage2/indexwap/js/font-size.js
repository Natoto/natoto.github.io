//控制根目录的font-size大小
(function (doc, win) {
  var docEl = doc.documentElement,
	resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
	recalc = function () {
	  var clientWidth = docEl.clientWidth>=750 ? 750 : docEl.clientWidth;
	  if (!clientWidth) return;
	  docEl.style.fontSize = 50 * (clientWidth / 750) + 'px';
	};

  if (!doc.addEventListener) return;
  win.addEventListener(resizeEvt, recalc, false);
  doc.addEventListener('DOMContentLoaded', recalc, false);
})(document, window);