# Заявки з форм пропозицій → Telegram (Cloudflare Worker, безкоштовний план)

Токен бота в коді сайту світити не можна — тому заявка йде з сайту на цей Worker, а він пересилає її в Telegram.
Токен і id чату зберігаються лише в секретах Cloudflare.

## Що потрібно від власника
1. Створити бота в @BotFather → отримати токен.
2. Додати бота в чат/групу менеджерів, написати туди будь-яке повідомлення, дізнатися `chat_id`
   (напр. через `https://api.telegram.org/bot<TOKEN>/getUpdates` — відкрити самостійно, токен нікому не пересилати).
3. Обліковий запис Cloudflare (безкоштовний).

## Встановлення
```
cp wrangler.toml.example wrangler.toml
npx wrangler login
npx wrangler secret put TG_TOKEN
npx wrangler secret put TG_CHAT_ID
npx wrangler deploy
```
Отриману адресу `https://ms-lviv-forms.<акаунт>.workers.dev` вписати в `telegramWorker` у
`build/concepts/hotel-na-ploshchi/static/forms-config.js` і перезібрати сайт.

## Що робить
- приймає лише POST із `ALLOWED_ORIGIN` (CORS);
- відкидає заявки із заповненим honeypot-полем `botcheck`;
- надсилає в чат назву пропозиції, сторінку, з якої прийшла заявка, і поля форми.
