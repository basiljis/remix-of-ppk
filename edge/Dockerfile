# Edge-прокси: всегда онлайн, показывает заглушку при недоступности app.
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf \
 && mkdir -p /etc/nginx/flags

COPY nginx.conf       /etc/nginx/conf.d/default.conf
COPY maintenance.html /usr/share/nginx/html/maintenance.html

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/__edge_health >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
