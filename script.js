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
const subtitle = document.getElementById("subtitle");
const shareBtn = document.getElementById("share");

const basePath = window.location.pathname.replace(/\/$/, "");

fetch("puzzles/current.json")
  .then(res => {
    if (!res.ok) {
      throw new Error("Puzzle not found");
    }
    return res.json();
  })
  .then(data => {
    init(data);
  })
  .catch(err => {
    console.error(err);
    document.getElementById("message").textContent = "Bulmaca yüklenemedi.";
  });

function init(data) {
  puzzle = data;
  subtitle.textContent = puzzle.title;
  shuffle(puzzle.words);
  renderGrid();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

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

function toggleWord(word) {
  if (gameOver || lockedWords[word]) return;

  if (selected.includes(word)) {
    selected = selected.filter(w => w !== word);
  } else if (selected.length < 4) {
    selected.push(word);
  }

  renderGrid();
}

document.getElementById("submit").onclick = () => {
  if (gameOver || selected.length !== 4) return;

  const match = puzzle.groups.find(g =>
    !solvedGroups.includes(g) &&
    g.words.every(w => selected.includes(w))
  );

  if (match) {
    match.words.forEach(w => lockedWords[w] = match.difficulty);
    solvedGroups.push(match);
    message.textContent = `Correct — ${match.name}`;
    reorderGrid();
  } else {
    const almost = puzzle.groups.some(g =>
      g.words.filter(w => selected.includes(w)).length === 3
    );
    message.textContent = almost
      ? "Almost — one word misaligned."
      : "Incorrect grouping.";
    if (!almost) mistakes++;
    shakeSelected();
  }

  selected = [];
  mistakesDiv.textContent = `Mistakes: ${mistakes} / 4`;

  if (solvedGroups.length === 4) endGame(true);
  if (mistakes >= 4) endGame(false);

  renderGrid();
};

document.getElementById("reset").onclick = () => {
  selected = [];
  renderGrid();
};

function reorderGrid() {
  puzzle.words = [
    ...solvedGroups.flatMap(g => g.words),
    ...puzzle.words.filter(w => !lockedWords[w])
  ];
}

function shakeSelected() {
  document.querySelectorAll(".selected").forEach(el => {
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 350);
  });
}

function endGame(win) {
  gameOver = true;
  message.textContent = win
    ? "All connections found."
    : "Puzzle over. Connections revealed.";

  if (!win) revealAll();
  showExplanations();
  shareBtn.style.display = "block";
}

function revealAll() {
  puzzle.groups.forEach(g =>
    g.words.forEach(w => lockedWords[w] = g.difficulty)
  );
}

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

shareBtn.onclick = () => {
  const squares = solvedGroups.map(g =>
    g.words.map(() => colorSquare(g.difficulty)).join("")
  ).join("\n");

  navigator.clipboard.writeText(
    `Literary Connections ${today}\n\n${squares}`
  );

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
