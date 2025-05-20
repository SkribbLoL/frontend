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

# Expose the port your Vite app will run on
EXPOSE 5173

# Define the command to start your Vite application with host flag to expose on all interfaces
CMD [ "npm", "run", "dev", "--", "--host", "0.0.0.0" ]