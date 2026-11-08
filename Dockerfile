FROM node:24-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes these into the bundle at build time. Empty API URL = same-origin /api.
ARG VITE_API_BASE_URL=""
ARG VITE_CLOUDINARY_CLOUD_NAME=""
RUN npm run build


FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

# The backend's /api/site-shell brands this build's index.html, so publish it to the shared folder.
CMD ["sh", "-c", "mkdir -p /shell && cp /usr/share/nginx/html/index.html /shell/.index.tmp && mv -f /shell/.index.tmp /shell/index.html; exec nginx -g 'daemon off;'"]
