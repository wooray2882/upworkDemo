/**
 * Document Extractor View Controller
 * Upload happens in the shared FileUploadModal (see
 * components/file-upload-modal.js - reused across all three apps); this
 * view is just the extracted-documents table plus a details modal per row.
 */

window.DocumentExtractView = {
  history: null, // real records from the backend, once loaded

  render: () => {
    const mainEl = document.getElementById("view-content");
    if (!mainEl) return;

    mainEl.innerHTML = `
      <div class="fade-in" style="display: flex; flex-direction: column; gap: 20px;">

        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800;">Document Extractor</h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Upload invoices, receipts, or forms - one at a time or as a batch - and get the key details pulled out automatically.
            </p>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn-secondary" onclick="DocumentExtractView.openClearConfirm()" title="Delete all extracted documents - for testing with fresh data">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Clear Data
            </button>
            <button class="btn-secondary" style="background: var(--accent-primary); color: white; border-color: transparent;" onclick="DocumentExtractView.openUploadModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Upload Document
            </button>
          </div>
        </div>

        <!-- Extracted Documents Table -->
        <div class="glass-card">
          <div class="chart-card-header">
            <div class="chart-title">Extracted Documents</div>
          </div>
          <div id="documents-table-container">
            <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Loading...</div>
          </div>
        </div>

      </div>
    `;

    RAGChat.init("document");
    DocumentExtractView.loadHistory();
  },

  loadHistory: () => {
    RealAPI.listDocuments()
      .then(records => {
        DocumentExtractView.history = records;
        DataTable.renderDocumentsTable("documents-table-container", records.map(DocumentExtractView.toRow));
      })
      .catch(err => App.showToast(`Could not load extracted documents: ${err.message}`));
  },

  // Deletes every stored extraction - a "reset to fresh demo data" action
  // for testing, irreversible, so it goes through the shared confirm
  // dialog rather than firing on a single click.
  openClearConfirm: () => {
    Modal.confirm({
      title: "Clear All Extracted Documents?",
      message: "This permanently deletes every stored extraction. This can't be undone. Use this to start testing with a clean slate.",
      confirmLabel: "Delete Everything",
      onConfirm: async () => {
        await RealAPI.clearDocuments();
        DocumentExtractView.history = [];
        DataTable.renderDocumentsTable("documents-table-container", []);
        App.showToast("All extracted documents cleared.");
      }
    });
  },

  toRow: (rec) => ({
    id: rec.id,
    documentType: rec.structured_result?.document_type || "Document",
    summary: rec.structured_result?.summary || rec.raw_input_summary || "",
    date: (rec.created_at || "").replace("T", " ").slice(0, 16)
  }),

  // Same shared FileUploadModal component used by Finance Tracker and
  // Sentiment Analyzer - one reusable batch-upload component across all
  // three apps, not a separate one-off per feature. Handles PDFs, images,
  // spreadsheets (.xlsx), and CSVs (a plain-text export of a Google
  // Sheet, which is what "supports Google Sheets" means in practice -
  // there's no live Sheets-API connection here).
  openUploadModal: () => {
    FileUploadModal.open({
      title: "Upload Documents",
      logLabel: "POST /extract-document",
      description: "Upload invoices, receipts, or forms (PDF, image, .xlsx, or .csv). Multiple files at once are fine.",
      accept: ".pdf,image/*,.xlsx,.csv",
      submitFn: (s3Key) => RealAPI.extractDocumentFromS3(s3Key),
      onComplete: (results) => {
        App.showToast(`Done! ${results.length} document(s) extracted.`);
        DocumentExtractView.loadHistory();
      }
    });
  },

  viewDetails: (id) => {
    const record = (DocumentExtractView.history || []).find(r => r.id === id);
    if (!record) return;
    DocumentExtractView.showDetailsModal(record.structured_result, "Loaded from saved history");
  },

  showDetailsModal: (result, statusLabel) => {
    Modal.open({
      title: result?.document_type || "Extracted Document",
      bodyHtml: `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16,185,129,0.25); border-radius: var(--radius-md); padding: 10px 12px; font-size: 0.8rem; color: var(--accent-success); display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          ${statusLabel}
        </div>
        ${DocumentExtractView.renderHumanSummary(result)}
      `,
      footerHtml: `<button class="btn-secondary" onclick="Modal.close()">Close</button>`
    });
  },

  // --- Human-readable rendering -------------------------------------------
  // The audience for this view is a business user (HR, ops, a manager),
  // not a developer - so results are shown as plain labeled fields, never
  // as raw JSON/code.

  ACRONYMS: new Set(["id", "it", "ein", "ssn", "url", "pst", "est", "vat", "sku"]),

  humanizeKey: (key) => key
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .split(" ")
    .map(word => DocumentExtractView.ACRONYMS.has(word.toLowerCase()) ? word.toUpperCase() : word)
    .join(" "),

  renderHumanSummary: (result) => {
    const { document_type, summary, ...rest } = result || {};
    const fields = { ...rest };
    // key_fields (if present) is the main field list; surface it directly
    // instead of as a nested "Key Fields" section, so it reads flat.
    let mainFields = fields;
    if (fields.key_fields && typeof fields.key_fields === "object") {
      mainFields = { ...fields.key_fields };
      delete fields.key_fields;
      Object.assign(mainFields, fields);
    }

    return `
      <div class="extraction-summary">
        ${summary ? `
          <div class="extraction-summary-text">${summary}</div>
        ` : ""}
        ${DocumentExtractView.renderFieldRows(mainFields)}
      </div>
    `;
  },

  renderFieldRows: (obj) => {
    const entries = Object.entries(obj || {});
    if (entries.length === 0) return "";
    return `
      <div class="extraction-fields">
        ${entries.map(([key, value]) => `
          <div class="extraction-row">
            <span class="extraction-label">${DocumentExtractView.humanizeKey(key)}</span>
            <span class="extraction-value">${DocumentExtractView.renderFieldValue(value)}</span>
          </div>
        `).join("")}
      </div>
    `;
  },

  renderFieldValue: (value) => {
    if (value === null || value === undefined || value === "") {
      return `<span class="extraction-value-empty">Not available</span>`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return `<span class="extraction-value-empty">None</span>`;
      if (typeof value[0] === "object") {
        return value.map(item => `<div class="extraction-subcard">${DocumentExtractView.renderFieldRows(item)}</div>`).join("");
      }
      return `<ul class="extraction-list">${value.map(v => `<li>${v}</li>`).join("")}</ul>`;
    }
    if (typeof value === "object") {
      return DocumentExtractView.renderFieldRows(value);
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    return `${value}`;
  }
};
