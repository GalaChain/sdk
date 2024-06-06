## GalaChain Connect

Connect is a library that gives developers capabilities comparable to ethers.js for allowing users to connect to and interact with GalaChain using wallets such as Metamask.

# Features (WIP)

Users can connect to the application using a MetaMask wallet

application can prompt users via MetaMask to sign dtos

library is able to provide the developer with endpoint documentation for the desired channel using the GetContractAPI endpoint

library allows the application to connect to a GalaChain API (ops or gateway) and send requests with signed dtos to it.

## Building

Run `nx build connect` to build the library.

## Running unit tests

Run `nx test connect` to execute the unit tests via [Jest](https://jestjs.io).

## Example client usage

A new GalachainConnectClient can be created and connected by instantiating a new client object:

> const client = new GalachainConnectClient();
> await client.connectToMetaMask();

PublicKeyClient and TokenClient can be instantiated with the GalachainConnectClient and the url as arguments:

> const publicKeyClient = new PublicKeyClient(client, url)
> const tokenClient = new TokenClient(client, url);
