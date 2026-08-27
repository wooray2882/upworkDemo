/**
 * Generic Modal Component
 * Usage: Modal.open({ title, bodyHtml, footerHtml, onClose })
 */
window.Modal = (function () {
  let currentOnClose = null;

  const open = ({ title, bodyHtml, footerHtml = "", onClose = null }) => {
    close(); // only one modal at a time
    currentOnClose = onClose;

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "app-modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box" onclick="event.stopPropagation()">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="chat-close-btn" onclick="Modal.close()" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body" id="app-modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ""}
      </div>
    `;
    overlay.addEventListener("click", close); // click outside the box closes it
    document.body.appendChild(overlay);
  };

  const setBody = (bodyHtml) => {
    const body = document.getElementById("app-modal-body");
    if (body) body.innerHTML = bodyHtml;
  };

  const close = () => {
    const overlay = document.getElementById("app-modal-overlay");
    if (overlay) overlay.remove();
    if (currentOnClose) {
      const cb = currentOnClose;
      currentOnClose = null;
      cb();
    }
  };

  // Shared "are you sure" dialog for destructive actions (e.g. clearing a
  // feature's stored data - see views/*.js openClearConfirm()).
  // onConfirm may return a Promise; the modal shows a "Working..." state
  // and stays open until it resolves, then closes.
  const confirm = ({ title, message, confirmLabel = "Confirm", onConfirm }) => {
    open({
      title,
      bodyHtml: `<p id="modal-confirm-message" style="font-size: 0.88rem; color: var(--text-main); margin: 0; line-height: 1.5;">${message}</p>`,
      footerHtml: `
        <button class="btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn-secondary" id="modal-confirm-btn" style="background: var(--accent-danger); color: white; border-color: transparent;" onclick="Modal.runConfirm()">
          ${confirmLabel}
        </button>
      `
    });
    _pendingConfirm = onConfirm;
  };

  let _pendingConfirm = null;

  const runConfirm = async () => {
    const btn = document.getElementById("modal-confirm-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Working..."; }
    try {
      await _pendingConfirm();
      close();
    } catch (err) {
      setBody(`<p style="font-size: 0.85rem; color: var(--accent-danger); margin: 0;">Failed: ${err.message}</p>`);
    }
  };

  return { open, close, setBody, confirm, runConfirm };
})();
