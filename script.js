console.log("SCRIPT ÇALIŞTI");

let puzzle;
let selected = [];
let lockedWords = {};
let solvedGroups = [];
let mistakes = 0;
let gameOver = false;
let gameWon = false;
let shareResultsBtn;


const grid = document.getElementById("grid");
const message = document.getElementById("message");
const mistakesDiv = document.getElementById("mistakes");

// Pastel renk paleti
const pastelColors = ["#f9df6d", "#a0c35a", "#8bbcd9", "#b497d6", "#ffb3ba", "#ffdfba", "#bae1ff", "#c3f7d9"];

// Bulmacayı yükle
fetch("puzzles/current.json")
  .then(res => {
    if (!res.ok) throw new Error("Puzzle not found");
    return res.json();
  })
  .then(data => init(data))
  .catch(err => {
    console.error(err);
    message.textContent = "Bulmaca yüklenemedi.";
  });

// Başlat
function init(data) {
  puzzle = data;

  // Her gruba pastel renk ata
  puzzle.groups.forEach((g, idx) => {
    g.color = pastelColors[idx % pastelColors.length];
  });

  shuffle(puzzle.words);
  renderGrid();
}

// Diziyi karıştır
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function colorSquare(difficulty) {
  switch (difficulty) {
    case 1: return "🟨";
    case 2: return "🟩";
    case 3: return "🟦";
    case 4: return "🟪";
    default: return "⬜";
  }
}


// Grid render
function renderGrid() {
  grid.innerHTML = "";
  puzzle.words.forEach(word => {
    const d = document.createElement("div");
    d.className = "word";
   const span = document.createElement("span");
span.textContent = word;
d.appendChild(span);


    // Kilitli kelimeler
    if (lockedWords[word]) {
      d.classList.add("locked");
      const group = puzzle.groups.find(g => g.words.includes(word));
      if (group && group.color) d.style.backgroundColor = group.color;
    }

    if (selected.includes(word)) d.classList.add("selected");

    d.onclick = () => toggleWord(word);
    grid.appendChild(d);
  });
}

// Kelime seçme/çıkarma
function toggleWord(word) {
  if (gameOver || lockedWords[word]) return;

  if (selected.includes(word)) selected = selected.filter(w => w !== word);
  else if (selected.length < 4) selected.push(word);

  renderGrid();
}

// Gönder
document.getElementById("submit").onclick = () => {
  if (gameOver || selected.length !== 4) return;

  const match = puzzle.groups.find(g =>
    !solvedGroups.includes(g) &&
    g.words.every(w => selected.includes(w))
  );

  if (match) {
    message.textContent = `Doğru! — ${match.name}`;
    const justLocked = [...selected]; // yeni kilitlenenler
    selected = [];
    document.querySelectorAll(".word.selected").forEach(el => el.classList.remove("selected"));

    setTimeout(() => {
      match.words.forEach(w => lockedWords[w] = match.difficulty);
      solvedGroups.push(match);
      reorderGrid();
      renderGrid();

      // Yeni kilitlenenlere animasyon
      justLocked.forEach(word => {
        const el = Array.from(grid.children).find(d => d.textContent === word);
        if (el) el.classList.add("locked-new");
      });
    }, 250);

    return;
  }

  // Yanlış eşleşme
  const almost = puzzle.groups.some(g =>
    g.words.filter(w => selected.includes(w)).length === 3
  );

  message.textContent = almost ? "Neredeyse oldu! Bir tane kaldı!" : "Yanlış eşleştirme.";

  mistakes++;
  shakeSelected();
  selected = [];
  mistakesDiv.textContent = `Deneme: ${mistakes} / 4`;

  if (mistakes >= 4) endGame(false);
  else renderGrid();
};

// Shuffle
document.getElementById("shuffle").onclick = () => {
  if (gameOver) return;
  grid.classList.add("shuffling");

  setTimeout(() => {
    match.words.forEach(w => lockedWords[w] = match.difficulty);
  solvedGroups.push(match);
  reorderGrid();
  renderGrid();

  // Yeni kilitlenenlere animasyon
  justLocked.forEach(word => {
    const el = Array.from(grid.children).find(d => d.textContent === word);
    if (el) el.classList.add("locked-new");
  });

  // ✅ BURAYA
  if (solvedGroups.length === 4) {
    endGame(true);
  }

}, 250);
};

// Reset
document.getElementById("reset").onclick = () => { selected = []; renderGrid(); };

// Reorder grid
function reorderGrid() {
  puzzle.words = [...solvedGroups.flatMap(g => g.words), ...puzzle.words.filter(w => !lockedWords[w])];
}

// Shake animasyonu
function shakeSelected() {
  document.querySelectorAll(".selected").forEach(el => {
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 350);
  });
}

// Oyun bitişi
function endGame(win) {
  gameOver = true;
  gameWon = win;

  message.textContent = win
    ? "Tebrikler! Tüm grupları tamamladın!"
    : "Bir dahaki sefere!";

  if (!win) revealAll();
  showExplanations();

  if (shareResultsBtn) {
    shareResultsBtn.style.display = "inline-flex";
    shareResultsBtn.disabled = false;
  }
}





// Tüm kelimeleri göster
function revealAll() {
  puzzle.groups.forEach(g => g.words.forEach(w => lockedWords[w] = g.difficulty));
  renderGrid();
}

// Açıklamalar
function showExplanations() {
  const ex = document.getElementById("explanations");
  ex.innerHTML = "";
  puzzle.groups.forEach(g => {
    const d = document.createElement("div");
    d.className = "explanation";
    d.style.backgroundColor = g.color;
    d.innerHTML = `<strong>${g.name}</strong><br>${g.explanation}`;
    ex.appendChild(d);
  });
}

// Sosyal paylaşım


function getShareText(win) {
  const squares = solvedGroups.map(g =>
    g.words.map(() => colorSquare(g.difficulty)).join("")
  ).join("\n");

  const attemptsText = win
    ? `${mistakes + 1}/4 denemede çözüldü`
    : `çözülemedi (4/4)`;

  return `Inklings 🧠📚
${attemptsText}

${squares}

https://selimbektas.github.io/inklings/`;
}

document.addEventListener("DOMContentLoaded", () => {
  shareResultsBtn = document.getElementById("share-results");

  shareResultsBtn.onclick = () => {
    const text = encodeURIComponent(getShareText(gameWon));
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(twitterUrl, "_blank");
  };
});
