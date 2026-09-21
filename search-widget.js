(function(){
  var style = document.createElement('style');
  style.textContent = `
    .vtcs-wrap{max-width:720px;margin:16px auto 0;padding:0 24px;position:relative;}
    .vtcs-box{position:relative;}
    .vtcs-input{width:100%;border:1px solid var(--line,#E4D9CC);background:var(--card,#fff);color:var(--ink,#241B2F);
      padding:12px 16px 12px 40px;border-radius:24px;font-family:'Inter',sans-serif;font-size:14px;}
    .vtcs-input:focus{outline:2px solid var(--coral,#E1543F);outline-offset:1px;}
    .vtcs-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted,#7A6F84);font-size:15px;pointer-events:none;}
    .vtcs-results{position:absolute;top:calc(100% + 6px);left:0;right:0;background:var(--card,#fff);
      border:1px solid var(--line,#E4D9CC);border-radius:14px;box-shadow:0 8px 24px rgba(36,27,47,0.12);
      max-height:360px;overflow-y:auto;z-index:200;display:none;}
    .vtcs-results.show{display:block;}
    .vtcs-item{display:block;padding:13px 16px;border-bottom:1px solid var(--line,#E4D9CC);text-decoration:none;color:inherit;}
    .vtcs-item:last-child{border-bottom:none;}
    .vtcs-item:hover, .vtcs-item.active{background:var(--teal-bg,#E7F1EF);}
    .vtcs-item .t{font-size:14px;font-weight:600;color:var(--ink,#241B2F);margin-bottom:2px;}
    .vtcs-item .s{font-size:12px;color:var(--muted,#7A6F84);}
    .vtcs-empty{padding:16px;font-size:13px;color:var(--muted,#7A6F84);text-align:center;}
  `;
  document.head.appendChild(style);

  var wrap = document.createElement('div');
  wrap.className = 'vtcs-wrap';
  wrap.innerHTML = `
    <div class="vtcs-box">
      <span class="vtcs-icon">&#128269;</span>
      <input class="vtcs-input" type="text" placeholder="Rechercher sur tout le site (règlement, arnaque, horaires, lexique...)" autocomplete="off">
      <div class="vtcs-results"></div>
    </div>
  `;

  var liveStrip = document.querySelector('.live-strip');
  if (liveStrip && liveStrip.parentNode) {
    liveStrip.parentNode.insertBefore(wrap, liveStrip.nextSibling);
  } else {
    document.body.insertBefore(wrap, document.body.firstChild);
  }

  var input = wrap.querySelector('.vtcs-input');
  var results = wrap.querySelector('.vtcs-results');
  var activeIndex = -1;
  var currentMatches = [];

  function normalize(s){
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function search(query){
    var q = normalize(query).trim();
    if (!q) return [];
    var index = window.VTC_SEARCH_INDEX || [];
    return index.filter(function(item){
      return normalize(item.title).indexOf(q) !== -1 || normalize(item.snippet).indexOf(q) !== -1;
    }).slice(0, 8);
  }

  function render(matches){
    currentMatches = matches;
    activeIndex = -1;
    if (matches.length === 0) {
      results.innerHTML = '<div class="vtcs-empty">Aucun résultat. Essayez un autre mot-clé.</div>';
    } else {
      results.innerHTML = matches.map(function(m, i){
        return '<a class="vtcs-item" href="' + m.url + '" data-i="' + i + '">' +
          '<div class="t">' + m.title + '</div>' +
          '<div class="s">' + m.snippet + '</div>' +
          '</a>';
      }).join('');
    }
    results.classList.add('show');
  }

  input.addEventListener('input', function(){
    var matches = search(input.value);
    if (!input.value.trim()) { results.classList.remove('show'); return; }
    render(matches);
  });

  input.addEventListener('keydown', function(e){
    var items = results.querySelectorAll('.vtcs-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      items.forEach(function(el, i){ el.classList.toggle('active', i === activeIndex); });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      items.forEach(function(el, i){ el.classList.toggle('active', i === activeIndex); });
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && currentMatches[activeIndex]) {
        window.location.href = currentMatches[activeIndex].url;
      } else if (currentMatches[0]) {
        window.location.href = currentMatches[0].url;
      }
    } else if (e.key === 'Escape') {
      results.classList.remove('show');
      input.blur();
    }
  });

  document.addEventListener('click', function(e){
    if (!wrap.contains(e.target)) results.classList.remove('show');
  });
})();
