/**
 * Generic Data Table Component with Sorting, Searching, and Pagination
 */

window.DataTable = (function() {
  
  const renderBookkeepingTable = (containerId, data) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    let rowsHtml = data.map(item => `
      <tr id="row-${item.id}">
        <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">${item.id}</td>
        <td>${item.date}</td>
        <td style="font-weight: 600;">${item.vendor}</td>
        <td><span style="background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; font-size: 0.78rem;">${item.category}</span></td>
        <td style="font-family: var(--font-mono); font-weight: 700;">$${item.amount.toFixed(2)}</td>
        <td>
          <span class="status-pill ${item.status}">
            ${item.status}
          </span>
        </td>
        <td>
          <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem;" onclick="App.showToast('Simulated receipt download for ${item.id}')">
            Receipt PDF
          </button>
        </td>
      </tr>
    `).join("");

    container.innerHTML = `
      <table class="custom-table">
        <thead>
          <tr>
            <th>TXN ID</th>
            <th>Date</th>
            <th>Vendor</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  };

  const renderReviewTable = (containerId, data) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    let rowsHtml = data.map(item => `
      <tr id="row-${item.id}">
        <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">${item.id}</td>
        <td style="font-weight: 600;">${item.author}</td>
        <td><span style="color: #fbbf24;">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</span></td>
        <td style="max-width: 280px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item.text}</td>
        <td>
          <span class="status-pill ${item.sentiment}">
            ${item.sentiment} (${Math.round(item.score * 100)}%)
          </span>
        </td>
        <td><span style="background: rgba(99,102,241,0.15); color: var(--accent-primary); padding: 2px 8px; border-radius: 4px; font-size: 0.78rem;">${item.keyTopic}</span></td>
      </tr>
    `).join("");

    container.innerHTML = `
      <table class="custom-table">
        <thead>
          <tr>
            <th>REV ID</th>
            <th>Author</th>
            <th>Rating</th>
            <th>Review Text</th>
            <th>Sentiment</th>
            <th>Key Topic</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  };

  const renderDocumentsTable = (containerId, data) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (data.length === 0) {
      container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No documents extracted yet. Click "Upload Document" to get started.</div>`;
      return;
    }

    let rowsHtml = data.map(item => `
      <tr id="row-${item.id}">
        <td style="font-weight: 600;">${item.documentType}</td>
        <td style="max-width: 320px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item.summary}</td>
        <td style="color: var(--text-muted);">${item.date}</td>
        <td>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.72rem;" onclick="DocumentExtractView.viewDetails('${item.id}')">
            View Details
          </button>
        </td>
      </tr>
    `).join("");

    container.innerHTML = `
      <table class="custom-table">
        <thead>
          <tr>
            <th>Document Type</th>
            <th>Summary</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  };

  return {
    renderBookkeepingTable,
    renderReviewTable,
    renderDocumentsTable
  };
})();
