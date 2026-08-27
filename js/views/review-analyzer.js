/**
 * Sentiment & Review Analyzer View Controller (`/analyze-reviews`)
 */

window.ReviewAnalyzerView = {
  render: () => {
    const mainEl = document.getElementById("view-content");
    if (!mainEl) return;

    const data = MockAPI.getReviewData();

    mainEl.innerHTML = `
      <div class="fade-in" style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Header Info -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800;">Review Tracker</h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Route: <code>/analyze-reviews</code> — Batch sentiment scoring, aspect analysis & churn risk detection via AWS Bedrock.
            </p>
          </div>
          <button class="btn-secondary" onclick="ReviewAnalyzerView.analyzeBatch()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            Re-Analyze Review Stream
          </button>
        </div>

        <!-- Metrics Grid -->
        <div class="metrics-grid">
          <div class="kpi-card" style="--card-accent: var(--accent-success);">
            <div class="kpi-header">
              <span>Positive Sentiment Rate</span>
              <div class="kpi-icon">😃</div>
            </div>
            <div class="kpi-value">60.0%</div>
            <div class="kpi-footer">
              <span class="trend-pill up">3 of 5 Reviews</span>
              <span style="color: var(--text-muted);">mostly satisfied</span>
            </div>
          </div>

          <div class="kpi-card" style="--card-accent: var(--accent-danger);">
            <div class="kpi-header">
              <span>Negative / Critical Rate</span>
              <div class="kpi-icon">😠</div>
            </div>
            <div class="kpi-value">40.0%</div>
            <div class="kpi-footer">
              <span class="trend-pill down">2 Flagged</span>
              <span style="color: var(--text-muted);">requires support action</span>
            </div>
          </div>

          <div class="kpi-card" style="--card-accent: var(--accent-cyan);">
            <div class="kpi-header">
              <span>Top Pain Point Identified</span>
              <div class="kpi-icon">🚨</div>
            </div>
            <div class="kpi-value" style="font-size: 1.2rem;">Shipping Delay</div>
            <div class="kpi-footer">
              <span style="color: var(--accent-cyan); font-weight: 600;">REV-102 (4-day delay)</span>
            </div>
          </div>
        </div>

        <!-- Review Data Table -->
        <div class="glass-card">
          <div class="chart-card-header">
            <div class="chart-title">Customer Review Entries & AI Analysis</div>
          </div>
          <div id="review-table-container"></div>
        </div>

      </div>
    `;

    setTimeout(() => {
      DataTable.renderReviewTable("review-table-container", data);
    }, 50);

    RAGChat.init("reviews");
  },

  analyzeBatch: async () => {
    App.showToast("Sending review batch to /analyze-reviews...");
    const result = await MockAPI.executeStepFunction("analyze-reviews", { count: 5 });
    App.showToast("Review sentiment & topic extraction completed!");
    App.logApiExecution("POST /analyze-reviews", { batch: 5 }, result);
  }
};
