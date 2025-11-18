/**
 * Обработчик подписок на странице «Премиум».
 */
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.subscribe-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan');
      const planName = plan === 'ai' ? 'AI Plus' : 'Премиум';
      alert(`Спасибо за интерес к тарифу «${planName}». Мы свяжемся с вами, чтобы активировать подписку.`);
    });
  });
});
