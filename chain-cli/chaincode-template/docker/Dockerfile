# Start with the Docker in Docker image
FROM docker:dind

# Install bash, Node.js, jq, yq, and Perl
RUN apk add --update nodejs npm bash jq perl

# Install yq
RUN wget https://github.com/mikefarah/yq/releases/download/v4.9.8/yq_linux_amd64 -O /usr/bin/yq && chmod +x /usr/bin/yq

# Install Gala Chain CLI globally
RUN npm install -g @gala-chain/cli

# Install Nodemon globally
RUN npm install -g nodemon

# Define the build-time argument for the project name with a default value
ARG PROJECT_NAME=proj-galachain

# Initialize a project with galachain
RUN galachain init "$PROJECT_NAME"

# Change working directory to the project directory
WORKDIR /$PROJECT_NAME

# Install project dependencies
RUN npm install

# Expose port 3010
EXPOSE 3010
