# Инструкция по деплою в Timeweb Cloud Apps (из Lovable)

> **Кратко**: проект состоит из двух сервисов — `edge` (nginx-прокси, всегда онлайн) и `app` (SPA + reverse-proxy на Supabase). Edge показывает заглушку "Сервис временно недоступен" автоматически, когда `app` недоступен (деплой, перезапуск, OOM).

---

## 1. Структура сервисов

| Сервис | Порт (хост) | Назначение |
|--------|-------------|------------|
| `edge` | `8082` → `8080` | Точка входа. Проксирует в `app`. Автоматически показывает `/maintenance.html` при 502/503/504. |
| `app`  | `8080` (внутренний) | SPA (Vite → Nginx) + reverse-proxy на Supabase (`api.unvrsm.ru`). |

**Важно**: в Timeweb Cloud Apps внешний порт должен быть направлен на `8082` (edge), а `app` не публикуется наружу (`expose`, не `ports`). Если вы используете домен `api.unvrsm.ru`, убедитесь, что он также направлен на этот же IP и порт `8082`.

---

## 2. Файлы, которые нужно скопировать в проект

Убедитесь, что в репозитории есть:

```
├── docker-compose.yml          # описание сервисов edge + app
├── Dockerfile                  # сборка SPA (Vite → Nginx)
├── nginx.conf                  # конфиг Nginx внутри app-контейнера
├── edge/
│   ├── Dockerfile              # nginx:alpine + maintenance.html
│   ├── nginx.conf              # edge-прокси с авто-заглушкой
│   └── maintenance.html        # страница "Вернитесь через 15 мин"
├── .env                        # VITE_* переменные (без секретов)
└── .dockerignore               # исключает node_modules, .git и т.д.
```

---

## 3. Переменные окружения (`.env` и Build Args)

### 3.1. В файле `.env` (для Vite в dev-режиме)

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
```

**Важно**: `VITE_SUPABASE_PUBLISHABLE_KEY` — это **публичный** anon-ключ, его можно хранить в коде. `service_role` ключ **никогда** не попадает во фронтенд.

### 3.2. Build Args в `docker-compose.yml`

В секции `app.build.args` прокидываются те же переменные, чтобы Vite получил их на этапе сборки:

```yaml
app:
  build:
    context: .
    dockerfile: Dockerfile
    args:
      VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
      VITE_SUPABASE_PUBLISHABLE_KEY: ${VITE_SUPABASE_PUBLISHABLE_KEY}
      VITE_SUPABASE_PROJECT_ID: ${VITE_SUPABASE_PROJECT_ID}
```

### 3.3. Где хранить секреты

- **Lovable Secrets**: хранятся в Lovable UI (Project Settings → Secrets) и доступны Edge Functions. Используйте для `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_API_KEY`, `YUKASSA_SECRET_KEY` и т.д.
- **Build Secrets** (Workspace Settings): нужны только если используете приватные npm-пакеты.
- **Timeweb Env**: при деплое в Timeweb Cloud Apps переменные из `.env` должны быть добавлены в интерфейсе Timeweb (или через `docker-compose` environment).

---

## 4. Настройка в Timeweb Cloud Apps

### 4.1. Порты

1. Откройте настройки приложения в панели Timeweb.
2. Убедитесь, что **внешний порт** приложения направлен на `8082` (контейнер `edge`).
3. Порт `8080` контейнера `app` **не должен быть открыт наружу** — он доступен только внутри Docker-сети.

### 4.2. Health Check

В `edge/Dockerfile` уже есть HEALTHCHECK:

```dockerfile
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/__edge_health >/dev/null || exit 1
```

Timeweb будет проверять этот эндпоинт. Убедитесь, что он отвечает `ok`.

### 4.3. Volumes

В `docker-compose.yml` используется именованный volume `maintenance_flags` для ручного включения заглушки:

```yaml
volumes:
  maintenance_flags:
```

Этот volume монтируется в `edge` как `/etc/nginx/flags`. При необходимости создайте файл внутри контейнера:

```bash
docker exec <edge_container_id> touch /etc/nginx/flags/maintenance.enabled
```

Для отключения:

```bash
docker exec <edge_container_id> rm /etc/nginx/flags/maintenance.enabled
```

---

## 5. Настройка в Lovable

### 5.1. Подключение к внешнему Supabase

Если ваш проект подключён к внешнему Supabase (не Lovable Cloud), убедитесь, что:

1. В `.env` указан `VITE_SUPABASE_URL` с вашим доменом `api.unvrsm.ru` (или аналогичным reverse-proxy), а не прямой `*.supabase.co` (может быть заблокирован РКН).
2. В `nginx.conf` (основном) настроен reverse-proxy на Supabase с корректными CORS-заголовками.

### 5.2. Edge Functions Secrets

Если используете Edge Functions (например, `yukassa-webhook`, `telegram-notify`), добавьте секреты через Lovable UI:

- `SUPABASE_SERVICE_ROLE_KEY`
- `YUKASSA_SHOP_ID`
- `YUKASSA_SECRET_KEY`
- `TELEGRAM_API_KEY`
- `LOVABLE_API_KEY` (если используется Telegram-коннектор)

Используйте **Add Secret** в Lovable — не храните ключи в коде.

### 5.3. Custom Domain (опционально)

Если нужен свой домен (`unvrsm.ru`):

1. Опубликуйте проект в Lovable (кнопка Publish).
2. В Project Settings → Domains добавьте свой домен.
3. Настройте DNS-записи у регистратора:
   - **A-запись** `@` → `185.158.133.1`
   - **A-запись** `www` → `185.158.133.1`
   - **TXT-запись** `_lovable` → `lovable_verify=...`
4. В Timeweb укажите свой домен в настройках приложения.

---

## 6. Что происходит при деплое

```
1. Timeweb запускает docker-compose up
2. Сборка app: Vite билд → Nginx image
3. Сборка edge: копируется nginx.conf + maintenance.html
4. Edge стартует первым, ждёт app (depends_on)
5. App становится доступен на порту 8080 (внутри сети)
6. Edge проксирует запросы с 8082 → 8080
7. Если app падает/пересоздаётся → edge автоматически отдаёт 503 + maintenance.html
```

Пользователи видят: **"Сервис временно недоступен. Идёт обновление. Вернитесь через 15 минут."**

---

## 7. Проверка после деплоя

### 7.1. Проверить edge health

```bash
curl https://your-domain.ru/__edge_health
# Должен вернуть: ok
```

### 7.2. Проверить maintenance-страницу вручную

```bash
curl -I https://your-domain.ru/maintenance.html
# Должен вернуть 200 + Cache-Control: no-store
```

### 7.3. Проверить API-прокси (если используется)

```bash
curl -I https://api.your-domain.ru/rest/v1/
# Должен вернуть 401 (Unauthorized) — значит прокси работает
```

---

## 8. Типичные проблемы и решения

| Проблема | Причина | Решение |
|----------|---------|---------|
| `502 Bad Gateway` | `app` не отвечает или порт не совпадает | Проверьте, что `app` слушает на `8080` и `edge` проксирует на `app:8080` |
| `Application error` без заглушки | Edge не запущен или порт открыт на `app` | Убедитесь, что внешний порт Timeweb направлен на `8082` (edge), а не `8080` |
| MIME type `application/octet-stream` для JS | Nginx не отдаёт `.js` с правильным типом | Проверьте `nginx.conf` в `app` — `gzip_types` должен включать `application/javascript` |
| CORS-ошибки при запросах к Supabase | Nginx прокси не прячет дублирующие CORS-заголовки | В `nginx.conf` для `api.` должен быть `proxy_hide_header Access-Control-Allow-Origin` |
| Сборка падает по OOM | Недостаточно памяти для `npm run build` | В `Dockerfile` используется `NODE_OPTIONS=--max-old-space-size=4096` и `fetch-retries` |

---

## 9. Чек-лист перед первым деплоем

- [ ] `.env` содержит корректные `VITE_SUPABASE_*`
- [ ] `docker-compose.yml` имеет сервисы `edge` (порт 8082) и `app` (expose 8080)
- [ ] В `edge/` лежат `Dockerfile`, `nginx.conf`, `maintenance.html`
- [ ] В `Dockerfile` app указаны `ARG VITE_SUPABASE_*` и `ENV`
- [ ] `nginx.conf` app раздаёт статику из `/usr/share/nginx/html` с SPA-fallback (`try_files $uri $uri/ /index.html`)
- [ ] `nginx.conf` edge имеет `proxy_intercept_errors on` и `error_page 502 503 504 = @maintenance`
- [ ] В Lovable добавлены все необходимые secrets для Edge Functions
- [ ] В Timeweb внешний порт настроен на `8082`
- [ ] Домен (если custom) направлен на Timeweb и верифицирован в Lovable

---

## 10. Полезные команды

```bash
# Проверить логи edge-контейнера
docker logs <edge_container_id> --tail 50

# Проверить логи app-контейнера
docker logs <app_container_id> --tail 50

# Вручную включить maintenance mode
docker exec <edge_container_id> touch /etc/nginx/flags/maintenance.enabled

# Вручную выключить maintenance mode
docker exec <edge_container_id> rm /etc/nginx/flags/maintenance.enabled

# Проверить, что nginx внутри edge работает
docker exec <edge_container_id> nginx -t
```

---

*Инструкция составлена на основе текущей инфраструктуры проекта unvrsm.ru.*
