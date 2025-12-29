// ===== Tiny DOM helpers (replaces jQuery) =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ===== Shared utilities =====
(function () {
  // Active nav highlight based on current path
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("[data-nav]").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.classList.add("active");
  });

  // Year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Promo countdown (GLOBAL 3-day cycle for everyone)
  const countdownEl = document.getElementById("promo-countdown");
  if (countdownEl) {
    // Global anchor time (everyone shares the same cycle boundaries)
    // Anchor is midnight Eastern on Dec 29, 2025
    const ANCHOR = new Date("2025-12-29T00:00:00-05:00").getTime();
    const CYCLE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
    const pad2 = (n) => String(n).padStart(2, "0");

    function getEndTime(nowMs) {
      const cyclesSince = Math.floor((nowMs - ANCHOR) / CYCLE_MS);
      return ANCHOR + (cyclesSince + 1) * CYCLE_MS;
    }

    function update() {
      const now = Date.now();
      const end = getEndTime(now);
      const diff = end - now;

      if (diff <= 0) {
        countdownEl.textContent = "00d 00h 00m 00s";
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      countdownEl.textContent = `${pad2(d)}d ${pad2(h)}h ${pad2(m)}m ${pad2(s)}s`;
    }

    update();
    setInterval(update, 1000);
  }

  // Mobile drawer
  const burger = document.getElementById("burger");
  const drawer = document.getElementById("drawer");
  const close = document.getElementById("drawerClose");

  function openDrawer() {
    if (!drawer || !burger) return;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    if (!drawer || !burger) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  if (burger && drawer) {
    burger.addEventListener("click", openDrawer);
    if (close) close.addEventListener("click", closeDrawer);
    drawer.addEventListener("click", (e) => {
      if (e.target === drawer) closeDrawer();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
    document
      .querySelectorAll("[data-close-drawer]")
      .forEach((a) => a.addEventListener("click", closeDrawer));
  }

  // Cookie consent
  const KEY = "ggb_cookie_consent";
  const banner = document.getElementById("cookieBanner");
  const accept = document.getElementById("cookieAccept");
  const decline = document.getElementById("cookieDecline");
  if (banner && accept && decline) {
    const saved = localStorage.getItem(KEY);
    if (!saved) {
      banner.hidden = false;
    }
    function choose(val) {
      localStorage.setItem(KEY, val);
      banner.hidden = true;
    }
    accept.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      choose("accepted");
    });
    decline.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      choose("essential");
    });
  }

  // Reveal on scroll
  const els = document.querySelectorAll(".reveal");
  if (els.length) {
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      els.forEach((el) => io.observe(el));
    }
  }
})();

// ===== Page-specific hooks =====
(function () {
  // FAQ toggles (only if present)
  document.querySelectorAll(".faq-q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const panel = btn.nextElementSibling;
      btn.setAttribute("aria-expanded", String(!expanded));
      if (panel) panel.hidden = expanded;
    });
  });

  // Email capture placeholder
  const form = document.getElementById("captureForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email")?.value?.trim();
      if (!email) return;
      alert("Got it — we will send the quick-start to: " + email);
      form.reset();
    });
  }

  // Wins ticker (only if present)
  const ticker = document.getElementById("wins-ticker");
  if (ticker) {
    const recentWins = [
      "$25 → $240 4-leg NBA parlay last night",
      "8-2 run on primetime NFL plays this month",
      "+6.4u on yesterday’s MLB slate",
      "3-0 sweep on SNF props (alt lines ladder)",
      "Bankroll up double digits this month for members tailing cards",
    ];
    let idx = 0;
    function showNext() {
      ticker.textContent = recentWins[idx];
      idx = (idx + 1) % recentWins.length;
    }
    showNext();
    setInterval(showNext, 3500);
  }

  // Members counter (only if present)
  const members = document.getElementById("members-count");
  if (members) {
    const target = 6300;
    const duration = 1300;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.floor(progress * target);
      members.textContent = value.toLocaleString() + "+";
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // -------- Calculators --------
  (function calculators() {
    if (!document.body.dataset.calculators) return;

    const parseNum = (v) => {
      const n = Number(String(v).replace(/,/g, "").trim());
      return Number.isFinite(n) ? n : NaN;
    };

    const parseAmerican = (v) => {
      const s = String(v || "").trim().replace(/\s+/g, "");
      if (!s) return NaN;
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    };

    const americanToDecimal = (a) => {
      if (!Number.isFinite(a) || a === 0) return NaN;
      return a > 0 ? a / 100 + 1 : 100 / Math.abs(a) + 1;
    };

    const decimalToAmerican = (d) => {
      if (!Number.isFinite(d) || d <= 1) return NaN;
      const a = d >= 2 ? (d - 1) * 100 : -100 / (d - 1);
      return Math.round(a);
    };

    const impliedProbFromDecimal = (d) => {
      if (!Number.isFinite(d) || d <= 1) return NaN;
      return 1 / d;
    };

    const impliedProbFromAmerican = (a) =>
      impliedProbFromDecimal(americanToDecimal(a));

    const fmtMoney = (n) => {
      if (!Number.isFinite(n)) return "—";
      return (
        "$" +
        n.toLocaleString(undefined, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })
      );
    };

    const fmtNum = (n, dp = 2) => {
      if (!Number.isFinite(n)) return "—";
      return n.toLocaleString(undefined, {
        maximumFractionDigits: dp,
        minimumFractionDigits: dp,
      });
    };

    const fmtPct = (p, dp = 2) => {
      if (!Number.isFinite(p)) return "—";
      return (
        (p * 100).toLocaleString(undefined, {
          maximumFractionDigits: dp,
          minimumFractionDigits: dp,
        }) + "%"
      );
    };

    // ---- Odds Converter ----
    (function oddsConverter() {
      const aIn = $("#oc_american");
      const dIn = $("#oc_decimal");
      const out = $("#oc_result");
      if (!aIn || !dIn || !out) return;

      let lock = false;
      const setOut = (a, d) => {
        const p = impliedProbFromDecimal(d);
        out.innerHTML = `
          <div><strong>Decimal:</strong> ${fmtNum(d, 3)}</div>
          <div><strong>American:</strong> ${
            Number.isFinite(a) ? (a > 0 ? "+" : "") + a : "—"
          }</div>
          <span class="muted">Implied probability: ${fmtPct(p, 2)}</span>
        `;
      };

      const onAmerican = () => {
        if (lock) return;
        lock = true;
        const a = parseAmerican(aIn.value);
        const d = americanToDecimal(a);
        if (Number.isFinite(d)) dIn.value = fmtNum(d, 3);
        setOut(a, d);
        lock = false;
      };

      const onDecimal = () => {
        if (lock) return;
        lock = true;
        const d = parseNum(dIn.value);
        const a = decimalToAmerican(d);
        if (Number.isFinite(a))
          aIn.value = (a > 0 ? "+" : "") + String(a);
        setOut(a, d);
        lock = false;
      };

      aIn.addEventListener("input", onAmerican);
      dIn.addEventListener("input", onDecimal);
      onAmerican();
    })();

    // ---- Unit Sizing ----
    (function unitSizing() {
      const bankroll = $("#us_bankroll");
      const pct = $("#us_pct");
      const out = $("#us_result");
      if (!bankroll || !pct || !out) return;

      const calc = () => {
        const b = parseNum(bankroll.value);
        const p = parseNum(pct.value) / 100;
        const u = b * p;
        out.innerHTML = `
          <div><strong>1 Unit:</strong> ${fmtMoney(u)}</div>
          <div><strong>0.5u:</strong> ${fmtMoney(u * 0.5)} &nbsp; <strong>2u:</strong> ${fmtMoney(u * 2)}</div>
          <span class="muted">Tip: many long-term bettors use 0.5%–2% per unit depending on variance.</span>
        `;
      };

      bankroll.addEventListener("input", calc);
      pct.addEventListener("input", calc);
      calc();
    })();

    // ---- Parlay ----
    (function parlay() {
      const list = $("#parlay_legs");
      const addBtn = $("#parlay_add");
      const stakeIn = $("#parlay_stake");
      const out = $("#parlay_result");
      if (!list || !addBtn || !stakeIn || !out) return;

      const addLeg = (value = "") => {
        const row = document.createElement("div");
        row.className = "calc-leg";
        row.innerHTML = `
          <input type="text" placeholder="+150 or -120" value="${value}">
          <button type="button" class="remove-leg">Remove</button>
        `;
        $("button.remove-leg", row).addEventListener("click", () => {
          row.remove();
          calc();
        });
        $("input", row).addEventListener("input", calc);
        list.appendChild(row);
      };

      const calc = () => {
        const stake = parseNum(stakeIn.value);
        const odds = $$("input", list)
          .map((i) => parseAmerican(i.value))
          .filter((n) => Number.isFinite(n));

        if (!odds.length) {
          out.innerHTML = `<div>Enter at least one leg to see results.</div>`;
          return;
        }

        const decimals = odds
          .map(americanToDecimal)
          .filter((d) => Number.isFinite(d));

        const combinedDec = decimals.reduce((acc, d) => acc * d, 1);
        const combinedAmer = decimalToAmerican(combinedDec);
        const implied = impliedProbFromDecimal(combinedDec);

        const payout = Number.isFinite(stake) ? stake * combinedDec : NaN;
        const profit = Number.isFinite(stake) ? payout - stake : NaN;

        out.innerHTML = `
          <div><strong>Combined Odds:</strong> ${
            Number.isFinite(combinedAmer)
              ? (combinedAmer > 0 ? "+" : "") + combinedAmer
              : "—"
          } &nbsp; <span class="muted">(Decimal ${fmtNum(combinedDec, 3)})</span></div>
          <div><strong>Implied probability:</strong> ${fmtPct(implied, 2)}</div>
          <div><strong>Payout:</strong> ${fmtMoney(payout)} &nbsp; <strong>Profit:</strong> ${fmtMoney(profit)}</div>
        `;
      };

      addBtn.addEventListener("click", () => addLeg(""));
      stakeIn.addEventListener("input", calc);

      if (!$$(".calc-leg", list).length) {
        addLeg("");
        addLeg("");
        addLeg("");
      }
      calc();
    })();

    // ---- Kelly Criterion ----
    (function kelly() {
      const bankroll = $("#k_bankroll");
      const oddsIn = $("#k_odds");
      const probIn = $("#k_prob");
      const fracIn = $("#k_frac");
      const out = $("#k_result");
      if (!bankroll || !oddsIn || !probIn || !fracIn || !out) return;

      const calc = () => {
        const b = parseNum(bankroll.value);
        const a = parseAmerican(oddsIn.value);
        const p = parseNum(probIn.value) / 100;
        const f = parseNum(fracIn.value) / 100;

        const d = americanToDecimal(a);
        const q = 1 - p;
        const bp = d - 1;

        const k = (bp * p - q) / bp;
        const kAdj = k * f;
        const stake = b * Math.max(0, kAdj);

        out.innerHTML = `
          <div><strong>Full Kelly:</strong> ${fmtPct(k, 2)}</div>
          <div><strong>${fmtNum(f * 100, 0)}% Kelly:</strong> ${fmtPct(kAdj, 2)}</div>
          <div><strong>Suggested stake:</strong> ${fmtMoney(stake)}</div>
          <span class="muted">Only use if you can estimate true win probability. Many bettors use 10%–50% Kelly to reduce volatility.</span>
        `;
      };

      [bankroll, oddsIn, probIn, fracIn].forEach((el) =>
        el.addEventListener("input", calc)
      );
      calc();
    })();

    // ---- Vig / No-Vig ----
    (function vig() {
      const a1 = $("#vig_a1");
      const a2 = $("#vig_a2");
      const out = $("#vig_result");
      if (!a1 || !a2 || !out) return;

      const calc = () => {
        const o1 = parseAmerican(a1.value);
        const o2 = parseAmerican(a2.value);
        const p1 = impliedProbFromAmerican(o1);
        const p2 = impliedProbFromAmerican(o2);
        const over = p1 + p2;
        const nv1 = p1 / over;
        const nv2 = p2 / over;
        const fair1 = decimalToAmerican(1 / nv1);
        const fair2 = decimalToAmerican(1 / nv2);

        out.innerHTML = `
          <div><strong>Implied:</strong> ${fmtPct(p1, 2)} / ${fmtPct(p2, 2)}</div>
          <div><strong>Overround (vig):</strong> ${fmtPct(over - 1, 2)}</div>
          <div><strong>No-vig:</strong> ${fmtPct(nv1, 2)} / ${fmtPct(nv2, 2)}</div>
          <div><strong>Fair odds:</strong> ${
            Number.isFinite(fair1) ? (fair1 > 0 ? "+" : "") + fair1 : "—"
          } / ${
            Number.isFinite(fair2) ? (fair2 > 0 ? "+" : "") + fair2 : "—"
          }</div>
        `;
      };

      [a1, a2].forEach((el) => el.addEventListener("input", calc));
      calc();
    })();

    // ---- Hedge (equal profit) ----
    (function hedge() {
      const stakeA = $("#h_stakeA");
      const oddsA = $("#h_oddsA");
      const oddsB = $("#h_oddsB");
      const out = $("#h_result");
      if (!stakeA || !oddsA || !oddsB || !out) return;

      const calc = () => {
        const sA = parseNum(stakeA.value);
        const aA = parseAmerican(oddsA.value);
        const aB = parseAmerican(oddsB.value);
        const dA = americanToDecimal(aA);
        const dB = americanToDecimal(aB);

        if (![sA, dA, dB].every(Number.isFinite)) {
          out.innerHTML = `<div>Enter stake + both odds to calculate.</div>`;
          return;
        }

        const sB = (sA * dA) / dB;

        const profitA = sA * (dA - 1) - sB;
        const profitB = sB * (dB - 1) - sA;

        out.innerHTML = `
          <div><strong>Hedge stake:</strong> ${fmtMoney(sB)}</div>
          <div><strong>Profit if A wins:</strong> ${fmtMoney(profitA)}</div>
          <div><strong>Profit if B wins:</strong> ${fmtMoney(profitB)}</div>
          <span class="muted">This targets equal profit on either outcome (ignores fees/limits).</span>
        `;
      };

      [stakeA, oddsA, oddsB].forEach((el) => el.addEventListener("input", calc));
      calc();
    })();

    // ---- Expected Value ----
    (function ev() {
      const stake = $("#ev_stake");
      const odds = $("#ev_odds");
      const prob = $("#ev_prob");
      const out = $("#ev_result");
      if (!stake || !odds || !prob || !out) return;

      const calc = () => {
        const s = parseNum(stake.value);
        const a = parseAmerican(odds.value);
        const p = parseNum(prob.value) / 100;
        const d = americanToDecimal(a);

        if (![s, p, d].every(Number.isFinite)) {
          out.innerHTML = `<div>Enter stake, odds, and win probability.</div>`;
          return;
        }

        const winProfit = s * (d - 1);
        const loss = -s;
        const ev = p * winProfit + (1 - p) * loss;
        const roi = ev / s;

        out.innerHTML = `
          <div><strong>EV:</strong> ${fmtMoney(ev)}</div>
          <div><strong>ROI:</strong> ${fmtPct(roi, 2)}</div>
          <span class="muted">EV is an estimate and depends entirely on your true probability.</span>
        `;
      };

      [stake, odds, prob].forEach((el) => el.addEventListener("input", calc));
      calc();
    })();
  })();
})();
