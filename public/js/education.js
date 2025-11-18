/**
 * Логика страницы "Обучение": уроки, квиз и прогресс.
 */

const lessons = [
  { id: 1, title: 'Основы бюджета', description: 'Разбираем, как формировать категории расходов и следить за лимитами.' },
  { id: 2, title: 'Подготовка целей', description: 'Учимся разбивать крупные цели на взносы и использовать автопереносы.' },
  { id: 3, title: 'Инвестиционные шаги', description: 'Говорим о распределении активов и регулярных пополнениях.' }
];

const quizQuestions = [
  {
    question: 'Что такое бюджет в FinTrackr?',
    options: ['Лимиты по категориям', 'Тип счёта', 'Курс валюты'],
    correct: 0
  },
  {
    question: 'Как часто стоит пересматривать цели?',
    options: ['Раз в год', 'Каждый месяц/квартал', 'Никогда'],
    correct: 1
  },
  {
    question: 'Что поможет избежать импульсивных расходов?',
    options: ['Отдельная категория “подушки”', 'Скрывать операции', 'Увеличивать лимиты'],
    correct: 0
  }
];

function loadLessonProgress() {
  try {
    return JSON.parse(localStorage.getItem('eduProgress') || '{}');
  } catch (e) {
    return {};
  }
}

function saveLessonProgress(progress) {
  localStorage.setItem('eduProgress', JSON.stringify(progress));
}

function loadQuizStats() {
  try {
    return JSON.parse(localStorage.getItem('eduQuizStats') || '{"correct":0,"answered":0}');
  } catch (e) {
    return { correct: 0, answered: 0 };
  }
}

function saveQuizStats(stats) {
  localStorage.setItem('eduQuizStats', JSON.stringify(stats));
}

function updateEducationStats() {
  const progress = loadLessonProgress();
  const quizStats = loadQuizStats();
  const totalLessons = lessons.length;
  const completed = Object.values(progress).filter(Boolean).length;
  const completionPercent = totalLessons ? Math.round((completed / totalLessons) * 100) : 0;
  const accuracy = quizStats.answered ? Math.round((quizStats.correct / quizStats.answered) * 100) : 0;

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set('educationHeroTag', `${totalLessons} уроков`);
  set('educationHeroQuizTag', `${accuracy}% точность квиза`);
  set('educationHeroProgress', `${completionPercent}%`);
  set('educationHeroNote', completed ? `Завершено уроков: ${completed}` : 'Нет завершённых уроков');

  set('educationMetricLessons', totalLessons);
  set('educationMetricCompleted', completed);
  set('educationMetricAccuracy', `${accuracy}%`);
  set('educationMetricQuiz', quizQuestions.length);
}

function renderLessons() {
  const container = document.getElementById('lessonsContainer');
  if (!container) return;
  const progress = loadLessonProgress();
  container.innerHTML = '';
  lessons.forEach((lesson) => {
    const card = document.createElement('div');
    card.className = 'lesson-card';
    const h3 = document.createElement('h3');
    h3.textContent = lesson.title;
    const desc = document.createElement('p');
    desc.textContent = lesson.description;
    const status = document.createElement('p');
    status.className = 'muted-label';
    const btn = document.createElement('button');
    btn.className = 'btn-primary';

    if (progress[lesson.id]) {
      status.textContent = 'Урок завершён';
      status.style.color = 'var(--primary)';
      btn.textContent = 'Снять отметку';
    } else {
      status.textContent = 'Не пройден';
      status.style.color = 'var(--danger)';
      btn.textContent = 'Отметить как пройденный';
    }

    btn.addEventListener('click', () => {
      const updated = loadLessonProgress();
      updated[lesson.id] = !updated[lesson.id];
      saveLessonProgress(updated);
      renderLessons();
      updateEducationStats();
    });

    card.append(h3, desc, status, btn);
    container.appendChild(card);
  });
}

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';
  quizQuestions.forEach((q, idx) => {
    const block = document.createElement('div');
    block.className = 'quiz-question';
    const title = document.createElement('p');
    title.textContent = `${idx + 1}. ${q.question}`;
    title.style.fontWeight = '600';
    block.appendChild(title);
    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';

    q.options.forEach((opt, optIdx) => {
      const li = document.createElement('li');
      li.style.marginBottom = '0.5rem';
      const btn = document.createElement('button');
      btn.className = 'btn-secondary';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        const correct = optIdx === q.correct;
        const stats = loadQuizStats();
        stats.answered += 1;
        if (correct) stats.correct += 1;
        saveQuizStats(stats);
        li.querySelectorAll('span').forEach((s) => s.remove());
        const result = document.createElement('span');
        result.textContent = correct ? ' — верно' : ' — неверно';
        result.style.marginLeft = '0.4rem';
        result.style.color = correct ? 'var(--primary)' : 'var(--danger)';
        li.appendChild(result);
        updateEducationStats();
      });
      li.appendChild(btn);
      list.appendChild(li);
    });

    block.appendChild(list);
    container.appendChild(block);
  });
}

function initEducationPage() {
  renderLessons();
  renderQuiz();
  updateEducationStats();
}

if (document.readyState !== 'loading') {
  initEducationPage();
} else {
  document.addEventListener('DOMContentLoaded', initEducationPage);
}
