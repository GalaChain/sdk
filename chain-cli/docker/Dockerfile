# Start with the Docker in Docker image
FROM docker:dind

# Install bash, Node.js, jq, and Perl
RUN apk add --update nodejs npm bash jq perl

# Install Gala Chain CLI globally
RUN npm install -g @gala-chain/cli

# Install Nodemon globally
RUN npm install -g nodemon

# Initialize a project with galachain
RUN galachain init chaincode-template

# Change working directory to the project directory
WORKDIR /chaincode-template

# Install project dependencies
RUN npm install

# Expose port 3010
EXPOSE 3010
