# Chaincode-template E2E Tests

To run these tests, first build dependency packages (`@gala-chain/api` etc):

```bash
../../npm-pack-and-replace.sh --skipConfirmation
```

Then to run the tests:

```bash
npm run network:recreate
# Switch to new terminal
npm run test:e2e
```

## Changes in dependent packages

If you make changes to the dependency packages, you must build them again (`../../npm-pack-and-replace.sh --skipConfirmation`), and then change some random line of code in `/chain-cli` (for example in `chain-cli/chaincode-template/src/cli.ts`) to trigger a hot reload before running the tests again.
