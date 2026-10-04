let editingCategory = null;

function hasLibraryPremiumAccess() {
    return window.loginStatus === 2 || window.accountAccessLevel === "premium";
}

function showLibraryPremiumPrompt(feature) {
    const dialog = document.getElementById("libraryPremiumDialog");
    document.getElementById("libraryPremiumDescription").textContent = feature + " is available with Premium. Sign in and contact the administrator to ask about the lowest-cost upgrade option.";
    if (typeof dialog.showModal === "function") dialog.showModal();
    else alert(document.getElementById("libraryPremiumDescription").textContent);
}

function closeLibraryPremiumPrompt() {
    document.getElementById("libraryPremiumDialog").close();
}

function updateLibraryExampleHint() {
    const category = document.getElementById("libCatName");
    const words = document.getElementById("libWords");
    document.getElementById("libraryExampleHint").hidden = Boolean(category.value.trim() || words.value.trim());
}

function clearLibraryForm() {
    document.getElementById("libCatName").value = "";
    document.getElementById("libWords").value = "";
    editingCategory = null;
    document.getElementById("saveLibraryButton").textContent = "Save to Library";
    updateLibraryExampleHint();
}

function saveLibrary() {
    const name = document.getElementById("libCatName").value.trim();
    const words = document.getElementById("libWords").value.split("\n").map(word => word.trim()).filter(Boolean);
    if (!name || words.length === 0) return alert("Enter a category name and at least one word.");
    if (!data.library || typeof data.library !== "object") data.library = {};
    if (!editingCategory && Object.prototype.hasOwnProperty.call(data.library, name) && !hasLibraryPremiumAccess()) {
        showLibraryPremiumPrompt("Replacing an existing word list");
        return;
    }

    if (editingCategory && name !== editingCategory) {
        if (Object.prototype.hasOwnProperty.call(data.library, name)
            && !confirm("A category with this name already exists. Replace it?")) return;
        delete data.library[editingCategory];
    } else if (!editingCategory && Object.prototype.hasOwnProperty.call(data.library, name)) {
        if (!confirm("This category already exists. Replace its words?")) return;
    }

    data.library[name] = words;
    save();
    renderLibrary();
    clearLibraryForm();
    alert("Saved to your library.");
}

function renderLibrary() {
    const list = document.getElementById("libraryList");
    list.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = "Current Library";
    list.appendChild(heading);

    const premium = hasLibraryPremiumAccess();
    const importButton = document.getElementById("backupImportButton");
    const exportButton = document.getElementById("backupExportButton");
    if (importButton) {
        importButton.textContent = premium ? "Import data (.json, .csv)" : "🔒 Import data (.json, .csv)";
        importButton.classList.toggle("is-locked", !premium);
    }
    if (exportButton) {
        exportButton.textContent = premium ? "Export data as JSON" : "🔒 Export data as JSON";
        exportButton.classList.toggle("is-locked", !premium);
    }
    Object.keys(data.library || {}).forEach(category => {
        const row = document.createElement("div");
        row.className = "library-category-row";
        const info = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = category;
        info.append(name, document.createTextNode(" (" + data.library[category].length + " words)"));

        const actions = document.createElement("div");
        actions.className = "library-category-actions";
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "library-action" + (premium ? "" : " is-locked");
        edit.textContent = premium ? "Edit" : "🔒 Edit";
        edit.setAttribute("aria-label", premium ? "Edit " + category : "Edit " + category + " (Premium feature)");
        edit.addEventListener("click", () => editCat(category));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "library-action" + (premium ? "" : " is-locked");
        remove.textContent = premium ? "Delete" : "🔒 Delete";
        remove.setAttribute("aria-label", premium ? "Delete " + category : "Delete " + category + " (Premium feature)");
        remove.addEventListener("click", () => deleteCat(category));
        actions.append(edit, remove);
        row.append(info, actions);
        list.appendChild(row);
    });
}

function editCat(category) {
    if (!hasLibraryPremiumAccess()) return showLibraryPremiumPrompt("Editing word lists");
    if (!Object.prototype.hasOwnProperty.call(data.library, category)) return;
    editingCategory = category;
    document.getElementById("libCatName").value = category;
    document.getElementById("libWords").value = data.library[category].join("\n");
    document.getElementById("saveLibraryButton").textContent = "Update Library";
    updateLibraryExampleHint();
    document.getElementById("libCatName").focus();
}

function deleteCat(category) {
    if (!hasLibraryPremiumAccess()) return showLibraryPremiumPrompt("Deleting word lists");
    if (!Object.prototype.hasOwnProperty.call(data.library, category)) return;
    if (confirm("Delete " + category + "? This cannot be undone.")) {
        delete data.library[category];
        if (editingCategory === category) clearLibraryForm();
        save();
        renderLibrary();
    }
}

function startImportData() {
    if (!hasLibraryPremiumAccess()) return showLibraryPremiumPrompt("Importing data");
    document.getElementById("importFile").click();
}

async function exportData() {
    if (!hasLibraryPremiumAccess()) return showLibraryPremiumPrompt("Exporting data");
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
    if (typeof window.showSaveFilePicker === "function") {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: "ielts_spelling_trainer_backup.json",
                types: [{description: "JSON backup", accept: {"application/json": [".json"]}}]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (error) {
            if (error.name === "AbortError") return;
            console.warn("Save dialog unavailable; using a standard download.", error);
        }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ielts_spelling_trainer_backup.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeLibrary(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("The file must contain a category-to-words list.");
    const clean = {};
    Object.entries(candidate).forEach(([category, words]) => {
        const name = String(category).trim();
        if (!name || !Array.isArray(words)) throw new Error("Each category must contain a list of words.");
        clean[name] = [...new Set(words.filter(word => typeof word === "string").map(word => word.trim()).filter(Boolean))];
    });
    if (!Object.keys(clean).length) throw new Error("No word categories were found in this file.");
    return clean;
}

function parseCsvRows(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        if (char === '"') {
            if (quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
            else quoted = !quoted;
        } else if (char === "," && !quoted) {
            row.push(cell.trim()); cell = "";
        } else if ((char === "\n" || char === "\r") && !quoted) {
            if (char === "\r" && text[i + 1] === "\n") i += 1;
            row.push(cell.trim());
            if (row.some(Boolean)) rows.push(row);
            row = []; cell = "";
        } else cell += char;
    }
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
    if (quoted) throw new Error("A quoted CSV value was not closed.");
    return rows;
}

function libraryFromCsv(text) {
    const rows = parseCsvRows(text.replace(/^\uFEFF/, ""));
    if (!rows.length) throw new Error("The CSV file is empty.");
    const header = rows[0].map(value => value.toLowerCase());
    const hasHeader = ["category", "topic", "list"].includes(header[0]) && ["word", "words", "vocabulary"].includes(header[1]);
    const start = hasHeader ? 1 : 0;
    const library = {};
    rows.slice(start).forEach((values, index) => {
        const category = String(values[0] || "").trim();
        const word = String(values[1] || "").trim();
        if (!category || !word) throw new Error("CSV row " + (index + start + 1) + " needs a category and a word.");
        if (!library[category]) library[category] = [];
        library[category].push(word);
    });
    return sanitizeLibrary(library);
}

function importData(event) {
    if (!hasLibraryPremiumAccess()) {
        showLibraryPremiumPrompt("Importing data");
        event.target.value = "";
        return;
    }
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
        try {
            if (file.name.toLowerCase().endsWith(".csv")) {
                const library = libraryFromCsv(String(loadEvent.target.result || ""));
                if (!confirm("Import " + Object.keys(library).length + " categories from this CSV? This will replace your current word library.")) return;
                data.library = library;
            } else {
                const imported = JSON.parse(loadEvent.target.result);
                if (!imported || typeof imported !== "object" || Array.isArray(imported)) throw new Error("The JSON file must contain an object.");
                if (imported.library && typeof imported.library === "object" && !Array.isArray(imported.library)) {
                    const library = sanitizeLibrary(imported.library);
                    if (!confirm("Import this backup? It will replace your library and saved practice data.")) return;
                    data = Object.assign({}, data, imported, {library});
                    if (!data.mistakes || typeof data.mistakes !== "object") data.mistakes = {};
                    if (!Array.isArray(data.revision)) data.revision = [];
                    if (!Array.isArray(data.learned)) data.learned = [];
                    if (!Array.isArray(data.history)) data.history = [];
                    if (!data.settings || typeof data.settings !== "object") data.settings = {};
                } else {
                    const library = sanitizeLibrary(imported);
                    if (!confirm("Import " + Object.keys(library).length + " categories from this JSON? This will replace your current word library.")) return;
                    data.library = library;
                }
            }
            window.appData = data;
            save();
            renderLibrary();
            alert("Import complete.");
        } catch (error) {
            alert("Could not import this file: " + error.message);
        } finally {
            event.target.value = "";
        }
    };
    reader.onerror = () => {
        alert("Could not read the selected file.");
        event.target.value = "";
    };
    reader.readAsText(file);
}

function openPracticeSetup() {
    const select = document.getElementById("catSelect");
    select.replaceChildren();
    const categories = Object.keys(data.library || {});
    if (!categories.length) return alert("Library empty.");
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = option.textContent = category;
        select.appendChild(option);
    });
    showView("practiceSetup");
}

document.getElementById("libCatName").addEventListener("input", updateLibraryExampleHint);
document.getElementById("libWords").addEventListener("input", updateLibraryExampleHint);
document.getElementById("importFile").addEventListener("change", importData);
document.getElementById("libraryPremiumClose").addEventListener("click", closeLibraryPremiumPrompt);
document.getElementById("libraryPremiumGet").addEventListener("click", () => {
    closeLibraryPremiumPrompt();
    showView("premium");
});
document.getElementById("libraryPremiumDialog").addEventListener("click", event => {
    if (event.target === event.currentTarget) closeLibraryPremiumPrompt();
});
window.renderLibrary = renderLibrary;