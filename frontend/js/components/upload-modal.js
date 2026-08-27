/**
 * Document Upload Modal Component
 * File upload only (PDF or image) - built on top of the generic Modal.
 * Usage: DocumentUploadModal.open(onComplete) - onComplete(structuredResult) fires after a successful extraction.
 */
window.DocumentUploadModal = (function () {
  const MAX_BYTES = 4_000_000; // stay under the backend's request size limit
  let file = null;
  let onComplete = null;

  const open = (completeCallback) => {
    file = null;
    onComplete = completeCallback;
    Modal.open({
      title: "Upload Document",
      bodyHtml: render(),
      footerHtml: `
        <button class="btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn-secondary" id="upload-modal-submit" style="background: var(--accent-primary); color: white; border-color: transparent;" disabled onclick="DocumentUploadModal.submit()">
          Extract Details
        </button>
      `
    });
  };

  const render = (error) => `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
        Upload an invoice, receipt, or form as a PDF or image. Details will be extracted automatically.
      </p>

      <label class="btn-secondary" style="cursor: pointer; text-align: center; margin: 0;">
        Choose PDF / Image
        <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" style="display: none;" onchange="DocumentUploadModal.handleFileSelect(event)">
      </label>

      <div id="upload-modal-preview">
        ${file ? renderPreview() : `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 24px 0;">No file selected yet</div>`}
      </div>

      ${error ? `<div style="color: var(--accent-danger); font-size: 0.82rem;">${error}</div>` : ""}
    </div>
  `;

  const renderPreview = () => `
    <div style="display: flex; align-items: center; justify-content: center; max-height: 320px; overflow: hidden; border-radius: var(--radius-md); background: rgba(255,255,255,0.03);">
      ${file.mediaType === "application/pdf"
        ? `<embed src="${file.previewUrl}" type="application/pdf" style="width: 100%; height: 300px;">`
        : `<img src="${file.previewUrl}" style="max-width: 100%; max-height: 300px;">`
      }
    </div>
    <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 6px;">${file.name}</div>
  `;

  const setSubmitEnabled = (enabled) => {
    const btn = document.getElementById("upload-modal-submit");
    if (btn) btn.disabled = !enabled;
  };

  const handleFileSelect = (event) => {
    const selected = event.target.files[0];
    if (!selected) return;

    if (selected.size > MAX_BYTES) {
      Modal.setBody(render(`File too large (${(selected.size / 1e6).toFixed(1)}MB) - max ~4MB for this demo.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const [, base64] = reader.result.split(",");
      file = { name: selected.name, mediaType: selected.type, base64, previewUrl: reader.result };
      Modal.setBody(render());
      setSubmitEnabled(true);
    };
    reader.readAsDataURL(selected);
  };

  const submit = async () => {
    if (!file) return;
    setSubmitEnabled(false);
    Modal.setBody(`
      <div style="text-align: center; padding: 40px 0; color: var(--text-muted); font-size: 0.85rem;">
        Extracting details...
      </div>
    `);

    try {
      const result = await RealAPI.extractDocumentFile(file.base64, file.mediaType);
      const structuredResult = result.output.structured_result;
      App.logApiExecution("POST /extract-document", { document_base64: `${file.base64.slice(0, 40)}... (truncated)`, media_type: file.mediaType }, result);
      Modal.close();
      if (onComplete) onComplete(structuredResult);
    } catch (err) {
      Modal.setBody(render(`Extraction failed: ${err.message}`));
      setSubmitEnabled(true);
    }
  };

  return { open, handleFileSelect, submit };
})();
