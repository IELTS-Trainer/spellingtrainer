function saveLibrary() {
        const name = document.getElementById('libCatName').value.trim();
        const words = document.getElementById('libWords').value.split('\n').map(w => w.trim()).filter(w => w);
        if(!name || words.length === 0) return alert("Please provide data.");
        data.library[name] = words; 
        save(); 
        renderLibrary();
        alert("Saved!");
    }

    function renderLibrary() {
        const list = document.getElementById('libraryList');
        list.innerHTML = "<h3>Current Library</h3>";
        Object.keys(data.library).forEach(cat => {
            list.innerHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #eee; padding:5px;">
                <span><strong>${cat}</strong> (${data.library[cat].length} words)</span>
                <div><button onclick="editCat('${cat}')">Edit</button> <button onclick="deleteCat('${cat}')">Delete</button></div>
            </div>`;
        });
    }

    function editCat(cat) {
        document.getElementById('libCatName').value = cat;
        document.getElementById('libWords').value = data.library[cat].join('\n');
    }
    
    function deleteCat(cat) {
        if(confirm(`Delete ${cat}?`)) { delete data.library[cat]; save(); renderLibrary(); }
    }

    function exportData() {
        const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'ielts_mastery_backup.json'; a.click();
    }

    function importData(e) {
        const reader = new FileReader();
        reader.onload = (ev) => { 
            data = JSON.parse(ev.target.result); 
            save(); 
            location.reload(); 
        };
        reader.readAsText(e.target.files[0]);
    }

    function openPracticeSetup() {
        const sel = document.getElementById('catSelect'); sel.innerHTML = "";
        const cats = Object.keys(data.library);
        if(cats.length === 0) return alert("Library empty.");
        cats.forEach(cat => {
            const opt = document.createElement('option'); opt.value = opt.innerText = cat; sel.appendChild(opt);
        });
        showView('practiceSetup');
    }

    