/**
 * Скрипт страницы «Настройки». Синхронизирует локальные предпочтения и формы.
 */
function updateSettingsHero(settings) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  const currency = settings.currency || 'USD';
  const report = settings.reportCurrency || currency;
  const balance = settings.balanceCurrency || currency;
  const timezone = settings.timezone || 'Europe/Warsaw';
  const notifications = settings.notifications || {};
  const channels = ['email', 'telegram', 'push'].filter((key) => notifications[key]).length;

  set('settingsHeroCurrency', `${currency} валюта интерфейса`);
  set('settingsHeroTimezone', timezone);
  set('settingsHeroNotifications', `${channels} каналов`);
  set('settingsHeroNote', channels ? 'Уведомления включены' : 'Каналы пока не выбраны');

  set('settingsMetricCurrency', currency);
  set('settingsMetricReport', report);
  set('settingsMetricBalance', balance);
  set('settingsMetricNotifications', channels);
}

async function initSettingsPage() {
  await Auth.redirectIfNotAuthenticated();
  try {
    await Auth.syncSession();
  } catch (err) {
    console.warn('Sync error', err);
  }

  let settings = {};
  try {
    settings = JSON.parse(localStorage.getItem('settings')) || {};
  } catch (err) {
    settings = {};
  }

  const currentUser = Auth.getUser() || {};
  const nameInput = document.getElementById('profileName');
  const currencySelect = document.getElementById('profileCurrency');
  const timezoneSelect = document.getElementById('profileTimezone');
  const reportCurrencySelect = document.getElementById('reportCurrencySelect');
  const balanceCurrencySelect = document.getElementById('balanceCurrencySelect');
  const notifyEmail = document.getElementById('notifyEmail');
  const notifyTelegram = document.getElementById('notifyTelegram');
  const notifyPush = document.getElementById('notifyPush');

  if (nameInput) nameInput.value = settings.name || currentUser.name || '';
  if (currencySelect) currencySelect.value = settings.currency || 'USD';
  if (timezoneSelect) timezoneSelect.value = settings.timezone || 'Europe/Warsaw';
  if (reportCurrencySelect) reportCurrencySelect.value = settings.reportCurrency || settings.currency || 'USD';
  if (balanceCurrencySelect) balanceCurrencySelect.value = settings.balanceCurrency || settings.currency || 'USD';
  if (notifyEmail) notifyEmail.checked = settings.notifications?.email || false;
  if (notifyTelegram) notifyTelegram.checked = settings.notifications?.telegram || false;
  if (notifyPush) notifyPush.checked = settings.notifications?.push || false;

  updateSettingsHero(settings);

  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      settings.name = nameInput.value.trim();
      settings.currency = currencySelect.value;
      settings.timezone = timezoneSelect.value;
      try {
        localStorage.setItem('settings', JSON.stringify(settings));
        updateSettingsHero(settings);
        alert('Профиль сохранён');
      } catch (err) {
        console.error(err);
        alert('Не удалось сохранить профиль');
      }
    });
  }

  const notifyForm = document.getElementById('notifyForm');
  if (notifyForm) {
    notifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      settings.notifications = {
        email: !!notifyEmail.checked,
        telegram: !!notifyTelegram.checked,
        push: !!notifyPush.checked,
      };
      try {
        localStorage.setItem('settings', JSON.stringify(settings));
        updateSettingsHero(settings);
        alert('Настройки уведомлений сохранены');
      } catch (err) {
        console.error(err);
        alert('Не удалось сохранить уведомления');
      }
    });
  }

  const reportForm = document.getElementById('reportCurrencyForm');
  if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      settings.reportCurrency = reportCurrencySelect.value;
      try {
        localStorage.setItem('settings', JSON.stringify(settings));
        updateSettingsHero(settings);
        alert('Валюта отчётов обновлена');
      } catch (err) {
        console.error(err);
        alert('Не удалось сохранить валюту отчётов');
      }
    });
  }

  const balanceForm = document.getElementById('balanceCurrencyForm');
  if (balanceForm) {
    balanceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      settings.balanceCurrency = balanceCurrencySelect.value;
      try {
        localStorage.setItem('settings', JSON.stringify(settings));
        updateSettingsHero(settings);
        alert('Валюта балансов сохранена');
      } catch (err) {
        console.error(err);
        alert('Не удалось сохранить валюту балансов');
      }
    });
  }
}

if (document.readyState !== 'loading') {
  initSettingsPage().catch((err) => console.error('Settings init error', err));
} else {
  document.addEventListener('DOMContentLoaded', () => {
    initSettingsPage().catch((err) => console.error('Settings init error', err));
  });
}
