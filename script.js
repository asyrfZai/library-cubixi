const form = document.getElementById("loanForm");
const bookSelect = document.getElementById("book");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");

function setFieldError(fieldName, message) {
  const el = document.querySelector(`.error[data-for="${fieldName}"]`);
  if (el) el.textContent = message || "";
}

function clearErrors() {
  document.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
}

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = `form-message ${type || ""}`;
}

function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  submitBtn.querySelector(".btn-text").textContent = isSubmitting ? "Submitting..." : "Submit Request";
  submitBtn.querySelector(".btn-spinner").hidden = !isSubmitting;
}

function toISODate(date) {
  return date.toISOString().split("T")[0];
}

function addOneMonth(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  const day = date.getDate();
  date.setMonth(date.getMonth() + 1);
  // Handle month-length overflow (e.g. Jan 31 -> Mar 3 becomes Feb 28/29)
  if (date.getDate() !== day) {
    date.setDate(0);
  }
  return toISODate(date);
}

async function loadBooks() {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=list`);
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    const books = data.books || [];

    bookSelect.innerHTML = "";

    if (books.length === 0) {
      bookSelect.innerHTML = '<option value="" disabled selected>No books available</option>';
      return;
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a book";
    placeholder.disabled = true;
    placeholder.selected = true;
    bookSelect.appendChild(placeholder);

    books.forEach((book) => {
      const option = document.createElement("option");
      option.value = book.id;
      option.textContent = book.name;
      option.dataset.name = book.name;
      bookSelect.appendChild(option);
    });
  } catch (err) {
    bookSelect.innerHTML = '<option value="" disabled selected>Failed to load books</option>';
    showMessage("Could not load the book list. Please refresh and try again.", "error");
  }
}

startDateInput.addEventListener("change", () => {
  if (startDateInput.value) {
    endDateInput.value = addOneMonth(startDateInput.value);
  } else {
    endDateInput.value = "";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();
  showMessage("", "");

  const name = document.getElementById("name").value.trim();
  const bookId = bookSelect.value;
  const bookName = bookSelect.selectedOptions[0]?.dataset.name || "";
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  let hasError = false;
  if (!name) {
    setFieldError("name", "Name is required");
    hasError = true;
  }
  if (!bookId) {
    setFieldError("book", "Please select a book");
    hasError = true;
  }
  if (!startDate) {
    setFieldError("startDate", "Start date is required");
    hasError = true;
  }
  if (hasError) return;

  setSubmitting(true);
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "submit",
        name,
        bookId,
        bookName,
        startDate,
        endDate,
      }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || "Submission failed");

    showMessage("Request submitted successfully!", "success");
    form.reset();
    endDateInput.value = "";
  } catch (err) {
    showMessage(err.message || "Something went wrong. Please try again.", "error");
  } finally {
    setSubmitting(false);
  }
});

loadBooks();
