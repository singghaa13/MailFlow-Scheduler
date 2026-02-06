FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY tsconfig.json ./
COPY prisma ./prisma

# Build TypeScript
RUN npm run build

# Generate Prisma client
RUN npm run prisma:generate

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
