document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const cardsContainer    = document.getElementById('cardsContainer');
  const addCardBtn        = document.getElementById('addCardBtn');
  const resetBtn          = document.getElementById('resetBtn');
  const undoBtn           = document.getElementById('undoBtn');
  const redoBtn           = document.getElementById('redoBtn');
  const callNumberBtn     = document.getElementById('callNumberBtn');
  const calledNumberInput = document.getElementById('calledNumber');
  const historyListEl     = document.getElementById('historyList');

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

  // Colores de títulos
  const headerColors      = ['#e57373','#81c784','#64b5f6','#ffb74d','#ba68c8','#4db6ac','#ffd54f','#aed581','#4fc3f7','#7986cb'];
  let availableColors     = [...headerColors];

  // Historial de “cantos”
  let callHistory = [];
  
  const colorMap = new Map();
  let colorPool = [...headerColors];
  // Undo/Redo
  let history = [], future = [], cardToDelete = null;

  // Patrón de victoria: 3 × 9
  let pattern = Array.from({ length: 3 }, () => Array(9).fill(false));

  function getRandomColor() {
    const letters = '789ABCD';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
  }


  // Actualiza títulos “Cartón X”
  function updateCardTitles() {
    Array.from(cardsContainer.children).forEach((card, i) => {
      const title = card.querySelector('.card-title');
      if (title) title.textContent = `Cartón ${i + 1}`;
    });
  }

  // Renderiza historial en pantalla
  function renderHistory() {
    historyListEl.innerHTML = '';

    if (callHistory.length === 0) {
      historyListEl.textContent = '—';
      return;
    }

    callHistory.forEach(({ num, color }) => {
      const ball = document.createElement('div');
      ball.className = 'history-ball';
      ball.style.backgroundColor = color;
      ball.textContent = num;
      historyListEl.appendChild(ball);
    });
  }

  // Undo/redo buttons
  function updateUndoRedo() {
    undoBtn.disabled = history.length === 0;
    redoBtn.disabled = future.length === 0;
  }

  function pushHistory(action) {
    history.push(action);
    future = [];
    updateUndoRedo();
  }

  // Modales
  function openModal(modalEl) {
    modalEl.style.display = 'flex';
    modalEl.classList.add('show');
  }
  function closeModal(modalEl) {
    modalEl.classList.remove('show');
    modalEl.style.display = 'none';
  }

  // Patrón de Victory
  function renderPattern() {
    patternGrid.innerHTML = '';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'pattern-cell' + (pattern[r][c] ? ' selected' : '');
        cell.onclick = () => {
          pattern[r][c] = !pattern[r][c];
          renderPattern();
        };
        patternGrid.appendChild(cell);
      }
    }
  }
  clearPatternBtn.onclick = () => {
    pattern = pattern.map(row => row.map(() => false));
    renderPattern();
  };

  // Crear un nuevo cartón
  function createCard() {
    if (!availableColors.length) availableColors = [...headerColors];
    const bgColor = availableColors.splice(Math.random() * availableColors.length | 0, 1)[0];

    const cardDiv = document.createElement('div');
    cardDiv.className = 'card pop-in';

    // Título
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.style.background = bgColor;
    title.style.color = '#fff';
    title.style.textAlign = 'center';
    title.style.margin = '0';
    title.style.padding = '12px 0';
    cardDiv.appendChild(title);

    // Tabla 3×9 con inputs
    const table = document.createElement('table');
    for (let r = 0; r < 3; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < 9; c++) {
        const td = document.createElement('td');
        td.style.width = '120px';
        td.style.height = '70px';

        const inp = document.createElement('input');
        inp.type = 'number';
        inp.min = '1';
        inp.max = '99';
        inp.style.width = '100%';
        inp.style.height = '100%';
        inp.style.border = 'none';
        inp.style.textAlign = 'center';
        inp.style.fontSize = '1.5rem';

        td.appendChild(inp);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    cardDiv.appendChild(table);

    // Botón eliminar
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Eliminar';
    removeBtn.className = 'remove-btn';
    removeBtn.onclick = () => {
      cardToDelete = cardDiv;
      openModal(modalDelete);
    };
    cardDiv.appendChild(removeBtn);

    cardsContainer.appendChild(cardDiv);
    pushHistory({
      undo: () => { cardDiv.remove(); updateCardTitles(); },
      redo: () => { cardsContainer.appendChild(cardDiv); updateCardTitles(); }
    });
    updateCardTitles();
  }

  // Función de cantar número
function callNumber() {
  const num = parseInt(calledNumberInput.value, 10);
  if (isNaN(num) || num > 99) return;

  // asignar color si es nuevo
  if (!colorMap.has(num)) {
    const color = colorPool.length > 0 ? colorPool.pop() : getRandomColor();
    colorMap.set(num, color);
  }

  const entry = { num, color: colorMap.get(num) };
  callHistory.unshift(entry);
  let removed = null;
  if (callHistory.length > 4) {
    removed = callHistory.pop();
  }

  renderHistory();

  // Marcar celdas correspondientes
  const markedCells = [];
  document.querySelectorAll('.card td').forEach(td => {
    const inp = td.querySelector('input');
    if (num === 0) {
      if (!inp.value && !td.classList.contains('marked')) {
        td.classList.add('marked');
        markedCells.push(td);
      }
    } else if (inp && parseInt(inp.value, 10) === num && !td.classList.contains('marked')) {
      td.classList.add('marked');
      markedCells.push(td);
    }
  });

  // guardar en historial para deshacer/rehacer
  pushHistory({
    undo: () => {
      callHistory.shift(); // quitar el último agregado
      if (removed) callHistory.push(removed); // restaurar el eliminado si hubo
      markedCells.forEach(td => td.classList.remove('marked'));
      renderHistory();
    },
    redo: () => {
      callHistory.unshift(entry);
      if (callHistory.length > 4) callHistory.pop();
      markedCells.forEach(td => td.classList.add('marked'));
      renderHistory();
    }
  });

  calledNumberInput.value = '';

  // Verificar victoria
  if (pattern.flat().some(v => v)) {
    document.querySelectorAll('.card').forEach(card => {
      const cells = Array.from(card.querySelectorAll('td'));
      const wins = pattern.flat().every((sel, i) => !sel || cells[i].classList.contains('marked'));
      if (wins) openModal(modalWin);
    });
  }
}


  // Cerrar modal de victoria
  closeWinBtn.onclick = () => closeModal(modalWin);

  // Reset
  resetBtn.onclick = () => openModal(modalReset);
  confirmResetBtn.onclick = () => {
    const marked = Array.from(document.querySelectorAll('.card td.marked'));
    marked.forEach(td => td.classList.remove('marked'));
    pushHistory({
      undo: () => marked.forEach(td => td.classList.add('marked')),
      redo: () => marked.forEach(td => td.classList.remove('marked'))
    });
    // Limpiar historial también
    callHistory = [];
    renderHistory();
    closeModal(modalReset);
  };
  cancelResetBtn.onclick = () => closeModal(modalReset);

  // Delete
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

  // Deshacer/Rehacer
  undoBtn.onclick = () => { const a = history.pop(); if (a) a.undo(); future.push(a); updateUndoRedo(); };
  redoBtn.onclick = () => { const a = future.pop(); if (a) a.redo(); history.push(a); updateUndoRedo(); };

  // Inicialización
  renderPattern();
  renderHistory();
  addCardBtn.onclick    = createCard;
  callNumberBtn.onclick = callNumber;
  updateUndoRedo();
});
