/* Налаштування відправки заявок з модальних вікон пропозицій.
   web3formsKey — публічний access key Web3Forms (https://web3forms.com, прив'язаний до e-mail отримувача).
   telegramWorker — URL Cloudflare Worker із site/workers/telegram-forms (токен бота — лише в секретах Cloudflare).
   Порожні значення = демо-режим: форма перевіряється і показує подяку, нічого не надсилає. */
window.HP_FORMS = {
  endpoint: 'https://api.web3forms.com/submit',
  web3formsKey: '',
  telegramWorker: ''
};
