FROM node:18-bullseye-slim

# Install Chromium dan dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    wget \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer environment
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p .wwebjs_auth uploads public && \
    chmod -R 777 .wwebjs_auth uploads

EXPOSE 3000

# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#     CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["npm", "start"]