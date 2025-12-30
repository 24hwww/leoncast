FROM node:20-slim

# Install system dependencies for Chromium and Puppeteer/Capture
RUN apt-get update && apt-get install -y \
    chromium \
    curl \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_PATH=/usr/bin/chromium
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
