(function () {
  function parseTags(s) {
    if (!s) return [];
    if (Array.isArray(s)) return s.filter(Boolean);
    return String(s).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function renderProjects(projects) {
    var grid = document.getElementById('projects-grid');
    if (!grid || !projects) return;
    grid.textContent = '';
    projects.forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'project-card';
      a.href = p.link || '#';
      if (/^https?:\/\//i.test(p.link)) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      var top = document.createElement('div');
      top.className = 'project-top';
      var name = document.createElement('span');
      name.className = 'project-name';
      name.textContent = p.title || '';
      var arrow = document.createElement('span');
      arrow.className = 'project-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      top.appendChild(name);
      top.appendChild(arrow);
      var desc = document.createElement('p');
      desc.className = 'project-desc';
      desc.textContent = p.description || '';
      var tagsWrap = document.createElement('div');
      tagsWrap.className = 'project-tags';
      parseTags(p.tags).forEach(function (t) {
        var sp = document.createElement('span');
        sp.className = 'tag';
        sp.textContent = t;
        tagsWrap.appendChild(sp);
      });
      a.appendChild(top);
      a.appendChild(desc);
      a.appendChild(tagsWrap);
      grid.appendChild(a);
    });
  }

  function renderAchievements(list) {
    var ul = document.getElementById('achievements-list');
    if (!ul || !list) return;
    ul.textContent = '';
    list.forEach(function (a) {
      var li = document.createElement('li');
      li.className = 'achievement-item';
      var p = document.createElement('p');
      p.innerHTML = a.text || '';
      var span = document.createElement('span');
      span.className = 'years';
      span.textContent = a.season || '';
      li.appendChild(p);
      li.appendChild(span);
      ul.appendChild(li);
    });
  }

  function loadPortfolioData() {
    return fetch('portfolio-data.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .catch(function () {
        var el = document.getElementById('portfolio-data-embedded');
        if (!el) throw new Error('Нет данных');
        try {
          return JSON.parse(el.textContent);
        } catch (err) {
          throw new Error('Некорректный JSON во встроенных данных');
        }
      });
  }

  function stripMeta(data) {
    if (!data || typeof data !== 'object') return data;
    delete data.__readme;
    return data;
  }

  var nav = document.getElementById('site-nav');

  function flexGapPx(el) {
    var s = getComputedStyle(el);
    var c = parseFloat(s.columnGap);
    if (!isNaN(c)) return c;
    var g = parseFloat(s.gap);
    return isNaN(g) ? 0 : g;
  }

  function updateHeroSloganLayout() {
    var combined = document.querySelector('.hero-combined');
    if (!combined) return;
    var brand = combined.querySelector('.hero-brand');
    var line = combined.querySelector('.hero-slogan-line');
    var slogan = combined.querySelector('.hero-slogan');
    var pipe = combined.querySelector('.hero-pipe');
    if (!brand || !line || !slogan || !pipe) return;

    combined.classList.remove('hero-combined--stacked');
    void combined.offsetWidth;

    var wsPrev = slogan.style.whiteSpace;
    slogan.style.whiteSpace = 'nowrap';
    var sloganOneLineW = slogan.scrollWidth;
    slogan.style.whiteSpace = wsPrev;

    var gapMain = flexGapPx(combined);
    var gapInner = flexGapPx(line);
    var brandW = brand.offsetWidth;
    var pipeW = pipe.offsetWidth;
    var cw = combined.clientWidth;
    var total = brandW + gapMain + pipeW + gapInner + sloganOneLineW;

    if (total > cw + 1) {
      combined.classList.add('hero-combined--stacked');
    }
  }

  function bindHeroSloganLayout() {
    var combined = document.querySelector('.hero-combined');
    if (!combined) return;
    var ro;
    var t;
    function schedule() {
      clearTimeout(t);
      t = setTimeout(function () {
        requestAnimationFrame(updateHeroSloganLayout);
      }, 50);
    }
    updateHeroSloganLayout();
    requestAnimationFrame(function () {
      updateHeroSloganLayout();
    });
    window.addEventListener('resize', schedule, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(schedule);
      ro.observe(combined);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        requestAnimationFrame(updateHeroSloganLayout);
      });
    }
  }

  bindHeroSloganLayout();

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 12);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-visible');
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    reveals.forEach(function (el) { io.observe(el); });
  }

  loadPortfolioData()
    .then(function (data) {
      stripMeta(data);
      renderProjects(data.projects);
      renderAchievements(data.achievements);
    })
    .catch(function (e) {
      console.error('portfolio-data:', e);
    });
})();
