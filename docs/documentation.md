## GalaChain SDK Documentation 

At the time of this writing (October 2024), the GalaChain SDK is using a combination of generated `TypeDoc` HTML, 
`class-validator-jsonschema` generated OpenAPI definitions, `mkdocs` (a Python-based command line tool).

This page aims to provide guidance on adding, maintaining, building, and locally-serving our documentation. 

### Overview

The `package.json` file in the root of the `galachain/sdk` monorepo contains `npm` commands use to generate `TypeDoc` builds of the various modules. `TypeDoc` works by reading a `tsconfig.json` file passed as an argument and determining the modules, included files, and builds from that configuration. `TypeDoc` fails if the TypeScript compiliation specified by the passed-in `tsconfig` fails. 

Currently, `TypeDoc` will output its generated content to `/docs/{name-of-module}-docs` directories. 

The `mkdocs.yml` file in the root of the  mono repo specifies various configurations for the `mkdocs` static site build. 

Every chaincode contract that extends `GalaContract` should have a method `GetContractAPI`. The output of this chaincode method can be used to construct an OpenAPI compatible API documentation page using tools like Swagger UI. 

### Getting Started 

To build, serve, and view documentation changes locally you will need to install the `mkdocs` tool and its dependencies used in this project. 

The `mkdocs` command line tool is Python-based. If you already have a Python development environment setup, you may choose to use a Python `virtualenv` using your existing tooling or environment. 

`pipx` is a tool that can be used to isolate Python environments, especially for command line tools. Always refer to the official `pipx` website for the most up-to-date installation instructions. 

The following can get `mkdocs` installed in a `pipx` managed virtual environment for use with this project. These commands have been tested on a Debian 12.x ARM64 Linux Virtual Machine in Sept/Oct 2024. If you would like to add details on setting up this tool for other environments, pull requests are welcome. 

```bash
sudo apt install pipx
pipx ensurepath
```

```bash
pipx install mkdocs

pipx runpip mkdocs install pymdown-extensions
pipx runpip mkdocs install mkdocs-material
pipx runpip mkdocs install mike
pipx runpip mkdocs install mkdocs-awesome-pages-plugin
```

Some Linux operating systems may come with a version of `mkdocs` pre-installed. If after running the above, the output of `which mkdocs` is something like `/usr/bin/mkdocs`, double check that your `pipx ensurepath` command has added `pipx` managed command line tools at the front of your `$PATH`. You may need to restart your shell session or execute `source $HOME/.bashrc`. If not, you may want to add a line to your `.bashrc` to ensure your path will prioritize the `pipx` installed version. 

```
# Created by `pipx` on 2024-09-11 14:53:00
export PATH="$HOME/.local/bin:$PATH"
```

Assuming your `mkdocs` installation is successful, you should be able to run the following in the root of the `galachain/sdk` monorepo to serve documentation locally:

```bash
mkdocs serve
```

```
INFO    -  [17:05:51] Serving on http://127.0.0.1:8000/GalaChain/sdk/
```

If you have not yet built `TypeDoc` HTML pages locally, you will want to do so with applicable commands detailed in `package.json` at the root of the mono repo. 
