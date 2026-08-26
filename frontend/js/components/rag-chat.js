/**
 * Bedrock Knowledge Base Conversational RAG Chat Controller
 */

window.RAGChat = (function() {
  let activeContextView = "bookkeeping";

  const init = (viewName) => {
    activeContextView = viewName || "bookkeeping";
    renderSuggestedPrompts();
  };

  const renderSuggestedPrompts = () => {
    const pillsContainer = document.getElementById("prompt-pills-list");
    if (!pillsContainer) return;

    let prompts = [];
    if (activeContextView === "bookkeeping") {
      prompts = [
        "What were my top 3 software expenses in March?",
        "Are there any flagged transactions or anomalies?",
        "How much total was spent on cloud hosting?"
      ];
    } else if (activeContextView === "reviews") {
      prompts = [
        "What is the main complaint regarding shipping?",
        "What features do customers praise the most?"
      ];
    } else {
      prompts = [
        "Extract line item summary for Invoice #INV-8841",
        "Verify tax ID and vendor payment terms"
      ];
    }

    pillsContainer.innerHTML = prompts.map(p => `
      <button class="prompt-pill" onclick="RAGChat.sendPrompt('${p}')">
        <span>${p}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    `).join("");
  };

  const sendPrompt = async (promptText) => {
    const inputEl = document.getElementById("chat-input-field");
    const query = promptText || (inputEl ? inputEl.value.trim() : "");
    if (!query) return;

    if (inputEl) inputEl.value = "";

    // Append User Message
    appendMessage(query, "user");

    // Show Typing Indicator
    const typingId = appendTypingIndicator();

    // Query Mock RAG Knowledge Base
    const response = await MockAPI.queryRAGKnowledgeBase(query, activeContextView);

    // Remove Typing & Append AI Response
    removeMessage(typingId);
    appendMessage(response.answer, "assistant", response.citations);
  };

  const appendMessage = (text, sender, citations = []) => {
    const container = document.getElementById("chat-messages-list");
    if (!container) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = `message-wrapper ${sender} fade-in`;

    let citationHtml = "";
    if (citations.length > 0) {
      citationHtml = citations.map(c => `
        <span class="rag-citation" onclick="RAGChat.highlightSource('${c.rowId}')">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path></svg>
          ${c.label}
        </span>
      `).join(" ");
    }

    msgDiv.innerHTML = `
      <div class="chat-bubble">
        ${text}
        ${citationHtml ? `<div style="margin-top: 8px;">${citationHtml}</div>` : ''}
      </div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  };

  const appendTypingIndicator = () => {
    const container = document.getElementById("chat-messages-list");
    if (!container) return null;

    const id = `typing-${Date.now()}`;
    const msgDiv = document.createElement("div");
    msgDiv.id = id;
    msgDiv.className = "message-wrapper assistant fade-in";
    msgDiv.innerHTML = `
      <div class="chat-bubble" style="color: var(--text-muted); font-style: italic;">
        Bedrock KB Vector Search running...
      </div>
    `;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    return id;
  };

  const removeMessage = (id) => {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  };

  const highlightSource = (rowId) => {
    // Clear existing highlights
    document.querySelectorAll(".row-highlight").forEach(r => r.classList.remove("row-highlight"));

    const row = document.getElementById(`row-${rowId}`);
    if (row) {
      row.classList.add("row-highlight");
      row.scrollIntoView({ behavior: "smooth", block: "center" });

      // Toast notification
      if (window.App) window.App.showToast(`Highlighted RAG citation row: ${rowId}`);
    }
  };

  return {
    init,
    sendPrompt,
    highlightSource
  };
})();
