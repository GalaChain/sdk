# Using Windows with WSL

## How to use GalaChain with Windows Subsystem for Linux (WSL)

### 1. Install Docker Desktop

Download and install Docker Desktop from the official website: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

**If you already have Docker Desktop installed, make sure to update it to the latest version.**

### 2. Install WSL 2 and a Ubuntu distribution

Follow the official guide to install WSL 2: [https://docs.microsoft.com/en-us/windows/wsl/install](https://docs.microsoft.com/en-us/windows/wsl/install)

Here is a short video from Microsoft about how to install WSL 2 and how to prepare it to build Node.js applications:
<iframe width="560" height="315" src="https://www.youtube.com/embed/lOXatmtBb88?si=tVmp-Jd8Nc-Mm6aS" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

### 3. Enable WSL integration on Docker Desktop

Open Docker Desktop and go to `Settings` > `Resources` > `WSL Integration` and enable the integration with your WSL distribution.

![remote-command-palette](./assets/wsl-integration.png)

### 4. Install dependencies and start network

1. Use the [WSL extension on VSCode](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) to connect to your WSL distribution.
2. Install Node Version Manager (NVM) on your WSL distribution: https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl#install-nvm-nodejs-and-npm
3. Install `yq` and `jq` on your WSL distribution:
    ```bash
    sudo snap install yq jq
    ```
4. At this point your WSL environment should be ready to use GalaChain. Follow the instructions on the [Getting Started](./getting-started.md) guide to install the CLI and initialize your project.

