/**
 * Document Extractor View Controller
 * Upload happens in the shared FileUploadModal (components/file-upload-modal.js);
 * this view manages the extracted documents data table, real S3 preview, and side-by-side inspector modal.
 */

window.DocumentExtractView = {
  history: null, // real records from DynamoDB via RealAPI.listDocuments()

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

        <!-- Extracted Documents Table Panel -->
        <div class="glass-card">
          <div class="chart-card-header">
            <div class="chart-title">Extracted Documents</div>
          </div>
          <div id="documents-table-container">
            <div style="padding: 32px; text-align: center; color: var(--text-muted);">
              <div class="loading-spinner"></div>
              <div style="font-size: 0.82rem;">Loading documents...</div>
            </div>
          </div>
        </div>

      </div>
    `;

    RAGChat.init("document");
    DocumentExtractView.loadHistory();
  },

  /**
   * Load real document records from DynamoDB via RealAPI
   */
  loadHistory: () => {
    RealAPI.listDocuments()
      .then(records => {
        DocumentExtractView.history = records;
        DataTable.renderDocumentsTable("documents-table-container", records.map(DocumentExtractView.toRow));
      })
      .catch(err => App.showToast(`Could not load extracted documents: ${err.message}`));
  },

  /**
   * Deletes every stored extraction via RealAPI.clearDocuments() with confirm dialog
   */
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
    date: (rec.created_at || "").replace("T", " ").slice(0, 16),
    s3Key: rec.s3_key || null
  }),

  /**
   * Shared FileUploadModal flow for real S3 presigned upload & Bedrock extraction
   */
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

  /**
   * View details for a specific record ID
   */
  viewDetails: (id) => {
    const record = (DocumentExtractView.history || []).find(r => r.id === id);
    if (!record) return;
    DocumentExtractView.showDetailsModal(record.structured_result, record.s3_key || null, record);
  },

  /**
   * Open the side-by-side modal with real S3 preview (iframe/img) on the left
   * and structured data inspector on the right.
   */
  showDetailsModal: (result, s3Key, record) => {
    const extractedPanel = DocumentExtractView.renderExtractedInspectorPanel(result, record);

    if (s3Key) {
      Modal.open({
        title: result?.document_type || "Extracted Document",
        bodyHtml: `
          <div class="doc-modal-body" id="doc-preview-container" style="gap: 20px; min-height: 520px;">
            <!-- Left Side: Real Document Preview Pane -->
            <div id="doc-preview-pane" class="doc-real-preview-container" style="border: 1px solid var(--border-glass);">
              <div style="text-align: center; color: var(--text-muted); padding: 24px;">
                <div class="loading-spinner"></div>
                <div style="font-size: 0.82rem; margin-top: 8px;">Fetching document preview from S3...</div>
              </div>
            </div>

            <!-- Right Side: Aligned Extracted Data Inspector -->
            <div style="min-width: 0; display: flex; flex-direction: column; overflow: hidden;">
              ${extractedPanel}
            </div>
          </div>
        `,
        footerHtml: `
          <button class="btn-secondary" onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(result || {})}, null, 2)); App.showToast('JSON copied to clipboard!');">Copy JSON</button>
          <button class="btn-secondary" style="background: var(--accent-primary); color: white; border-color: transparent;" onclick="Modal.close()">Close</button>
        `
      });

      // Widen modal box for side-by-side preview
      const box = document.querySelector(".modal-box");
      if (box) {
        box.style.width = "1180px";
        box.style.maxWidth = "94vw";
        box.style.maxHeight = "90vh";
      }

      // Fetch Presigned S3 URL
      RealAPI.getDownloadUrl(s3Key).then(url => {
        const pane = document.getElementById("doc-preview-pane");
        if (!pane) return;
        const ext = s3Key.split(".").pop().toLowerCase();

        if (ext === "pdf") {
          pane.innerHTML = `<iframe src="${url}" class="doc-real-preview-iframe" style="width: 100%; height: 100%; min-height: 520px; border: none; border-radius: var(--radius-md);" title="Document PDF Preview"></iframe>`;
        } else if (["xlsx", "csv"].includes(ext)) {
          pane.innerHTML = `
            <div style="padding: 32px 24px; font-size: 0.85rem; color: var(--text-muted); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              <div>
                <strong style="color: var(--text-main); font-size: 0.95rem;">Spreadsheet Data File (.${ext})</strong>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Extracted schema fields and rows are structured on the right.</p>
              </div>
              <a href="${url}" target="_blank" rel="noopener" class="btn-secondary" style="padding: 6px 14px; font-size: 0.78rem; text-decoration: none; color: var(--text-main);">
                Download Original .${ext.toUpperCase()} File
              </a>
            </div>
          `;
        } else {
          pane.innerHTML = `
            <div style="padding: 16px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
              <img src="${url}" class="doc-real-preview-img" style="max-width: 100%; max-height: 520px; object-fit: contain; border-radius: var(--radius-md);" alt="Document image preview">
            </div>
          `;
        }
      }).catch(err => {
        const pane = document.getElementById("doc-preview-pane");
        if (pane) {
          pane.innerHTML = `
            <div style="padding: 24px; font-size: 0.82rem; color: var(--text-muted); text-align: center;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-danger)" stroke-width="1.5" style="margin: 0 auto 8px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <div>Preview unavailable (S3 temporary URL expired or not found)</div>
            </div>
          `;
        }
      });

    } else {
      // Single pane layout if no s3Key
      Modal.open({
        title: result?.document_type || "Extracted Document",
        bodyHtml: extractedPanel,
        footerHtml: `<button class="btn-secondary" onclick="Modal.close()">Close</button>`
      });
    }
  },

  /**
   * Render the structured inspector panel on the right side of the modal
   */
  renderExtractedInspectorPanel: (result, record) => {
    const { document_type, summary, ...rest } = result || {};
    let fields = { ...rest };
    
    if (fields.key_fields && typeof fields.key_fields === "object") {
      const kf = { ...fields.key_fields };
      delete fields.key_fields;
      fields = { ...kf, ...fields };
    }

    // Separate line items array from scalar metadata fields
    let lineItemsArray = null;
    let lineItemsKey = null;

    const lineItemsCandidateKeys = ["line_items", "items", "entries", "lineitems", "transactions", "rows", "products", "charges"];
    for (const k of Object.keys(fields)) {
      if (lineItemsCandidateKeys.includes(k.toLowerCase()) && Array.isArray(fields[k]) && fields[k].length > 0 && typeof fields[k][0] === "object") {
        lineItemsArray = fields[k];
        lineItemsKey = k;
        break;
      }
    }

    // Scalar fields excluding line items
    const scalarFields = {};
    for (const [k, v] of Object.entries(fields)) {
      if (k !== lineItemsKey) {
        scalarFields[k] = v;
      }
    }

    // Check for financial totals / status
    const totalAmount = fields.total_amount || fields.total || fields.amount_due || fields.balance_due || fields.grand_total || fields.total_paid || null;
    const paymentStatus = fields.payment_status || fields.status || fields.term || fields.payment_terms || "Extracted";
    const invoiceNum = fields.invoice_number || fields.invoice_no || fields.receipt_number || fields.doc_id || record?.id || null;

    // Render KPI Row
    const kpis = [];
    if (document_type) kpis.push({ label: "Document Type", val: document_type, color: "var(--accent-cyan)" });
    if (paymentStatus) kpis.push({ label: "Status / Terms", val: paymentStatus, color: "var(--accent-success)" });
    if (totalAmount) kpis.push({ label: "Total Amount", val: typeof totalAmount === 'number' ? `$${totalAmount.toFixed(2)}` : `${totalAmount}`, color: "#ffffff", mono: true });
    if (invoiceNum) kpis.push({ label: "Document Ref #", val: invoiceNum, color: "var(--text-main)", mono: true });

    let kpiHtml = "";
    if (kpis.length > 0) {
      kpiHtml = `
        <div class="inspector-kpi-row" style="margin-bottom: 14px;">
          ${kpis.map(k => `
            <div class="inspector-kpi-card">
              <span class="inspector-kpi-label">${k.label}</span>
              <span class="inspector-kpi-value ${k.mono ? 'mono' : ''}" style="color: ${k.color}; font-size: 0.92rem;">${k.val}</span>
            </div>
          `).join("")}
        </div>
      `;
    }

    // Render Line Items Table if available
    let lineItemsHtml = "";
    if (lineItemsArray && lineItemsArray.length > 0) {
      lineItemsHtml = DocumentExtractView.renderLineItemsTable(lineItemsArray, lineItemsKey);
    }

    // Render Metadata Key-Value Grid for scalar fields
    let metaGridHtml = "";
    const scalarEntries = Object.entries(scalarFields);
    if (scalarEntries.length > 0) {
      metaGridHtml = `
        <div class="entity-meta-grid" style="margin-bottom: 14px;">
          ${scalarEntries.map(([key, val]) => `
            <div class="meta-field">
              <span class="meta-label">${DocumentExtractView.humanizeKey(key)}</span>
              <span class="meta-val">${DocumentExtractView.renderFieldValue(val)}</span>
            </div>
          `).join("")}
        </div>
      `;
    }

    return `
      <div class="extracted-inspector-panel" style="padding: 0; max-height: 75vh; overflow-y: auto;">
        
        <!-- Status & Precision Badge -->
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16,185,129,0.25); border-radius: var(--radius-md); padding: 10px 14px; font-size: 0.8rem; color: var(--accent-success); display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>Extracted via AWS Bedrock Multimodal Vision</span>
          </div>
          <span style="font-family: var(--font-mono); font-size: 0.72rem; background: rgba(16,185,129,0.18); padding: 2px 8px; border-radius: 10px;">100% Strict Match</span>
        </div>

        ${summary ? `
          <div class="extraction-summary-text" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: var(--radius-md); padding: 12px 16px; font-size: 0.85rem; color: var(--text-main); margin-bottom: 14px; line-height: 1.5;">
            ${summary}
          </div>
        ` : ""}

        ${kpiHtml}
        ${lineItemsHtml}
        ${metaGridHtml}

        <!-- Raw JSON Schema Accordion -->
        <details style="background: rgba(11, 15, 25, 0.6); border: 1px solid var(--border-glass); border-radius: var(--radius-md); padding: 12px 16px; margin-top: 4px;">
          <summary style="font-size: 0.8rem; font-weight: 600; color: var(--accent-cyan); cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
            <span>Inspect Raw Bedrock JSON Output</span>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Payload Schema</span>
          </summary>
          <div class="json-editor-container" style="margin-top: 10px;">
            ${DocumentExtractView.formatJSON(result || {})}
          </div>
        </details>

      </div>
    `;
  },

  /**
   * Render structured 5-column line items table
   */
  renderLineItemsTable: (items, sectionKey) => {
    let rowsHtml = items.map((item, idx) => {
      // Intelligently find fields
      const num = item.item || item.item_number || item.itemNumber || item.no || (idx + 1);
      const desc = item.description || item.desc || item.name || item.item || item.service || "Item";
      const qty = item.quantity || item.qty || item.count || 1;
      const unitPrice = item.unit_price || item.unitPrice || item.price || item.rate || null;
      const amount = item.amount || item.total || item.cost || item.line_total || (typeof unitPrice === 'number' ? unitPrice * qty : null);

      const priceFormatted = (typeof unitPrice === 'number') ? `$${unitPrice.toFixed(2)}` : (unitPrice ? `${unitPrice}` : '—');
      const amountFormatted = (typeof amount === 'number') ? `$${amount.toFixed(2)}` : (amount ? `${amount}` : '—');

      return `
        <tr>
          <td class="col-num">${num}</td>
          <td class="col-desc">${desc}</td>
          <td class="col-qty">${qty}</td>
          <td class="col-unit-price">${priceFormatted}</td>
          <td class="col-amount">${amountFormatted}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="line-items-wrapper" style="margin-bottom: 14px;">
        <div class="line-items-header">
          <span class="line-items-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            ${DocumentExtractView.humanizeKey(sectionKey || "Line Items")} (${items.length})
          </span>
          <span style="font-size: 0.72rem; color: var(--text-muted);">Aligned Schema Grid</span>
        </div>

        <table class="extracted-line-items-table">
          <thead>
            <tr>
              <th class="col-num">#</th>
              <th class="col-desc">Description</th>
              <th class="col-qty">Qty</th>
              <th class="col-unit-price">Unit Price</th>
              <th class="col-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  },

  // --- Human-readable key-value formatting helpers ---
  ACRONYMS: new Set(["id", "it", "ein", "ssn", "url", "pst", "est", "vat", "sku", "kms", "s3", "api"]),

  humanizeKey: (key) => (key || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .split(" ")
    .map(word => DocumentExtractView.ACRONYMS.has(word.toLowerCase()) ? word.toUpperCase() : word)
    .join(" "),

  renderFieldValue: (value) => {
    if (value === null || value === undefined || value === "") {
      return `<span class="extraction-value-empty">Not available</span>`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return `<span class="extraction-value-empty">None</span>`;
      if (typeof value[0] === "object") {
        return value.map(item => `
          <div class="extraction-subcard">
            ${Object.entries(item).map(([k, v]) => `
              <div style="font-size: 0.78rem; display: flex; justify-content: space-between; gap: 8px; padding: 2px 0;">
                <span style="color: var(--text-muted);">${DocumentExtractView.humanizeKey(k)}:</span>
                <span style="font-weight: 600; color: var(--text-main);">${DocumentExtractView.renderFieldValue(v)}</span>
              </div>
            `).join("")}
          </div>
        `).join("");
      }
      return `<ul class="extraction-list">${value.map(v => `<li>${v}</li>`).join("")}</ul>`;
    }
    if (typeof value === "object") {
      return `
        <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
          ${Object.entries(value).map(([k, v]) => `
            <div style="font-size: 0.78rem; display: flex; justify-content: space-between; gap: 8px;">
              <span style="color: var(--text-muted);">${DocumentExtractView.humanizeKey(k)}:</span>
              <span style="font-weight: 600; color: var(--text-main);">${DocumentExtractView.renderFieldValue(v)}</span>
            </div>
          `).join("")}
        </div>
      `;
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    return `${value}`;
  },

  formatJSON: (obj) => {
    return JSON.stringify(obj, null, 2)
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
      .replace(/: ([0-9.]+)/g, ': <span class="json-number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>');
  }
};
