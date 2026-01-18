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

  /* =========================
     DOĞRU CEVAP
     ========================= */
  if (match) {
    message.textContent = `Doğru! — ${match.name}`;

    // seçimi temizle
    selected = [];

    // seçili class'larını kaldır
    document.querySelectorAll(".word.selected").forEach(el => {
      el.classList.remove("selected");
    });

    // kısa animasyon gecikmesi
    setTimeout(() => {
      match.words.forEach(w => {
        lockedWords[w] = match.difficulty;
      });

      solvedGroups.push(match);

      // doğru grup en üste gelsin
      reorderGrid();
      renderGrid();
    }, 250);

    return; // 🔴 BURASI ŞART
  }

  /* =========================
     YANLIŞ CEVAP
     ========================= */
  const almost = puzzle.groups.some(g =>
    g.words.filter(w => selected.includes(w)).length === 3
  );

  message.textContent = almost
    ? "Neredeyse oldu! Bir tane kaldı!"
    : "Yanlış eşleştirme.";

  if (!almost) mistakes++;

  shakeSelected();

  selected = [];
  mistakesDiv.textContent = `Hata: ${mistakes} / 4`;

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
    ? "Tebrikler! Tüm grupları tamamladın!"
    : "Yarın yine uğramayı unutma!";

  if (!win) revealAll();
  showExplanations();
  shareBtn.style.display = "block";
}
document.getElementById("social-share").style.display = "block";


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
document.getElementById("shuffle").onclick = () => {
  if (gameOver) return;

  // sadece çözülmemiş kelimeleri karıştır
  const unlockedWords = puzzle.words.filter(w => !lockedWords[w]);
  shuffle(unlockedWords);

  // çözülmüşler üstte sabit kalsın
  puzzle.words = [
    ...solvedGroups.flatMap(g => g.words),
    ...unlockedWords
  ];

  selected = [];
  renderGrid();
};
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
