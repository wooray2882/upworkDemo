# RAG Agent Demo Platform — React / JS Frontend

This directory contains the source code for the interactive **RAG Agent & Document Extraction Platform** frontend. 

It is designed as a clean, high-performance portfolio dashboard showcasing AWS-native generative AI features in action.

---

## 🚀 Featured AI Modules

The dashboard presents three distinct interactive views, each demonstrating a core serverless AI pattern:

### 1. 📄 Document Extraction Module (`document-extract.js`)
- **Visual Upload**: Drag-and-drop file upload simulator for parsing financial invoices, contracts, or receipts.
- **Side-by-Side Extraction Review**: Displays original uploaded file details alongside key-value fields (Vendor Name, Total Amount, Date, Line Items) parsed and extracted using Amazon Bedrock.

### 2. 📊 Review Analyzer Module (`review-analyzer.js`)
- **Feedback Analysis**: Submits text chunks or customer reviews for real-time sentiment scoring and entity extraction.
- **Sentiment Visualizer**: Renders interactive charts showing positive, neutral, and negative sentiment distribution across review sets.

### 3. 📓 Bookkeeping & Ledger Query Module (`bookkeeping.js`)
- **Interactive Ledger**: Simulates bookkeeping tables showing transaction history, categories, and payment statuses.
- **Ledger Ingestion**: Syncs ledger records directly to the Bedrock vector search database for conversational query retrieval.

---

## 💬 RAG Chat Assistant (`rag-chat.js`)
- **Conversational RAG Overlay**: A floating chat widget enabling users to ask natural questions grounded in their uploaded files.
- **Quick Prompts**: Pre-populated suggest triggers for immediate RAG retrieval testing.

---

## 🛠️ How to Run Locally

Since this is a lightweight, pure-client frontend designed for easy hosting:

1. **Launch a local server** in the `frontend` directory:
   ```bash
   # Using Python 3
   python3 -m http.server 3000
   
   # Or using Node.js static server
   npx serve .
   ```
2. Open `http://localhost:3000` in your web browser.
