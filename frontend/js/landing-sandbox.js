/**
 * Interactive Live Batch Sandbox Simulator
 * Demonstrates a multi-step automated processing flow, a timer, and the
 * kind of structured output the real pipeline produces - illustrative
 * sample data, not a live call to the actual backend.
 */

window.LandingSandbox = {
  activeTimer: null,
  startTime: null,

  sampleData: {
    'doc-extract': {
      items: [
        { id: "INV-2026-881", vendor: "CloudFlare Technologies", total: "$1,450.00", tax: "$116.00", dueDate: "2026-09-15", status: "Reviewed" },
        { id: "INV-2026-882", vendor: "Snowflake Computing Inc", total: "$3,820.50", tax: "$305.64", dueDate: "2026-09-20", status: "Reviewed" },
        { id: "INV-2026-883", vendor: "Datadog Observability", total: "$890.00", tax: "$71.20", dueDate: "2026-09-22", status: "Reviewed" }
      ],
      resultSummary: {
        status: "complete",
        documents_processed: 3,
        flagged_for_review: 0
      }
    },

    'finance-tracker': {
      items: [
        { id: "TX-7091", date: "2026-08-27", merchant: "CloudGrid Hosting", category: "Software & Cloud", amount: "-$438.20", status: "Reconciled", anomaly: "None" },
        { id: "TX-7092", date: "2026-08-27", merchant: "Slack Technologies Inc", category: "Collaboration Tools", amount: "-$150.00", status: "Reconciled", anomaly: "None" },
        { id: "TX-7093", date: "2026-08-27", merchant: "Unknown Vendor (POS-449)", category: "Uncategorized Expense", amount: "-$750.00", status: "Flagged for Review", anomaly: "Duplicate charge warning (matched TX-6981)" }
      ],
      resultSummary: {
        status: "complete",
        transactions_processed: 3,
        flagged_for_review: 1
      }
    },

    'review-tracker': {
      items: [
        { id: "REV-441", source: "App Store", customer: "Elena R.", rating: "5/5", sentiment: "Positive", aspect: "Performance / Speed", churnRisk: "Low", snippet: "The batch processing speed is unbelievable. Saved our team hours this week." },
        { id: "REV-442", source: "Trustpilot", customer: "Marcus K.", rating: "2/5", sentiment: "Negative", aspect: "Billing & Invoicing", churnRisk: "HIGH RISK", snippet: "Charged twice for the enterprise tier. Support took 3 days to respond." },
        { id: "REV-443", source: "G2 Crowd", customer: "DevOps Lead", rating: "4/5", sentiment: "Positive", aspect: "Onboarding", churnRisk: "Low", snippet: "Setup was fast and the integration was clean." }
      ],
      resultSummary: {
        status: "complete",
        reviews_processed: 3,
        high_churn_risk_flagged: 1
      }
    }
  },

  runBatch: (appType) => {
    const btn = document.getElementById('btn-run-batch');
    const stopwatch = document.getElementById('batch-stopwatch');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const step4 = document.getElementById('step-4');
    const outputContainer = document.getElementById('sandbox-output');
    const jsonContainer = document.getElementById('sandbox-json');

    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = `<span class="dot" style="background:#06b6d4;"></span> Processing...`;

    [step1, step2, step3, step4].forEach(s => {
      if (s) s.className = 'pipeline-step';
    });

    let msElapsed = 0;
    if (stopwatch) stopwatch.innerText = "0.00s";
    clearInterval(LandingSandbox.activeTimer);
    LandingSandbox.startTime = performance.now();
    LandingSandbox.activeTimer = setInterval(() => {
      msElapsed = performance.now() - LandingSandbox.startTime;
      if (stopwatch) stopwatch.innerText = (msElapsed / 1000).toFixed(2) + 's';
    }, 40);

    if (step1) step1.className = 'pipeline-step active';

    setTimeout(() => {
      if (step1) step1.className = 'pipeline-step completed';
      if (step2) step2.className = 'pipeline-step active';
    }, 280);

    setTimeout(() => {
      if (step2) step2.className = 'pipeline-step completed';
      if (step3) step3.className = 'pipeline-step active';
    }, 620);

    setTimeout(() => {
      if (step3) step3.className = 'pipeline-step completed';
      if (step4) step4.className = 'pipeline-step active';
    }, 880);

    setTimeout(() => {
      clearInterval(LandingSandbox.activeTimer);
      const totalTime = ((performance.now() - LandingSandbox.startTime) / 1000).toFixed(2);
      if (stopwatch) stopwatch.innerText = totalTime + 's (Finished)';

      if (step4) step4.className = 'pipeline-step completed';

      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Run Batch Again`;

      LandingSandbox.renderOutput(appType, outputContainer, jsonContainer);
    }, 1150);
  },

  renderOutput: (appType, cardContainer, jsonContainer) => {
    const data = LandingSandbox.sampleData[appType];
    if (!data) return;

    if (jsonContainer) {
      jsonContainer.innerText = JSON.stringify(data.resultSummary, null, 2);
    }

    if (!cardContainer) return;

    if (appType === 'doc-extract') {
      cardContainer.innerHTML = data.items.map(item => `
        <div style="padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #ffffff; font-size: 0.88rem;">${item.id} — ${item.vendor}</strong>
            <span style="font-size: 0.72rem; color: #10b981; background: rgba(16,185,129,0.1); padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(16,185,129,0.3);">
              ${item.status}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8;">
            <span>Total: <strong style="color: #38bdf8;">${item.total}</strong> (Tax: ${item.tax})</span>
            <span>Due: ${item.dueDate}</span>
          </div>
        </div>
      `).join('');
    } else if (appType === 'finance-tracker') {
      cardContainer.innerHTML = data.items.map(item => `
        <div style="padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid ${item.status === 'Flagged for Review' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.08)'}; border-radius: 8px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #ffffff; font-size: 0.88rem;">${item.id} — ${item.merchant}</strong>
            <span style="font-size: 0.72rem; color: ${item.status === 'Flagged for Review' ? '#ef4444' : '#10b981'}; background: ${item.status === 'Flagged for Review' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.1)'}; padding: 2px 8px; border-radius: 12px;">
              ${item.status}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8;">
            <span>Category: <strong style="color: #f59e0b;">${item.category}</strong></span>
            <span style="font-weight: 700; color: #ffffff;">${item.amount}</span>
          </div>
          ${item.anomaly !== 'None' ? `<div style="font-size: 0.75rem; color: #ef4444; margin-top: 6px;">⚠️ ${item.anomaly}</div>` : ''}
        </div>
      `).join('');
    } else if (appType === 'review-tracker') {
      cardContainer.innerHTML = data.items.map(item => `
        <div style="padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid ${item.churnRisk === 'HIGH RISK' ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255,255,255,0.08)'}; border-radius: 8px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #ffffff; font-size: 0.88rem;">${item.customer} (${item.source})</strong>
            <span style="font-size: 0.72rem; color: ${item.sentiment === 'Positive' ? '#10b981' : '#f43f5e'}; background: ${item.sentiment === 'Positive' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.15)'}; padding: 2px 8px; border-radius: 12px;">
              ${item.rating} • ${item.sentiment}
            </span>
          </div>
          <p style="font-size: 0.8rem; color: #cbd5e1; font-style: italic; margin-bottom: 6px;">"${item.snippet}"</p>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8;">
            <span>Aspect: <strong style="color: #a855f7;">${item.aspect}</strong></span>
            <span style="color: ${item.churnRisk === 'HIGH RISK' ? '#f43f5e' : '#10b981'}; font-weight: 600;">Churn Risk: ${item.churnRisk}</span>
          </div>
        </div>
      `).join('');
    }
  }
};
