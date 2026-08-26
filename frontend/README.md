# IndyComply Compliance Hub — React Frontend

This directory contains the source code for the **IndyComply Subcontractor RAG & Insurance Compliance Platform** frontend. 

It is built as a responsive Single Page Application (SPA) using **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 Key Features & Components

### 1. 📊 Compliance Overview Dashboard (`/overview`)
- **Real-Time KPIs**: High-visibility card panels showing total active vendors, overall account compliance rate, documents expiring within 30 days, and pending review counts.
- **Dynamic Timeline Feed**: An interactive, scrollable recent activity tree detailing automated document syncs, processed policy scans, and SMS reminder notifications.
- **Action-Needed Renewal Chase Queue**: Spans the full canvas width, highlighting expired or expiring vendor records with quick-action buttons to dispatch SMS/email renewal requests instantly.

### 2. 👷 Subcontractor Catalog & detail Views (`/subcontractors`)
- **Catalog Page**: Filterable directory enabling compliance managers to search subcontractors by name, trade specialty, or active status (Compliant, Expiring Soon, Non-Compliant).
- **Onboarding Modal**: Form to onboard new subcontractors and persist them to DynamoDB.
- **Detail View (`/subcontractors/:id`)**: Comprehensive company profile displaying primary contacts, project assignments, and their historical COI compliance vault.
- **Dynamic S3 Ingest Trigger**: Directly request S3 presigned URLs, upload files securely via multi-part PUT, and start background extraction pipelines.

### 3. 📂 Document Vault & Side-by-Side Review Page (`/intake`)
- **Direct Uploads & Simulation**: Contains simulator buttons for mobile photo capture upload and SES automated email intake simulation.
- **Side-by-Side Verification Modal (`DocumentExtractionModal`)**: Opens a dual-column layout streaming the original PDF/image preview from S3 on the left, and editable metadata verification fields (Carrier, Policy Number, Expiration Date) parsed by AWS Bedrock on the right.
- **Native Browser Calendar Trigger**: Custom 📅 calendar button that opens the native OS date picker overlay on any input field.

### 4. 🤖 Grounded RAG Chat Assistant Widget
- **Floating Widget Overlay**: Grounded strictly in your company's uploaded documents via AWS Bedrock Knowledge Base retrieve-and-generate APIs.
- **Human-Like Tone**: Tailored Bedrock generation prompts that output conversational, direct answers (e.g. listing only the exact company names and contacts asked for) and preserve spacing/line breaks without technical result wrapper boilerplate.

---

## 🎨 Solid Pill Badge Compliance System

To adhere to construction industry compliance standards, document status indicators are rendered as solid, high-visibility badges:

- **🟢 Compliant**: Solid Emerald Pill (`bg-emerald-500 text-slate-950 font-extrabold rounded-full px-3 py-1`) — Document is approved with a valid expiration date > 30 days in the future.
- **🟡 Expiring Soon**: Solid Gold/Amber Pill (`bg-amber-500 text-slate-950 font-extrabold rounded-full px-3 py-1`) — Document is valid, but expires within 30 days.
- **🔴 Non-Compliant**: Solid Rose Pill (`bg-rose-500 text-white font-extrabold rounded-full px-3 py-1`) — Document has expired, is missing mandatory fields, or failed human verification.
- **🔴 Needs Review**: Solid Rose Pill with Warning Icon (`bg-rose-500 text-white font-extrabold rounded-full px-3 py-1`) — Document requires human verification.

---

## 🛠️ Local Development & Setup

### Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x

### Running the App
1. Install project dependencies:
   ```bash
   npm install
   ```

2. Start the Vite hot-reloading development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` in your web browser.

4. Build the minified production bundle:
   ```bash
   npm run build
   ```
