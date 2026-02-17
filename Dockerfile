FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


# ---------- Serve ----------
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# React router fix
RUN printf 'server { \
  listen 8080; \
  location / { \
    root /usr/share/nginx/html; \
    try_files $uri /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
