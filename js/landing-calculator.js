/**
 * Dynamic ROI & Batch Duration Calculator Engine
 * Supports Document Extractor, Finance Tracker, and Review Tracker
 */

window.LandingCalculator = {
  // App-specific operational benchmarks
  configs: {
    'doc-extract': {
      unitName: 'documents',
      unitSingular: 'document',
      manualMinutesPerUnit: 5.0, // 5 min per invoice/receipt manual review & entry
      awsSecondsPerUnit: 0.28,   // 280ms average multimodal extraction on AWS Bedrock
      defaultHourlyWage: 30,     // $30/hour operations clerk
      accuracyRate: '99.4%'
    },
    'finance-tracker': {
      unitName: 'transactions',
      unitSingular: 'transaction',
      manualMinutesPerUnit: 1.5, // 90 seconds to match, verify, and categorize ledger line
      awsSecondsPerUnit: 0.05,   // 50ms Step Functions DynamoDB reconciliation
      defaultHourlyWage: 45,     // $45/hour bookkeeper / junior accountant
      accuracyRate: '99.8%'
    },
    'review-tracker': {
      unitName: 'reviews',
      unitSingular: 'review',
      manualMinutesPerUnit: 2.0, // 2 minutes to read, classify sentiment, tag churn risk
      awsSecondsPerUnit: 0.04,   // 40ms Bedrock batch classification
      defaultHourlyWage: 35,     // $35/hour product analyst
      accuracyRate: '98.9%'
    }
  },

  /**
   * Calculate time and cost savings for a given app type and volume
   */
  calculate: (appType, volume, hourlyWage) => {
    const config = LandingCalculator.configs[appType];
    if (!config) return null;

    const wage = hourlyWage || config.defaultHourlyWage;
    
    // Manual calculations
    const manualMinutesTotal = volume * config.manualMinutesPerUnit;
    const manualHoursTotal = manualMinutesTotal / 60;
    const manualCostMonthly = manualHoursTotal * wage;

    // Automated AWS calculations
    const awsSecondsTotal = volume * config.awsSecondsPerUnit;
    const awsHoursTotal = awsSecondsTotal / 3600;
    const awsCostMonthly = (volume * 0.0015); // Approx AWS serverless execution cost ($0.0015 per item)

    // Net savings
    const hoursSavedMonthly = Math.max(0, manualHoursTotal - awsHoursTotal);
    const dollarsSavedMonthly = Math.max(0, manualCostMonthly - awsCostMonthly);
    const dollarsSavedYearly = dollarsSavedMonthly * 12;
    const speedMultiplier = Math.round((config.manualMinutesPerUnit * 60) / config.awsSecondsPerUnit);

    return {
      volume,
      manualDurationFormatted: LandingCalculator.formatDuration(manualHoursTotal * 3600),
      awsDurationFormatted: LandingCalculator.formatDuration(awsSecondsTotal),
      hoursSavedFormatted: Math.round(hoursSavedMonthly * 10) / 10 + ' hrs',
      dollarsSavedMonthlyFormatted: '$' + Math.round(dollarsSavedMonthly).toLocaleString(),
      dollarsSavedYearlyFormatted: '$' + Math.round(dollarsSavedYearly).toLocaleString(),
      speedMultiplier: speedMultiplier + 'x faster',
      accuracyRate: config.accuracyRate
    };
  },

  /**
   * Helper to format seconds into readable hours, minutes, seconds
   */
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

  /**
   * Attach listener to an interactive slider and update UI metrics
   */
  init: (appType, sliderId, wageId) => {
    const slider = document.getElementById(sliderId);
    if (!slider) return;

    const wageInput = wageId ? document.getElementById(wageId) : null;

    const updateUI = () => {
      const volume = parseInt(slider.value, 10);
      const wage = wageInput ? parseFloat(wageInput.value) : null;
      const res = LandingCalculator.calculate(appType, volume, wage);
      if (!res) return;

      // Update volume display
      const volDisplay = document.getElementById('calc-vol-display');
      if (volDisplay) volDisplay.innerText = volume.toLocaleString();

      // Update manual time vs AWS time
      const manualTimeEl = document.getElementById('calc-manual-time');
      if (manualTimeEl) manualTimeEl.innerText = res.manualDurationFormatted;

      const awsTimeEl = document.getElementById('calc-aws-time');
      if (awsTimeEl) awsTimeEl.innerText = res.awsDurationFormatted;

      // Update savings
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

    // Initial render
    updateUI();
  }
};
