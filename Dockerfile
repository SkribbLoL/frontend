# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install the project dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Build the application for production
RUN npm run build

# Expose the port your Vite app will run on
EXPOSE 5173

# Use Vite's preview server to serve the built static files
# This is much more efficient and avoids file watching issues
CMD [ "npm", "run", "preview", "--", "--host", "0.0.0.0" ]

# Alternative for development mode (commented out)
# Uncomment below and comment above for development/Docker Compose usage
# CMD [ "npm", "run", "dev", "--", "--host", "0.0.0.0" ]