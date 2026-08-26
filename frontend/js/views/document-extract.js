/**
 * Document Extractor View Controller (`/extract-document`)
 */

window.DocumentExtractView = {
  mode: "upload", // "upload" | "paste"
  uploadedFile: null, // { name, mediaType, base64, previewUrl } when a real file is loaded
  pasteText: "",
  liveResult: null, // real structured_result from the most recent run in this session
  history: null, // real records from GET /extract-document, once loaded
  selectedHistoryId: null,

  render: () => {
    const mainEl = document.getElementById("view-content");
    if (!mainEl) return;

    const selectedHistory = DocumentExtractView.selectedHistoryId
      ? (DocumentExtractView.history || []).find(h => h.id === DocumentExtractView.selectedHistoryId)
      : null;
    const displayedJSON = selectedHistory ? selectedHistory.structured_result : DocumentExtractView.liveResult;

    mainEl.innerHTML = `
      <div class="fade-in" style="display: flex; flex-direction: column; gap: 20px;">

        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800;">Document Extractor & Parser</h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Route: <code>/extract-document</code> — AWS Bedrock Claude 3 Multimodal vision + JSON Schema Enforcer.
            </p>
          </div>

          <div style="display: flex; gap: 10px; align-items: center;">
            <button class="nav-tab ${DocumentExtractView.mode === 'upload' ? 'active' : ''}" onclick="DocumentExtractView.switchMode('upload')">
              Upload File
            </button>
            <button class="nav-tab ${DocumentExtractView.mode === 'paste' ? 'active' : ''}" onclick="DocumentExtractView.switchMode('paste')">
              Paste Text
            </button>
          </div>
        </div>

        <!-- Dual View Grid -->
        <div class="dual-view-grid">

          <!-- Left: Input -->
          <div class="doc-viewer-panel">
            <div class="panel-header">
              <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">
                ${DocumentExtractView.mode === "upload" ? (DocumentExtractView.uploadedFile?.name || "No file selected") : "Paste document text"}
              </span>
            </div>
            <div class="doc-preview-area" id="doc-preview">
              ${DocumentExtractView.mode === "upload" ? DocumentExtractView.renderUploadPanel() : DocumentExtractView.renderPastePanel()}
            </div>
          </div>

          <!-- Right: Extracted Structured Data -->
          <div class="doc-viewer-panel">
            <div class="panel-header">
              <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">
                ${selectedHistory ? "Stored Extraction (DynamoDB)" : "Extracted JSON Output & Validation"}
              </span>
              ${selectedHistory ? "" : `
                <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="DocumentExtractView.runExtraction()">
                  Run Bedrock Extraction
                </button>
              `}
            </div>
            <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto;">
              ${displayedJSON ? `
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16,185,129,0.25); border-radius: var(--radius-md); padding: 12px; font-size: 0.8rem; color: var(--accent-success); display: flex; align-items: center; gap: 8px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  ${selectedHistory ? "Loaded from DynamoDB" : "Live Bedrock extraction result"}
                </div>
                <div class="json-editor-container">
                  ${DocumentExtractView.formatJSON(displayedJSON)}
                </div>
              ` : `
                <div style="color: var(--text-muted); font-size: 0.85rem;">Upload a file or paste text, then click "Run Bedrock Extraction" to send it to the deployed backend.</div>
              `}
            </div>
          </div>

        </div>

        <!-- Recent Extractions (real DynamoDB records) -->
        <div class="glass-card">
          <div class="chart-card-header">
            <div class="chart-title">Recent Extractions (from DynamoDB)</div>
          </div>
          <div style="padding: 12px 20px 20px;">
            ${DocumentExtractView.renderHistoryList()}
          </div>
        </div>

      </div>
    `;

    RAGChat.init("document");

    if (!DocumentExtractView.history) {
      RealAPI.listDocuments()
        .then(records => {
          DocumentExtractView.history = records;
          DocumentExtractView.render();
        })
        .catch(err => App.showToast(`Could not load stored records: ${err.message}`));
    }
  },

  renderUploadPanel: () => {
    const f = DocumentExtractView.uploadedFile;
    return `
      <div style="height: 100%; display: flex; flex-direction: column; gap: 12px; padding: 16px;">
        <label class="btn-secondary" style="cursor: pointer; text-align: center; margin: 0;">
          Choose PDF / Image
          <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" style="display: none;" onchange="DocumentExtractView.handleFileUpload(event)">
        </label>
        ${f ? `
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0;">
            ${f.mediaType === "application/pdf"
              ? `<embed src="${f.previewUrl}" type="application/pdf" style="width: 100%; height: 100%; border-radius: var(--radius-md);">`
              : `<img src="${f.previewUrl}" style="max-width: 100%; max-height: 100%; border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.3);">`
            }
          </div>
        ` : `<div style="flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.85rem;">No file selected yet</div>`}
      </div>
    `;
  },

  renderPastePanel: () => `
    <div style="height: 100%; padding: 16px;">
      <textarea id="doc-paste-textarea" placeholder="Paste invoice, receipt, or other document text here..."
        style="width: 100%; height: 100%; min-height: 240px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-md); color: var(--text-main); font-family: var(--font-mono); font-size: 0.85rem; padding: 12px; resize: vertical;"
        oninput="DocumentExtractView.pasteText = this.value">${DocumentExtractView.pasteText}</textarea>
    </div>
  `,

  renderHistoryList: () => {
    if (DocumentExtractView.history === null) {
      return `<div style="color: var(--text-muted); font-size: 0.85rem;">Loading records from DynamoDB...</div>`;
    }
    if (DocumentExtractView.history.length === 0) {
      return `<div style="color: var(--text-muted); font-size: 0.85rem;">No documents extracted yet.</div>`;
    }
    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${DocumentExtractView.history.map(rec => `
          <div onclick="DocumentExtractView.selectHistory('${rec.id}')"
               style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: var(--radius-md); background: ${DocumentExtractView.selectedHistoryId === rec.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)'}; cursor: pointer; border: 1px solid ${DocumentExtractView.selectedHistoryId === rec.id ? 'var(--accent-primary)' : 'transparent'};">
            <div>
              <div style="font-size: 0.85rem; font-weight: 600;">${rec.structured_result?.document_type || "Document"}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${rec.raw_input_summary || ""}</div>
            </div>
            <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">${(rec.created_at || "").replace("T", " ").slice(0, 16)}</span>
          </div>
        `).join("")}
      </div>
    `;
  },

  switchMode: (mode) => {
    DocumentExtractView.mode = mode;
    DocumentExtractView.selectedHistoryId = null;
    DocumentExtractView.render();
  },

  selectHistory: (id) => {
    DocumentExtractView.selectedHistoryId = DocumentExtractView.selectedHistoryId === id ? null : id;
    DocumentExtractView.render();
  },

  handleFileUpload: (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const MAX_BYTES = 4_000_000; // stay under Lambda's 6MB sync-invoke limit after base64 overhead
    if (file.size > MAX_BYTES) {
      App.showToast(`File too large (${(file.size / 1e6).toFixed(1)}MB) - max ~4MB for this demo.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const [, base64] = reader.result.split(",");
      DocumentExtractView.uploadedFile = {
        name: file.name,
        mediaType: file.type,
        base64,
        previewUrl: reader.result
      };
      DocumentExtractView.liveResult = null;
      DocumentExtractView.selectedHistoryId = null;
      DocumentExtractView.render();
    };
    reader.readAsDataURL(file);
  },

  runExtraction: async () => {
    if (DocumentExtractView.mode === "upload" && !DocumentExtractView.uploadedFile) {
      App.showToast("Choose a file first.");
      return;
    }
    if (DocumentExtractView.mode === "paste" && !DocumentExtractView.pasteText.trim()) {
      App.showToast("Paste some document text first.");
      return;
    }

    App.showToast("Invoking AWS Step Function /extract-document...");
    try {
      let result;
      let requestBody;
      if (DocumentExtractView.mode === "upload") {
        const { base64, mediaType } = DocumentExtractView.uploadedFile;
        result = await RealAPI.extractDocumentFile(base64, mediaType);
        requestBody = { document_base64: `${base64.slice(0, 40)}... (truncated)`, media_type: mediaType };
      } else {
        result = await RealAPI.extractDocument(DocumentExtractView.pasteText);
        requestBody = { document_text: DocumentExtractView.pasteText };
      }
      DocumentExtractView.liveResult = result.output.structured_result;
      DocumentExtractView.selectedHistoryId = null;
      App.showToast("Bedrock extraction completed cleanly!");
      App.logApiExecution("POST /extract-document", requestBody, result);

      // Refresh history so the new document shows up immediately.
      const records = await RealAPI.listDocuments();
      DocumentExtractView.history = records;
      DocumentExtractView.render();
    } catch (err) {
      App.showToast(`Extraction failed: ${err.message}`);
    }
  },

  formatJSON: (obj) => {
    return JSON.stringify(obj, null, 2)
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
      .replace(/: ([0-9.]+)/g, ': <span class="json-number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>');
  }
};
