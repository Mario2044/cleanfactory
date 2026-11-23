/* Services dropdown: click/keyboard toggle (hover is handled in CSS on desktop) */
(function () {
  var dds = document.querySelectorAll('.nav-dd');
  if (!dds.length) return;

  function setOpen(dd, open) {
    dd.classList.toggle('open', open);
    var t = dd.querySelector('.nav-dd-toggle');
    if (t) t.setAttribute('aria-expanded', String(open));
  }

  dds.forEach(function (dd) {
    var toggle = dd.querySelector('.nav-dd-toggle');
    var links = dd.querySelectorAll('.nav-dd-menu a');

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(dd, !dd.classList.contains('open'));
      if (dd.classList.contains('open') && links[0] && e.detail === 0) links[0].focus();
    });

    dd.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(links);
      var i = items.indexOf(document.activeElement);
      if (e.key === 'Escape' && dd.classList.contains('open')) {
        e.stopPropagation();
        setOpen(dd, false);
        toggle.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!dd.classList.contains('open')) setOpen(dd, true);
        (items[i + 1] || items[0]).focus();
      } else if (e.key === 'ArrowUp' && i !== -1) {
        e.preventDefault();
        (items[i - 1] || items[items.length - 1]).focus();
      }
    });

    dd.addEventListener('focusout', function (e) {
      if (!dd.contains(e.relatedTarget) && window.matchMedia('(min-width: 1025px)').matches) setOpen(dd, false);
    });

    links.forEach(function (a) {
      a.addEventListener('click', function () { setOpen(dd, false); });
    });
  });

  document.addEventListener('click', function (e) {
    dds.forEach(function (dd) { if (!dd.contains(e.target)) setOpen(dd, false); });
  });
})();
