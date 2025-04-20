let questions = [];
let current = 0;
let score = 0;
let timer = null;
let timePerQuestion = 10; // секунд
let timeLeft = timePerQuestion;

function startQuiz() {
  const operation = document.getElementById("operation").value;
  const num = parseInt(document.getElementById("numQuestions").value);

  questions = generateQuestions(num, operation);
  current = 0;
  score = 0;

  document.getElementById("setup").style.display = "none";
  document.getElementById("quiz").style.display = "block";
  document.getElementById("result").style.display = "none";

  showQuestion();
}

function generateQuestions(count, op) {
  const q = [];
  for (let i = 0; i < count; i++) {
    let a = Math.floor(Math.random() * 50) + 1;
    let b = Math.floor(Math.random() * 50) + 1;
    if (op === "/") {
      a = a * b;
    }
    const correct = eval(`${a} ${op} ${b}`);
    q.push({ a, b, op, correct, user: null });
  }
  return q;
}

function showQuestion() {
  const q = questions[current];
  document.getElementById("question").innerText = `${current + 1}) ${q.a} ${q.op} ${q.b} = ?`;
  document.getElementById("answer").value = "";
  document.getElementById("score").innerText = score;
  startTimer();
}

function submitAnswer() {
  stopTimer();

  const input = parseFloat(document.getElementById("answer").value);
  questions[current].user = input;

  if (Math.abs(input - questions[current].correct) < 0.001) {
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
      submitAnswer(); // автоматически
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

function updateTimerDisplay() {
  document.getElementById("timer").innerText = `Осталось времени: ${timeLeft} сек.`;
}


function handleKey(e) {
  if (e.key === "Enter") {
    submitAnswer();
  }
}

function clearHistory() {
  if (confirm("Ты точно хочешь удалить всю историю?")) {
    localStorage.removeItem("history");
    alert("История очищена!");
    location.reload();
  }
}


function showHistory() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  renderHistoryTable(history);
}

function renderHistoryTable(data) {
  const table = document.getElementById("historyTable");
  table.innerHTML = "<h3>История:</h3>";
  if (data.length === 0) {
    table.innerHTML += "<p>История пуста</p>";
    return;
  }

  let html = "<table border='1' style='border-collapse: collapse;'><tr><th>Дата</th><th>Операция</th><th>Результат</th></tr>";
  data.reverse().forEach(h => {
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
        label: 'Процент правильных (%)',
        data: scores,
        fill: false,
        borderColor: 'green',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}






function finishQuiz() {
  stopTimer();
  document.getElementById("quiz").style.display = "none";
  document.getElementById("result").style.display = "block";
  document.getElementById("finalScore").innerText = `Ты решил правильно ${score} из ${questions.length} задач.`;

  const review = document.getElementById("review");
  review.innerHTML = "";
  questions.forEach((q, i) => {
    const p = document.createElement("p");
    const isCorrect = Math.abs(q.user - q.correct) < 0.001;
    p.innerHTML = `${i + 1}) ${q.a} ${q.op} ${q.b} = ${q.correct}. Твой ответ: ${q.user}`;
    p.className = isCorrect ? "correct" : "incorrect";
    review.appendChild(p);
  });

  saveToHistory(score, questions.length, questions[0].op);
  showHistory();
  
  renderChart();

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

function showHistory() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  const historyDiv = document.createElement("div");
  historyDiv.innerHTML = "<h3>Предыдущие попытки:</h3>";

  history.slice(-5).reverse().forEach(h => {
    const p = document.createElement("p");
    p.innerText = `${h.date} | ${h.operation} | ${h.correct}/${h.total}`;
    historyDiv.appendChild(p);
  });

  document.getElementById("result").appendChild(historyDiv);
}

function restart() {
  document.getElementById("setup").style.display = "block";
  document.getElementById("quiz").style.display = "none";
  document.getElementById("result").style.display = "none";
}
