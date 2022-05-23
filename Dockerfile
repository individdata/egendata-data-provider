FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN cat test-services-jtech-se.pem >> /etc/ssl/certs/ca-certificates.crt
RUN npm run build

FROM node:16-alpine AS server
WORKDIR /app
COPY package* ./
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
RUN npm install --production
COPY --from=builder ./app/dist ./
EXPOSE 3002
CMD ["node", "server"]
