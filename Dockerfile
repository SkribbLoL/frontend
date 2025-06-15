# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the production version of the app
RUN npm run build

# Install a static file server to serve the built files
RUN npm install -g serve

# Expose the port for the static server
EXPOSE 5173

# Command to serve the built app
CMD ["serve", "-s", "dist", "-l", "5173"]
