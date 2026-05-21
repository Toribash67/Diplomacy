FROM node:22-alpine AS build

WORKDIR /app

COPY . .

RUN npm install --global typescript
RUN tsc -p packages/engine/tsconfig.json

FROM nginx:1.27-alpine

COPY deploy/nginx/diplomacy-web.conf /etc/nginx/conf.d/default.conf
COPY packages/web /usr/share/nginx/html/packages/web
COPY --from=build /app/packages/engine/dist /usr/share/nginx/html/packages/engine/dist
