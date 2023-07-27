FROM node:20-alpine as build
ADD . /appBuild
WORKDIR /appBuild
RUN yarn install --ignore-scripts && \
    yarn build && \
    yarn run prune

FROM node:20-alpine
WORKDIR /app
COPY --from=build /appBuild/dist ./dist
COPY --from=build /appBuild/node_modules ./node_modules
COPY --from=build /appBuild/package.json ./package.json
ENTRYPOINT [ "yarn", "start:prod" ]