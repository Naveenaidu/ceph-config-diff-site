const referenceVersions = ["squid", "tentacle"];
const comparingVersions = ["main", "tentacle"];

const referenceSelect = document.querySelector("#referenceVersion");
const comparingSelect = document.querySelector("#comparingVersion");
const loadDiffButton = document.querySelector("#loadDiffButton");
const statusMessage = document.querySelector("#statusMessage");

const countElements = {
  added: document.querySelector("#addedCount"),
  deleted: document.querySelector("#deletedCount"),
  modified: document.querySelector("#modifiedCount"),
};

const groupCountElements = {
  added: document.querySelector("#addedGroupCount"),
  deleted: document.querySelector("#deletedGroupCount"),
  modified: document.querySelector("#modifiedGroupCount"),
};

const sectionElements = {
  added: document.querySelector("#addedSection"),
  deleted: document.querySelector("#deletedSection"),
  modified: document.querySelector("#modifiedSection"),
};

function createOption(value) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = value;
  return option;
}

function populateSelect(selectElement, values, selectedValue) {
  values.forEach((value) => selectElement.appendChild(createOption(value)));
  selectElement.value = selectedValue;
}

function formatValue(value) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#fca5a5" : "#94a3b8";
}

function setSectionEmptyState(sectionName, message) {
  sectionElements[sectionName].innerHTML = `<p class="empty-state">${message}</p>`;
}

function updateCounts(diff) {
  const addedCount = Object.values(diff.added || {}).reduce(
    (total, entries) => total + entries.length,
    0,
  );
  const deletedCount = Object.values(diff.deleted || {}).reduce(
    (total, entries) => total + entries.length,
    0,
  );
  const modifiedCount = Object.values(diff.modified || {}).reduce(
    (total, daemonChanges) => total + Object.keys(daemonChanges).length,
    0,
  );

  countElements.added.textContent = addedCount;
  countElements.deleted.textContent = deletedCount;
  countElements.modified.textContent = modifiedCount;

  groupCountElements.added.textContent = `${Object.keys(diff.added || {}).length} groups`;
  groupCountElements.deleted.textContent = `${Object.keys(diff.deleted || {}).length} groups`;
  groupCountElements.modified.textContent = `${Object.keys(diff.modified || {}).length} groups`;
}

function renderAddedOrDeleted(sectionName, groups) {
  const entries = Object.entries(groups || {});
  if (!entries.length) {
    setSectionEmptyState(sectionName, `No ${sectionName} configuration options for this selection.`);
    return;
  }

  const markup = entries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([groupName, configs]) => {
      const listItems = [...configs]
        .sort((left, right) => left.localeCompare(right))
        .map((configName) => `<li>${configName}</li>`)
        .join("");

      return `
        <article class="group-card">
          <h3>${groupName}</h3>
          <ul class="config-list">${listItems}</ul>
        </article>
      `;
    })
    .join("");

  sectionElements[sectionName].innerHTML = markup;
}

function renderModified(groups) {
  const entries = Object.entries(groups || {});
  if (!entries.length) {
    setSectionEmptyState("modified", "No modified configuration options for this selection.");
    return;
  }

  const markup = entries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([groupName, configChanges]) => {
      const changesMarkup = Object.entries(configChanges)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([configName, changedFields]) => {
          const fieldMarkup = Object.entries(changedFields)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([fieldName, values]) => `
              <div class="field-change">
                <span class="field-name">${fieldName}</span>
                <div class="change-values">
                  <span class="before"><strong>Before:</strong> ${formatValue(values.before)}</span>
                  <span class="after"><strong>After:</strong> ${formatValue(values.after)}</span>
                </div>
              </div>
            `)
            .join("");

          return `
            <article class="change-item">
              <h4>${configName}</h4>
              ${fieldMarkup}
            </article>
          `;
        })
        .join("");

      return `
        <article class="group-card">
          <h3>${groupName}</h3>
          <div class="change-list">${changesMarkup}</div>
        </article>
      `;
    })
    .join("");

  sectionElements.modified.innerHTML = markup;
}

async function loadDiff() {
  const reference = referenceSelect.value;
  const comparing = comparingSelect.value;
  const fileName = `data/${reference}-${comparing}.json`;

  setStatus(`Loading ${reference} → ${comparing}…`);
  loadDiffButton.disabled = true;

  try {
    const response = await fetch(fileName);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const diff = await response.json();
    updateCounts(diff);
    renderAddedOrDeleted("added", diff.added);
    renderAddedOrDeleted("deleted", diff.deleted);
    renderModified(diff.modified);
    setStatus(`Showing diff from ${reference} to ${comparing}.`);
  } catch (error) {
    updateCounts({ added: {}, deleted: {}, modified: {} });
    setSectionEmptyState("added", "Unable to load added config changes.");
    setSectionEmptyState("deleted", "Unable to load deleted config changes.");
    setSectionEmptyState("modified", "Unable to load modified config changes.");
    setStatus(`Could not load ${reference} → ${comparing}: ${error.message}`, true);
  } finally {
    loadDiffButton.disabled = false;
  }
}

populateSelect(referenceSelect, referenceVersions, "squid");
populateSelect(comparingSelect, comparingVersions, "main");

loadDiffButton.addEventListener("click", loadDiff);
referenceSelect.addEventListener("change", loadDiff);
comparingSelect.addEventListener("change", loadDiff);

loadDiff();
