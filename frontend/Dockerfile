FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Bitta domen: API shu hostning /api/ yo'lida (nginx Django'ga proxy qiladi)
ARG VITE_API_URL=/
ENV VITE_API_URL=$VITE_API_URL
# Qaysi commit build qilinganini sahifa oxirida ko'rsatadi (docker compose build web, GIT_SHA=$(git rev-parse --short HEAD))
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
