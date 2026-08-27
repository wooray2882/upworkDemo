/**
 * Time & Cost Savings Estimator
 * Supports Document Extractor, Finance Tracker, and Review Tracker
 *
 * Deliberately does NOT claim a precise measured accuracy percentage or a
 * benchmarked processing latency down to the millisecond - those were
 * fabricated numbers in an earlier draft of this page (99.4% accuracy,
 * 0.28s latency, etc.). Automated processing time per item is a small,
 * clearly-rounded estimate, and the output is framed as an estimate
 * throughout, not a lab-measured result.
 */
window.LandingCalculator = {
  configs: {
    'doc-extract': {
      unitName: 'documents',
      manualMinutesPerUnit: 5.0,      // typical manual entry time per invoice/receipt
      automatedSecondsPerUnit: 2,     // rounded estimate, not a benchmark
      defaultHourlyWage: 30
    },
    'finance-tracker': {
      unitName: 'transactions',
      manualMinutesPerUnit: 1.5,      // typical time to match, verify, and categorize a line
      automatedSecondsPerUnit: 1,
      defaultHourlyWage: 45
    },
    'review-tracker': {
      unitName: 'reviews',
      manualMinutesPerUnit: 2.0,      // typical time to read, classify, and tag one review
      automatedSecondsPerUnit: 1,
      defaultHourlyWage: 35
    }
  },

  /**
   * Estimate time and cost savings for a given app type and volume.
   */
  calculate: (appType, volume, hourlyWage) => {
    const config = LandingCalculator.configs[appType];
    if (!config) return null;

    const wage = hourlyWage || config.defaultHourlyWage;

    const manualMinutesTotal = volume * config.manualMinutesPerUnit;
    const manualHoursTotal = manualMinutesTotal / 60;
    const manualCostMonthly = manualHoursTotal * wage;

    const automatedSecondsTotal = volume * config.automatedSecondsPerUnit;
    const automatedHoursTotal = automatedSecondsTotal / 3600;

    const hoursSavedMonthly = Math.max(0, manualHoursTotal - automatedHoursTotal);
    // The value of the manual hours eliminated - not a claim about exact
    // infrastructure cost, which varies per client and workload.
    const dollarsSavedMonthly = Math.max(0, manualCostMonthly);
    const dollarsSavedYearly = dollarsSavedMonthly * 12;
    const speedMultiplier = Math.round((config.manualMinutesPerUnit * 60) / config.automatedSecondsPerUnit);

    return {
      volume,
      manualDurationFormatted: LandingCalculator.formatDuration(manualHoursTotal * 3600),
      automatedDurationFormatted: LandingCalculator.formatDuration(automatedSecondsTotal),
      hoursSavedFormatted: Math.round(hoursSavedMonthly * 10) / 10 + ' hrs',
      dollarsSavedMonthlyFormatted: '$' + Math.round(dollarsSavedMonthly).toLocaleString(),
      dollarsSavedYearlyFormatted: '$' + Math.round(dollarsSavedYearly).toLocaleString(),
      speedMultiplier: speedMultiplier + 'x faster (est.)'
    };
  },

  formatDuration: (seconds) => {
    if (seconds < 60) {
      return Math.max(1, Math.round(seconds)) + 's';
    }
    const mins = Math.floor(seconds / 60);
    const remainingSecs = Math.round(seconds % 60);
    if (mins < 60) {
      return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins} min`;
    }
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs} hrs`;
  },

  init: (appType, sliderId, wageId) => {
    const slider = document.getElementById(sliderId);
    if (!slider) return;

    const wageInput = wageId ? document.getElementById(wageId) : null;

    const updateUI = () => {
      const volume = parseInt(slider.value, 10);
      const wage = wageInput ? parseFloat(wageInput.value) : null;
      const res = LandingCalculator.calculate(appType, volume, wage);
      if (!res) return;

      const volDisplay = document.getElementById('calc-vol-display');
      if (volDisplay) volDisplay.innerText = volume.toLocaleString();

      const manualTimeEl = document.getElementById('calc-manual-time');
      if (manualTimeEl) manualTimeEl.innerText = res.manualDurationFormatted;

      const automatedTimeEl = document.getElementById('calc-automated-time');
      if (automatedTimeEl) automatedTimeEl.innerText = res.automatedDurationFormatted;

      const hoursSavedEl = document.getElementById('calc-hours-saved');
      if (hoursSavedEl) hoursSavedEl.innerText = res.hoursSavedFormatted;

      const dollarsMonthEl = document.getElementById('calc-dollars-month');
      if (dollarsMonthEl) dollarsMonthEl.innerText = res.dollarsSavedMonthlyFormatted;

      const dollarsYearEl = document.getElementById('calc-dollars-year');
      if (dollarsYearEl) dollarsYearEl.innerText = res.dollarsSavedYearlyFormatted;

      const speedEl = document.getElementById('calc-speed-multiplier');
      if (speedEl) speedEl.innerText = res.speedMultiplier;
    };

    slider.addEventListener('input', updateUI);
    if (wageInput) wageInput.addEventListener('input', updateUI);

    updateUI();
  }
};
