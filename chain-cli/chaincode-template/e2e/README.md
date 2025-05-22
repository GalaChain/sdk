# Chaincode-template E2E Tests

To run these tests, first build the dependent packages (`@gala-chain/api` etc):

```bash
../../npm-pack-and-replace.sh --skipConfirmation
```

Then to run the tests:

```bash
npm run network:recreate
npm run test:e2e
```

(It is necessary to create a fresh network for each run of the tests)
