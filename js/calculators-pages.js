/* /js/calculators-pages.js
   One file powering all calculator pages.
   Pages are identified via: <body data-calculator="..."> (odds, unit, parlay, kelly, novig, hedge, ev)
*/
(function () {
  const $ = (id) => document.getElementById(id);

  function toNum(v) {
    if (v == null) return NaN;
    const s = String(v).trim().replace(/,/g, "");
    if (!s) return NaN;
    return Number(s);
  }

  function fmtMoney(n) {
    if (!isFinite(n)) return "—";
    const sign = n < 0 ? "-" : "";
    const x = Math.abs(n);
    return `${sign}$${x.toFixed(2)}`;
  }

  function fmtPct(p) {
    if (!isFinite(p)) return "—";
    return `${p.toFixed(2)}%`;
  }

  function americanToDecimal(a) {
    const A = toNum(a);
    if (!isFinite(A) || A === 0) return NaN;
    if (A > 0) return 1 + A / 100;
    return 1 + 100 / Math.abs(A);
  }

  function decimalToAmerican(d) {
    const D = toNum(d);
    if (!isFinite(D) || D <= 1) return NaN;
    if (D >= 2) return Math.round((D - 1) * 100);
    return -Math.round(100 / (D - 1));
  }

  function impliedProbFromAmerican(a) {
    const A = toNum(a);
    if (!isFinite(A) || A === 0) return NaN;
    if (A > 0) return 100 / (A + 100);
    return Math.abs(A) / (Math.abs(A) + 100);
  }

  function probToAmerican(p) {
    const P = toNum(p);
    if (!isFinite(P) || P <= 0 || P >= 1) return NaN;
    if (P >= 0.5) return -Math.round((P / (1 - P)) * 100);
    return Math.round(((1 - P) / P) * 100);
  }

  function fmtAmerican(a) {
    if (!isFinite(a)) return "—";
    const n = Math.round(a);
    return n > 0 ? `+${n}` : `${n}`;
  }

  // ---------- Mobile fix: American odds sign (+ / -) ----------
  // iOS/Android numeric keypads often hide +/- when inputmode="numeric".
  // We keep the number pad but add small +/- buttons next to American-odds inputs.
  function enhanceAmericanOddsInputs(root) {
    const scope = root || document;

    const selectors = [
      "#oddsAmerican",
      "#kellyOdds",
      "#evOdds",
      "#hedgeOdds1",
      "#hedgeOdds2",
      "#nvA",
      "#nvB",
      ".legOdds"
    ];

    const inputs = Array.from(scope.querySelectorAll(selectors.join(",")))
      .filter((el) => el && el.tagName === "INPUT");

    inputs.forEach((input) => {
      if (input.dataset.signEnhanced === "1") return;

      // If it's already wrapped, just mark as enhanced
      const parent = input.parentElement;
      if (!parent) return;
      if (parent.classList && parent.classList.contains("odds-with-sign")) {
        input.dataset.signEnhanced = "1";
        return;
      }

      const wrap = document.createElement("div");
      wrap.className = "odds-with-sign";

      const btnMinus = document.createElement("button");
      btnMinus.type = "button";
      btnMinus.className = "sign-btn sign-minus";
      btnMinus.setAttribute("aria-label", "Set odds to negative");
      btnMinus.textContent = "−";

      const btnPlus = document.createElement("button");
      btnPlus.type = "button";
      btnPlus.className = "sign-btn sign-plus";
      btnPlus.setAttribute("aria-label", "Set odds to positive");
      btnPlus.textContent = "+";

      // Swap input into wrapper in the same position
      parent.insertBefore(wrap, input);
      wrap.appendChild(btnMinus);
      wrap.appendChild(input);
      wrap.appendChild(btnPlus);

      input.dataset.signEnhanced = "1";

      function updateActive() {
        const v = String(input.value || "").trim();
        btnMinus.classList.toggle("active", v.startsWith("-"));
        btnPlus.classList.toggle("active", v.startsWith("+"));
      }

      function normalizeSign(sign) {
        const raw = String(input.value || "").trim();
        const noSign = raw.replace(/^[\+\-]/, "");
        input.value = (noSign ? (sign + noSign) : sign);

        updateActive();
        input.focus();
        try {
          const end = input.value.length;
          input.setSelectionRange(end, end);
        } catch (_) {}

        // Trigger calculator recalcs
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }

      btnMinus.addEventListener("click", () => normalizeSign("-"));
      btnPlus.addEventListener("click", () => normalizeSign("+"));
      input.addEventListener("input", updateActive);
      updateActive();
    });
  }

  // ---------- Odds page (if you already have it) ----------
  function initOdds() {
    const aIn = $("oddsAmerican");
    const dIn = $("oddsDecimal");
    const outA = $("rOddsAmerican");
    const outD = $("rOddsDecimal");
    const outP = $("rOddsProb");
    const reset = $("oddsReset");

    if (!aIn || !dIn || !outA || !outD || !outP) return;

    function computeFromAmerican() {
      const a = toNum(aIn.value);
      const dec = americanToDecimal(a);
      const p = impliedProbFromAmerican(a);
      outA.textContent = fmtAmerican(a);
      outD.textContent = isFinite(dec) ? dec.toFixed(4) : "—";
      outP.textContent = isFinite(p) ? fmtPct(p * 100) : "—";
    }

    function computeFromDecimal() {
      const d = toNum(dIn.value);
      const a = decimalToAmerican(d);
      const p = isFinite(d) ? (1 / d) : NaN;
      outA.textContent = isFinite(a) ? fmtAmerican(a) : "—";
      outD.textContent = isFinite(d) ? d.toFixed(4) : "—";
      outP.textContent = isFinite(p) ? fmtPct(p * 100) : "—";
    }

    aIn.addEventListener("input", () => {
      if (String(aIn.value).trim() === "") return;
      dIn.value = "";
      computeFromAmerican();
    });

    dIn.addEventListener("input", () => {
      if (String(dIn.value).trim() === "") return;
      aIn.value = "";
      computeFromDecimal();
    });

    if (reset) {
      reset.addEventListener("click", () => {
        aIn.value = "";
        dIn.value = "";
        outA.textContent = "—";
        outD.textContent = "—";
        outP.textContent = "—";
      });
    }
  }

  // ---------- Unit ----------
  function initUnit() {
    const bankroll = $("unitBankroll");
    const pct = $("unitPct");
    const out = $("unitValue");
    const calc = $("unitCalc");
    const reset = $("unitReset");
    if (!bankroll || !pct || !out) return;

    function run() {
      const b = toNum(bankroll.value);
      const p = toNum(pct.value);
      const val = (isFinite(b) && isFinite(p)) ? (b * (p / 100)) : NaN;
      out.textContent = fmtMoney(val);
    }

    (calc || bankroll).addEventListener("click", run);
    bankroll.addEventListener("input", run);
    pct.addEventListener("input", run);

    if (reset) {
      reset.addEventListener("click", () => {
        bankroll.value = "";
        pct.value = "";
        out.textContent = "—";
      });
    }
  }

  // ---------- Parlay ----------
  function initParlay() {
    const stake = $("parlayStake");
    const legsWrap = $("parlayLegs");
    const addLeg = $("addLeg");
    const calc = $("parlayCalc");
    const reset = $("parlayReset");

    const outA = $("parlayAmerican");
    const outD = $("parlayDecimal");
    const outProb = $("parlayProb");
    const outPay = $("parlayPayout");
    const outProf = $("parlayProfit");

    if (!stake || !legsWrap || !addLeg || !outA || !outD || !outProb || !outPay || !outProf) return;

    function makeLeg(i) {
      const row = document.createElement("div");
      row.className = "leg";
      row.innerHTML = `
        <label>Leg ${i}</label>
        <input class="legOdds" type="text" inputmode="numeric" placeholder="-110 or +150">
        <button class="rm" type="button" aria-label="Remove leg">✕</button>
      `;
      row.querySelector(".rm").addEventListener("click", () => {
        row.remove();
        renumber();
        compute();
      });
      row.querySelector(".legOdds").addEventListener("input", compute);
      // Add +/- buttons for mobile numeric keyboards
      enhanceAmericanOddsInputs(row);
      return row;
    }

    function renumber() {
      const rows = Array.from(legsWrap.querySelectorAll(".leg"));
      rows.forEach((r, idx) => {
        const lab = r.querySelector("label");
        if (lab) lab.textContent = `Leg ${idx + 1}`;
      });
    }

    function compute() {
      const s = toNum(stake.value);
      const oddsInputs = Array.from(legsWrap.querySelectorAll(".legOdds"));

      let dec = 1;
      let ok = oddsInputs.length > 0;

      oddsInputs.forEach((inp) => {
        const a = toNum(inp.value);
        const d = americanToDecimal(a);
        if (isFinite(d)) dec *= d;
        else ok = false;
      });

      if (!ok || !isFinite(dec) || dec <= 1) {
        outA.textContent = "—";
        outD.textContent = "—";
        outProb.textContent = "—";
        outPay.textContent = "—";
        outProf.textContent = "—";
        return;
      }

      const am = decimalToAmerican(dec);
      const prob = 1 / dec;

      const payout = (isFinite(s) ? (s * dec) : NaN);
      const profit = (isFinite(s) ? (payout - s) : NaN);

      outA.textContent = fmtAmerican(am);
      outD.textContent = dec.toFixed(4);
      outProb.textContent = fmtPct(prob * 100);
      outPay.textContent = fmtMoney(payout);
      outProf.textContent = fmtMoney(profit);
    }

    function resetAll() {
      stake.value = "";
      legsWrap.innerHTML = "";
      legsWrap.appendChild(makeLeg(1));
      legsWrap.appendChild(makeLeg(2));
      // Ensure any newly created odds inputs get +/- buttons
      enhanceAmericanOddsInputs(legsWrap);
      outA.textContent = "—";
      outD.textContent = "—";
      outProb.textContent = "—";
      outPay.textContent = "—";
      outProf.textContent = "—";
    }

    addLeg.addEventListener("click", () => {
      const count = legsWrap.querySelectorAll(".leg").length;
      legsWrap.appendChild(makeLeg(count + 1));
      enhanceAmericanOddsInputs(legsWrap);
      compute();
    });

    (calc || stake).addEventListener("click", compute);
    stake.addEventListener("input", compute);

    if (reset) reset.addEventListener("click", resetAll);

    // init with 2 legs
    resetAll();
  }

  // ---------- Kelly ----------
  function initKelly() {
    const odds = $("kellyOdds");
    const prob = $("kellyProb");
    const frac = $("kellyFraction");
    const bankroll = $("kellyBankroll");
    const outPct = $("kellyPct");
    const outStake = $("kellyStake");
    const calc = $("kellyCalc");
    const reset = $("kellyReset");

    if (!odds || !prob || !frac || !outPct || !outStake) return;

    function run() {
      const a = toNum(odds.value);
      const p = toNum(prob.value) / 100;
      const f = toNum(frac.value);

      const dec = americanToDecimal(a);
      const b = dec - 1;
      const q = 1 - p;

      let k = (isFinite(b) && isFinite(p) && isFinite(q) && b > 0) ? ((b * p - q) / b) : NaN;
      if (!isFinite(k) || k < 0) k = 0;

      const kFrac = (isFinite(f) && f > 0) ? (k * f) : 0;

      outPct.textContent = isFinite(kFrac) ? fmtPct(kFrac * 100) : "—";

      const br = bankroll ? toNum(bankroll.value) : NaN;
      outStake.textContent = (isFinite(br) && isFinite(kFrac)) ? fmtMoney(br * kFrac) : "—";
    }

    (calc || odds).addEventListener("click", run);
    odds.addEventListener("input", run);
    prob.addEventListener("input", run);
    frac.addEventListener("input", run);
    if (bankroll) bankroll.addEventListener("input", run);

    if (reset) {
      reset.addEventListener("click", () => {
        odds.value = "";
        prob.value = "";
        frac.value = "";
        if (bankroll) bankroll.value = "";
        outPct.textContent = "—";
        outStake.textContent = "—";
      });
    }
  }

  // ---------- No-Vig ----------
  function initNoVig() {
    const a = $("nvA");
    const b = $("nvB");
    const calc = $("nvCalc");
    const reset = $("nvReset");

    const pA = $("nvProbA");
    const pB = $("nvProbB");
    const fA = $("nvFairA");
    const fB = $("nvFairB");
    const vig = $("nvVig");

    if (!a || !b || !pA || !pB || !fA || !fB || !vig) return;

    function run() {
      const A = toNum(a.value);
      const B = toNum(b.value);

      const ia = impliedProbFromAmerican(A);
      const ib = impliedProbFromAmerican(B);

      if (!isFinite(ia) || !isFinite(ib)) {
        pA.textContent = pB.textContent = fA.textContent = fB.textContent = vig.textContent = "—";
        return;
      }

      const sum = ia + ib;
      const fa = ia / sum;
      const fb = ib / sum;

      pA.textContent = fmtPct(fa * 100);
      pB.textContent = fmtPct(fb * 100);
      fA.textContent = fmtAmerican(probToAmerican(fa));
      fB.textContent = fmtAmerican(probToAmerican(fb));
      vig.textContent = fmtPct((sum - 1) * 100);
    }

    (calc || a).addEventListener("click", run);
    a.addEventListener("input", run);
    b.addEventListener("input", run);

    if (reset) {
      reset.addEventListener("click", () => {
        a.value = "";
        b.value = "";
        pA.textContent = pB.textContent = fA.textContent = fB.textContent = vig.textContent = "—";
      });
    }
  }

  // ---------- Hedge (equal-profit hedge) ----------
  function initHedge() {
    const stake1 = $("hedgeStake1");
    const odds1 = $("hedgeOdds1");
    const odds2 = $("hedgeOdds2");
    const outStake2 = $("hedgeStake2");
    const outPA = $("hedgeProfitA");
    const outPB = $("hedgeProfitB");
    const calc = $("hedgeCalc");
    const reset = $("hedgeReset");

    if (!stake1 || !odds1 || !odds2 || !outStake2 || !outPA || !outPB) return;

    function run() {
      const s1 = toNum(stake1.value);
      const d1 = americanToDecimal(toNum(odds1.value));
      const d2 = americanToDecimal(toNum(odds2.value));

      if (!isFinite(s1) || !isFinite(d1) || !isFinite(d2) || d1 <= 1 || d2 <= 1) {
        outStake2.textContent = outPA.textContent = outPB.textContent = "—";
        return;
      }

      // Equal-profit hedge sizing:
      // hedgeStake = originalStake * decOriginal / decHedge
      const s2 = s1 * d1 / d2;

      const profitIfOriginalWins = (s1 * (d1 - 1)) - s2;
      const profitIfHedgeWins = (s2 * (d2 - 1)) - s1;

      outStake2.textContent = fmtMoney(s2);
      outPA.textContent = fmtMoney(profitIfOriginalWins);
      outPB.textContent = fmtMoney(profitIfHedgeWins);
    }

    (calc || stake1).addEventListener("click", run);
    stake1.addEventListener("input", run);
    odds1.addEventListener("input", run);
    odds2.addEventListener("input", run);

    if (reset) {
      reset.addEventListener("click", () => {
        stake1.value = "";
        odds1.value = "";
        odds2.value = "";
        outStake2.textContent = "—";
        outPA.textContent = "—";
        outPB.textContent = "—";
      });
    }
  }

  // ---------- EV ----------
  function initEV() {
    const stake = $("evStake");
    const odds = $("evOdds");
    const prob = $("evProb");
    const outWin = $("evWinProfit");
    const outEV = $("evValue");
    const outROI = $("evRoi");
    const calc = $("evCalc");
    const reset = $("evReset");

    if (!stake || !odds || !prob || !outWin || !outEV || !outROI) return;

    function run() {
      const s = toNum(stake.value);
      const a = toNum(odds.value);
      const p = toNum(prob.value) / 100;

      const dec = americanToDecimal(a);
      if (!isFinite(s) || !isFinite(dec) || dec <= 1 || !isFinite(p) || p < 0 || p > 1) {
        outWin.textContent = outEV.textContent = outROI.textContent = "—";
        return;
      }

      const winProfit = s * (dec - 1);
      const ev = (p * winProfit) + ((1 - p) * (-s));
      const roi = (ev / s) * 100;

      outWin.textContent = fmtMoney(winProfit);
      outEV.textContent = fmtMoney(ev);
      outROI.textContent = fmtPct(roi);
    }

    (calc || stake).addEventListener("click", run);
    stake.addEventListener("input", run);
    odds.addEventListener("input", run);
    prob.addEventListener("input", run);

    if (reset) {
      reset.addEventListener("click", () => {
        stake.value = "";
        odds.value = "";
        prob.value = "";
        outWin.textContent = "—";
        outEV.textContent = "—";
        outROI.textContent = "—";
      });
    }
  }

  // ---------- Boot ----------
  const type = document.body && document.body.dataset ? document.body.dataset.calculator : null;

  // Enable +/- buttons on American odds inputs (mobile numeric keyboard fix)
  enhanceAmericanOddsInputs();

  // Always safe-init odds (only runs if IDs exist)
  initOdds();

  switch (type) {
    case "unit": initUnit(); break;
    case "parlay": initParlay(); break;
    case "kelly": initKelly(); break;
    case "novig": initNoVig(); break;
    case "hedge": initHedge(); break;
    case "ev": initEV(); break;
    default: break;
  }
})();
