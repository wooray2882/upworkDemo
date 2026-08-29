/**
 * File Upload Modal Component
 * Multi-file drag-and-drop upload, built on the generic Modal. Each file
 * goes through the shared presigned-upload flow (RealAPI.presignUpload +
 * uploadToS3) and then triggers the caller's feature route via `submitFn`.
 *
 * Usage: FileUploadModal.open({
 *   title, description, accept,          // e.g. ".pdf,image/*,.xlsx"
 *   submitFn: (s3Key) => RealAPI.xyzFile(s3Key),
 *   onComplete: (structuredResults) => {...}  // array, one per file
 * })
 */
window.FileUploadModal = (function () {
  const CONCURRENCY = 3;
  const MAX_CSV_ROWS = 20; // hard cap — only this many rows go to S3 and Bedrock

  let config = null;
  let files = []; // { file, status: "pending"|"uploading"|"done"|"error", error, rowWarning }

  const open = (opts) => {
    config = opts;
    files = [];
    Modal.open({
      title: opts.title,
      bodyHtml: render(),
      footerHtml: `
        <button class="btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn-secondary" id="file-upload-submit" style="background: var(--accent-primary); color: white; border-color: transparent;" disabled onclick="FileUploadModal.submit()">
          Upload &amp; Process
        </button>
      `
    });
  };

  const render = () => `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${config.description}</p>

      <label for="file-upload-input" id="file-drop-zone"
        style="border: 2px dashed rgba(255,255,255,0.15); border-radius: var(--radius-md); padding: 28px; text-align: center; cursor: pointer; color: var(--text-muted); font-size: 0.85rem; display: block;"
        ondragover="event.preventDefault(); document.getElementById('file-drop-zone').style.borderColor='var(--accent-primary)';"
        ondragleave="document.getElementById('file-drop-zone').style.borderColor='rgba(255,255,255,0.15)';"
        ondrop="event.preventDefault(); document.getElementById('file-drop-zone').style.borderColor='rgba(255,255,255,0.15)'; FileUploadModal.handleDrop(event);">
        Drag &amp; drop files here, or <strong style="color: var(--accent-primary);">click to choose</strong><br>
        <span style="font-size: 0.75rem; margin-top: 4px; display: inline-block;">Multiple files supported</span>
      </label>

      <input id="file-upload-input" type="file" multiple accept="${config.accept}"
        style="position: absolute; width: 0.1px; height: 0.1px; opacity: 0; overflow: hidden; z-index: -1;"
        onchange="FileUploadModal.handleFilesSelected(event.target.files)">

      <div id="file-upload-list" style="display: flex; flex-direction: column; gap: 6px; max-height: 220px; overflow-y: auto;">
        ${renderFileList()}
      </div>
    </div>
  `;

  const STATUS_LABEL = { pending: "", uploading: "Uploading...", done: "Done", error: "Failed" };
  const STATUS_COLOR = { pending: "var(--text-muted)", uploading: "var(--accent-cyan)", done: "var(--accent-success)", error: "var(--accent-danger)" };

  const renderFileList = () => {
    if (files.length === 0) {
      return `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 8px 0;">No files selected yet</div>`;
    }
    return files.map((f, i) => `
      <div style="display: flex; flex-direction: column; gap: 2px; padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm, 6px); font-size: 0.8rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;">${f.file.name}</span>
          <span style="display: flex; align-items: center; gap: 8px;">
            <span style="color: ${STATUS_COLOR[f.status]};">${STATUS_LABEL[f.status]}${f.status === "error" ? `: ${f.error}` : ""}</span>
            ${f.status === "pending" ? `<button class="btn-secondary" style="padding: 2px 8px; font-size: 0.7rem;" onclick="FileUploadModal.removeFile(${i})">Remove</button>` : ""}
          </span>
        </div>
        ${f.rowWarning ? `<div style="font-size: 0.72rem; color: var(--accent-warning);">⚠ ${f.rowWarning}</div>` : ""}
      </div>
    `).join("");
  };

  const refreshList = () => {
    const list = document.getElementById("file-upload-list");
    if (list) list.innerHTML = renderFileList();
  };

  const setSubmitEnabled = (enabled) => {
    const btn = document.getElementById("file-upload-submit");
    if (btn) btn.disabled = !enabled;
  };

  // Reads a CSV file client-side and returns a new tiny File capped at
  // MAX_CSV_ROWS lines. This runs BEFORE the S3 upload so only the small
  // slice ever leaves the browser — critical on slow connections.
  const truncateCsvFile = (file) => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = (e.target.result || "").split("\n").filter(l => l.trim());
      if (lines.length <= MAX_CSV_ROWS) {
        resolve({ file, originalCount: lines.length, truncated: false });
        return;
      }
      const sliced = new File([lines.slice(0, MAX_CSV_ROWS).join("\n")], file.name, { type: "text/csv" });
      resolve({ file: sliced, originalCount: lines.length, truncated: true });
    };
    reader.onerror = () => resolve({ file, originalCount: 0, truncated: false });
    reader.readAsText(file);
  });

  const readRowCount = (file) => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target.result || "").split("\n").filter(l => l.trim()).length);
    reader.onerror = () => resolve(0);
    reader.readAsText(file.slice(0, 500_000));
  });

  // Async: reads row counts first, shows warnings, THEN enables the submit
  // button so the user always sees the truncation notice before uploading.
  const addFiles = async (fileList) => {
    const newEntries = [];
    for (const file of fileList) {
      const entry = { file, status: "pending", error: null, rowWarning: null };
      newEntries.push(entry);
      files.push(entry);
    }
    setSubmitEnabled(false); // hold until checks complete
    refreshList();

    await Promise.all(newEntries.map(async (entry) => {
      const name = entry.file.name.toLowerCase();
      if (name.endsWith(".csv") || name.endsWith(".xlsx")) {
        const count = await readRowCount(entry.file);
        if (count > MAX_CSV_ROWS) {
          entry.rowWarning = `${count} rows detected — only the first ${MAX_CSV_ROWS} will be uploaded`;
        }
      }
    }));

    refreshList();
    setSubmitEnabled(files.some(f => f.status === "pending"));
  };

  const handleFilesSelected = (fileList) => addFiles(fileList);

  const handleDrop = (event) => {
    event.preventDefault();
    const zone = document.getElementById("file-drop-zone");
    if (zone) zone.style.borderColor = "rgba(255,255,255,0.15)";
    addFiles(event.dataTransfer.files);
  };

  const removeFile = (index) => {
    files.splice(index, 1);
    refreshList();
    setSubmitEnabled(files.length > 0);
  };

  const uploadOne = async (entry) => {
    entry.status = "uploading";
    refreshList();
    try {
      // Truncate CSV client-side BEFORE upload — only a small slice goes to S3
      let fileToUpload = entry.file;
      if (entry.file.name.toLowerCase().endsWith(".csv")) {
        const { file, truncated, originalCount } = await truncateCsvFile(entry.file);
        fileToUpload = file;
        if (truncated) {
          entry.rowWarning = `Sent first ${MAX_CSV_ROWS} of ${originalCount} rows`;
          refreshList();
        }
      }
      const { upload_url, s3_key } = await RealAPI.presignUpload(fileToUpload.name, fileToUpload.type || "text/csv");
      await RealAPI.uploadToS3(upload_url, fileToUpload);
      const result = await config.submitFn(s3_key);
      entry.status = "done";
      entry.structuredResult = result?.output?.structured_result ?? null;
      App.logApiExecution(config.logLabel || config.title, { s3_key }, result);
    } catch (err) {
      entry.status = "error";
      entry.error = err.message;
    }
    refreshList();
  };

  const submit = async () => {
    setSubmitEnabled(false);
    const pending = files.filter(f => f.status === "pending");

    // Small client-side concurrency cap so a large batch doesn't fire a
    // pile of simultaneous Step Functions executions at once.
    let cursor = 0;
    const worker = async () => {
      while (cursor < pending.length) {
        const entry = pending[cursor++];
        await uploadOne(entry);
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));

    const succeeded = files.filter(f => f.status === "done");
    const failed = files.filter(f => f.status === "error");

    if (failed.length === 0) {
      Modal.close();
    } else {
      setSubmitEnabled(true);
    }

    if (succeeded.length > 0 && config.onComplete) {
      config.onComplete(succeeded.map(f => f.structuredResult));
    }
    if (failed.length > 0) {
      App.showToast(`${failed.length} file(s) failed - see the list for details.`);
    }
  };

  return { open, handleFilesSelected, handleDrop, removeFile, submit };
})();
