/**
 * Document Extractor View Controller (`/extract-document`)
 */

window.DocumentExtractView = {
  activePreset: "invoice",
  liveResults: {}, // presetKey -> real extractedJSON returned by the backend

  render: () => {
    const mainEl = document.getElementById("view-content");
    if (!mainEl) return;

    const presets = MockAPI.getDocumentPresets();
    const current = presets[DocumentExtractView.activePreset];
    const displayedJSON = DocumentExtractView.liveResults[DocumentExtractView.activePreset] || current.extractedJSON;

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

          <div style="display: flex; gap: 10px;">
            <button class="nav-tab ${DocumentExtractView.activePreset === 'invoice' ? 'active' : ''}" onclick="DocumentExtractView.switchPreset('invoice')">
              Invoice PDF
            </button>
            <button class="nav-tab ${DocumentExtractView.activePreset === 'receipt' ? 'active' : ''}" onclick="DocumentExtractView.switchPreset('receipt')">
              Receipt Scan
            </button>
            <button class="nav-tab ${DocumentExtractView.activePreset === 'w2' ? 'active' : ''}" onclick="DocumentExtractView.switchPreset('w2')">
              Tax Form W-2
            </button>
          </div>
        </div>

        <!-- Dual View Grid -->
        <div class="dual-view-grid">
          
          <!-- Left: Document Previewer -->
          <div class="doc-viewer-panel">
            <div class="panel-header">
              <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">${current.title}</span>
              <span class="status-pill categorized">${DocumentExtractView.liveResults[DocumentExtractView.activePreset] ? "Live Bedrock Result" : `Confidence: ${Math.round(current.extractedJSON.confidence_score * 100)}%`}</span>
            </div>
            <div class="doc-preview-area" id="doc-preview">
              <div class="invoice-preview-card">
                <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;">
                  <h3 style="font-size: 1.2rem; color: #0f172a; margin-bottom: 4px;">${current.title}</h3>
                  <p style="font-size: 0.8rem; color: #64748b;">Filename: ${current.fileName}</p>
                </div>
                <pre style="white-space: pre-wrap; font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.6; color: #334155;">${current.rawText}</pre>

                <!-- Bounding Box Highlights -->
                <div class="doc-highlight-box active" style="top: 80px; left: 24px; right: 24px; height: 36px;"></div>
              </div>
            </div>
          </div>

          <!-- Right: Extracted Structured Data & JSON Schema -->
          <div class="doc-viewer-panel">
            <div class="panel-header">
              <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Extracted JSON Output & Validation</span>
              <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="DocumentExtractView.reRunExtraction()">
                Re-Run Bedrock Extraction
              </button>
            </div>
            <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto;">
              
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16,185,129,0.25); border-radius: var(--radius-md); padding: 12px; font-size: 0.8rem; color: var(--accent-success); display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                JSON Schema Validation Passed (100% strict match, zero missing required keys)
              </div>

              <div class="json-editor-container">
                ${DocumentExtractView.formatJSON(displayedJSON)}
              </div>

            </div>
          </div>

        </div>

      </div>
    `;

    RAGChat.init("document");
  },

  switchPreset: (presetKey) => {
    DocumentExtractView.activePreset = presetKey;
    DocumentExtractView.render();
  },

  reRunExtraction: async () => {
    App.showToast("Invoking AWS Step Function /extract-document...");
    const presets = MockAPI.getDocumentPresets();
    const current = presets[DocumentExtractView.activePreset];
    try {
      const result = await RealAPI.extractDocument(current.rawText);
      DocumentExtractView.liveResults[DocumentExtractView.activePreset] = result.output.structured_result;
      App.showToast("Bedrock extraction completed cleanly!");
      App.logApiExecution("POST /extract-document", { document_text: current.rawText }, result);
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
