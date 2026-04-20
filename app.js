const STORAGE_KEY = "pulse-habit-tracker-state";

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneValue(value) {
  if (typeof window.structuredClone === "function") {
    return window.structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

const defaultState = {
  habits: [
    { id: createId(), name: "Drink water", goal: 8, unit: "glasses", color: "#ff7a59" },
    { id: createId(), name: "Stand up and stretch", goal: 4, unit: "breaks", color: "#f4a261" }
  ],
  surveyCategories: [
    { id: createId(), name: "Alertness" },
    { id: createId(), name: "Stress" },
    { id: createId(), name: "Mood" }
  ],
  habitLogs: [],
  surveyEntries: {}
};

let state = loadState();

const habitForm = document.querySelector("#habitForm");
const habitList = document.querySelector("#habitList");
const todaySnapshot = document.querySelector("#todaySnapshot");
const historyList = document.querySelector("#historyList");
const correlationList = document.querySelector("#correlationList");
const dailySurveyForm = document.querySelector("#dailySurveyForm");
const surveyCategoryForm = document.querySelector("#surveyCategoryForm");
const surveyCategoryList = document.querySelector("#surveyCategoryList");
const habitCardTemplate = document.querySelector("#habitCardTemplate");
const historyItemTemplate = document.querySelector("#historyItemTemplate");
const habitIdInput = document.querySelector("#habitId");
const habitSubmitButton = document.querySelector("#habitSubmitButton");
const surveyCategoryIdInput = document.querySelector("#surveyCategoryId");
const surveyCategorySubmitButton = document.querySelector("#surveyCategorySubmitButton");

document.querySelector("#openHabitForm").addEventListener("click", () => {
  resetHabitForm();
  habitForm.classList.remove("hidden");
  document.querySelector("#habitName").focus();
});

document.querySelector("#cancelHabitForm").addEventListener("click", () => {
  resetHabitForm();
  habitForm.classList.add("hidden");
});

document.querySelector("#openSurveyCategoryForm").addEventListener("click", () => {
  surveyCategoryForm.classList.toggle("hidden");
});

document.querySelector("#cancelSurveyCategoryForm").addEventListener("click", () => {
  resetSurveyCategoryForm();
  surveyCategoryForm.classList.add("hidden");
});

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.querySelector("#habitName").value.trim();
  const goal = Number(document.querySelector("#habitGoal").value);
  const unit = document.querySelector("#habitUnit").value.trim();
  const color = document.querySelector("#habitColor").value;
  const existingId = habitIdInput.value;

  if (!name || !unit || goal < 1) {
    return;
  }

  if (existingId) {
    state.habits = state.habits.map((habit) => habit.id === existingId ? {
      ...habit,
      name,
      goal,
      unit,
      color
    } : habit);
  } else {
    state.habits.unshift({
      id: createId(),
      name,
      goal,
      unit,
      color
    });
  }

  saveAndRender();
  resetHabitForm();
  habitForm.classList.add("hidden");
});

surveyCategoryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const input = document.querySelector("#surveyCategoryName");
  const name = input.value.trim();
  const existingId = surveyCategoryIdInput.value;
  if (!name) {
    return;
  }

  if (existingId) {
    state.surveyCategories = state.surveyCategories.map((category) => category.id === existingId ? {
      ...category,
      name
    } : category);
  } else {
    state.surveyCategories.push({
      id: createId(),
      name
    });
  }

  resetSurveyCategoryForm();
  saveAndRender();
});

dailySurveyForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const todayKey = getLocalDateKey();
  const formData = new FormData(dailySurveyForm);
  const ratings = {};

  for (const category of state.surveyCategories) {
    const value = Number(formData.get(`rating-${category.id}`));
    if (!Number.isNaN(value) && value > 0) {
      ratings[category.id] = value;
    }
  }

  state.surveyEntries[todayKey] = {
    date: todayKey,
    ratings,
    notes: String(formData.get("survey-notes") || "").trim(),
    updatedAt: new Date().toISOString()
  };

  saveAndRender();
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return cloneValue(defaultState);
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      ...cloneValue(defaultState),
      ...parsed
    };
  } catch (error) {
    console.error("Failed to load saved state", error);
    return cloneValue(defaultState);
  }
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function render() {
  renderSnapshot();
  renderHabits();
  renderSurvey();
  renderSurveyCategories();
  renderCorrelations();
  renderHistory();
}

function renderSnapshot() {
  const todayKey = getLocalDateKey();
  const todayLogs = state.habitLogs.filter((log) => log.date === todayKey);
  const surveyEntry = state.surveyEntries[todayKey];
  const completedGoals = state.habits.filter((habit) => getTodayCount(habit.id) >= habit.goal).length;

  const rows = [
    { label: "Habit logs", value: todayLogs.length },
    { label: "Goals hit", value: `${completedGoals}/${state.habits.length}` },
    { label: "Survey saved", value: surveyEntry ? "Yes" : "No" }
  ];

  todaySnapshot.innerHTML = rows.map((row) => `
    <div class="snapshot-row">
      <span>${row.label}</span>
      <span class="snapshot-value">${row.value}</span>
    </div>
  `).join("");
}

function renderHabits() {
  if (!state.habits.length) {
    habitList.innerHTML = `<p class="empty-state">Create your first habit to start tracking repeat actions throughout the day.</p>`;
    return;
  }

  habitList.innerHTML = "";
  const todayKey = getLocalDateKey();

  for (const habit of state.habits) {
    const node = habitCardTemplate.content.firstElementChild.cloneNode(true);
    const count = state.habitLogs.filter((log) => log.habitId === habit.id && log.date === todayKey).length;
    const progress = Math.min((count / habit.goal) * 100, 100);

    node.querySelector(".habit-title").textContent = habit.name;
    node.querySelector(".habit-meta").textContent = `${habit.goal} ${habit.unit} per day`;
    node.querySelector(".progress-fill").style.width = `${progress}%`;
    node.querySelector(".progress-fill").style.background = `linear-gradient(90deg, ${habit.color} 0%, #f4a261 100%)`;
    node.querySelector(".progress-text").textContent = `${count}/${habit.goal} ${habit.unit}`;

    node.querySelector(".log-habit-button").addEventListener("click", () => {
      state.habitLogs.unshift({
        id: createId(),
        habitId: habit.id,
        date: getLocalDateKey(),
        timestamp: new Date().toISOString()
      });
      saveAndRender();
    });

    node.querySelector(".edit-habit-button").addEventListener("click", () => {
      startHabitEdit(habit);
    });

    node.querySelector(".delete-habit-button").addEventListener("click", () => {
      state.habits = state.habits.filter((entry) => entry.id !== habit.id);
      state.habitLogs = state.habitLogs.filter((entry) => entry.habitId !== habit.id);
      saveAndRender();
    });

    habitList.appendChild(node);
  }
}

function renderSurvey() {
  const todayKey = getLocalDateKey();
  const existingEntry = state.surveyEntries[todayKey];
  const rows = state.surveyCategories.map((category) => {
    const value = existingEntry?.ratings?.[category.id] ?? 3;
    return `
      <div class="survey-row">
        <label for="rating-${category.id}">${category.name}</label>
        <div class="rating-control">
          <input id="rating-${category.id}" name="rating-${category.id}" type="range" min="1" max="5" value="${value}">
          <span class="rating-value">${value}</span>
        </div>
      </div>
    `;
  }).join("");

  dailySurveyForm.innerHTML = `
    ${rows || `<p class="empty-state">Add at least one survey category to start capturing daily feelings.</p>`}
    <label>
      Notes
      <textarea name="survey-notes" placeholder="Anything notable today?">${existingEntry?.notes || ""}</textarea>
    </label>
    <div class="form-actions">
      <button class="button button-primary" type="submit">Save Survey</button>
    </div>
  `;

  for (const input of dailySurveyForm.querySelectorAll('input[type="range"]')) {
    input.addEventListener("input", () => {
      const valueNode = input.parentElement.querySelector(".rating-value");
      valueNode.textContent = input.value;
    });
  }
}

function renderSurveyCategories() {
  if (!state.surveyCategories.length) {
    surveyCategoryList.innerHTML = `<p class="empty-state">No categories yet.</p>`;
    return;
  }

  surveyCategoryList.innerHTML = "";
  for (const category of state.surveyCategories) {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `
      <span>${category.name}</span>
      <div class="chip-actions">
        <button type="button" data-action="edit" aria-label="Edit ${category.name}">Edit</button>
        <button type="button" data-action="delete" aria-label="Delete ${category.name}">x</button>
      </div>
    `;

    chip.querySelector('[data-action="edit"]').addEventListener("click", () => {
      startSurveyCategoryEdit(category);
    });

    chip.querySelector('[data-action="delete"]').addEventListener("click", () => {
      state.surveyCategories = state.surveyCategories.filter((entry) => entry.id !== category.id);
      for (const entry of Object.values(state.surveyEntries)) {
        delete entry.ratings[category.id];
      }
      saveAndRender();
    });
    surveyCategoryList.appendChild(chip);
  }
}

function renderCorrelations() {
  const correlations = buildCorrelations();
  if (!correlations.length) {
    correlationList.innerHTML = `
      <p class="empty-state">
        Correlations will appear after a few days of habit logs and survey answers.
      </p>
    `;
    return;
  }

  correlationList.innerHTML = correlations.map((item) => `
    <article class="correlation-item">
      <div>
        <h3>${item.habitName} vs ${item.categoryName}</h3>
        <p class="correlation-meta">${item.summary}</p>
      </div>
      <div class="correlation-score ${item.scoreClass}">${item.displayScore}</div>
    </article>
  `).join("");
}

function renderHistory() {
  const recentLogs = state.habitLogs
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 12);

  if (!recentLogs.length) {
    historyList.innerHTML = `<p class="empty-state">No habit activity yet. Your recent logs will show up here.</p>`;
    return;
  }

  historyList.innerHTML = "";

  recentLogs.forEach((log) => {
    const habit = state.habits.find((entry) => entry.id === log.habitId);
    const time = new Date(log.timestamp).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });

    const node = historyItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".history-title").textContent = habit?.name || "Deleted habit";
    node.querySelector(".history-time").textContent = time;
    node.querySelector(".delete-history-button").addEventListener("click", () => {
      deleteHistoryEntry(log.id);
    });
    historyList.appendChild(node);
  });
}

function deleteHistoryEntry(logId) {
  state.habitLogs = state.habitLogs.filter((entry) => entry.id !== logId);
  saveAndRender();
}

function buildCorrelations() {
  const results = [];
  const dates = Object.keys(state.surveyEntries).sort();

  for (const habit of state.habits) {
    for (const category of state.surveyCategories) {
      const x = [];
      const y = [];

      for (const date of dates) {
        const survey = state.surveyEntries[date];
        const rating = survey?.ratings?.[category.id];
        if (!rating) {
          continue;
        }

        const count = state.habitLogs.filter((log) => log.habitId === habit.id && log.date === date).length;
        x.push(count);
        y.push(rating);
      }

      if (x.length < 3) {
        continue;
      }

      const score = pearsonCorrelation(x, y);
      if (Number.isNaN(score)) {
        continue;
      }

      results.push({
        habitName: habit.name,
        categoryName: category.name,
        score,
        displayScore: score.toFixed(2),
        summary: describeCorrelation(score, x.length),
        scoreClass: score > 0.2 ? "positive" : score < -0.2 ? "negative" : "neutral"
      });
    }
  }

  return results
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 6);
}

function startHabitEdit(habit) {
  habitIdInput.value = habit.id;
  document.querySelector("#habitName").value = habit.name;
  document.querySelector("#habitGoal").value = habit.goal;
  document.querySelector("#habitUnit").value = habit.unit;
  document.querySelector("#habitColor").value = habit.color;
  habitSubmitButton.textContent = "Update Habit";
  habitForm.classList.remove("hidden");
  document.querySelector("#habitName").focus();
}

function startSurveyCategoryEdit(category) {
  surveyCategoryIdInput.value = category.id;
  document.querySelector("#surveyCategoryName").value = category.name;
  surveyCategorySubmitButton.textContent = "Update Category";
  surveyCategoryForm.classList.remove("hidden");
  document.querySelector("#surveyCategoryName").focus();
}

function resetHabitForm() {
  habitForm.reset();
  habitIdInput.value = "";
  habitSubmitButton.textContent = "Save Habit";
  document.querySelector("#habitColor").value = "#ff7a59";
  document.querySelector("#habitGoal").value = "8";
}

function resetSurveyCategoryForm() {
  surveyCategoryForm.reset();
  surveyCategoryIdInput.value = "";
  surveyCategorySubmitButton.textContent = "Add Category";
}

function pearsonCorrelation(x, y) {
  const n = x.length;
  const sumX = x.reduce((sum, value) => sum + value, 0);
  const sumY = y.reduce((sum, value) => sum + value, 0);
  const sumXY = x.reduce((sum, value, index) => sum + value * y[index], 0);
  const sumX2 = x.reduce((sum, value) => sum + value * value, 0);
  const sumY2 = y.reduce((sum, value) => sum + value * value, 0);

  const numerator = (n * sumXY) - (sumX * sumY);
  const denominator = Math.sqrt(((n * sumX2) - (sumX ** 2)) * ((n * sumY2) - (sumY ** 2)));

  if (!denominator) {
    return NaN;
  }

  return numerator / denominator;
}

function describeCorrelation(score, samples) {
  const direction = score > 0.2 ? "Higher logging tends to match higher scores" :
    score < -0.2 ? "Higher logging tends to match lower scores" :
      "Only a weak relationship so far";

  return `${direction}. Based on ${samples} day${samples === 1 ? "" : "s"} of survey data.`;
}

function getTodayCount(habitId) {
  const todayKey = getLocalDateKey();
  return state.habitLogs.filter((log) => log.habitId === habitId && log.date === todayKey).length;
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

render();
