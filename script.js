(function () {
  "use strict";

  var STORAGE_TASKS = "mahir-planner-tasks";
  var STORAGE_THEME = "mahir-planner-theme";
  var CATEGORIES = ["Study", "Homework", "Personal", "Projects", "Other"];
  var PRIORITIES = ["Low", "Medium", "High"];

  var state = {
    tasks: [],
    editingId: null,
    deletingId: null,
    filters: {
      search: "",
      status: "all",
      priority: "all",
      category: "all",
      sort: "deadline-asc"
    }
  };

  var lastFocus = null;
  var saving = false;

  var liveClock = document.getElementById("live-clock");
  var todayLabel = document.getElementById("today-label");
  var themeToggle = document.getElementById("theme-toggle");
  var themeColor = document.querySelector('meta[name="theme-color"]');
  var statTotal = document.getElementById("stat-total");
  var statCompleted = document.getElementById("stat-completed");
  var statPending = document.getElementById("stat-pending");
  var statToday = document.getElementById("stat-today");
  var statOverdue = document.getElementById("stat-overdue");
  var progress = document.getElementById("progress");
  var progressBar = document.getElementById("progress-bar");
  var progressLabel = document.getElementById("progress-label");
  var progressDetail = document.getElementById("progress-detail");
  var countAll = document.getElementById("count-all");
  var countPending = document.getElementById("count-pending");
  var countCompleted = document.getElementById("count-completed");
  var searchInput = document.getElementById("search-input");
  var clearSearch = document.getElementById("clear-search");
  var priorityFilter = document.getElementById("priority-filter");
  var sortSelect = document.getElementById("sort-select");
  var resetFilters = document.getElementById("reset-filters");
  var resultCount = document.getElementById("result-count");
  var taskList = document.getElementById("task-list");
  var emptyState = document.getElementById("empty-state");
  var emptyTitle = document.getElementById("empty-title");
  var emptyCopy = document.getElementById("empty-copy");
  var emptyAdd = document.getElementById("empty-add");
  var emptyReset = document.getElementById("empty-reset");
  var newTaskBtn = document.getElementById("new-task-btn");
  var formModal = document.getElementById("form-modal");
  var taskForm = document.getElementById("task-form");
  var formHeading = document.getElementById("form-heading");
  var formSubmit = document.getElementById("form-submit");
  var formCancel = document.getElementById("form-cancel");
  var formClose = document.getElementById("form-close");
  var fieldTitle = document.getElementById("field-title");
  var fieldNotes = document.getElementById("field-notes");
  var fieldCategory = document.getElementById("field-category");
  var fieldPriority = document.getElementById("field-priority");
  var fieldDeadline = document.getElementById("field-deadline");
  var deleteModal = document.getElementById("delete-modal");
  var deleteMessage = document.getElementById("delete-message");
  var confirmDelete = document.getElementById("confirm-delete");
  var cancelDelete = document.getElementById("cancel-delete");
  var toastStack = document.getElementById("toast-stack");

  function todayISO(date) {
    var now = date || new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  function isISODate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var parts = value.split("-");
    var year = Number(parts[0]);
    var month = Number(parts[1]);
    var day = Number(parts[2]);
    var date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  function formatLongDate(date) {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatShortDate(iso) {
    var parts = iso.split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }

  function formatTime(date) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "task-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function isTask(value) {
    return Boolean(value)
      && typeof value.id === "string"
      && typeof value.title === "string"
      && typeof value.notes === "string"
      && CATEGORIES.indexOf(value.category) !== -1
      && PRIORITIES.indexOf(value.priority) !== -1
      && isISODate(value.deadline)
      && typeof value.completed === "boolean"
      && typeof value.createdAt === "number";
  }

  function loadTasks() {
    try {
      var raw = localStorage.getItem(STORAGE_TASKS);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isTask);
    } catch (error) {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_TASKS, JSON.stringify(state.tasks));
    } catch (error) {
      showToast("Could not save tasks in this browser.", "error");
    }
  }

  function findTask(id) {
    for (var i = 0; i < state.tasks.length; i += 1) {
      if (state.tasks[i].id === id) return state.tasks[i];
    }
    return null;
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_THEME, theme);
    } catch (error) {
      showToast("Could not save the theme preference.", "error");
    }
    var next = theme === "dark" ? "light" : "dark";
    themeToggle.setAttribute("aria-label", "Switch to " + next + " mode");
    themeToggle.setAttribute("title", "Switch to " + next + " mode");
    if (themeColor) themeColor.setAttribute("content", theme === "light" ? "#e7eefc" : "#071226");
  }

  function showToast(message, type) {
    var toast = document.createElement("div");
    toast.className = "toast toast-" + (type || "success");
    toast.setAttribute("role", "status");
    toast.textContent = message;
    toastStack.appendChild(toast);
    while (toastStack.children.length > 4) {
      toastStack.removeChild(toastStack.firstElementChild);
    }
    requestAnimationFrame(function () {
      toast.classList.add("is-in");
    });
    window.setTimeout(function () {
      toast.classList.remove("is-in");
      window.setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 280);
    }, 2800);
  }

  function deadlineKind(task) {
    if (task.completed) return "done";
    var today = todayISO();
    if (task.deadline < today) return "overdue";
    if (task.deadline === today) return "today";
    return "upcoming";
  }

  function deadlineText(task) {
    var kind = deadlineKind(task);
    if (task.completed) return "Completed · " + formatShortDate(task.deadline);
    if (kind === "overdue") return "Overdue · " + formatShortDate(task.deadline);
    if (kind === "today") return "Due today";
    return "Due " + formatShortDate(task.deadline);
  }

  function filtersAreDefault() {
    return state.filters.search === ""
      && state.filters.status === "all"
      && state.filters.priority === "all"
      && state.filters.category === "all"
      && state.filters.sort === "deadline-asc";
  }

  function visibleTasks() {
    var query = state.filters.search.trim().toLowerCase();
    var list = state.tasks.filter(function (task) {
      if (state.filters.status === "completed" && !task.completed) return false;
      if (state.filters.status === "pending" && task.completed) return false;
      if (state.filters.priority !== "all" && task.priority !== state.filters.priority) return false;
      if (state.filters.category !== "all" && task.category !== state.filters.category) return false;
      if (!query) return true;
      var haystack = (task.title + " " + task.notes + " " + task.category + " " + task.priority).toLowerCase();
      return haystack.indexOf(query) !== -1;
    });

    list.sort(function (a, b) {
      if (state.filters.sort === "newest") return b.createdAt - a.createdAt;
      if (a.deadline === b.deadline) return a.createdAt - b.createdAt;
      var direction = state.filters.sort === "deadline-desc" ? -1 : 1;
      return a.deadline < b.deadline ? -1 * direction : direction;
    });
    return list;
  }

  function taskMarkup(task) {
    var kind = deadlineKind(task);
    var notes = task.notes.trim()
      ? '<p class="task-notes">' + escapeHtml(task.notes) + "</p>"
      : "";
    return (
      '<article class="task-card is-' + kind + '" data-id="' + escapeHtml(task.id) + '">' +
        '<div class="task-top">' +
          '<button type="button" class="check" data-action="toggle" aria-pressed="' + (task.completed ? "true" : "false") + '" aria-label="' + (task.completed ? "Mark as pending" : "Mark as completed") + '">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5 10 16.5 18 8"></path></svg>' +
          "</button>" +
          '<div class="task-main">' +
            '<div class="task-title-row">' +
              "<h3 class=\"task-title\">" + escapeHtml(task.title) + "</h3>" +
              '<span class="pill pill-' + task.priority.toLowerCase() + '">' + escapeHtml(task.priority) + "</span>" +
            "</div>" +
            '<div class="task-meta">' +
              '<span class="category-chip"><i class="dot dot-' + task.category.toLowerCase() + '"></i>' + escapeHtml(task.category) + "</span>" +
              '<span class="deadline is-' + kind + '">' + escapeHtml(deadlineText(task)) + "</span>" +
            "</div>" +
          "</div>" +
        "</div>" +
        notes +
        '<div class="task-actions">' +
          '<button type="button" class="mini-btn" data-action="edit">Edit</button>' +
          '<button type="button" class="mini-btn danger" data-action="delete">Delete</button>' +
        "</div>" +
      "</article>"
    );
  }

  function render() {
    var today = todayISO();
    var completed = state.tasks.filter(function (task) { return task.completed; }).length;
    var pending = state.tasks.length - completed;
    var dueToday = state.tasks.filter(function (task) {
      return !task.completed && task.deadline === today;
    }).length;
    var overdue = state.tasks.filter(function (task) {
      return !task.completed && task.deadline < today;
    }).length;
    var percent = state.tasks.length ? Math.round((completed / state.tasks.length) * 100) : 0;

    statTotal.textContent = String(state.tasks.length);
    statCompleted.textContent = String(completed);
    statPending.textContent = String(pending);
    statToday.textContent = String(dueToday);
    countAll.textContent = String(state.tasks.length);
    countPending.textContent = String(pending);
    countCompleted.textContent = String(completed);

    if (overdue) {
      statOverdue.hidden = false;
      statOverdue.textContent = overdue + " overdue";
    } else {
      statOverdue.hidden = true;
      statOverdue.textContent = "";
    }

    progressLabel.textContent = percent + "% complete";
    progressDetail.textContent = completed + " of " + state.tasks.length + " tasks completed";
    progress.setAttribute("aria-valuenow", String(percent));
    progressBar.style.width = percent + "%";

    document.querySelectorAll("[data-status]").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.status === state.filters.status);
    });
    document.querySelectorAll("[data-category]").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.category === state.filters.category);
    });

    var tasks = visibleTasks();
    taskList.innerHTML = tasks.map(taskMarkup).join("");
    var noun = tasks.length === 1 ? "task" : "tasks";
    resultCount.textContent = state.tasks.length
      ? "Showing " + tasks.length + " " + noun
      : "No tasks yet";

    var noTasks = state.tasks.length === 0;
    var noMatches = !noTasks && tasks.length === 0;
    emptyState.hidden = tasks.length !== 0;
    taskList.hidden = tasks.length === 0;
    emptyAdd.hidden = noMatches;
    emptyReset.hidden = !noMatches;
    if (noTasks) {
      emptyTitle.textContent = "Your planner is clear";
      emptyCopy.textContent = "Add a study block, homework deadline, or project milestone. It will still be here after you refresh.";
    } else if (noMatches) {
      emptyTitle.textContent = "No tasks match";
      emptyCopy.textContent = "Try another search, priority, category, or status. Your saved tasks are still here.";
    }

    resetFilters.disabled = filtersAreDefault();
    clearSearch.hidden = searchInput.value.length === 0;
  }

  function tickClock() {
    var now = new Date();
    todayLabel.textContent = "Today is " + formatLongDate(now);
    liveClock.textContent = formatTime(now);
    liveClock.setAttribute("datetime", now.toISOString());
  }

  function lockScroll(locked) {
    document.body.classList.toggle("modal-open", locked);
  }

  function openModal(modal, focusTarget) {
    lastFocus = document.activeElement;
    modal.hidden = false;
    lockScroll(true);
    if (focusTarget) focusTarget.focus();
  }

  function closeModal(modal) {
    modal.hidden = true;
    if (formModal.hidden && deleteModal.hidden) lockScroll(false);
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function openCreate() {
    state.editingId = null;
    taskForm.reset();
    fieldPriority.value = "Medium";
    fieldCategory.value = "Study";
    fieldDeadline.value = todayISO();
    formHeading.textContent = "New task";
    formSubmit.textContent = "Add task";
    openModal(formModal, fieldTitle);
  }

  function openEdit(id) {
    var task = findTask(id);
    if (!task) {
      showToast("That task is no longer available.", "error");
      render();
      return;
    }
    state.editingId = id;
    fieldTitle.value = task.title;
    fieldNotes.value = task.notes;
    fieldCategory.value = task.category;
    fieldPriority.value = task.priority;
    fieldDeadline.value = task.deadline;
    formHeading.textContent = "Edit task";
    formSubmit.textContent = "Save changes";
    openModal(formModal, fieldTitle);
  }

  function openDelete(id) {
    var task = findTask(id);
    if (!task) {
      showToast("That task is no longer available.", "error");
      render();
      return;
    }
    state.deletingId = id;
    deleteMessage.textContent = 'Delete "' + task.title + '"? This cannot be undone.';
    openModal(deleteModal, cancelDelete);
  }

  function saveTask(event) {
    event.preventDefault();
    if (saving) return;

    var title = fieldTitle.value.trim();
    var notes = fieldNotes.value.trim();
    var category = fieldCategory.value;
    var priority = fieldPriority.value;
    var deadline = fieldDeadline.value;

    if (!title) {
      showToast("Add a task title.", "error");
      fieldTitle.focus();
      return;
    }
    if (title.length > 80) {
      showToast("Keep the title under 80 characters.", "error");
      fieldTitle.focus();
      return;
    }
    if (notes.length > 280) {
      showToast("Keep notes under 280 characters.", "error");
      fieldNotes.focus();
      return;
    }
    if (CATEGORIES.indexOf(category) === -1 || PRIORITIES.indexOf(priority) === -1) {
      showToast("Choose a valid category and priority.", "error");
      return;
    }
    if (!isISODate(deadline)) {
      showToast("Choose a valid deadline.", "error");
      fieldDeadline.focus();
      return;
    }

    saving = true;
    if (state.editingId) {
      var existing = findTask(state.editingId);
      if (!existing) {
        saving = false;
        showToast("That task is no longer available.", "error");
        closeModal(formModal);
        render();
        return;
      }
      existing.title = title;
      existing.notes = notes;
      existing.category = category;
      existing.priority = priority;
      existing.deadline = deadline;
      saveTasks();
      showToast("Task updated.", "success");
    } else {
      state.tasks.push({
        id: createId(),
        title: title,
        notes: notes,
        category: category,
        priority: priority,
        deadline: deadline,
        completed: false,
        createdAt: Date.now()
      });
      saveTasks();
      showToast("Task added.", "success");
    }
    saving = false;
    closeModal(formModal);
    render();
  }

  function toggleTask(id) {
    var task = findTask(id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    showToast(task.completed ? "Marked complete." : "Marked as pending.", "success");
    render();
  }

  function deleteTask() {
    var id = state.deletingId;
    var index = -1;
    for (var i = 0; i < state.tasks.length; i += 1) {
      if (state.tasks[i].id === id) index = i;
    }
    if (index === -1) {
      showToast("That task is no longer available.", "error");
    } else {
      state.tasks.splice(index, 1);
      saveTasks();
      showToast("Task deleted.", "success");
    }
    state.deletingId = null;
    closeModal(deleteModal);
    render();
  }

  function resetFilterState() {
    state.filters.search = "";
    state.filters.status = "all";
    state.filters.priority = "all";
    state.filters.category = "all";
    state.filters.sort = "deadline-asc";
    searchInput.value = "";
    priorityFilter.value = "all";
    sortSelect.value = "deadline-asc";
    render();
  }

  document.querySelector(".side-nav").addEventListener("click", function (event) {
    var button = event.target.closest("[data-status]");
    if (!button) return;
    state.filters.status = button.dataset.status;
    render();
  });

  document.querySelector(".category-list").addEventListener("click", function (event) {
    var button = event.target.closest("[data-category]");
    if (!button) return;
    state.filters.category = button.dataset.category;
    render();
  });

  searchInput.addEventListener("input", function () {
    state.filters.search = searchInput.value;
    render();
  });

  clearSearch.addEventListener("click", function () {
    searchInput.value = "";
    state.filters.search = "";
    searchInput.focus();
    render();
  });

  priorityFilter.addEventListener("change", function () {
    state.filters.priority = priorityFilter.value;
    render();
  });

  sortSelect.addEventListener("change", function () {
    state.filters.sort = sortSelect.value;
    render();
  });

  resetFilters.addEventListener("click", resetFilterState);
  emptyReset.addEventListener("click", resetFilterState);
  newTaskBtn.addEventListener("click", openCreate);
  emptyAdd.addEventListener("click", openCreate);
  formCancel.addEventListener("click", function () { closeModal(formModal); });
  formClose.addEventListener("click", function () { closeModal(formModal); });
  taskForm.addEventListener("submit", saveTask);
  cancelDelete.addEventListener("click", function () {
    state.deletingId = null;
    closeModal(deleteModal);
  });
  confirmDelete.addEventListener("click", deleteTask);

  themeToggle.addEventListener("click", function () {
    applyTheme(currentTheme() === "dark" ? "light" : "dark");
  });

  formModal.addEventListener("click", function (event) {
    if (event.target === formModal) closeModal(formModal);
  });

  deleteModal.addEventListener("click", function (event) {
    if (event.target === deleteModal) {
      state.deletingId = null;
      closeModal(deleteModal);
    }
  });

  taskList.addEventListener("click", function (event) {
    var action = event.target.closest("[data-action]");
    var card = event.target.closest(".task-card");
    if (!action || !card) return;
    var id = card.getAttribute("data-id");
    if (action.dataset.action === "toggle") toggleTask(id);
    if (action.dataset.action === "edit") openEdit(id);
    if (action.dataset.action === "delete") openDelete(id);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (!deleteModal.hidden) {
      state.deletingId = null;
      closeModal(deleteModal);
    } else if (!formModal.hidden) {
      closeModal(formModal);
    }
  });

  state.tasks = loadTasks();
  applyTheme(currentTheme());
  tickClock();
  window.setInterval(function () {
    var previous = todayLabel.textContent;
    tickClock();
    if (previous !== todayLabel.textContent) render();
  }, 1000);
  render();
})();
