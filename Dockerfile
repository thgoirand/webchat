FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install --production || true

# Copy app
COPY . .

EXPOSE 3000

CMD ["npm", "start"]