# Getting started

To write application chaincode for GalaChain, a prospective developer will want at least some familiarity with TypeScript and general experience working with [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript), [Node.js](https://nodejs.org/), and the wider [npm](https://www.npmjs.com/) ecosystem. 

A broad understanding of working with the command line, backend web application development, and asynchronous programming will also be useful for all chaincode developers.

We aim to be beginner-friendly. Additional documentation and onboarding resources are forth coming, and community assistance is available in the [GalaChain Discord Server](https://discord.gg/galachain). We are a small team and this is an ambitious project. 

GalaChain runs on [Hyperledger Fabric](https://www.lfdecentralizedtrust.org/projects/fabric). 

A running network is generally comprised of many separate services: Peers, orderers, certicate authorities, etc. 

As such, most development environments rely on [containerization](https://en.wikipedia.org/wiki/Containerization_(computing)) using [Docker](https://en.wikipedia.org/wiki/Docker_(software)). 

Developers experienced with containers may choose to work directly with our [Docker image](#use-docker-image-linux-macos-or-windows) or via a VSCode [Dev Container](#using-dev-containers-linux-or-macos) as documented below. 

Primarily, we offer detailed instructions for setting up a [Local Development Environment](#local-development-environment-linux-macos-or-windows-with-wsl) on various operating systems. 

Additionally, our [Test Net Environment](./from-zero-to-deployment.md) is under active development. The public test net can provide a way for developers to get up and running without needing to run a local Hyperledger Fabric network at all. 

* [Local Development Environment](#local-development-environment-linux-macos-or-windows-with-wsl)
* [Test Net Environment Deployment](./from-zero-to-deployment.md)
* [GalaChain Docker image](#use-docker-image-linux-macos-or-windows)
* [Dev Container](#using-dev-containers-linux-or-macos)

Common issues encountered during development environment setup are collected on our [Troubleshooting](./troubleshooting.md) page. 


## Local Development Environment (Linux, MacOS, or Windows with WSL)

### Prerequisite Requirements

You will need to have the following tools installed on your machine:

- Node.js 18+
- Docker and Docker Compose
- [jq](https://jqlang.github.io/jq/download/) and [yq](https://github.com/mikefarah/yq)

#### Linux

[Install Docker Engine](https://docs.docker.com/engine/install/) following the instructions for your preferred Linux Distribution.

Follow the [Linux post-installation steps for Docker Engine](https://docs.docker.com/engine/install/linux-postinstall/).

Install Node.js using [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating), the Node Version Manager. After [verifying the installation](https://github.com/nvm-sh/nvm?tab=readme-ov-file#verify-installation), install Node.js v18 using:

```bash
nvm install 18
```

Follow the linked installation instructions to install [jq](https://jqlang.github.io/jq/download/) and [yq](https://github.com/mikefarah/yq) on your system.

#### MacOS

##### Containers on MacOS

Consider using [homebrew](https://brew.sh/) to install and manage prerequisite software.

GalaChain requires a Docker runtime to compose the underlying Hyperledger Fabric network. 

Install [Docker Desktop](https://docs.docker.com/get-started/get-docker/), either using the provided graphical installer or via homebrew: 

```bash
brew install --cask --appdir="/Applications" docker`
```

If preferred, choose an alternative to Docker Desktop such as [colima](https://github.com/abiosoft/colima), [Orbstack](https://orbstack.dev/), a full Linux Virtual Machine ([instructions](#linux-virtual-machines-on-macos) below), or a direct command-line install of Docker Engine using a tool like homebrew. 

Specifics for most of these options are currently outside the scope of this document, but one important note is that Colima's default limit of 2GB of memory on Docker's linux/arm64 VM is insufficient for a running GalaChain network. 

It is important to be aware that running Docker on macOS always involves using a linux/arm64 Virtual Machine under the hood, with only the Docker CLI running natively within macOS. 

Be advised that mixing virtualization technologies, such as running Docker Desktop or Colima while using Virtual Machines managed by UTM or VMware Fusion, can cause unpredictable problems. It's best to either go with a containerization option or full virtualization, not both. 

Install Node.js using [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating), the Node Version Manager. After [verifying the installation](https://github.com/nvm-sh/nvm?tab=readme-ov-file#verify-installation), install Node.js v18 using:

```bash
nvm install 18
```

Follow the linked installation instructions to install [jq](https://jqlang.github.io/jq/download/) and [yq](https://github.com/mikefarah/yq) on your system.

##### Linux Virtual Machines on MacOS

Rather than relying on tools like Docker Desktop or Colima to abstact away the details of the [Virtual Machine](https://en.wikipedia.org/wiki/Virtual_machine) used to emulate Linux on a MacOS host, you might prefer to simply run Docker in a dedicated Linux VM. 

[UTM](https://docs.getutm.app/installation/macos/) is a virtual machine host for iOS and macOS based of QEMU. You can support the developers by installing it from the Mac App Store, download it for free from Github, or use [homebrew](https://formulae.brew.sh/cask/utm). 

While UTM can emulate a different CPU architecture than present on the host for guest operating systems, performance will be significantly improved if the Host and Guest CPU architectures match: i.e. ARM64 Linux for Apple Silicon hosts, and x86_64 Linux for Intel Macs. 

UTM provides [guides](https://docs.getutm.app/guides/guides/) for installing several different guest operating systems using their software. 

For GalaChain development, we recommend using a Linux ARM64 image when working on an Apple Silicon Mac. ARM64 images are currently available for Debian, Ubuntu, or Fedora. Intel Macs can use x86_64 Linux Virtual Machines.

Once a guest operating system is up and running, follow the [`Linux`](#linux) instructions above to setup prerequisite software within your guest environment. 

An important consideration when using a Linux ARM64 Virtual Machine concerns the available OS/Arch builds of Docker images downloadable through Docker Hub and other container registries. 

This is slowly becoming a non-issue, but there may be times where you see an error message such as:

```
WARNING: The requested image's platform (linux/amd64) does not match the
 detected host platform (linux/arm64/v8) and no specific platform 
 was requested.
```

This occurs when an Docker image is provided for the linux/amd64 architecture, but not the linux/arm64 architecture. An example would be the Hyperledger Fabric Certificate Authority (fabric-ca) image for version 1.5.5. 

Advanced users can work around these issues by manually building their own image locally compiled to their specific architecture.


#### Windows

Microsoft offers the [Windows Sub System for Linux (WSL)](https://learn.microsoft.com/en-us/windows/wsl/about) which greatly faciliates web application and cross-platform development on Microsoft Windows 10 and 11. 

Install [Docker Desktop](https://docs.docker.com/get-started/get-docker/).

> If you are using Windows with WSL don't forget to enable integration with WSL on Docker Desktop.

And see [How to use Windows with WSL](./windows-wsl.md) in order to get up and running for local GalaChain development. 

Similar to how it is detailed above in the [MacOS](#macos) section, virtualization is an alternative to WSL on Windows hosts. 

Interested users can check out Microsoft's [introduction to Hyper-V](https://learn.microsoft.com/en-us/virtualization/hyper-v-on-windows/about/) or explore third party offerings that enable Linux operating system virtualization on Windows. 


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

## Use Docker image (Linux, MacOS or Windows)

### Requirements

- Docker Desktop or Docker CLI.
- [Optional] VS Code with [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension.

### 1. Run the Docker image

```
docker run --privileged -d -p 3010:3010 -it --name <container_name> ghcr.io/galachain/sdk:latest
```

Make sure the container is up and running.
The Docker image initializes a new project with the name `chaincode-template` by default.

### 2. Open the running container

#### 2.1 Open the container with bash

```
docker exec -ti <container_name> /bin/bash
```

#### 2.2 Open the container with VSCode (Requires VSCode and Dev Containers Extension)

Open VSCode and press F1 to open the Command Palette and search for `Dev Containers: Attach to Running Container`

After attach the container you may have to open the project folder manually.

### 3. Start the network

Once the terminal is open, start the network with:

```
npm run network:start
```

The network is going to start in dev mode and the prompt will be left showing the logs, so don't close the prompt and open new ones to proceed with the following commands.

### 4. Run integration tests

Now you can run integration tests with:

```
npm run test:e2e
```

### 5. Verify changes in block browser and GraphQL

Navigate to [http://localhost:3010/blocks](http://localhost:3010/blocks) to see our block browser which allows you to see what's saved on your local GalaChain network.

Navigate to [http://localhost:3010/graphiql](http://localhost:3010/graphiql) to interact with GraphQL and execute queries.

---

## Using Dev Containers (Linux or MacOS)

### Requirements

- [VSCode](https://code.visualstudio.com/)
- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- Node.js
- Docker

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

---

