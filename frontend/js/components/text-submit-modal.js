/**
 * Text Submit Modal Component
 * A paste-your-own-data dialog, built on the generic Modal.
 * Usage: TextSubmitModal.open({ title, description, placeholder, exampleText, submitLabel, onSubmit })
 *   onSubmit(text) must return a Promise; resolving closes the modal.
 */
window.TextSubmitModal = (function () {
  let config = null;

  const open = (opts) => {
    config = opts;
    Modal.open({
      title: opts.title,
      bodyHtml: render(),
      footerHtml: `
        <button class="btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn-secondary" id="text-submit-btn" style="background: var(--accent-primary); color: white; border-color: transparent;" onclick="TextSubmitModal.submit()">
          ${opts.submitLabel || "Submit"}
        </button>
      `
    });
  };

  const render = (error) => `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${config.description ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${config.description}</p>` : ""}
      <textarea id="text-submit-textarea" placeholder="${config.placeholder || ""}"
        style="width: 100%; min-height: 220px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-md); color: var(--text-main); font-size: 0.85rem; padding: 12px; resize: vertical;"></textarea>
      ${config.exampleText ? `
        <button class="btn-secondary" style="align-self: flex-start; font-size: 0.75rem; padding: 4px 10px;" onclick="TextSubmitModal.fillExample()">
          Use example text
        </button>
      ` : ""}
      ${error ? `<div style="color: var(--accent-danger); font-size: 0.82rem;">${error}</div>` : ""}
    </div>
  `;

  const fillExample = () => {
    const textarea = document.getElementById("text-submit-textarea");
    if (textarea) textarea.value = config.exampleText;
  };

  const setSubmitting = (isSubmitting) => {
    const btn = document.getElementById("text-submit-btn");
    if (btn) {
      btn.disabled = isSubmitting;
      btn.textContent = isSubmitting ? "Processing..." : (config.submitLabel || "Submit");
    }
  };

  const submit = async () => {
    const textarea = document.getElementById("text-submit-textarea");
    const text = textarea ? textarea.value.trim() : "";
    if (!text) {
      App.showToast("Enter some text first.");
      return;
    }

    setSubmitting(true);
    try {
      await config.onSubmit(text);
      Modal.close();
    } catch (err) {
      Modal.setBody(render(`Failed: ${err.message}`));
      setSubmitting(false);
    }
  };

  return { open, submit, fillExample };
})();
