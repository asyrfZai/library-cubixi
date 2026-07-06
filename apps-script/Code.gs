// ── Configure these before deploying ──────────────────────────────
// Spreadsheet that holds the list of books (columns: ID | Name)
const BOOKS_SHEET_ID = "1Nb5vv3HEsGbFvmX86XW8Uj4fbMlV-y4SOvNVeT7mD28";
const BOOKS_SHEET_NAME = "Sheet1";

// Spreadsheet that receives loan requests / feedback
// (columns: Timestamp | Name | Book ID | Book Name | Start Date | End Date)
const FEEDBACK_SHEET_ID = "1tp5ccVNTnDSr9gN6Obc5pd8l_Rw3wj6rwAzNGzROBBc";
const FEEDBACK_SHEET_NAME = "Sheet1";

// Rate limiting (Apps Script has no access to caller IP, so this throttles
// total traffic to the endpoint rather than per-visitor).
const MAX_SUBMISSIONS_PER_WINDOW = 20; // max submissions allowed...
const RATE_LIMIT_WINDOW_SECONDS = 60; // ...per this many seconds
const DUPLICATE_SUPPRESS_SECONDS = 30; // block an identical payload resubmitted within this window
// ───────────────────────────────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;
  if (action === "list") {
    return jsonResponse({ success: true, books: getBooks() });
  }
  return jsonResponse({ success: false, error: "Unknown action" });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.action === "submit") {
      const rateLimitError = checkRateLimit(payload);
      if (rateLimitError) {
        return jsonResponse({ success: false, error: rateLimitError });
      }
      appendLoanRequest(payload);
      return jsonResponse({ success: true });
    }
    return jsonResponse({ success: false, error: "Unknown action" });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function checkRateLimit(payload) {
  const cache = CacheService.getScriptCache();

  // Global throttle: cap total submissions within the rolling window.
  const countKey = "submission_count";
  const currentCount = Number(cache.get(countKey) || 0);
  if (currentCount >= MAX_SUBMISSIONS_PER_WINDOW) {
    return "Too many requests right now. Please try again in a minute.";
  }
  cache.put(countKey, String(currentCount + 1), RATE_LIMIT_WINDOW_SECONDS);

  // Duplicate suppression: block the exact same submission repeated quickly.
  const dedupeKey = "dup_" + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      [payload.name, payload.bookId, payload.startDate].join("|")
    )
  );
  if (cache.get(dedupeKey)) {
    return "This request was already submitted. Please wait before trying again.";
  }
  cache.put(dedupeKey, "1", DUPLICATE_SUPPRESS_SECONDS);

  return null;
}

function getBooks() {
  const sheet = SpreadsheetApp.openById(BOOKS_SHEET_ID).getSheetByName(BOOKS_SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  // Skip header row; expects columns: ID, Name
  return rows.slice(1)
    .filter((row) => row[0] !== "" && row[1] !== "")
    .map((row) => ({ id: row[0], name: row[1] }));
}

function appendLoanRequest(payload) {
  const sheet = SpreadsheetApp.openById(FEEDBACK_SHEET_ID).getSheetByName(FEEDBACK_SHEET_NAME);
  sheet.appendRow([
    new Date(),
    payload.name,
    payload.bookId,
    payload.bookName,
    payload.startDate,
    payload.endDate,
  ]);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
