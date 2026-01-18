console.log("SCRIPT ÇALIŞTI");

let puzzle;
let selected = [];
let lockedWords = {};
let solvedGroups = [];
let mistakes = 0;
let gameOver = false;

const grid = document.getElementById("grid");
const message = document.getElementById("message");
const mistakesDiv = document.getElementById("mistakes");
const shareBtn = document.getElementById("share");

const basePath = window.location.pathname.replace(/\/$/, "");

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

// Grid render
function renderGrid() {
  grid.innerHTML = "";
  puzzle.words.forEach(word => {
    const d = document.createElement("div");
    d.className = "word";
    d.textContent = word;

    if (lockedWords[word]) d.classList.add("locked", lockedWords[word]);
    if (selected.includes(word)) d.classList.add("selected");

    d.onclick = () => toggleWord(word);
    grid.appendChild(d);
  });
}

// Kelime seçme/çıkarma
function toggleWord(word) {
  if (gameOver || lockedWords[word]) return;

  if (selected.includes(word)) {
    selected = selected.filter(w => w !== word);
  } else if (selected.length < 4) {
    selected.push(word);
  }

  renderGrid();
}

// Gönder butonu
document.getElementById("submit").onclick = () => {
  if (gameOver || selected.length !== 4) return;

  const match = puzzle.groups.find(g =>
    !solvedGroups.includes(g) &&
    g.words.every(w => selected.includes(w))
  );

  if (match) {
    message.textContent = `Doğru! — ${match.name}`;
    selected = [];
    document.querySelectorAll(".word.selected").forEach(el => el.classList.remove("selected"));

    setTimeout(() => {
      match.words.forEach(w => lockedWords[w] = match.difficulty);
      solvedGroups.push(match);
      reorderGrid();
      renderGrid();
    }, 250);

    if (solvedGroups.length === 4) endGame(true);
    return;
  }

  const almost = puzzle.groups.some(g =>
    g.words.filter(w => selected.includes(w)).length === 3
  );

  message.textContent = almost
    ? "Neredeyse oldu! Bir tane kaldı!"
    : "Yanlış eşleştirme.";

  mistakes++;
  shakeSelected();
  selected = [];
  mistakesDiv.textContent = `Deneme: ${mistakes} / 4`;

  if (mistakes >= 4) endGame(false);
  else renderGrid();
};

// Temizle butonu
document.getElementById("reset").onclick = () => {
  selected = [];
  renderGrid();
};

// Karıştır butonu
document.getElementById("shuffle").onclick = () => {
  if (gameOver) return;

  grid.classList.add("shuffling");

  setTimeout(() => {
    const unlockedWords = puzzle.words.filter(w => !lockedWords[w]);
    shuffle(unlockedWords);

    puzzle.words = [
      ...solvedGroups.flatMap(g => g.words),
      ...unlockedWords
    ];

    selected = [];
    renderGrid();
    grid.classList.remove("shuffling");
  }, 200);
};

// Grid sıralama (çözülmüşleri üstte tut)
function reorderGrid() {
  puzzle.words = [
    ...solvedGroups.flatMap(g => g.words),
    ...puzzle.words.filter(w => !lockedWords[w])
  ];
}

// Seçili kelimeleri sallama efekti
function shakeSelected() {
  document.querySelectorAll(".selected").forEach(el => {
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 350);
  });
}

// Oyun bitişi
function endGame(win) {
  gameOver = true;
  message.textContent = win
    ? "Tebrikler! Tüm grupları tamamladın!"
    : "Bir dahaki sefere!";

  if (!win) revealAll();
  showExplanations();
  shareBtn.style.display = "block";
}

// Tüm kelimeleri göster
function revealAll() {
  puzzle.groups.forEach(g =>
    g.words.forEach(w => lockedWords[w] = g.difficulty)
  );
}

// Açıklamaları göster
function showExplanations() {
  const ex = document.getElementById("explanations");
  ex.innerHTML = "";
  puzzle.groups.forEach(g => {
    const d = document.createElement("div");
    d.className = `explanation ${g.difficulty}`;
    d.innerHTML = `<strong>${g.name}</strong><br>${g.explanation}`;
    ex.appendChild(d);
  });
}

// Sonuç paylaşımı
shareBtn.onclick = () => {
  const squares = solvedGroups.map(g =>
    g.words.map(() => colorSquare(g.difficulty)).join("")
  ).join("\n");

  navigator.clipboard.writeText(`Literary Connections\n\n${squares}`);
  message.textContent = "Results copied.";
};

function colorSquare(d) {
  return {
    yellow: "🟨",
    green: "🟩",
    blue: "🟦",
    purple: "🟪"
  }[d];
}

const twitterBtn = document.getElementById("share-twitter");
const instaBtn = document.getElementById("share-instagram");

function getShareText() {
  const squares = solvedGroups.map(g =>
    g.words.map(() => colorSquare(g.difficulty)).join("")
  ).join("\n");
  return `Edebi Connections\n\n${squares}`;
}

twitterBtn.onclick = () => {
  const text = encodeURIComponent(getShareText());
  const url = `https://twitter.com/intent/tweet?text=${text}`;
  window.open(url, "_blank");
};

instaBtn.onclick = () => {
  navigator.clipboard.writeText(getShareText());
  message.textContent = "Sonuçlar panoya kopyalandı. Instagram’a yapıştırabilirsin.";
};

// Sosyal paylaşım görünür yap
document.getElementById("social-share").style.display = "block";
