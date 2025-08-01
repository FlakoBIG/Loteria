document.addEventListener('DOMContentLoaded', () => {
  const cardsContainer    = document.getElementById('cardsContainer');
  const addCardBtn        = document.getElementById('addCardBtn');
  const resetBtn          = document.getElementById('resetBtn');
  const undoBtn           = document.getElementById('undoBtn');
  const redoBtn           = document.getElementById('redoBtn');
  const callNumberBtn     = document.getElementById('callNumberBtn');
  const calledNumberInput = document.getElementById('calledNumber');

  const modalDelete       = document.getElementById('modalDelete');
  const confirmDeleteBtn  = document.getElementById('confirmDelete');
  const cancelDeleteBtn   = document.getElementById('cancelDelete');

  const modalReset        = document.getElementById('modalReset');
  const confirmResetBtn   = document.getElementById('confirmReset');
  const cancelResetBtn    = document.getElementById('cancelReset');

  const modalWin          = document.getElementById('modalWin');
  const closeWinBtn       = document.getElementById('closeWin');

  const patternGrid       = document.getElementById('patternGrid');
  const clearPatternBtn   = document.getElementById('clearPatternBtn');

  const headerColors      = ['#e57373','#81c784','#64b5f6','#ffb74d','#ba68c8','#4db6ac','#ffd54f','#aed581','#4fc3f7','#7986cb'];
  let availableColors     = [...headerColors];
  let history = [], future = [], cardToDelete = null;
  // Patrón: 3 filas × 9 columnas
  let pattern = Array.from({ length: 3 }, () => Array(9).fill(false));

  function updateCardTitles() {
    Array.from(cardsContainer.children).forEach((card, i) => {
      const title = card.querySelector('.card-title');
      if (title) title.textContent = `Cartón ${i + 1}`;
    });
  }

  function updateUndoRedo() {
    undoBtn.disabled = history.length === 0;
    redoBtn.disabled = future.length === 0;
  }

  function pushHistory(action) {
    history.push(action);
    future = [];
    updateUndoRedo();
  }

  function openModal(modalEl) {
    modalEl.style.display = 'flex';
    modalEl.classList.add('show');
  }

  function closeModal(modalEl) {
    modalEl.classList.remove('show');
    modalEl.style.display = 'none';
  }

  // Renderiza Patrón de Victoria
  function renderPattern() {
    patternGrid.innerHTML = '';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'pattern-cell' + (pattern[r][c] ? ' selected' : '');
        cell.onclick = () => { pattern[r][c] = !pattern[r][c]; renderPattern(); };
        patternGrid.appendChild(cell);
      }
    }
  }
  clearPatternBtn.onclick = () => { pattern = pattern.map(row => row.map(() => false)); renderPattern(); };

  // Crear cartón 3×9 con inputs editables
  function createCard() {
    if (availableColors.length === 0) availableColors = [...headerColors];
    const bgColor = availableColors.splice(Math.random() * availableColors.length | 0, 1)[0];

    const cardDiv = document.createElement('div');
    cardDiv.className = 'card pop-in';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.style.background = bgColor;
    title.style.color = '#fff';
    title.style.textAlign = 'center';
    title.style.margin = '0';
    title.style.padding = '8px 0';
    cardDiv.appendChild(title);

    const table = document.createElement('table');
    for (let r = 0; r < 3; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < 9; c++) {
        const td = document.createElement('td');
        // Celdas más anchas
        td.style.width = '80px';

        const inp = document.createElement('input');
        inp.type = 'number';
        inp.min = '1';
        inp.max = '90';
        inp.style.width = '100%';
        inp.style.height = '100%';
        inp.style.border = 'none';
        inp.style.textAlign = 'center';
        inp.style.fontSize = '1.2rem';

        td.appendChild(inp);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    cardDiv.appendChild(table);

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Eliminar';
    removeBtn.className = 'remove-btn';
    removeBtn.onclick = () => { cardToDelete = cardDiv; openModal(modalDelete); };
    cardDiv.appendChild(removeBtn);
    cardsContainer.appendChild(cardDiv);

    pushHistory({
      undo: () => { cardDiv.remove(); updateCardTitles(); },
      redo: () => { cardsContainer.appendChild(cardDiv); updateCardTitles(); }
    });
    updateCardTitles();
  }

  function callNumber() {
    const num = parseInt(calledNumberInput.value, 10);
    // Permite 0 para marcar celdas vacías
    if (isNaN(num) || num > 90) return;

    const markedCells = [];
    document.querySelectorAll('.card td').forEach(td => {
      const inp = td.querySelector('input');
      if (num === 0) {
        // Marca celdas vacías
        if (!inp.value && !td.classList.contains('marked')) {
          td.classList.add('marked');
          markedCells.push(td);
        }
      } else if (inp && parseInt(inp.value, 10) === num && !td.classList.contains('marked')) {
        td.classList.add('marked');
        markedCells.push(td);
      }
    });

    if (markedCells.length) {
      pushHistory({
        undo: () => markedCells.forEach(td => td.classList.remove('marked')),
        redo: () => markedCells.forEach(td => td.classList.add('marked'))
      });
    }
    calledNumberInput.value = '';

    // Comprueba victoria según patrón
    if (pattern.flat().some(v => v)) {
      document.querySelectorAll('.card').forEach(card => {
        const cells = Array.from(card.querySelectorAll('td'));
        const wins = pattern.flat().every((sel, i) => !sel || cells[i].classList.contains('marked'));
        if (wins) openModal(modalWin);
      });
    }
  }

  closeWinBtn.onclick = () => closeModal(modalWin);

  // Reset y Delete
  resetBtn.onclick = () => openModal(modalReset);
  confirmResetBtn.onclick = () => {
    const marked = Array.from(document.querySelectorAll('.card td.marked'));
    marked.forEach(td => td.classList.remove('marked'));
    pushHistory({
      undo: () => marked.forEach(td => td.classList.add('marked')),
      redo: () => marked.forEach(td => td.classList.remove('marked'))
    });
    closeModal(modalReset);
  };
  cancelResetBtn.onclick = () => closeModal(modalReset);

  confirmDeleteBtn.onclick = () => {
    const parent = cardToDelete.parentNode;
    const idx = [...parent.children].indexOf(cardToDelete);
    cardToDelete.remove();
    pushHistory({
      undo: () => { parent.insertBefore(cardToDelete, parent.children[idx] || null); updateCardTitles(); },
      redo: () => { cardToDelete.remove(); updateCardTitles(); }
    });
    closeModal(modalDelete);
    cardToDelete = null;
  };
  cancelDeleteBtn.onclick = () => closeModal(modalDelete);

  // Undo/Redo
  undoBtn.onclick = () => { const action = history.pop(); if (action) action.undo(); future.push(action); updateUndoRedo(); };
  redoBtn.onclick = () => { const action = future.pop(); if (action) action.redo(); history.push(action); updateUndoRedo(); };

  // Inicialización
  renderPattern();
  addCardBtn.onclick = createCard;
  callNumberBtn.onclick = callNumber;
  updateUndoRedo();
});