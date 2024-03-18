## Experimental! Deploy your chaincode

For the first time we're able to provide you with the ability to deploy chaincode and make it public. This is an experimental feature, there might be some glitches, and at some point all the data will be probably removed.

### How to deploy:

#### 1 Build and publish your chaincode as a docker image in public repo (for instance DockerHub, GitHub registry or GitLab registry). Remember to `docker login` before pushing.

   Sample for DockerHub (It uses the [ttl.sh](https://github.com/replicatedhq/ttl.sh) to make it available for 1 day):

   ````
   docker build --push -t ttl.sh/<IMAGE_NAME>:1d .
   ````

   Provide us the image name (everything before the `:` character of full docker tag). In the sample above it is the content of `ttl.sh/<IMAGE_NAME>`.

#### 2 Provide us your secp **public** key for chaincode **admin**, and secp **public** keys for all **developers**.

   The keys are automatically generated when you initialize the project using `galachain init`, so you can find these keys in `keys/gc-admin-key.pub` and `keys/gc-dev-key.pub`.
   
   If you can't find the keys, you can generate them using the following commands:

   ```
   galachain keygen gc-admin-key
   galachain keygen gc-dev-key
   ```

   The above command creates a private keys in `./gc-admin-key` and `./gc-dev1-key`, and public keys in `./gc-key.pub`, `./gc-dev-key.pub`.  We need the content of `*.pub` files for chaincode admin user and for all developers who want to deploy. Keep **private** keys safe, they will be needed later.

#### 3 Once we register your public keys, you will be able to connect your chaincode with GalaChain. To do it, navigate to the root directory of your chaincode and call the following command, providing path to developer private key:

   ```
   galachain connect <path-to>/gc-dev-key
   ```

   You should see the message that confirms you are connected:

   ```
   You are now connected! Chaincode gc-<eth-addr-from-admin-pub-key>
   ```

#### 4 If your docker image is published, and your chaincode is connected, you can deploy it to our sandbox environment with the command:

   ```
   galachain deploy <docker-image-tag> <path-to>/gc-dev-key
   ```

   _Note: you need to provide docker image name and also the version part. If you used the `ttl.sh` example, the <docker-image-tag> should be something like `ttl.sh/<IMAGE_NAME>:1d`._

#### 5 You can check the status of your deployment with the command:

   ```
   galachain info <path-to>/gc-dev-key
   ```

   Once the status is `CC_DEPLOYED` you can visit the Swagger webpage: https://gateway.stage.galachain.com/docs/. You can find your chaincode (`gc-<eth-addr>`). If the version is still unknown (and you see `v?.?.?`), it means you may need to wait a couple of minutes till the chaincode is ready.

   Once it is ready, you can use the webpage to call chaincodes. It's good to start `PublicKeyContract/GetPublicKey` with empty object as request body. It should return the admin public key you provided before.