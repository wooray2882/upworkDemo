/**
 * Bookkeeping & Revenue Tracker View Controller (Primary Demo)
 */

window.BookkeepingView = {
  liveData: null, // flattened transactions from real DynamoDB batches, once loaded

  // Each stored record is one ingested batch (structured_result.transactions[]).
  // Flatten into one row per transaction for the table, synthesizing an id
  // and status since those aren't part of the generic per-batch schema.
  flattenBatches: (batches) => {
    const rows = [];
    batches.forEach(batch => {
      const txns = batch.structured_result?.transactions || [];
      txns.forEach((t, i) => {
        rows.push({
          id: `${batch.id.slice(0, 8)}-${i}`,
          date: t.date || "—",
          vendor: t.vendor || "Unknown",
          category: t.category || "uncategorized",
          amount: Number(t.amount) || 0,
          status: t.category ? "categorized" : "flagged"
        });
      });
    });
    return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  },

  // Real month-by-month expense totals from the flattened rows. There is no
  // "revenue" field anywhere in the bookkeeping-query schema (it's an
  // expense extractor, not a P&L tool), so this is a single expense series,
  // not a fabricated revenue-vs-expense comparison.
  monthlyTotals: (data) => {
    const byMonth = {};
    data.forEach(t => {
      const month = (t.date || "").slice(0, 7); // "2026-03"
      if (!month) return;
      byMonth[month] = (byMonth[month] || 0) + t.amount;
    });
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Object.keys(byMonth).sort().map(key => ({
      label: monthNames[parseInt(key.slice(5, 7), 10) - 1] || key,
      total: byMonth[key]
    }));
  },

  // Real category breakdown (% of total spend) from the flattened rows.
  categoryBreakdown: (data) => {
    const palette = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#a855f7", "#84cc16"];
    const byCategory = {};
    data.forEach(t => {
      const cat = t.category || "uncategorized";
      byCategory[cat] = (byCategory[cat] || 0) + t.amount;
    });
    const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount], i) => ({
        name,
        value: Math.round((amount / total) * 1000) / 10, // one decimal place
        color: palette[i % palette.length]
      }));
  },

  render: () => {
    const mainEl = document.getElementById("view-content");
    if (!mainEl) return;

    const data = BookkeepingView.liveData || [];
    const totalExpenses = data.reduce((sum, t) => sum + t.amount, 0);
    const flaggedCount = data.filter(t => t.status === "flagged").length;
    const avgTransaction = data.length ? totalExpenses / data.length : 0;
    const categoriesTracked = new Set(data.map(t => t.category)).size;

    mainEl.innerHTML = `
      <div class="fade-in" style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Header Info -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Finance Tracker</h1>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              Automatically extracts and categorizes expenses from uploaded invoices and receipts.
            </p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn-secondary" onclick="BookkeepingView.openClearConfirm()" title="Delete all bookkeeping records - for testing with fresh data">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Clear Data
            </button>
            <button class="btn-secondary" style="background: var(--accent-primary); color: white; border-color: transparent;" onclick="BookkeepingView.openSubmitModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Add Transactions
            </button>
          </div>
        </div>

        <!-- KPI Metrics Grid -->
        <div class="metrics-grid">
          <div class="kpi-card" style="--card-accent: var(--accent-danger);">
            <div class="kpi-header">
              <span>Total Expenses</span>
              <div class="kpi-icon">📊</div>
            </div>
            <div class="kpi-value">$${totalExpenses.toFixed(2)}</div>
            <div class="kpi-footer">
              <span class="trend-pill down">${data.length} transactions</span>
              <span style="color: var(--text-muted);">${BookkeepingView.liveData ? "up to date" : "loading..."}</span>
            </div>
          </div>

          <div class="kpi-card" style="--card-accent: var(--accent-primary);">
            <div class="kpi-header">
              <span>Average Transaction</span>
              <div class="kpi-icon">📈</div>
            </div>
            <div class="kpi-value">$${avgTransaction.toFixed(2)}</div>
            <div class="kpi-footer">
              <span class="trend-pill up">${categoriesTracked} categor${categoriesTracked === 1 ? "y" : "ies"}</span>
              <span style="color: var(--text-muted);">tracked across all records</span>
            </div>
          </div>

          <div class="kpi-card" style="--card-accent: var(--accent-warning);">
            <div class="kpi-header">
              <span>Flagged Anomalies</span>
              <div class="kpi-icon">⚠️</div>
            </div>
            <div class="kpi-value">${flaggedCount} ${flaggedCount === 1 ? "Review" : "Reviews"}</div>
            <div class="kpi-footer">
              <span class="trend-pill down" style="background: rgba(245,158,11,0.15); color: var(--accent-warning);">${flaggedCount} Action${flaggedCount === 1 ? "" : "s"}</span>
              <span style="color: var(--text-muted);">missing category / low confidence</span>
            </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="charts-grid">
          <div class="glass-card">
            <div class="chart-card-header">
              <div>
                <div class="chart-title">
                  <span>Monthly Expense Trend</span>
                </div>
                <div class="chart-subtitle">Based on transaction dates and amounts</div>
              </div>
              <div style="display: flex; gap: 16px; font-size: 0.78rem;">
                <span style="display: flex; align-items: center; gap: 6px; color: var(--accent-danger);"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent-danger);"></span> Expenses</span>
              </div>
            </div>
            <div class="chart-container">
              <canvas id="rev-exp-canvas"></canvas>
            </div>
          </div>

          <div class="glass-card">
            <div class="chart-card-header">
              <div>
                <div class="chart-title">Category Breakdown</div>
                <div class="chart-subtitle">Expense distribution across all records</div>
              </div>
            </div>
            <div id="category-donut-container" class="chart-container"></div>
          </div>
        </div>

        <!-- Transactions Data Table Panel -->
        <div class="glass-card">
          <div class="table-controls">
            <div class="search-input-wrapper">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="txn-search" class="search-input" placeholder="Search vendor, category, or ID (e.g. Acme Corp, Software, TXN-9027)..." oninput="BookkeepingView.filterData()">
            </div>
            
            <div class="filter-group">
              <select id="category-filter" class="select-input" onchange="BookkeepingView.filterData()">
                <option value="ALL">All Categories</option>
                ${[...new Set(data.map(t => t.category))].sort().map(c => `<option value="${c}">${c}</option>`).join("")}
              </select>

              <select id="status-filter" class="select-input" onchange="BookkeepingView.filterData()">
                <option value="ALL">All Statuses</option>
                <option value="categorized">Categorized</option>
                <option value="pending">Pending</option>
                <option value="flagged">Flagged Anomaly</option>
              </select>
            </div>
          </div>

          <div id="bookkeeping-table-container"></div>

          <div class="table-footer">
            <span>Showing <strong id="visible-count">${data.length}</strong> of ${data.length} records</span>
            <div class="pagination-buttons">
              <button class="page-btn" disabled>Previous</button>
              <button class="page-btn" disabled>Next</button>
            </div>
          </div>
        </div>

      </div>
    `;

    // Render Charts (real aggregates computed from `data` above - not
    // hardcoded, and not rendered at all until there's real data to show)
    setTimeout(() => {
      ChartRenderer.renderLineChart("rev-exp-canvas", BookkeepingView.monthlyTotals(data));
      ChartRenderer.renderDonutChart("category-donut-container", BookkeepingView.categoryBreakdown(data));
      DataTable.renderBookkeepingTable("bookkeeping-table-container", data);
    }, 50);

    // Initialize RAG chat context
    RAGChat.init("bookkeeping");

    // Fetch real records from DynamoDB (via GET /bookkeeping-query) once,
    // then re-render with live data. No MockAPI fallback - an empty/loading
    // state is shown until this resolves rather than fabricated numbers.
    if (!BookkeepingView.liveData) {
      const tableContainer = document.getElementById("bookkeeping-table-container");
      if (tableContainer) tableContainer.innerHTML = `
        <div style="padding: 32px; text-align: center; color: var(--text-muted);">
          <div class="loading-spinner"></div>
          <div style="font-size: 0.82rem;">Loading transactions...</div>
        </div>`;
      RealAPI.listBookkeepingBatches()
        .then(batches => {
          BookkeepingView.liveData = BookkeepingView.flattenBatches(batches);
          BookkeepingView.render();
        })
        .catch(err => App.showToast(`Could not load stored records: ${err.message}`));
    }
  },

  filterData: () => {
    const query = document.getElementById("txn-search").value.toLowerCase();
    const cat = document.getElementById("category-filter").value;
    const status = document.getElementById("status-filter").value;

    const allData = BookkeepingView.liveData || [];

    const filtered = allData.filter(item => {
      const matchesSearch = item.vendor.toLowerCase().includes(query) ||
                            item.category.toLowerCase().includes(query) ||
                            item.id.toLowerCase().includes(query);
      const matchesCat = (cat === "ALL" || item.category === cat);
      const matchesStatus = (status === "ALL" || item.status === status);

      return matchesSearch && matchesCat && matchesStatus;
    });

    DataTable.renderBookkeepingTable("bookkeeping-table-container", filtered);
    const visibleCountEl = document.getElementById("visible-count");
    if (visibleCountEl) visibleCountEl.textContent = filtered.length;
  },

  // Lets a real user upload their own receipts/expense sheets to test
  // with, instead of only ever resubmitting the same fixed sample data.
  // PDF/image receipts go through Claude's native document/vision support
  // (no Textract); .xlsx expense sheets are parsed directly into rows -
  // see lambdas/bookkeeping-query/ai-call/handler.py.
  openSubmitModal: () => {
    FileUploadModal.open({
      title: "Add Transactions",
      logLabel: "POST /bookkeeping-query",
      description: "Upload receipts (PDF or image) or an expense sheet (.xlsx or .csv). Multiple files at once are fine.",
      accept: ".pdf,image/*,.xlsx,.csv",
      submitFn: (s3Key) => RealAPI.queryBookkeepingFile(s3Key),
      onComplete: async (results) => {
        const total = results.reduce((sum, r) => sum + (r.transaction_count || 0), 0);
        App.showToast(`Done! ${total} transaction(s) categorized.`);
        const batches = await RealAPI.listBookkeepingBatches();
        BookkeepingView.liveData = BookkeepingView.flattenBatches(batches);
        BookkeepingView.render();
      }
    });
  },

  // Deletes every stored bookkeeping record - a "reset to fresh demo
  // data" action for testing, irreversible, so it goes through the
  // shared confirm dialog rather than firing on a single click.
  openClearConfirm: () => {
    Modal.confirm({
      title: "Clear All Finance Data?",
      message: "This permanently deletes every stored transaction record. This can't be undone. Use this to start testing with a clean slate.",
      confirmLabel: "Delete Everything",
      onConfirm: async () => {
        await RealAPI.clearBookkeepingBatches();
        BookkeepingView.liveData = [];
        BookkeepingView.render();
        App.showToast("All bookkeeping data cleared.");
      }
    });
  }
};
