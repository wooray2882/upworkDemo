/**
 * Interactive Live Batch Sandbox Simulator
 * Demonstrates AWS Step Functions execution flow, latency counters, and structured output
 */

window.LandingSandbox = {
  activeTimer: null,
  startTime: null,

  sampleData: {
    'doc-extract': {
      items: [
        {
          id: "INV-2026-881",
          vendor: "CloudFlare Technologies",
          total: "$1,450.00",
          tax: "$116.00",
          dueDate: "2026-09-15",
          lineItemsCount: 4,
          confidence: 0.998,
          validation: "PASSED (KMS Signed)"
        },
        {
          id: "INV-2026-882",
          vendor: "Snowflake Computing Inc",
          total: "$3,820.50",
          tax: "$305.64",
          dueDate: "2026-09-20",
          lineItemsCount: 2,
          confidence: 0.994,
          validation: "PASSED (KMS Signed)"
        },
        {
          id: "INV-2026-883",
          vendor: "Datadog Observability",
          total: "$890.00",
          tax: "$71.20",
          dueDate: "2026-09-22",
          lineItemsCount: 1,
          confidence: 0.991,
          validation: "PASSED (KMS Signed)"
        }
      ],
      rawPayloadPreview: {
        "executionArn": "arn:aws:states:us-east-1:123456789012:execution:DocumentExtractPipeline:exec-99a",
        "model": "anthropic.claude-3-sonnet-20240229-v1:0",
        "latency_ms": 342,
        "schema_valid": true,
        "extracted_entities": {
          "vendor": "CloudFlare Technologies",
          "invoice_number": "INV-2026-881",
          "total_amount": 1450.00,
          "currency": "USD",
          "confidence_score": 0.998
        }
      }
    },

    'finance-tracker': {
      items: [
        {
          id: "TX-7091",
          date: "2026-08-27",
          merchant: "AWS EMEA Cloud Infrastructure",
          category: "Software & Cloud",
          amount: "-$438.20",
          status: "Reconciled",
          confidence: 0.999,
          anomaly: "None"
        },
        {
          id: "TX-7092",
          date: "2026-08-27",
          merchant: "Slack Technologies Inc",
          category: "Collaboration Tools",
          amount: "-$150.00",
          status: "Reconciled",
          confidence: 0.995,
          anomaly: "None"
        },
        {
          id: "TX-7093",
          date: "2026-08-27",
          merchant: "Unknown Vendor (POS-449)",
          category: "Uncategorized Expense",
          amount: "-$750.00",
          status: "Flagged for Review",
          confidence: 0.812,
          anomaly: "Duplicate charge warning (matched TX-6981)"
        }
      ],
      rawPayloadPreview: {
        "executionArn": "arn:aws:states:us-east-1:123456789012:execution:FinanceTrackerState:exec-44f",
        "ledger_batch_id": "BATCH-FIN-8812",
        "transactions_parsed": 3,
        "reconciliation_rate": "100%",
        "anomalies_detected": 1,
        "dynamodb_persisted": true
      }
    },

    'review-tracker': {
      items: [
        {
          id: "REV-441",
          source: "App Store",
          customer: "Elena R.",
          rating: "5/5",
          sentiment: "Positive",
          sentimentScore: 0.98,
          aspect: "Performance / Speed",
          churnRisk: "Low",
          snippet: "The batch processing speed is unbelievable. Saved our team hours this week."
        },
        {
          id: "REV-442",
          source: "Trustpilot",
          customer: "Marcus K.",
          rating: "2/5",
          sentiment: "Negative",
          sentimentScore: 0.94,
          aspect: "Billing & Invoicing",
          churnRisk: "HIGH RISK",
          snippet: "Charged twice for the enterprise tier. Support took 3 days to respond."
        },
        {
          id: "REV-443",
          source: "G2 Crowd",
          customer: "DevOps Lead",
          rating: "4/5",
          sentiment: "Positive",
          sentimentScore: 0.87,
          aspect: "AWS Integration",
          churnRisk: "Low",
          snippet: "Setup via Terraform took 10 minutes. Clean IAM policies."
        }
      ],
      rawPayloadPreview: {
        "executionArn": "arn:aws:states:us-east-1:123456789012:execution:ReviewAnalyzerPipeline:exec-12b",
        "reviews_ingested": 3,
        "sentiment_distribution": {
          "positive": 2,
          "negative": 1,
          "neutral": 0
        },
        "critical_churn_alerts_sent": 1,
        "latency_ms": 118
      }
    }
  },

  /**
   * Run the interactive batch simulation
   */
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
    btn.innerHTML = `<span class="dot" style="background:#06b6d4;"></span> Executing Step Functions...`;

    // Reset steps
    [step1, step2, step3, step4].forEach(s => {
      if (s) s.className = 'pipeline-step';
    });

    // Start timer
    let msElapsed = 0;
    if (stopwatch) stopwatch.innerText = "0.00s";
    clearInterval(LandingSandbox.activeTimer);
    LandingSandbox.startTime = performance.now();
    LandingSandbox.activeTimer = setInterval(() => {
      msElapsed = performance.now() - LandingSandbox.startTime;
      if (stopwatch) stopwatch.innerText = (msElapsed / 1000).toFixed(2) + 's';
    }, 40);

    // Step 1: Ingestion
    if (step1) step1.className = 'pipeline-step active';

    setTimeout(() => {
      if (step1) step1.className = 'pipeline-step completed';
      if (step2) step2.className = 'pipeline-step active';
    }, 280);

    // Step 2: Bedrock AI Execution
    setTimeout(() => {
      if (step2) step2.className = 'pipeline-step completed';
      if (step3) step3.className = 'pipeline-step active';
    }, 620);

    // Step 3: Schema Validation
    setTimeout(() => {
      if (step3) step3.className = 'pipeline-step completed';
      if (step4) step4.className = 'pipeline-step active';
    }, 880);

    // Step 4: DynamoDB / Vector Committal & Render Output
    setTimeout(() => {
      clearInterval(LandingSandbox.activeTimer);
      const totalTime = ((performance.now() - LandingSandbox.startTime) / 1000).toFixed(2);
      if (stopwatch) stopwatch.innerText = totalTime + 's (Finished)';

      if (step4) step4.className = 'pipeline-step completed';

      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Run Batch Again`;

      // Render cards
      LandingSandbox.renderOutput(appType, outputContainer, jsonContainer);
    }, 1150);
  },

  renderOutput: (appType, cardContainer, jsonContainer) => {
    const data = LandingSandbox.sampleData[appType];
    if (!data) return;

    if (jsonContainer) {
      jsonContainer.innerText = JSON.stringify(data.rawPayloadPreview, null, 2);
    }

    if (!cardContainer) return;

    if (appType === 'doc-extract') {
      cardContainer.innerHTML = data.items.map(item => `
        <div style="padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #ffffff; font-size: 0.88rem;">${item.id} — ${item.vendor}</strong>
            <span style="font-size: 0.72rem; color: #10b981; background: rgba(16,185,129,0.1); padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(16,185,129,0.3);">
              ${(item.confidence * 100).toFixed(1)}% Conf
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
