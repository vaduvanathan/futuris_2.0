# Build Stage
FROM node:18 as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Set API URL directly
ENV VITE_API_URL=https://futuris-2-0-242775953468.asia-south1.run.app

RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
