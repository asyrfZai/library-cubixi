// ── Configure these before deploying ──────────────────────────────
// Spreadsheet that holds the list of books (columns: ID | Name)
const BOOKS_SHEET_ID = "PASTE_BOOKS_SPREADSHEET_ID_HERE";
const BOOKS_SHEET_NAME = "Books";

// Spreadsheet that receives loan requests / feedback
// (columns: Timestamp | Name | Book ID | Book Name | Start Date | End Date)
const FEEDBACK_SHEET_ID = "PASTE_FEEDBACK_SPREADSHEET_ID_HERE";
const FEEDBACK_SHEET_NAME = "Loan Requests";
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
      appendLoanRequest(payload);
      return jsonResponse({ success: true });
    }
    return jsonResponse({ success: false, error: "Unknown action" });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
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
