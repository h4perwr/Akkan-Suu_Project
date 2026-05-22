# Use an official node image as the base (Node version 20)
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Start the application

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]