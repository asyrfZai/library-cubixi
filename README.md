# Library Book Loan Request Form

A static form that lets a member request to borrow a book. The book list is
pulled live from a Google Sheet, and every submission is written to a
separate "feedback" Google Sheet — all via a single Google Apps Script Web App
(no backend server needed).

## Files

- `index.html` / `style.css` — the form UI (theme: `#798f69` green + black)
- `script.js` — loads the book dropdown, auto-computes the end date (+1 month), submits the form
- `config.js` — put your deployed Apps Script Web App URL here
- `apps-script/Code.gs` — the Google Apps Script backend to deploy

## 1. Create the two Google Sheets

**Books sheet** (read-only source for the dropdown)
| A (ID) | B (Name)          |
|--------|-------------------|
| ID     | Name              |
| B001   | The Hobbit        |
| B002   | Clean Code        |

Row 1 must be a header row (it's skipped automatically). Any sheet/tab name is fine — just set `BOOKS_SHEET_NAME` in `Code.gs` to match (default: `Books`).

**Loan Requests sheet** (where submissions/feedback are written)
| A (Timestamp) | B (Name) | C (Book ID) | D (Book Name) | E (Start Date) | F (End Date) |
|---|---|---|---|---|---|

Just add the header row shown above; the script appends new rows below it. Set `FEEDBACK_SHEET_NAME` in `Code.gs` to match your tab name (default: `Loan Requests`).

Copy each spreadsheet's ID from its URL:
`https://docs.google.com/spreadsheets/d/`**`THIS_PART_IS_THE_ID`**`/edit`

## 2. Deploy the Apps Script

1. Go to [script.google.com](https://script.google.com) → **New project**.
2. Delete the default code and paste in the contents of `apps-script/Code.gs`.
3. Replace `BOOKS_SHEET_ID` and `FEEDBACK_SHEET_ID` with the IDs from step 1.
4. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (required so the static form can call it)
5. Click **Deploy**, authorize the script when prompted, and copy the **Web app URL** (ends in `/exec`).

## 3. Wire up the form

Paste the Web App URL into `config.js`:

```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
```

## 4. Run it

Just open `index.html` in a browser, or serve the folder with any static file server, e.g.:

```bash
npx serve .
```

## Notes

- Every time you edit `Code.gs`, you must create a **new deployment version** (Deploy → Manage deployments → Edit → New version) for changes to take effect on the same URL.
- The Books sheet and Loan Requests sheet can live in the same Google account but are intentionally separate spreadsheets, per the requirement that submissions go to a different sheet than the book list.
