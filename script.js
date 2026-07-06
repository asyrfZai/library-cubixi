const form = document.getElementById("loanForm");
const bookSearchInput = document.getElementById("bookSearch");
const bookHiddenInput = document.getElementById("book");
const bookOptionsList = document.getElementById("bookOptions");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");

let allBooks = [];
let activeIndex = -1;

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

function selectBook(book) {
  bookHiddenInput.value = book.id;
  bookHiddenInput.dataset.name = book.name;
  bookSearchInput.value = book.name;
  closeOptions();
  setFieldError("book", "");
}

function clearBookSelection() {
  bookHiddenInput.value = "";
  bookHiddenInput.dataset.name = "";
}

function renderOptions(filterText) {
  const query = filterText.trim().toLowerCase();
  const matches = query
    ? allBooks.filter((book) => book.name.toLowerCase().includes(query))
    : allBooks;

  bookOptionsList.innerHTML = "";
  activeIndex = -1;

  if (matches.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No books found";
    bookOptionsList.appendChild(li);
  } else {
    matches.forEach((book) => {
      const li = document.createElement("li");
      li.textContent = book.name;
      li.setAttribute("role", "option");
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        selectBook(book);
      });
      bookOptionsList.appendChild(li);
    });
  }

  openOptions();
}

function openOptions() {
  bookOptionsList.hidden = false;
  bookSearchInput.setAttribute("aria-expanded", "true");
}

function closeOptions() {
  bookOptionsList.hidden = true;
  bookSearchInput.setAttribute("aria-expanded", "false");
  activeIndex = -1;
}

function highlightOption(index) {
  const items = Array.from(bookOptionsList.querySelectorAll("li:not(.empty)"));
  items.forEach((item, i) => item.classList.toggle("active", i === index));
  if (items[index]) items[index].scrollIntoView({ block: "nearest" });
}

async function loadBooks() {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=list`);
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    allBooks = data.books || [];

    if (allBooks.length === 0) {
      bookSearchInput.placeholder = "No books available";
      return;
    }

    bookSearchInput.placeholder = "Search for a book...";
    bookSearchInput.disabled = false;
  } catch (err) {
    bookSearchInput.placeholder = "Failed to load books";
    showMessage("Could not load the book list. Please refresh and try again.", "error");
  }
}

bookSearchInput.addEventListener("input", () => {
  clearBookSelection();
  renderOptions(bookSearchInput.value);
});

bookSearchInput.addEventListener("focus", () => {
  renderOptions(bookSearchInput.value);
});

bookSearchInput.addEventListener("blur", () => {
  closeOptions();
});

bookSearchInput.addEventListener("keydown", (e) => {
  const items = Array.from(bookOptionsList.querySelectorAll("li:not(.empty)"));
  if (bookOptionsList.hidden || items.length === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex = (activeIndex + 1) % items.length;
    highlightOption(activeIndex);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex = (activeIndex - 1 + items.length) % items.length;
    highlightOption(activeIndex);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (activeIndex >= 0 && items[activeIndex]) {
      items[activeIndex].dispatchEvent(new Event("mousedown"));
    }
  } else if (e.key === "Escape") {
    closeOptions();
  }
});

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
  const bookId = bookHiddenInput.value;
  const bookName = bookHiddenInput.dataset.name || "";
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
    clearBookSelection();
  } catch (err) {
    showMessage(err.message || "Something went wrong. Please try again.", "error");
  } finally {
    setSubmitting(false);
  }
});

loadBooks();
