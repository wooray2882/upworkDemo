/**
 * Bedrock Knowledge Base Conversational RAG Chat Controller
 */

window.RAGChat = (function() {
  let activeContextView = "bookkeeping";

  // The active app's chat data is scoped server-side too - the RAG query
  // Lambda filters retrieval to this view's records (see
  // CONTEXT_TO_FEATURE_TYPE in lambdas/rag-query/handler.py), so each app's
  // assistant only ever answers from its own data.
  const init = (viewName) => {
    activeContextView = viewName || "bookkeeping";
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

    // Query the real Bedrock Knowledge Base (S3 Vectors-backed retrieval,
    // see lambdas/rag-query/handler.py) for this view's context.
    try {
      const response = await RealAPI.queryRag(query, activeContextView);
      removeMessage(typingId);
      appendMessage(response.answer, "assistant");
    } catch (err) {
      removeMessage(typingId);
      appendMessage(`Query failed: ${err.message}`, "assistant");
    }
  };

  const appendMessage = (text, sender) => {
    const container = document.getElementById("chat-messages-list");
    if (!container) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = `message-wrapper ${sender} fade-in`;
    msgDiv.innerHTML = `<div class="chat-bubble">${text}</div>`;

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
        Looking into your data...
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

  return {
    init,
    sendPrompt
  };
})();
