# Dockerized Galachain Dev Environment

## Base requirement

- Docker Desktop or Docker CLI installed on your machine.
- VS Code with [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension.

## Build the image
Run the docker build command

	$ docker build --build-arg PROJECT_NAME=<project_folder_name> -t <image_name> .

You can also run this command without the project name argument:

	$ docker build -t <image_name> .

This will run the `galachain init <project-name>` command with a default project-name of `proj-galachain`


## Run a container
Run a container from the built image:

    $ docker run --privileged -d -p 3010:3010 -it --name <container_name> <image_name>
    
Make sure the container is up and running.

## Attach VS Code to the Container

Make sure you have the Dev Containers extension installed in VS code.

Run `Dev Containers: Attach to a running container`

After attach the container you may have to open the project folder manually.


## Open the Dev Container Terminal and Start Network

Once the terminal is open, start the network
    $ npm run network:start

The network is going to start in dev mode and the prompt will be left showing the logs, so don't close the prompt and open new ones to proceed with the following commands.

## Open a new Dev Container Terminal and Run Tests

    $ npm run test:e2e


## Verify changes in block browser and GraphQL
Navigate to http://localhost:3010/blocks to see our block browser which allows you to see what's saved on your local GalaChain network.

Navigate to http://localhost:3010/graphiql to interact with GraphQL and execute queries.
