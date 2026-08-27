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

  return { open, close, setBody };
})();
