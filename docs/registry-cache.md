# Using the local registry cache

To save on bandwidth and to improve everyone's downloading speed and development experience we are asking everyone to update their Docker and NPM config to prioritize using a cache setup on our local network. If you have questions how a pull through cache works you can [read more here](https://docs.docker.com/docker-hub/mirror/#how-does-it-work).

Below are instructions, NPM is the same on all environments but docker will be different per OS. 

## NPM

To use the local registry just run the below command.

```sh
    npm set registry http://172.23.0.79:4873

```

To remove the registry after the hackathon run this.

```sh
    npm config delete registry http://172.23.0.79:4873

```

## Docker

### 1. Openining the config file.

### Windows

```
C:\Users\<YourName>\.docker\daemon.json
```

### Mac

```
~/.docker/config.json
```

### Linux

```sh
sudo nano /etc/docker/daemon.json
```

## 2. Change to make

```json
{
  "registry-mirrors": ["http://172.23.0.79:5000"]
}
```

## 3. Restarting Docker

### Windows/Mac

End the process and close the program, then start it back up.

### Linux

```sh
sudo systemctl restart docker
```
