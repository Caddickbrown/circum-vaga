/* Circum Vaga — small progressive enhancements. Everything works without JS. */
(function () {
  'use strict';

  /* Mobile navigation toggle */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
        toggle.focus();
      }
    });
  }

  /* Tabs (winners page) — ARIA tab pattern with hash deep links */
  var tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

    function select(tab, focus) {
      tabs.forEach(function (t, i) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (panels[i]) panels[i].hidden = !on;
      });
      if (focus) tab.focus();
      if (history.replaceState) history.replaceState(null, '', '#' + tab.dataset.tab);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });

    var fromHash = tabs.filter(function (t) { return '#' + t.dataset.tab === location.hash; })[0];
    select(fromHash || tabs[0], false);
  }

  /* Blog filter chips */
  var filters = document.querySelector('.filters');
  if (filters) {
    var chips = Array.prototype.slice.call(filters.querySelectorAll('.chip'));
    var posts = Array.prototype.slice.call(document.querySelectorAll('.post[data-tag]'));
    var status = document.getElementById('filter-status');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var tag = chip.dataset.filter;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        var shown = 0;
        posts.forEach(function (p) {
          var on = tag === 'all' || p.dataset.tag === tag;
          p.hidden = !on;
          if (on) shown++;
        });
        if (status) status.textContent = shown + (shown === 1 ? ' post shown' : ' posts shown');
      });
    });
  }

  /* Newsletter — no backend, so hand off to the team inbox with a pre-filled email */
  var signup = document.getElementById('signup-form');
  if (signup) {
    signup.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = signup.querySelector('input[type="email"]').value.trim();
      var to = signup.dataset.to;
      var subject = encodeURIComponent('Please add me to Circum Vaga updates');
      var body = encodeURIComponent('Hi Thomas,\n\nPlease add ' + email + ' to the Circum Vaga updates list.\n\nThanks!');
      window.location.href = 'mailto:' + to + '?subject=' + subject + '&body=' + body;
      var note = document.getElementById('signup-note');
      if (note) note.textContent = 'Opening your email app so you can send the request to ' + to + '.';
    });
  }
})();
