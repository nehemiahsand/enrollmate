# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 4000

# Run migrations and start the server
CMD ["sh", "-c", "node ./scripts/migrate.js && node server.js"]
