let questions = [];
let current = 0;
let score = 0;
let timer = null;
let timePerQuestion = 30; // секунд (default)
let timeLeft = timePerQuestion;
let currentTopicLabel = "";

/* ---------- Көмекші функциялар ---------- */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

/* ---------- Жауапты икемді тексеру ---------- */
function isCorrect(user, correct) {
  if (user === null || user === undefined) return false;

  const norm = s => String(s).trim().toLowerCase().replace(/\s+/g, '');
  let u = norm(user);
  let c = norm(correct);

  // 0x, 0o, 0b префикстерін екі жақтан да алып тастаймыз
  const stripPrefix = s => s.replace(/^0[xob]/, '');
  const uStripped = stripPrefix(u);
  const cStripped = stripPrefix(c);

  // 1) Тікелей салыстыру
  if (u === c) return true;

  // 2) Префикссіз салыстыру (4e == 0x4e)
  if (uStripped === cStripped) return true;

  // 3) Сан ретінде салыстыру
  const un = parseFloat(u);
  const cn = parseFloat(c);
  if (!isNaN(un) && !isNaN(cn) && Math.abs(un - cn) < 0.001) return true;

  // 4) True/False жағдайы
  if ((u === 'true' && c === 'true') || (u === 'false' && c === 'false')) return true;

  return false;
}

/* ---------- Есеп генераторлары ---------- */
const generators = {

  // Арифметикалық операторлар (аралас)
  arith: () => {
    const op = pick(['+', '-', '*', '/', '//', '%', '**']);
    let a, b, correct;
    switch (op) {
      case '+':
        a = randInt(1, 50); b = randInt(1, 50); correct = a + b; break;
      case '-':
        a = randInt(20, 60); b = randInt(1, a); correct = a - b; break;
      case '*':
        a = randInt(2, 12); b = randInt(2, 12); correct = a * b; break;
      case '/':
        b = randInt(2, 10);
        a = b * randInt(2, 10) + randInt(1, b - 1);
        correct = +(a / b).toFixed(2); break;
      case '//':
        b = randInt(2, 10);
        a = randInt(b * 2, b * 10);
        correct = Math.floor(a / b); break;
      case '%':
        b = randInt(2, 10);
        a = randInt(b + 1, b * 10);
        correct = a % b; break;
      case '**':
        a = randInt(2, 6); b = randInt(2, 4); correct = a ** b; break;
    }
    return { question: `${a} ${op} ${b} = ?`, correct: String(correct) };
  },

  // Тек // және %
  intdiv: () => {
    const op = pick(['//', '%']);
    const b = randInt(2, 10);
    const a = randInt(b + 1, b * 10);
    const correct = op === '//' ? Math.floor(a / b) : a % b;
    return { question: `${a} ${op} ${b} = ?`, correct: String(correct) };
  },

  // Дәрежелеу
  power: () => {
    const a = randInt(2, 6);
    const b = randInt(2, 4);
    return { question: `${a} ** ${b} = ?`, correct: String(a ** b) };
  },

  // Дөңгелектеу: round, int, abs
  roundfns: () => {
    const fn = pick(['round', 'int', 'abs']);
    let num;
    do {
      num = +(Math.random() * 20 - 10).toFixed(2);
    } while (Math.abs(num % 1) === 0.5);

    let correct;
    if (fn === 'round') correct = Math.round(num);
    else if (fn === 'int') correct = Math.trunc(num);
    else correct = Math.abs(num);

    return { question: `${fn}(${num}) = ?`, correct: String(correct) };
  },

  // Математикалық функциялар: min, max, pow, sqrt
  mathfns: () => {
    const fn = pick(['min', 'max', 'pow', 'sqrt']);
    if (fn === 'min' || fn === 'max') {
      const nums = [randInt(1, 50), randInt(1, 50), randInt(1, 50)];
      const correct = fn === 'min' ? Math.min(...nums) : Math.max(...nums);
      return { question: `${fn}(${nums.join(', ')}) = ?`, correct: String(correct) };
    }
    if (fn === 'pow') {
      const a = randInt(2, 6), b = randInt(2, 4);
      return { question: `pow(${a}, ${b}) = ?`, correct: String(a ** b) };
    }
    const n = randInt(2, 15);
    return { question: `math.sqrt(${n * n}) = ?`, correct: String(n) };
  },

  // Санау жүйелері — ТУРА ЖӘНЕ КЕРІ БАҒЫТ
  numsys: () => {
    const systems = [
      { base: 2,  name: 'екілік',       prefix: '0b', fn: 'bin' },
      { base: 8,  name: 'сегіздік',     prefix: '0o', fn: 'oct' },
      { base: 16, name: 'он алтылық',   prefix: '0x', fn: 'hex' }
    ];
    const sys = pick(systems);
    const direction = pick(['toBase', 'toDecimal']); // ТУРА / КЕРІ

    if (direction === 'toBase') {
      // 78 (ондық) → он алтылық = ?
      const n = randInt(10, 200);
      const body = n.toString(sys.base);
      const correct = sys.prefix + body;
      return {
        question: `${n} (ондық) → ${sys.name} жүйе = ?`,
        correct,
        hint: `💡 Python-да: ${sys.fn}(${n}) = ${correct}`
      };
    } else {
      // 0x4e (он алтылық) → ондық = ?
      const n = randInt(10, 200);
      const body = n.toString(sys.base);
      const shown = sys.prefix + body;
      return {
        question: `${shown} (${sys.name}) → ондық = ?`,
        correct: String(n),
        hint: `💡 Python-да: int("${body}", ${sys.base}) = ${n}`
      };
    }
  },

  // Логикалық операторлар
  logic: () => {
    const a = pick([true, false]);
    const b = pick([true, false]);
    const op = pick(['and', 'or']);
    const correct = op === 'and' ? (a && b) : (a || b);
    return {
      question: `${a ? 'True' : 'False'} ${op} ${b ? 'True' : 'False'} = ?`,
      correct: correct ? 'True' : 'False'
    };
  },

  // Жол ұзындығы
  strings: () => {
    const words = ['python', 'algebra', 'informatika', 'mektep',
                   'kompyuter', 'programma', 'matematika', 'algoritm',
                   'operator', 'kod', 'san', 'qosylu', 'Kazakhstan', 'Qyzylzhar', 'Taldyqorgan', 'Almaty', 'Astana', 'Saryozek'];
    const w = pick(words);
    return { question: `len("${w}") = ?`, correct: String(w.length) };
  }
};

/* ---------- Негізгі логика ---------- */
function startQuiz() {
  const topicKey = document.getElementById("topic").value;
  const num = parseInt(document.getElementById("numQuestions").value);
  timePerQuestion = parseInt(document.getElementById("timePerQ").value) || 30;

  if (isNaN(num) || num < 1) {
    alert("Тапсырма санын дұрыс көрсетіңіз.");
    return;
  }
  if (isNaN(timePerQuestion) || timePerQuestion < 5) {
    alert("Уақыт кемінде 5 секунд болуы керек.");
    return;
  }

  currentTopicLabel = document.getElementById("topic").options[
    document.getElementById("topic").selectedIndex
  ].text;

  questions = generateQuestions(num, topicKey);
  current = 0;
  score = 0;

  document.getElementById("setup").style.display = "none";
  document.getElementById("quiz").style.display = "block";
  document.getElementById("result").style.display = "none";

  showQuestion();
}

function generateQuestions(count, topicKey) {
  const q = [];
  for (let i = 0; i < count; i++) {
    const gen = topicKey === 'mixed'
      ? generators[pick(Object.keys(generators))]
      : generators[topicKey];
    q.push(gen());
  }
  return q;
}

function showQuestion() {
  const q = questions[current];
  document.getElementById("question").innerText =
    `${current + 1}) ${q.question}`;
  document.getElementById("answer").value = "";
  document.getElementById("score").innerText = score;
  document.getElementById("answer").focus();
  startTimer();
}

function submitAnswer() {
  stopTimer();

  const input = document.getElementById("answer").value.trim();
  questions[current].user = input;

  if (isCorrect(input, questions[current].correct)) {
    score++;
  }

  current++;
  if (current < questions.length) {
    showQuestion();
  } else {
    finishQuiz();
  }
}

function startTimer() {
  timeLeft = timePerQuestion;
  updateTimerDisplay();
  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      submitAnswer();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

function updateTimerDisplay() {
  document.getElementById("timer").innerText = `Қалған уақыт: ${timeLeft} сек.`;
}

function handleKey(e) {
  if (e.key === "Enter") {
    submitAnswer();
  }
}

/* ---------- Тарих ---------- */
function clearHistory() {
  if (confirm("Барлық тарихты өшіргіңіз келе ме?")) {
    localStorage.removeItem("history");
    alert("Тарих тазартылды!");
    location.reload();
  }
}

function showHistory() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  renderHistoryTable(history);
}

function renderHistoryTable(data) {
  const table = document.getElementById("historyTable");
  table.innerHTML = "<h3>Тарих:</h3>";
  if (data.length === 0) {
    table.innerHTML += "<p>Тарих бос</p>";
    return;
  }

  let html = "<table border='1' style='border-collapse: collapse;'><tr><th>Күні</th><th>Тақырып</th><th>Нәтиже</th></tr>";
  data.slice().reverse().forEach(h => {
    html += `<tr><td>${h.date}</td><td>${h.operation}</td><td>${h.correct}/${h.total}</td></tr>`;
  });
  html += "</table>";
  table.innerHTML += html;
}

function filterHistory() {
  const selectedDate = document.getElementById("filterDate").value;
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  const filtered = history.filter(h => h.date.startsWith(selectedDate));
  renderHistoryTable(filtered);
}

function renderChart() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  const labels = history.map(h => h.date.split(",")[0]);
  const scores = history.map(h => Math.round((h.correct / h.total) * 100));

  const ctx = document.getElementById("progressChart").getContext("2d");
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Дұрыс жауаптар пайызы (%)',
        data: scores,
        fill: false,
        borderColor: 'green',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}

/* ---------- Аяқтау ---------- */
function finishQuiz() {
  stopTimer();
  document.getElementById("quiz").style.display = "none";
  document.getElementById("result").style.display = "block";
  document.getElementById("finalScore").innerText =
    `Сіз ${questions.length} тапсырманың ${score} дұрыс шештіңіз.`;

  const review = document.getElementById("review");
  review.innerHTML = "<h3>Талдау:</h3>";
  questions.forEach((q, i) => {
    const p = document.createElement("p");
    const ok = isCorrect(q.user, q.correct);
    let html = `${i + 1}) <span class="code">${q.question}</span> → ` +
               `Дұрыс жауап: <b>${q.correct}</b>. Сіздің жауабыңыз: ${q.user || '—'}`;
    if (q.hint) {
      html += `<br><small style="color:#666;">${q.hint}</small>`;
    }
    p.innerHTML = html;
    p.className = ok ? "correct" : "incorrect";
    review.appendChild(p);
  });

  saveToHistory(score, questions.length, currentTopicLabel);
  showHistory();
  renderChart();
  showCongratulations(score, questions.length);
}

function saveToHistory(correct, total, op) {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  history.push({
    date: new Date().toLocaleString(),
    correct,
    total,
    operation: op
  });
  localStorage.setItem("history", JSON.stringify(history));
}

function restart() {
  document.getElementById("setup").style.display = "block";
  document.getElementById("quiz").style.display = "none";
  document.getElementById("result").style.display = "none";
}

function showCongratulations(score, total) {
  const percent = (score / total) * 100;
  if (percent >= 80) {
    const congrats = document.createElement("div");
    congrats.innerHTML = `
      <div style="background-color: #d1e7dd; padding: 20px; border-radius: 15px; margin: 20px 0; text-align: center;">
        <h2 style="color: #0f5132;">🎉 Құттықтаймыз! 🎉</h2>
        <p>Сіз <strong>${total}</strong> тапсырманың <strong>${score}</strong> дұрыс орындадыңыз — тамаша нәтиже!</p>
        <p>Осылай жалғастырыңыз!</p>
      </div>
    `;
    document.getElementById("result").prepend(congrats);
  }
}
