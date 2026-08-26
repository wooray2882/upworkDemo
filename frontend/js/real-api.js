/**
 * Real backend API client - calls the deployed API Gateway routes directly.
 * Mirrors the shape of window.MockAPI's executeStepFunction() return value
 * so the existing views/app.js drawer logging code works unchanged.
 */
window.RealAPI = (function () {
  const BASE_URL = window.APP_CONFIG.API_BASE_URL;

  // POSTs to a feature route; the API Gateway integration runs the route's
  // Step Functions state machine synchronously and returns its raw
  // StartSyncExecution response (executionArn, status, output as a JSON
  // string, etc - see infrastructure/modules/feature/api-route.tf).
  const callFeature = async (routeName, payload) => {
    const startTime = performance.now();
    const response = await fetch(`${BASE_URL}/${routeName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const raw = await response.json();
    const durationMs = Math.round(performance.now() - startTime);

    if (raw.status === "FAILED") {
      const cause = (() => {
        try { return JSON.parse(raw.cause); } catch { return raw.cause; }
      })();
      throw new Error(cause?.errorMessage || raw.cause || "Step Function execution failed");
    }

    const output = raw.output ? JSON.parse(raw.output) : null;

    return {
      executionArn: raw.executionArn,
      status: raw.status,
      durationMs,
      input: payload,
      output
    };
  };

  return {
    extractDocument: (documentText) => callFeature("extract-document", { document_text: documentText }),
    // documentBase64/mediaType come from a real uploaded PDF or image - Claude
    // reads it directly via Bedrock's native document/vision support (this IS
    // the OCR step, no separate OCR/Textract service involved).
    extractDocumentFile: (documentBase64, mediaType) => callFeature("extract-document", { document_base64: documentBase64, media_type: mediaType }),
    analyzeReviews: (reviewsText) => callFeature("analyze-reviews", { reviews_text: reviewsText }),
    queryBookkeeping: (transactionsText) => callFeature("bookkeeping-query", { transactions_text: transactionsText })
  };
})();
