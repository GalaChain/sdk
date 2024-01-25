FROM node:16-alpine AS build

WORKDIR /usr/src/app

COPY . .

RUN npm ci --include=dev
RUN npm run build
RUN npm prune --production

FROM gcr.io/distroless/nodejs16-debian11 as production

ARG CC_SERVER_ADDRESS=0.0.0.0
ARG CC_SERVER_PORT=7052

ENV CC_SERVER_ADDRESS=${CC_SERVER_ADDRESS}
ENV CC_SERVER_PORT=${CC_SERVER_PORT}
ENV CORE_CHAINCODE_ADDRESS=${CC_SERVER_ADDRESS}:${CC_SERVER_PORT}

EXPOSE $CC_SERVER_PORT

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/lib ./lib
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/package.json ./package-lock.json

CMD ["lib/src/cli.js", "server"]
