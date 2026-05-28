FROM node:22-alpine AS build

WORKDIR /app

COPY . .

RUN npm install --global typescript
RUN tsc -p packages/engine/tsconfig.json

FROM node:22-alpine

WORKDIR /app

ENV HOST=0.0.0.0
ENV PORT=80

COPY packages/server /app/packages/server
COPY packages/web /app/packages/web
COPY packages/engine/package.json /app/packages/engine/package.json
COPY --from=build /app/packages/engine/dist /app/packages/engine/dist

EXPOSE 80

CMD ["node", "packages/server/src/server.mjs"]
