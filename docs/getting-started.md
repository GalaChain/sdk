# Getting started

## Local Environment (Linux, MacOS, or Windows with WSL)

If you are using Windows with WSL don't forget to enable integration with WSL on Docker Desktop.

### Requirements

You need to have the following tools installed on your machine:
- Node.js 16+
- Docker and Docker Compose
- [jq](https://jqlang.github.io/jq/) and [yq](https://github.com/mikefarah/yq)

### 1. Install our CLI

```
npm i -g @gala-chain/cli
```

Check the CLI:

```
galachain --help
```

### 2. Initialize your project

```
galachain init <project-name>
```

It will create a sample project inside `<project-name>` directory.

Install all dependencies:

```
npm i
```

### 3. Start the network

```
npm run network:start
```

The network will start in hot-reload/watch mode, so leave the prompt with logs running and execute the following commands in a new prompt.

### 4. Run integration tests

Now you can run integration tests with:

```
npm run test:e2e
```

### 5. Verify changes in block browser and GraphQL

Navigate to [http://localhost:3010/blocks](http://localhost:3010/blocks) to see our block browser which allows you to see what's saved on your local GalaChain network.

Navigate to [http://localhost:3010/graphiql](http://localhost:3010/graphiql) to interact with GraphQL and execute queries.


### 6. Next steps

- [Iterate on your chaincode](chaincode-development.md)
- [Get familiar with GalaChain SDK](galachain.md)
- [Deploy chaincode to gc-testnet](chaincode-deployment.md)

---

## Using Dev Containers (Linux or MacOS)

### Requirements

- [VSCode](https://code.visualstudio.com/)
- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- Node.js
- Docker

### 1. Install our CLI

```
npm i -g @gala-games/chain-cli
```

Check the CLI:

```
galachain --help
```

### 2. Initialize your project

```
galachain init <project-name>
```

It will create a sample project inside `<project-name>` directory.

Open the directory on VSCode.

```
cd <project-name>
code .
```

### 3. Open in a Dev Container

While in VSCode, press F1 to open the Command Palette and search for `Dev Containers: Reopen in Container`

![remote-command-palette](./assets/remote-command-palette.png)

You can also click on the Remote Indicator in the status bar to get a list of the most common commands.

![remote-command-palette](./assets/remote-dev-status-bar.png)

### 4. Install dependencies and start network

Open a new prompt when in a Dev Conatiner and run the commands:

```
npm install
```

```
npm run network:start
```

The network will start in dev mode, so leave the prompt with logs running and execute the following commands in a new prompt.

### 5. Run integration tests

Now you can run integration tests with:

```
npm run test:e2e
```

### 6. Verify changes in block browser and GraphQL

Navigate to [http://localhost:3010/blocks](http://localhost:3010/blocks) to see our block browser which allows you to see what's saved on your local GalaChain network.

Navigate to [http://localhost:3010/graphiql](http://localhost:3010/graphiql) to interact with GraphQL and execute queries.

## Use Docker file + Dev Containers (Linux, MacOS or Windows)

### Requirements

- [VSCode](https://code.visualstudio.com/)
- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- Node.js
- Docker

### 1. Install our CLI

```
npm i -g @gala-games/chain-cli
```

Check the CLI:

```
galachain --help
```

### 2. Initialize your project

```
galachain init <project-name>
```

It will create a sample project inside `<project-name>` directory.

### 3. Docker file and Instructions

Navigate to the docker folder where you can find a Docker file and instructions about how to use it.

```
cd <project-name>/docker
```

Follow the steps on the `README.md` file.
