# Dockerized Galachain Dev Environment

## Base requirement

- Docker Desktop or Docker CLI.
- [Optional] VS Code with [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension.

## Run a container
Run a container from the built image:

    $ docker run --privileged -d -p 3010:3010 -it --name <container_name> ghcr.io/gala-chain/sdk:latest
    
Make sure the container is up and running.
The Docker image initializes a new project with the name `chaincode-template` by default.

## Open the running container

### Open the container with bash

```
docker exec -ti <container_name> /bin/bash
```

### Open the container with VSCode (Requires VSCode and Dev Containers Extension)

Open VSCode and press F1 to open the Command Palette and search for `Dev Containers: Attach to Running Container`

After attach the container you may have to open the project folder manually.

## Start the network

Once the terminal is open, start the network

```
npm run network:start
```

The network is going to start in dev mode and the prompt will be left showing the logs, so don't close the prompt and open new ones to proceed with the following commands.

## Run integration tests

Now you can run integration tests with:

```
npm run test:e2e
```

## Verify changes in block browser and GraphQL

Navigate to [http://localhost:3010/blocks](http://localhost:3010/blocks) to see our block browser which allows you to see what's saved on your local GalaChain network.

Navigate to [http://localhost:3010/graphiql](http://localhost:3010/graphiql) to interact with GraphQL and execute queries.