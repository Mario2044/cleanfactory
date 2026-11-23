/* Shared behaviour for inner pages. Mirrors the homepage scripts so forms,
   popup and menu behave identically. Lead tracking stays in GTM (form submit
   trigger on elements with class "form") — nothing is pushed from here. */
(function () {
  // Mobile menu
  var burger = document.querySelector('.nav-burger');
  var navLinks = document.querySelector('.nav-links');
  var navOverlay = document.querySelector('.nav-overlay');
  function closeMenu() {
    navLinks.classList.remove('open');
    navOverlay.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Відкрити меню');
  }
  if (burger && navLinks && navOverlay) {
    burger.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navOverlay.classList.toggle('open', isOpen);
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.setAttribute('aria-label', isOpen ? 'Закрити меню' : 'Відкрити меню');
    });
    navLinks.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    navOverlay.addEventListener('click', closeMenu);
    var closeBtn = document.querySelector('.nav-close');
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-list').forEach(function (list) {
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('.faq-question');
      if (!btn) return;
      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      list.querySelectorAll('.faq-item.open').forEach(function (el) {
        el.classList.remove('open');
        el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Reveal on scroll
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    document.querySelectorAll('.reveal').forEach(function (el, index) {
      el.style.transitionDelay = Math.min(index % 6 * 70, 320) + 'ms';
      observer.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in-view'); });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Topbar reviews rotator
  var items = document.querySelectorAll('#topbar .topbar-item');
  if (items.length > 1) {
    var cur = 0;
    setInterval(function () {
      items[cur].classList.remove('active');
      cur = (cur + 1) % items.length;
      items[cur].classList.add('active');
    }, 4000);
  }

  // Before / after sliders
  document.querySelectorAll('.ba-slider input[type=range]').forEach(function (range) {
    var slider = range.closest('.ba-slider');
    function update() { slider.style.setProperty('--pos', range.value + '%'); }
    range.addEventListener('input', update);
    update();
  });

  // Price nav highlight
  var priceNav = document.querySelector('.price-nav');
  if (priceNav && 'IntersectionObserver' in window) {
    var navMap = {};
    priceNav.querySelectorAll('a').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
    var secObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        priceNav.querySelectorAll('a').forEach(function (a) { a.classList.remove('active'); });
        var link = navMap[entry.target.id];
        if (link) {
          link.classList.add('active');
          priceNav.scrollTo({ left: link.offsetLeft - 6, behavior: 'smooth' });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(navMap).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) secObserver.observe(sec);
    });
  }

  // Phone field reset
  var phone = document.getElementById('phone');
  if (phone) {
    phone.addEventListener('input', function () {
      this.classList.remove('input-error');
      document.getElementById('phoneError').style.display = 'none';
    });
  }
})();

/* Success popup + form submit — same flow as the homepage (/api/send-lead) */
var _popupTimer = null;
var _popupBtn = null;

function showSuccessPopup(btn) {
  _popupBtn = btn;
  var popup = document.getElementById('successPopup');
  var bar = document.getElementById('popupProgressBar');
  bar.style.transition = 'none';
  bar.style.transform = 'scaleX(1)';
  popup.classList.add('show');
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      bar.style.transition = 'transform 4s linear';
      bar.style.transform = 'scaleX(0)';
    });
  });
  _popupTimer = setTimeout(closeSuccessPopup, 4000);
}

function closeSuccessPopup() {
  clearTimeout(_popupTimer);
  document.getElementById('successPopup').classList.remove('show');
  if (_popupBtn) {
    _popupBtn.disabled = false;
    _popupBtn.textContent = _popupBtn.dataset.label;
    _popupBtn = null;
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  var form = event.target;
  var note = form.querySelector('.form-note');
  var btn = form.querySelector('button[type="submit"]');
  var phoneInput = form.querySelector('input[name="phone"]');
  var phoneError = form.querySelector('.phone-error');
  if (!btn.dataset.label) btn.dataset.label = btn.textContent;

  var cleanPhone = phoneInput.value.trim().replace(/[\s\-()]/g, '');
  if (!/^(\+?380|0)\d{9}$/.test(cleanPhone)) {
    phoneInput.classList.add('input-error');
    phoneError.style.display = 'block';
    phoneInput.focus();
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Відправка...';
  note.textContent = '';

  var formData = new FormData(form);
  var data = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    service: formData.get('service'),
    object_type: formData.get('object_type') || formData.get('object'),
    comment: formData.get('comment') || formData.get('message'),
    page_url: window.location.href
  };

  function fail(msg) {
    note.textContent = msg;
    note.style.color = '#ef4444';
    btn.disabled = false;
    btn.textContent = btn.dataset.label;
  }

  try {
    var res = await fetch('/api/send-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    var json = {};
    try { json = await res.json(); } catch (_) {}

    if (res.ok && json.success) {
      form.reset();
      var preset = form.querySelector('[data-preset]');
      if (preset) preset.value = preset.dataset.preset;
      showSuccessPopup(btn);
    } else {
      console.error('Send lead error:', json);
      fail('Помилка відправки. Спробуйте ще раз або зателефонуйте нам.');
    }
  } catch (e) {
    console.error('Network error:', e);
    fail('Помилка мережі. Перевірте зʼєднання та спробуйте ще раз.');
  }
}
