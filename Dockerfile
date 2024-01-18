FROM node:20-alpine as build
ADD . /appBuild
WORKDIR /appBuild
RUN yarn install --ignore-scripts && \
    yarn build && \
    yarn run prune

FROM golang:alpine as query-build
ADD image-query /appBuild
WORKDIR /appBuild
RUN go mod vendor && \
    go build main.go

FROM node:20-alpine
WORKDIR /app
COPY --from=build /appBuild/dist ./dist
COPY --from=build /appBuild/node_modules ./node_modules
COPY --from=build /appBuild/package.json ./package.json
COPY --from=query-build /appBuild/main ./main
RUN chmod a+x ./main
ENTRYPOINT [ "yarn", "start:prod" ]