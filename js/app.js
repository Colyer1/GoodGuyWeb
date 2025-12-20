// ===== Shared utilities =====
(function(){
  // Active nav highlight based on current path
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('[data-nav]').forEach(a=>{
    const href = (a.getAttribute('href') || '').toLowerCase();
    if(href === path) a.classList.add('active');
  });

  // Year
  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();

  // Promo countdown (5 days from first load unless you change)
  const countdownEl = document.getElementById('promo-countdown');
  if(countdownEl){
    const KEY = 'ggb_promo_end';
    let end = localStorage.getItem(KEY);
    if(!end){
      const d = new Date();
      d.setDate(d.getDate() + 5);
      end = d.toISOString();
      localStorage.setItem(KEY, end);
    }
    const endDate = new Date(end);

    function update(){
      const now = new Date();
      const diff = endDate - now;
      if(diff <= 0){
        countdownEl.textContent = '00d 00h 00m 00s';
        return;
      }
      const d = Math.floor(diff / (1000*60*60*24));
      const h = Math.floor((diff / (1000*60*60)) % 24);
      const m = Math.floor((diff / (1000*60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      countdownEl.textContent =
        String(d).padStart(2,'0')+'d '+
        String(h).padStart(2,'0')+'h '+
        String(m).padStart(2,'0')+'m '+
        String(s).padStart(2,'0')+'s';
    }
    update();
    setInterval(update, 1000);
  }

  // Mobile drawer
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('drawer');
  const close = document.getElementById('drawerClose');

  function openDrawer(){
    if(!drawer || !burger) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden','false');
    burger.setAttribute('aria-expanded','true');
    document.body.style.overflow='hidden';
  }
  function closeDrawer(){
    if(!drawer || !burger) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden','true');
    burger.setAttribute('aria-expanded','false');
    document.body.style.overflow='';
  }

  if(burger && drawer){
    burger.addEventListener('click', openDrawer);
    if(close) close.addEventListener('click', closeDrawer);
    drawer.addEventListener('click', (e)=>{ if(e.target === drawer) closeDrawer(); });
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeDrawer(); });
    document.querySelectorAll('[data-close-drawer]').forEach(a=>a.addEventListener('click', closeDrawer));
  }

  // Cookie consent
  const KEY = 'ggb_cookie_consent';
  const banner = document.getElementById('cookieBanner');
  const accept = document.getElementById('cookieAccept');
  const decline = document.getElementById('cookieDecline');
  if(banner && accept && decline){
    const saved = localStorage.getItem(KEY);
    if(!saved){ banner.hidden = false; }
    function choose(val){
      localStorage.setItem(KEY, val);
      banner.hidden = true;
    }
    accept.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); choose('accepted'); });
    decline.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); choose('essential'); });
  }

  // Reveal on scroll
  const els = document.querySelectorAll('.reveal');
  if(els.length){
    if(!('IntersectionObserver' in window)){
      els.forEach(el=>el.classList.add('in'));
    }else{
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      els.forEach(el=>io.observe(el));
    }
  }
})();

// ===== Page-specific hooks =====
(function(){
  // FAQ toggles (only if present)
  document.querySelectorAll('.faq-q').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const panel = btn.nextElementSibling;
      btn.setAttribute('aria-expanded', String(!expanded));
      panel.hidden = expanded;
    });
  });

  // Email capture placeholder
  const form = document.getElementById('captureForm');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = document.getElementById('email')?.value?.trim();
      if(!email) return;
      alert('Got it — we will send the quick-start to: ' + email);
      form.reset();
    });
  }

  // Wins ticker (only if present)
  const ticker = document.getElementById('wins-ticker');
  if(ticker){
    const recentWins = [
      '$25 → $240 4-leg NBA parlay last night',
      '8-2 run on primetime NFL plays this month',
      '+6.4u on yesterday’s MLB slate',
      '3-0 sweep on SNF props (alt lines ladder)',
      'Bankroll up double digits this month for members tailing cards'
    ];
    let idx = 0;
    function showNext(){
      ticker.textContent = recentWins[idx];
      idx = (idx + 1) % recentWins.length;
    }
    showNext();
    setInterval(showNext, 3500);
  }

  // Members counter (only if present)
  const members = document.getElementById('members-count');
  if(members){
    const target = 2900;
    const duration = 1300;
    const start = performance.now();

    function tick(now){
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.floor(progress * target);
      members.textContent = value.toLocaleString() + '+';
      if(progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
