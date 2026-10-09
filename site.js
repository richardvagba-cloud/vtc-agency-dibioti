/* Menu repliable (mobile et tablette). Aucune dépendance. */
(function () {
  var nav = document.querySelector('nav');
  if (!nav) return;
  var btn = nav.querySelector('.nav-toggle');
  var panel = nav.querySelector('.nav-panel');
  if (!btn || !panel) return;
  var label = btn.querySelector('.nav-toggle-label');

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (label) label.textContent = open ? 'Fermer' : 'Menu';
  }

  btn.addEventListener('click', function () {
    setOpen(!nav.classList.contains('is-open'));
  });

  // Un choix dans le menu le referme (liens, boutons de section, Connexion).
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a, button')) setOpen(false);
  });

  // Un clic en dehors, ou la touche Échap, le referme aussi.
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      btn.focus();
    }
  });

  // Repasser en grand écran remet le menu à zéro.
  var mq = window.matchMedia('(min-width: 1081px)');
  var onChange = function (e) { if (e.matches) setOpen(false); };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
})();
