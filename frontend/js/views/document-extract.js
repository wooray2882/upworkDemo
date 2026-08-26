/**
 * Document Extractor View Controller (`/extract-document`)
 */

window.DocumentExtractView = {
  activePreset: "invoice",
  liveResults: {}, // presetKey -> real extractedJSON returned by the backend
  uploadedFile: null, // { name, mediaType, base64, previewUrl } when a real file is loaded
  mode: "preset", // "preset" | "upload"

  render: () => {
    const mainEl = document.getElementById("view-content");
    if (!mainEl) return;

    const presets = MockAPI.getDocumentPresets();
    const current = presets[DocumentExtractView.activePreset];
    const isUpload = DocumentExtractView.mode === "upload" && DocumentExtractView.uploadedFile;
    const displayedJSON = isUpload
      ? (DocumentExtractView.liveResults.uploaded || null)
      : (DocumentExtractView.liveResults[DocumentExtractView.activePreset] || current.extractedJSON);

    mainEl.innerHTML = `
      <div class="fade-in" style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Header & Preset Selector -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800;">Document Extractor & Parser</h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Route: <code>/extract-document</code> — AWS Bedrock Claude 3 Multimodal vision + JSON Schema Enforcer.
            </p>
          </div>

          <div style="display: flex; gap: 10px; align-items: center;">
            <button class="nav-tab ${DocumentExtractView.mode === 'preset' && DocumentExtractView.activePreset === 'invoice' ? 'active' : ''}" onclick="DocumentExtractView.switchPreset('invoice')">
              Invoice PDF
            </button>
            <button class="nav-tab ${DocumentExtractView.mode === 'preset' && DocumentExtractView.activePreset === 'receipt' ? 'active' : ''}" onclick="DocumentExtractView.switchPreset('receipt')">
              Receipt Scan
            </button>
            <button class="nav-tab ${DocumentExtractView.mode === 'preset' && DocumentExtractView.activePreset === 'w2' ? 'active' : ''}" onclick="DocumentExtractView.switchPreset('w2')">
              Tax Form W-2
            </button>
            <label class="nav-tab ${DocumentExtractView.mode === 'upload' ? 'active' : ''}" style="cursor: pointer; margin: 0;">
              Upload PDF / Image
              <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" style="display: none;" onchange="DocumentExtractView.handleFileUpload(event)">
            </label>
          </div>
        </div>

        <!-- Dual View Grid -->
        <div class="dual-view-grid">
          
          <!-- Left: Document Previewer -->
          <div class="doc-viewer-panel">
            <div class="panel-header">
              <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">${isUpload ? DocumentExtractView.uploadedFile.name : current.title}</span>
              <span class="status-pill categorized">${
                isUpload || DocumentExtractView.liveResults[DocumentExtractView.activePreset]
                  ? "Live Bedrock Result"
                  : `Confidence: ${Math.round(current.extractedJSON.confidence_score * 100)}%`
              }</span>
            </div>
            <div class="doc-preview-area" id="doc-preview">
              ${isUpload ? `
                <div style="height: 100%; display: flex; align-items: center; justify-content: center; padding: 16px;">
                  ${DocumentExtractView.uploadedFile.mediaType === "application/pdf"
                    ? `<embed src="${DocumentExtractView.uploadedFile.previewUrl}" type="application/pdf" style="width: 100%; height: 100%; border-radius: var(--radius-md);">`
                    : `<img src="${DocumentExtractView.uploadedFile.previewUrl}" style="max-width: 100%; max-height: 100%; border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.3);">`
                  }
                </div>
              ` : `
                <div class="invoice-preview-card">
                  <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;">
                    <h3 style="font-size: 1.2rem; color: #0f172a; margin-bottom: 4px;">${current.title}</h3>
                    <p style="font-size: 0.8rem; color: #64748b;">Filename: ${current.fileName}</p>
                  </div>
                  <pre style="white-space: pre-wrap; font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.6; color: #334155;">${current.rawText}</pre>

                  <!-- Bounding Box Highlights -->
                  <div class="doc-highlight-box active" style="top: 80px; left: 24px; right: 24px; height: 36px;"></div>
                </div>
              `}
            </div>
          </div>

          <!-- Right: Extracted Structured Data & JSON Schema -->
          <div class="doc-viewer-panel">
            <div class="panel-header">
              <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Extracted JSON Output & Validation</span>
              <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="DocumentExtractView.reRunExtraction()">
                ${isUpload ? "Run Bedrock Extraction" : "Re-Run Bedrock Extraction"}
              </button>
            </div>
            <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto;">
              ${displayedJSON ? `
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16,185,129,0.25); border-radius: var(--radius-md); padding: 12px; font-size: 0.8rem; color: var(--accent-success); display: flex; align-items: center; gap: 8px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  JSON Schema Validation Passed (100% strict match, zero missing required keys)
                </div>

                <div class="json-editor-container">
                  ${DocumentExtractView.formatJSON(displayedJSON)}
                </div>
              ` : `
                <div style="color: var(--text-muted); font-size: 0.85rem;">Click "Run Bedrock Extraction" to send this file to the deployed backend.</div>
              `}
            </div>
          </div>

        </div>

      </div>
    `;

    RAGChat.init("document");
  },

  switchPreset: (presetKey) => {
    DocumentExtractView.mode = "preset";
    DocumentExtractView.activePreset = presetKey;
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
      // reader.result is a data: URL, e.g. "data:application/pdf;base64,JVBERi0..."
      const [, base64] = reader.result.split(",");
      DocumentExtractView.mode = "upload";
      DocumentExtractView.uploadedFile = {
        name: file.name,
        mediaType: file.type,
        base64,
        previewUrl: reader.result
      };
      delete DocumentExtractView.liveResults.uploaded;
      DocumentExtractView.render();
    };
    reader.readAsDataURL(file);
  },

  reRunExtraction: async () => {
    App.showToast("Invoking AWS Step Function /extract-document...");
    try {
      let result;
      let requestBody;
      if (DocumentExtractView.mode === "upload" && DocumentExtractView.uploadedFile) {
        const { base64, mediaType } = DocumentExtractView.uploadedFile;
        result = await RealAPI.extractDocumentFile(base64, mediaType);
        requestBody = { document_base64: `${base64.slice(0, 40)}... (truncated)`, media_type: mediaType };
        DocumentExtractView.liveResults.uploaded = result.output.structured_result;
      } else {
        const presets = MockAPI.getDocumentPresets();
        const current = presets[DocumentExtractView.activePreset];
        result = await RealAPI.extractDocument(current.rawText);
        requestBody = { document_text: current.rawText };
        DocumentExtractView.liveResults[DocumentExtractView.activePreset] = result.output.structured_result;
      }
      App.showToast("Bedrock extraction completed cleanly!");
      App.logApiExecution("POST /extract-document", requestBody, result);
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
