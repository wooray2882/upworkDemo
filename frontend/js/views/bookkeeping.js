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

  render: () => {
    const mainEl = document.getElementById("view-content");
    if (!mainEl) return;

    const data = BookkeepingView.liveData || MockAPI.getBookkeepingData();
    const totalExpenses = data.reduce((sum, t) => sum + t.amount, 0);
    const flaggedCount = data.filter(t => t.status === "flagged").length;

    mainEl.innerHTML = `
      <div class="fade-in" style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Header Info -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Bookkeeping & Revenue Tracker</h1>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              AWS Step Functions + Bedrock Knowledge Base RAG pipeline querying DynamoDB bookkeeping records.
            </p>
          </div>
          <button class="btn-secondary" onclick="BookkeepingView.simulateBatchUpload()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Upload Invoices Batch
          </button>
        </div>

        <!-- KPI Metrics Grid -->
        <div class="metrics-grid">
          <div class="kpi-card" style="--card-accent: var(--accent-success);">
            <div class="kpi-header">
              <span>Total Revenue (March)</span>
              <div class="kpi-icon">💰</div>
            </div>
            <div class="kpi-value">$7,500.00</div>
            <div class="kpi-footer">
              <span class="trend-pill up">↑ +21%</span>
              <span style="color: var(--text-muted);">vs. last month</span>
            </div>
          </div>

          <div class="kpi-card" style="--card-accent: var(--accent-danger);">
            <div class="kpi-header">
              <span>Total Expenses</span>
              <div class="kpi-icon">📊</div>
            </div>
            <div class="kpi-value">$${totalExpenses.toFixed(2)}</div>
            <div class="kpi-footer">
              <span class="trend-pill down">${data.length} transactions</span>
              <span style="color: var(--text-muted);">${BookkeepingView.liveData ? "live from DynamoDB" : "sample data"}</span>
            </div>
          </div>

          <div class="kpi-card" style="--card-accent: var(--accent-primary);">
            <div class="kpi-header">
              <span>Net Margin</span>
              <div class="kpi-icon">📈</div>
            </div>
            <div class="kpi-value">57.3%</div>
            <div class="kpi-footer">
              <span class="trend-pill up">↑ Healthy</span>
              <span style="color: var(--text-muted);">strong profitability</span>
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
                  <span>Revenue vs. Expense Trend (5-Month History)</span>
                </div>
                <div class="chart-subtitle">Calculated via AWS Lambda aggregation</div>
              </div>
              <div style="display: flex; gap: 16px; font-size: 0.78rem;">
                <span style="display: flex; align-items: center; gap: 6px; color: var(--accent-primary);"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent-primary);"></span> Revenue</span>
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
                <div class="chart-subtitle">March expense distribution</div>
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
              <input type="text" id="txn-search" class="search-input" placeholder="Search vendor, category, or ID (e.g. AWS, SaaS, TXN-9027)..." oninput="BookkeepingView.filterData()">
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
            <span>Showing <strong id="visible-count">${data.length}</strong> of ${data.length} records in DynamoDB</span>
            <div class="pagination-buttons">
              <button class="page-btn" disabled>Previous</button>
              <button class="page-btn" disabled>Next</button>
            </div>
          </div>
        </div>

      </div>
    `;

    // Render Charts
    setTimeout(() => {
      ChartRenderer.renderLineChart("rev-exp-canvas");
      ChartRenderer.renderDonutChart("category-donut-container");
      DataTable.renderBookkeepingTable("bookkeeping-table-container", data);
    }, 50);

    // Initialize RAG chat context
    RAGChat.init("bookkeeping");

    // Fetch real records from DynamoDB (via GET /bookkeeping-query) once,
    // then re-render with live data instead of MockAPI's static sample rows.
    if (!BookkeepingView.liveData) {
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

    const allData = BookkeepingView.liveData || MockAPI.getBookkeepingData();

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

  simulateBatchUpload: async () => {
    App.showToast("Sending transaction batch to /bookkeeping-query...");
    const allData = MockAPI.getBookkeepingData();
    const transactionsText = allData
      .map(t => `${t.vendor} - $${t.amount.toFixed(2)} - ${t.date} - ${t.category}`)
      .join("\n");
    try {
      const result = await RealAPI.queryBookkeeping(transactionsText);
      App.showToast(`Step Function Succeeded! ${result.output.structured_result.transaction_count} transactions parsed via AWS Bedrock.`);
      App.logApiExecution("POST /bookkeeping-query", { transactions_text: transactionsText }, result);
    } catch (err) {
      App.showToast(`Ingestion failed: ${err.message}`);
    }
  }
};
