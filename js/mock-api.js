/**
 * AWS Native Platform Mock API Engine
 * Simulates API Gateway routes, Step Functions execution, DynamoDB responses, and Bedrock Knowledge Base RAG queries.
 */

window.MockAPI = (function() {
  
  // Synthetic Financial Transactions for Bookkeeping & Revenue Tracker
  const bookkeepingData = [
    { id: "TXN-9021", date: "2026-03-24", vendor: "AWS Web Services", category: "Cloud Infrastructure", amount: 482.50, status: "categorized", receiptUrl: "#", confidence: 0.99, notes: "EC2 & Bedrock monthly usage" },
    { id: "TXN-9022", date: "2026-03-22", vendor: "OpenAI API", category: "AI Services", amount: 240.00, status: "categorized", receiptUrl: "#", confidence: 0.98, notes: "API usage credits" },
    { id: "TXN-9023", date: "2026-03-20", vendor: "Vercel Inc", category: "Hosting & CDN", amount: 40.00, status: "categorized", receiptUrl: "#", confidence: 0.99, notes: "Pro team plan" },
    { id: "TXN-9024", date: "2026-03-18", vendor: "GitHub Enterprise", category: "Developer Tools", amount: 210.00, status: "categorized", receiptUrl: "#", confidence: 0.97, notes: "21 user licenses" },
    { id: "TXN-9025", date: "2026-03-15", vendor: "Slack Technologies", category: "Communication", amount: 156.00, status: "categorized", receiptUrl: "#", confidence: 0.95, notes: "Business+ tier" },
    { id: "TXN-9026", date: "2026-03-14", vendor: "Uber Trip #981A", category: "Travel & Meals", amount: 45.20, status: "pending", receiptUrl: "#", confidence: 0.82, notes: "Airport trip to client meeting" },
    { id: "TXN-9027", date: "2026-03-11", vendor: "Unknown Merchant *849", category: "Uncategorized", amount: 890.00, status: "flagged", receiptUrl: "#", confidence: 0.45, notes: "Anomaly flagged - high amount without receipt" },
    { id: "TXN-9028", date: "2026-03-08", vendor: "Figma Subscription", category: "Design Tools", amount: 90.00, status: "categorized", receiptUrl: "#", confidence: 0.99, notes: "Professional seats" },
    { id: "TXN-9029", date: "2026-03-05", vendor: "Google Workspace", category: "Software & SaaS", amount: 144.00, status: "categorized", receiptUrl: "#", confidence: 0.98, notes: "Business Starter" },
    { id: "TXN-9030", date: "2026-03-01", vendor: "WeWork Office Space", category: "Rent & Office", amount: 1250.00, status: "categorized", receiptUrl: "#", confidence: 0.99, notes: "Monthly desk membership" },
    { id: "TXN-9031", date: "2026-02-28", vendor: "AWS Web Services", category: "Cloud Infrastructure", amount: 440.10, status: "categorized", receiptUrl: "#", confidence: 0.99, notes: "EC2 & S3 usage" },
    { id: "TXN-9032", date: "2026-02-24", vendor: "Stripe Processing Fee", category: "Bank & Merchant Fees", amount: 312.40, status: "categorized", receiptUrl: "#", confidence: 0.99, notes: "Transaction fees" },
    { id: "TXN-9033", date: "2026-02-20", vendor: "Supabase Inc", category: "Cloud Infrastructure", amount: 75.00, status: "categorized", receiptUrl: "#", confidence: 0.98, notes: "Database compute" },
    { id: "TXN-9034", date: "2026-02-15", vendor: "Apple Store - Hardware", category: "Equipment", amount: 2499.00, status: "categorized", receiptUrl: "#", confidence: 0.96, notes: "MacBook Pro M3 Max" },
    { id: "TXN-9035", date: "2026-02-10", vendor: "Delta Air Lines", category: "Travel & Meals", amount: 620.00, status: "categorized", receiptUrl: "#", confidence: 0.94, notes: "Flight to Tech Conference" }
  ];

  // Document Presets for Document Extractor
  const documentPresets = {
    invoice: {
      title: "Invoice #INV-8841 (Cloud Infrastructure)",
      fileName: "invoice_aws_march.pdf",
      rawText: "INVOICE #INV-8841\nDate: March 24, 2026\nVendor: AWS Web Services\nBilled To: Acme Corp\nItem: AWS Bedrock & EC2 Compute - $482.50\nPayment Method: Visa ending 4092",
      extractedJSON: {
        document_type: "Commercial Invoice",
        invoice_number: "INV-8841",
        issue_date: "2026-03-24",
        vendor: {
          name: "AWS Web Services",
          tax_id: "US-99182371",
          address: "Seattle, WA, USA"
        },
        financials: {
          subtotal: 450.00,
          tax: 32.50,
          total_amount: 482.50,
          currency: "USD"
        },
        line_items: [
          { description: "AWS Bedrock Foundation Models", amount: 280.00 },
          { description: "Amazon EC2 t4g.xlarge Instances", amount: 170.00 }
        ],
        confidence_score: 0.985
      }
    },
    receipt: {
      title: "Receipt #REC-1029 (Hardware Purchase)",
      fileName: "receipt_apple_hardware.pdf",
      rawText: "APPLE STORE #R102\nDate: Feb 15, 2026\nItem: MacBook Pro 16\" M3 Max\nTotal Paid: $2,499.00 (Tax incl.)\nAuth Code: 881920",
      extractedJSON: {
        document_type: "Retail Receipt",
        receipt_number: "REC-1029",
        merchant: "Apple Store #R102",
        transaction_date: "2026-02-15",
        total_amount: 2499.00,
        currency: "USD",
        items: [
          { sku: "MBP-16-M3", name: "MacBook Pro 16\" M3 Max", unit_price: 2499.00, quantity: 1 }
        ],
        confidence_score: 0.991
      }
    },
    w2: {
      title: "Form W-2 Wage Statement (2025)",
      fileName: "form_w2_2025_sample.pdf",
      rawText: "Form W-2 Wage and Tax Statement 2025\nEmployer: ACME TECH LLC (EIN: 12-3456789)\nEmployee: Jane Doe (SSN: XXX-XX-4419)\n1 Wages, tips, other comp: $145,000.00\n2 Federal income tax withheld: $28,400.00",
      extractedJSON: {
        document_type: "IRS Form W-2",
        tax_year: 2025,
        employer: { name: "ACME TECH LLC", ein: "12-3456789" },
        employee: { name: "Jane Doe", ssn_masked: "XXX-XX-4419" },
        wages: 145000.00,
        federal_tax_withheld: 28400.00,
        social_security_wages: 145000.00,
        confidence_score: 0.978
      }
    }
  };

  // Synthetic E-Commerce Reviews for Sentiment & Review Analyzer
  const reviewData = [
    { id: "REV-101", rating: 5, author: "Sarah M.", date: "2026-03-22", text: "The AWS native architecture speed is unbelievable. Data queries take under 100ms!", sentiment: "positive", score: 0.98, keyTopic: "Performance", painPoint: "None" },
    { id: "REV-102", rating: 1, author: "Dave K.", date: "2026-03-21", text: "Shipping was delayed by 4 days and customer support didn't reply to my ticket for 48 hours.", sentiment: "negative", score: 0.95, keyTopic: "Shipping & Support", painPoint: "Late Delivery & Support Delay" },
    { id: "REV-103", rating: 4, author: "Elena R.", date: "2026-03-19", text: "Great product overall, but the initial onboarding instructions were a bit confusing.", sentiment: "positive", score: 0.76, keyTopic: "User Onboarding", painPoint: "Documentation clarity" },
    { id: "REV-104", rating: 2, author: "Marcus T.", date: "2026-03-18", text: "Pricing is way too high compared to competitors. The basic plan lacks key export features.", sentiment: "negative", score: 0.91, keyTopic: "Pricing & Features", painPoint: "High Price & Missing Exports" },
    { id: "REV-105", rating: 5, author: "Jessica P.", date: "2026-03-15", text: "The conversational AI chat assistant answered all my financial questions instantly! Outstanding.", sentiment: "positive", score: 0.99, keyTopic: "AI Chat & Usability", painPoint: "None" }
  ];

  // Public Methods
  return {
    getBookkeepingData: () => bookkeepingData,
    getDocumentPresets: () => documentPresets,
    getReviewData: () => reviewData,

    // Simulate Step Function Execution
    executeStepFunction: async (featureName, payload) => {
      const startTime = performance.now();
      await new Promise(res => setTimeout(res, 450)); // Realistic API gateway latency
      const endTime = performance.now();

      return {
        executionArn: `arn:aws:states:us-east-1:123456789012:execution:${featureName}-state-machine:${Date.now()}`,
        status: "SUCCEEDED",
        durationMs: Math.round(endTime - startTime),
        input: payload,
        output: {
          statusCode: 200,
          feature: featureName,
          timestamp: new Date().toISOString(),
          processedCount: Array.isArray(payload) ? payload.length : 1,
          bedrockTokenUsage: { inputTokens: 420, outputTokens: 185 }
        }
      };
    },

    // Simulate RAG Knowledge Base Queries
    queryRAGKnowledgeBase: async (query, contextView) => {
      await new Promise(res => setTimeout(res, 600)); // Bedrock Knowledge Base vector search latency
      const q = query.toLowerCase();

      if (contextView === "bookkeeping") {
        if (q.includes("software") || q.includes("saas") || q.includes("highest")) {
          return {
            answer: "Based on your March 2026 transactions, your highest software expenses were **AWS Web Services** ($482.50), **OpenAI API** ($240.00), and **GitHub Enterprise** ($210.00). Total software spend for March is **$1,166.50**.",
            citations: [
              { label: "TXN-9021 (AWS)", rowId: "TXN-9021" },
              { label: "TXN-9022 (OpenAI)", rowId: "TXN-9022" },
              { label: "TXN-9024 (GitHub)", rowId: "TXN-9024" }
            ]
          };
        } else if (q.includes("flagged") || q.includes("anomaly") || q.includes("suspicious")) {
          return {
            answer: "There is 1 flagged transaction requiring review: **Unknown Merchant *849** on March 11 for **$890.00**. It was flagged due to low confidence (45%) and a missing receipt attachment.",
            citations: [
              { label: "TXN-9027 (Flagged)", rowId: "TXN-9027" }
            ]
          };
        } else {
          return {
            answer: `I analyzed your 15 transaction records in DynamoDB. Total income tracking shows net positive margin with cloud infrastructure accounting for 32% of total operational expenditure.`,
            citations: [
              { label: "Bookkeeping Index", rowId: "TXN-9021" }
            ]
          };
        }
      } else if (contextView === "reviews") {
        if (q.includes("complaint") || q.includes("angriest") || q.includes("shipping")) {
          return {
            answer: "The primary shipping complaint came from **Dave K. (REV-102)** who rated 1 star, stating: *'Shipping was delayed by 4 days and customer support didn't reply for 48 hours.'*",
            citations: [
              { label: "REV-102 (Dave K.)", rowId: "REV-102" }
            ]
          };
        } else {
          return {
            answer: "Analysis of 5 recent customer reviews shows a **60% Positive sentiment rate**. Key praised features include AI query speed and overall performance.",
            citations: [
              { label: "REV-101 (Sarah M.)", rowId: "REV-101" }
            ]
          };
        }
      } else {
        return {
          answer: "Extracted document fields confirm Invoice #INV-8841 was issued by AWS Web Services for $482.50 on March 24, 2026. All line items passed JSON schema validation.",
          citations: [
            { label: "Document Bedrock Parse", rowId: "doc-preview" }
          ]
        };
      }
    }
  };
})();
