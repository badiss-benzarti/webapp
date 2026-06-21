FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build && mkdir -p /tmp/frontend-build && if [ -d dist/frontend/browser ]; then cp -r dist/frontend/browser/* /tmp/frontend-build/; else cp -r dist/frontend/* /tmp/frontend-build/; fi

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /tmp/frontend-build /usr/share/nginx/html

EXPOSE 80
