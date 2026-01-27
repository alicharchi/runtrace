# Stable Node version
FROM node:20-bullseye

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Vite dev server port
EXPOSE 5173

# Run Vite in Docker
CMD ["npm", "run", "dev", "--", "--host"]
