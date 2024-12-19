# Troubleshooting

## Docker Desktop on Windows

#### If you are using Windows with WSL don't forget to enable integration with WSL on Docker Desktop.
```
Docker Desktop > Settins > Resources > WSL Integration
```

#### Docker: image operating system "linux" cannot be used on this platform: operating system is not supported.

Some versions of the Docker Desktop for Windows have a bug that prevents the use of Linux images. If you are facing this issue, you can use the WSL2 backend to run Docker. To do so, go to Docker Desktop > Settings > General and select WSL2 as the default backend.

#### Docker: "no matching manifest for windows/amd64 in the manifest list entries".

To bypass this issue you can run the Docker daemon in experimental mode:

```
Docker Desktop > Settins > Docker Engine > Edit the Docker daemon file > Set the "experimental": true > Apply & Restart
```

## Docker

#### Docker: Error response from daemon: Conflict. The container name "/<container_name>" is already in use by container "<container_id>". 

You have to remove (or rename) that container to be able to reuse that name.

## WSL

#### ./fablo-target/fabric-config/configtx.yaml: no such file or directory

Make sure you are running it as a administrator of the cmd or powershell.

#### docker: Got permission denied

If you get a `docker: Got permission denied` error when running npm run network:start or npm run network:up, you may need to enable the configuration:
 ```
Docker Desktop > Settins > General > Expose daemon on tcp://localhost:2375 without TLS
```
If it still doesn't work, you can try use the WSL Ubuntu-20.04 distribution to run the network.