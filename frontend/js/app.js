/**
 * Master Application Shell & Routing Controller
 */

window.App = (function() {
  let activeTab = "bookkeeping";

  // Matches each nav tab's data-tab value. A URL like ?app=bookkeeping
  // locks the app to just that view (nav hidden down to the one tab) -
  // for sending a client a link to only the feature relevant to them.
  // No `app` param at all shows every tab, for working across all three.
  const FOCUS_APPS = ["bookkeeping", "document-extract", "review-analyzer"];

  const init = () => {
    const focusApp = new URLSearchParams(window.location.search).get("app");
    if (focusApp && FOCUS_APPS.includes(focusApp)) {
      applyFocusMode(focusApp);
      switchTab(focusApp);
    } else {
      switchTab("bookkeeping");
    }
    setupEventListeners();
  };

  // Hides every nav tab except the one this link is scoped to, so there's
  // no way to navigate to the other two features from a focus-mode link.
  const applyFocusMode = (tabName) => {
    document.querySelectorAll(".nav-tab[data-tab]").forEach(tab => {
      if (tab.dataset.tab !== tabName) tab.style.display = "none";
    });
  };

  const switchTab = (tabName) => {
    activeTab = tabName;

    // Update Nav Tabs UI
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });

    // Render Corresponding View
    if (tabName === "bookkeeping") {
      BookkeepingView.render();
    } else if (tabName === "document-extract") {
      DocumentExtractView.render();
    } else if (tabName === "review-analyzer") {
      ReviewAnalyzerView.render();
    }
  };

  const setupEventListeners = () => {
    // Nav Tab Click Handlers
    document.querySelectorAll(".nav-tab[data-tab]").forEach(tab => {
      tab.addEventListener("click", () => {
        switchTab(tab.dataset.tab);
      });
    });

    // Enter Key on Chat Input
    const chatInput = document.getElementById("chat-input-field");
    if (chatInput) {
      chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          RAGChat.sendPrompt();
        }
      });
    }
  };

  const toggleApiDrawer = () => {
    const drawer = document.getElementById("api-drawer");
    if (drawer) {
      drawer.classList.toggle("open");
    }
  };

  const toggleChatPanel = () => {
    const chatPanel = document.getElementById("rag-chat-panel");
    if (chatPanel) {
      chatPanel.classList.toggle("collapsed");
    }
  };

  const logApiExecution = (endpoint, reqBody, resBody) => {
    const reqEl = document.getElementById("drawer-req-log");
    const resEl = document.getElementById("drawer-res-log");
    const stepEl = document.getElementById("drawer-step-log");

    if (reqEl) reqEl.textContent = `// API Gateway Request: ${endpoint}\n` + JSON.stringify(reqBody, null, 2);
    if (resEl) resEl.textContent = `// Response Output:\n` + JSON.stringify(resBody.output, null, 2);
    if (stepEl) stepEl.textContent = `// Step Function Execution:\nARN: ${resBody.executionArn}\nStatus: ${resBody.status}\nDuration: ${resBody.durationMs}ms`;
  };

  const showToast = (message) => {
    let toast = document.getElementById("global-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "global-toast";
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 24px;
        background: rgba(17, 24, 39, 0.95);
        border: 1px solid var(--accent-primary);
        color: white;
        padding: 12px 20px;
        border-radius: var(--radius-md);
        font-size: 0.85rem;
        z-index: 100;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        transition: all 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
    }, 3000);
  };

  return {
    init,
    switchTab,
    toggleApiDrawer,
    toggleChatPanel,
    logApiExecution,
    showToast
  };
})();

// Bootstrap Application on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
