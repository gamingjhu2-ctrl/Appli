document.addEventListener('DOMContentLoaded', () => {
  
  const app = document.getElementById('app');
  let docs = JSON.parse(localStorage.getItem('mesDocs')) || [];
  let currentTableInstance = null;
  let filtresActives = false;

  document.getElementById('addNoteBtn').onclick = function() {
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    document.getElementById('modalNote').classList.remove('hidden');
  };

  document.getElementById('addTableBtn').onclick = function() {
    document.getElementById('tableTitle').value = '';
    document.getElementById('tableContent').value = '';
    document.getElementById('modalTable').classList.remove('hidden');
  };

  window.renderMenu = function() {
    app.innerHTML = '<div class="grid"></div>';
    const grid = app.querySelector('.grid');

    if (docs.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#666;">Aucun document. Utilise les boutons en haut pour en ajouter !</p>';
      return;
    }

    docs.forEach((doc, index) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <span class="icon" style="font-size: 2rem; cursor:pointer;">${doc.type === 'table' ? '📊' : '📝'}</span>
        <span class="title" style="font-weight:bold; margin-top:10px; cursor:pointer;">${escapeHtml(doc.title)}</span>
        <button class="btn-delete" style="position:absolute; top:10px; right:10px; background:#fee2e2; border:none; border-radius:50%; width:30px; height:30px; cursor:pointer;">🗑️</button>
      `;
      card.querySelector('.title').onclick = () => openDoc(doc, index);
      card.querySelector('.icon').onclick = () => openDoc(doc, index);
      card.querySelector('.btn-delete').onclick = (e) => {
        e.stopPropagation();
        if(confirm('Supprimer ce document ?')) {
          docs.splice(index, 1);
          saveToLocal();
          window.renderMenu();
        }
      };
      grid.appendChild(card);
    });
  };

  function openDoc(doc, index) {
    filtresActives = false;

    app.innerHTML = `
      <div class="toolbar">
        <button onclick="window.renderMenu()">← Retour</button>
        <h2>${escapeHtml(doc.title)}</h2>
        ${doc.type === 'table' ? `
          <div style="margin-left:auto; display:flex; gap:10px;">
            <button onclick="window.toggleFiltres()" id="btnFiltres" class="btn-cancel" style="background:#e0e7ff; color:#4f46e5; font-weight:bold;">🔍 Filtres : OFF</button>
            <button onclick="window.sauvegarderTableau(${index})" class="btn-save">💾 Sauvegarder</button>
          </div>
        ` : ''}
      </div>
      <div id="content"></div>
    `;
    const content = document.getElementById('content');

    if (doc.type === 'table') {
      if (typeof Tabulator === 'undefined') {
        content.innerHTML = '<p class="error">Erreur : Tabulator non chargé.</p>';
        return;
      }
      
      currentTableInstance = new Tabulator("#content", {
        data: doc.data,
        autoColumns: true,
        layout: "fitColumns",
        movableColumns: true,
        movableRows: true,
        editable: true,             
        editor: "input",
        editTrigger: "click",
        columnDefaults: {
          editable: true,
          editor: "input",
          resizable: true
        },
        rowHeader: {
          formatter: "rownum",
          hozAlign: "center",
          headerSort: false,
          resizable: false
        },
        height: "600px",
        headerSort: true
      });
    } else {
      content.innerHTML = `<pre class="notes">${escapeHtml(doc.content)}</pre>`;
    }
  }

  window.toggleFiltres = function() {
    if (currentTableInstance) {
      filtresActives = !filtresActives;
      currentTableInstance.getColumns().forEach(column => {
        column.updateDefinition({ headerFilter: filtresActives });
      });
      const btn = document.getElementById('btnFiltres');
      if (filtresActives) {
        btn.innerText = "🔍 Filtres : ON";
        btn.style.background = "#4f46e5";
        btn.style.color = "white";
      } else {
        btn.innerText = "🔍 Filtres : OFF";
        btn.style.background = "#e0e7ff";
        btn.style.color = "#4f46e5";
      }
    }
  };

  window.sauvegarderTableau = function(index) {
    if (currentTableInstance) {
      docs[index].data = currentTableInstance.getData();
      saveToLocal();
      alert("Modifications sauvegardées !");
    }
  };

  window.saveNote = function() {
    const title = document.getElementById('noteTitle').value || 'Note sans titre';
    const content = document.getElementById('noteContent').value;
    docs.push({ type: 'note', title: title, content: content });
    saveToLocal();
    closeModals();
    window.renderMenu();
  };

  window.saveTable = function() {
    const title = document.getElementById('tableTitle').value || 'Tableau sans titre';
    const text = document.getElementById('tableContent').value;
    if(!text) return;

    const rows = text.trim().split('\n');
    const headers = rows[0].split('\t').map((h, i) => h.trim() || `Colonne ${i+1}`);
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split('\t');
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = cells[index] || '';
      });
      data.push(rowData);
    }

    docs.push({ type: 'table', title: title, data: data });
    saveToLocal();
    closeModals();
    window.renderMenu();
  };

  window.closeModals = function() {
    document.getElementById('modalNote').classList.add('hidden');
    document.getElementById('modalTable').classList.add('hidden');
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
    );
  }

  function saveToLocal() {
    localStorage.setItem('mesDocs', JSON.stringify(docs));
  }

  window.renderMenu();
});