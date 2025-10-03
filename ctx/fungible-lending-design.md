# GalaChain DeFi Lending Protocol Design

## Executive Summary

This document outlines the design for a decentralized finance (DeFi) lending protocol for fungible tokens on GalaChain. Unlike the existing NFT loan system (which operates like an "interlibrary loan" for digital assets), this new system enables peer-to-peer financial lending with interest, collateral, and automated risk management.

## Business Domain Analysis

### Existing NFT Loans = "Asset Lending"
- **Business model**: Temporary usage rights (museum/library paradigm)
- **Risk profile**: Low financial risk, reputational risk
- **Value exchange**: Access/utility, not capital
- **Stakeholders**: Asset owners, users/borrowers, optional registrars
- **Use cases**: Gaming guild asset sharing, digital art exhibitions

### Proposed Fungible Loans = "Financial Lending"
- **Business model**: Capital lending with yield generation
- **Risk profile**: High financial risk, market risk, counterparty risk
- **Value exchange**: Capital, interest, collateral
- **Stakeholders**: Lenders, borrowers, liquidators, oracles, protocol
- **Use cases**: DeFi lending, yield farming, liquidity provision

## Architectural Decision: Separate Module

**Recommendation**: Create a new `lending/` module separate from existing `loans/`

### Rationale
1. **Different Risk Models**: Financial lending requires sophisticated risk management
2. **Different Lifecycles**: Asset loans are simple state machines; financial loans need continuous monitoring
3. **Different Dependencies**: DeFi lending needs oracles, liquidation engines, interest calculations
4. **Different Regulatory Considerations**: Financial services may have different compliance requirements
5. **Different User Personas**: DeFi users vs. gaming/asset users

### Proposed Module Structure
```
chaincode/src/
├── loans/           # Existing NFT/asset lending
│   ├── offerLoan.ts
│   └── ...
└── lending/         # New DeFi fungible lending
    ├── core/
    │   ├── lendingOffer.ts
    │   ├── originateLoan.ts
    │   ├── repayLoan.ts
    │   └── liquidateLoan.ts
    ├── interest/
    │   ├── calculateInterest.ts
    │   └── compoundInterest.ts
    ├── collateral/
    │   ├── evaluateCollateral.ts
    │   ├── liquidationEngine.ts
    │   └── healthFactor.ts
    └── risk/
        ├── priceOracles.ts
        └── riskAssessment.ts
```

## Business Requirements

### BR-1: Lending Markets
- Users can create lending offers for any fungible token
- Define lending terms: principal, interest rate, duration, collateral requirements
- Support both open market and direct peer-to-peer lending
- Market discovery mechanisms for matching lenders and borrowers

### BR-2: Interest & Yield
- Compound interest calculation with configurable frequencies
- Competitive interest rate discovery through market dynamics
- Transparent yield calculation for lenders
- Support for both fixed and variable interest rates

### BR-3: Collateral Management
- Multi-token collateral support
- Configurable loan-to-value (LTV) ratios
- Over-collateralization requirements
- Real-time collateral valuation using price oracles

### BR-4: Risk Management
- Automated liquidation when health factors deteriorate
- Price oracle integration for accurate valuations
- Liquidation incentives for protocol sustainability
- Risk-based interest rate adjustments
- Grace periods and partial liquidation support

### BR-5: Protocol Economics
- Origination fees for loan creation
- Liquidation penalties and rewards
- Protocol revenue sharing mechanisms
- Governance token integration for protocol parameters

## Functional Requirements

### FR-1: Loan Origination
```gherkin
GIVEN a user wants to lend tokens
WHEN they create a lending offer with terms
THEN the system locks their principal tokens
AND creates a discoverable lending offer
AND validates all lending parameters
```

### FR-2: Loan Acceptance
```gherkin
GIVEN an active lending offer
WHEN a borrower provides adequate collateral
THEN the system originates the loan
AND transfers principal to borrower
AND begins interest accrual
AND records loan agreement on chain
```

### FR-3: Interest Accrual
```gherkin
GIVEN an active loan
WHEN time passes
THEN interest accrues according to loan terms
AND health factor updates with market conditions
AND system tracks total debt outstanding
```

### FR-4: Automated Liquidation
```gherkin
GIVEN a loan's health factor drops below threshold
WHEN liquidation conditions are met
THEN any user can trigger liquidation
AND collateral is sold to repay debt
AND liquidator receives incentive fee
AND remaining collateral returns to borrower
```

### FR-5: Loan Repayment
```gherkin
GIVEN an active loan with accrued interest
WHEN borrower repays principal plus interest
THEN collateral is unlocked and returned
AND loan is marked as completed
AND lender receives principal plus interest
```

## Technical Design

### Core Chain Objects

#### FungibleLendingOffer
```typescript
class FungibleLendingOffer extends ChainObject {
  // Loan terms
  principalToken: TokenClassKey;     // What's being lent
  principalQuantity: BigNumber;      // Amount to lend
  interestRate: BigNumber;           // APR as percentage
  duration: number;                  // Loan term in seconds
  
  // Collateral requirements  
  collateralToken: TokenClassKey;    // Required collateral token
  collateralRatio: BigNumber;        // LTV ratio (e.g., 150% = 1.5)
  
  // Parties
  lender: string;
  borrower?: string;                 // Optional for open offers
  
  // Status and lifecycle
  status: LendingStatus;
  created: number;
  expires: number;
  
  // Usage tracking
  uses: BigNumber;                   // How many times offer can be used
  usesSpent: BigNumber;             // Times already used
}
```

#### FungibleLoan
```typescript
class FungibleLoan extends ChainObject {
  // Loan identification
  lender: string;
  borrower: string;
  offerKey: string;                 // Reference to original offer
  
  // Financial tracking
  principalToken: TokenClassKey;
  principalAmount: BigNumber;
  interestRate: BigNumber;
  interestAccrued: BigNumber;
  lastInterestUpdate: number;
  
  // Collateral management
  collateralToken: TokenClassKey;
  collateralAmount: BigNumber;
  collateralRatio: BigNumber;
  
  // Risk management
  liquidationThreshold: BigNumber;
  healthFactor: BigNumber;           // Current collateral value / debt value
  
  // Lifecycle
  startTime: number;
  endTime: number;
  status: LendingStatus;
  
  // Liquidation tracking
  liquidationPrice?: BigNumber;      // Price at which liquidation occurs
  liquidatedBy?: string;            // Who triggered liquidation
}
```

### Key Enums

#### LendingStatus
```typescript
enum LendingStatus {
  Any = 0,
  OfferOpen = 1,
  OfferAccepted = 2,
  LoanActive = 3,
  LoanRepaid = 4,
  LoanDefaulted = 5,
  LoanLiquidated = 6,
  OfferCancelled = 7,
  OfferExpired = 8
}
```

### Core Methods

#### Lending Lifecycle
- `createLendingOffer()` - Create lending offer with terms
- `acceptLendingOffer()` - Borrower accepts, provides collateral
- `repayLoan()` - Repay principal + interest
- `liquidateLoan()` - Liquidate undercollateralized loans

#### Financial Calculations
- `calculateInterest()` - Ongoing interest accrual
- `updateHealthFactor()` - Monitor loan health
- `evaluateCollateral()` - Real-time collateral valuation

#### Risk Management  
- `checkLiquidationConditions()` - Determine if liquidation needed
- `executeLiquidation()` - Perform liquidation process
- `distributeLiquidationProceeds()` - Handle liquidation payouts

## Integration Points

### Reusable from Existing System
- User validation patterns
- Chain object storage patterns  
- Status enum concepts (adapted)
- Error handling patterns

### New Dependencies
- **Oracle System**: Price feeds for collateral valuation
- **Advanced Math**: Interest calculations, compound interest
- **Time-based Logic**: Continuous accrual calculations
- **Multi-token Operations**: Complex balance management

### Shared Infrastructure
- **Lock/Unlock**: Extended for collateral management
- **Allowance System**: For liquidation rights
- **Fee System**: Protocol and origination fees
- **User Management**: Existing user validation

## Risk Considerations

### Financial Risks
- Market volatility affecting collateral values
- Interest rate risk for fixed-rate loans
- Counterparty risk in peer-to-peer lending
- Liquidity risk during liquidation events

### Technical Risks
- Oracle price manipulation
- Smart contract vulnerabilities
- Liquidation mechanism failures
- Interest calculation errors

### Operational Risks
- Network congestion affecting liquidations
- Governance parameter changes
- Regulatory compliance requirements

## Success Metrics

### Protocol Metrics
- Total Value Locked (TVL)
- Number of active loans
- Liquidation success rate
- Interest rate spreads

### User Metrics
- Lender yield rates
- Borrower satisfaction
- Liquidation recovery rates
- Platform adoption

## Next Steps

1. **Detailed Technical Specification**: Define exact API interfaces and data structures
2. **Risk Parameter Research**: Determine appropriate LTV ratios, liquidation thresholds
3. **Oracle Integration**: Design price feed integration strategy
4. **Testing Strategy**: Comprehensive testing for financial calculations
5. **Security Audit**: Professional security review of lending logic
6. **Regulatory Review**: Compliance assessment for financial services

## Conclusion

The GalaChain DeFi Lending Protocol represents a significant expansion of the platform's capabilities, moving from simple asset sharing to sophisticated financial services. By implementing this as a separate module, we maintain the simplicity of existing systems while building a robust foundation for decentralized finance on GalaChain.

The protocol's success will depend on careful implementation of risk management, accurate financial calculations, and seamless integration with existing GalaChain infrastructure.