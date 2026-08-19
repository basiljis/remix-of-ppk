# --- Stage 1: build Vite-приложения ---
FROM node:20-alpine AS build

WORKDIR /app

# Установка зависимостей (используем кэш слоёв)
COPY package*.json ./
# Увеличиваем heap для npm — на маленьких билд-раннерах npm ci падает по OOM
ENV NODE_OPTIONS=--max-old-space-size=4096
# Делаем npm устойчивым к сетевым сбоям (на Timeweb/Cloud.ru registry бывает нестабильным)
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set fetch-timeout 600000
# npm install (а не ci) — терпим к рассинхрону package-lock.json.
# Явная проверка vite в конце: если install молча упал ("Exit handler never called!"),
# шаг сразу падает с понятной ошибкой, а не на этапе `npm run build`.
RUN npm install --no-audit --no-fund --legacy-peer-deps \
 && test -x node_modules/.bin/vite \
 || (echo "npm install failed — vite not installed" && exit 1)

# Копируем исходники и собираем
COPY . .

# Vite-сборке нужен увеличенный heap (см. project memory)
ENV NODE_OPTIONS=--max-old-space-size=4096

# Переменные окружения для Supabase прокидываются на этапе сборки
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

RUN npm run build

# --- Stage 2: раздача статики через Nginx ---
FROM nginx:alpine AS runtime

# Удаляем дефолтный конфиг и кладём свой (SPA-роутинг)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранные ассеты
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=20s --timeout=5s --start-period=30s \
  CMD wget -qO- --header="Host: unvrsm.ru" http://127.0.0.1:8080/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
