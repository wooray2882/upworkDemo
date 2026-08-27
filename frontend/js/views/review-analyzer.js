/**
 * Sentiment & Review Analyzer View Controller (`/analyze-reviews`)
 */

window.ReviewAnalyzerView = {
  liveData: null, // flattened notable reviews from real DynamoDB batches, once loaded
  rawBatches: null, // unflattened batches, kept around for topThemes() (top_themes is batch-level, not per-review)

  // Aggregates each batch's structured_result.top_themes (Bedrock's own
  // theme extraction, already computed - not re-derived here) across all
  // loaded batches, ranked by how often each theme recurs. Replaces the
  // old "Top Pain Point" card, which showed one truncated review sentence
  // and a meaningless internal row id - themes are the actual glanceable,
  // visual data point this card should surface.
  topThemes: (batches) => {
    const counts = {};
    (batches || []).forEach(batch => {
      (batch.structured_result?.top_themes || []).forEach(theme => {
        const key = (theme || "").trim();
        if (!key) return;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  },

  // Each stored record is one analyzed batch (structured_result.notable_reviews[]
  // holds the standout examples, not every review). Flatten into table rows -
  // author/rating/score/keyTopic aren't part of the generic per-batch schema,
  // so they're reasonable derived approximations, not stored values.
  // keyTopic used to be `reason` hard-cut at 40 characters, which chopped
  // real sentences mid-word (e.g. "...creating strong" instead of
  // "...creating strong negative experience; 1-star rating.") - it's a full
  // clause from Bedrock, not a short tag, so it's kept whole here.
  flattenBatches: (batches) => {
    const rows = [];
    const sentimentRating = { positive: 5, neutral: 3, negative: 1 };
    batches.forEach(batch => {
      const notable = batch.structured_result?.notable_reviews || [];
      notable.forEach((r, i) => {
        rows.push({
          id: `${batch.id.slice(0, 8)}-${i}`,
          author: `Batch ${batch.created_at.slice(0, 10)}`,
          rating: sentimentRating[r.sentiment] ?? 3,
          text: r.excerpt || "",
          sentiment: r.sentiment || "neutral",
          score: 0.85,
          keyTopic: r.reason || ""
        });
      });
    });
    return rows;
  },

  render: () => {
    const mainEl = document.getElementById("view-content");
    if (!mainEl) return;

    const data = ReviewAnalyzerView.liveData || [];
    const positiveCount = data.filter(r => r.sentiment === "positive").length;
    const negativeCount = data.filter(r => r.sentiment === "negative").length;
    const positiveRate = data.length ? (positiveCount / data.length * 100) : 0;
    const negativeRate = data.length ? (negativeCount / data.length * 100) : 0;
    const themes = ReviewAnalyzerView.topThemes(ReviewAnalyzerView.rawBatches);

    mainEl.innerHTML = `
      <div class="fade-in" style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Header Info -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800;">Review &amp; Sentiment</h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Automatically scores customer sentiment and surfaces common pain points and themes.
            </p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn-secondary" onclick="ReviewAnalyzerView.openClearConfirm()" title="Delete all review records - for testing with fresh data">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Clear Data
            </button>
            <button class="btn-secondary" style="background: var(--accent-primary); color: white; border-color: transparent;" onclick="ReviewAnalyzerView.openSubmitModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Analyze New Reviews
            </button>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="metrics-grid">
          <div class="kpi-card" style="--card-accent: var(--accent-success);">
            <div class="kpi-header">
              <span>Positive Sentiment Rate</span>
              <div class="kpi-icon">😃</div>
            </div>
            <div class="kpi-value">${positiveRate.toFixed(1)}%</div>
            <div class="kpi-footer">
              <span class="trend-pill up">${positiveCount} of ${data.length} Reviews</span>
              <span style="color: var(--text-muted);">${ReviewAnalyzerView.liveData ? "up to date" : "loading..."}</span>
            </div>
          </div>

          <div class="kpi-card" style="--card-accent: var(--accent-danger);">
            <div class="kpi-header">
              <span>Negative / Critical Rate</span>
              <div class="kpi-icon">😠</div>
            </div>
            <div class="kpi-value">${negativeRate.toFixed(1)}%</div>
            <div class="kpi-footer">
              <span class="trend-pill down">${negativeCount} Flagged</span>
              <span style="color: var(--text-muted);">requires support action</span>
            </div>
          </div>

          <div class="kpi-card" style="--card-accent: var(--accent-cyan);">
            <div class="kpi-header">
              <span>Themes Identified</span>
              <div class="kpi-icon">🏷️</div>
            </div>
            <div class="kpi-value">${themes.length}</div>
            <div class="kpi-footer">
              <span class="trend-pill up">${themes[0] ? `${themes[0].count}x` : "0"} Top Theme</span>
              <span style="color: var(--text-muted);">${themes[0] ? themes[0].name : "no themes yet"}</span>
            </div>
          </div>
        </div>

        <!-- Review Data Table -->
        <div class="glass-card">
          <div class="chart-card-header">
            <div class="chart-title">Customer Review Entries</div>
          </div>
          <div id="review-table-container"></div>
        </div>

      </div>
    `;

    setTimeout(() => {
      DataTable.renderReviewTable("review-table-container", data);
    }, 50);

    RAGChat.init("reviews");

    // Fetch real records from DynamoDB (via GET /analyze-reviews) once,
    // then re-render with live data instead of MockAPI's static sample rows.
    if (!ReviewAnalyzerView.liveData) {
      RealAPI.listReviewBatches()
        .then(batches => {
          ReviewAnalyzerView.rawBatches = batches;
          ReviewAnalyzerView.liveData = ReviewAnalyzerView.flattenBatches(batches);
          ReviewAnalyzerView.render();
        })
        .catch(err => App.showToast(`Could not load stored records: ${err.message}`));
    }
  },

  // Lets a real user upload their own reviews to test with, instead of
  // only ever resubmitting the same fixed sample data. PDF/image review
  // exports go through Claude's native document/vision support (no
  // Textract); .xlsx review exports are parsed directly into rows - see
  // lambdas/analyze-reviews/ai-call/handler.py.
  openSubmitModal: () => {
    FileUploadModal.open({
      title: "Analyze New Reviews",
      logLabel: "POST /analyze-reviews",
      description: "Upload a review export (PDF, image, or .xlsx). Multiple files at once are fine.",
      accept: ".pdf,image/*,.xlsx",
      submitFn: (s3Key) => RealAPI.analyzeReviewsFile(s3Key),
      onComplete: async (results) => {
        const total = results.reduce((sum, r) => sum + (r.review_count || 0), 0);
        App.showToast(`Done! ${total} review(s) analyzed.`);
        const batches = await RealAPI.listReviewBatches();
        ReviewAnalyzerView.rawBatches = batches;
        ReviewAnalyzerView.liveData = ReviewAnalyzerView.flattenBatches(batches);
        ReviewAnalyzerView.render();
      }
    });
  },

  // Deletes every stored review record - a "reset to fresh demo data"
  // action for testing, irreversible, so it goes through the shared
  // confirm dialog rather than firing on a single click.
  openClearConfirm: () => {
    Modal.confirm({
      title: "Clear All Review Data?",
      message: "This permanently deletes every stored review batch. This can't be undone. Use this to start testing with a clean slate.",
      confirmLabel: "Delete Everything",
      onConfirm: async () => {
        await RealAPI.clearReviewBatches();
        ReviewAnalyzerView.rawBatches = [];
        ReviewAnalyzerView.liveData = [];
        ReviewAnalyzerView.render();
        App.showToast("All review data cleared.");
      }
    });
  }
};
