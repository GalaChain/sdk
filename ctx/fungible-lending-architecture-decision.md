# Fungible Token Lending - Architecture Decision Record

**Decision Date**: 2025-01-26  
**Status**: Decided  
**Deciders**: Technical Architecture Team  

## Context and Problem Statement

We need to determine the appropriate repository location for implementing fungible token lending functionality within the GalaChain ecosystem. Two viable options exist:

1. **galachain-sdk** (core SDK repository) - alongside existing primitives
2. **dex repository** - alongside existing DeFi trading functionality

This decision impacts development workflow, dependency management, feature scope, and long-term architectural evolution.

## Decision Drivers

- **Separation of Concerns**: Clean architectural boundaries between business domains
- **Reusability**: Availability as a primitive for multiple use cases
- **Dependency Management**: Natural dependency flow and version management
- **Development Velocity**: Faster implementation with fewer cross-repo dependencies
- **Future Integration**: Clear path for advanced DeFi features

## Considered Options

### Option 1: Implement in galachain-sdk (Core SDK)

**Pros:**
- Lending becomes a reusable primitive available to all applications
- Natural evolution from existing NFT `loans/` module
- Clean dependency direction (DEX → Core SDK)
- Faster initial implementation (no cross-repo coordination)
- Consistent with existing architectural patterns
- Broader applicability beyond DeFi use cases

**Cons:**
- May require future refactoring for advanced DEX integration
- Could increase core SDK complexity
- Potential for feature scope creep

### Option 2: Implement in DEX Repository

**Pros:**
- Tight integration with existing DeFi infrastructure
- Access to sophisticated trading and liquidation mechanisms
- Shared risk management and oracle systems
- Natural fit for pool-based lending models

**Cons:**
- Limited reusability outside DeFi context
- Complex dependency management across repositories
- Slower initial development due to cross-repo coordination
- DEX-specific implementation may not serve broader use cases

## Repository Analysis

### DEX Repository Current Scope
**Analysis Date**: 2025-01-26

**Core Functionality:**
- Uniswap V3-style concentrated liquidity DEX
- Pool creation and management (`DexV3Pool`)
- Liquidity provision and removal (`addLiquidity`, `burn`)
- Token swaps with complex pricing algorithms
- Limit order system (`DexLimitOrder`, `placeLimitOrder`)
- Fee collection and protocol revenue (`collectProtocolFees`)
- Position management and transfers (`DexPositionData`)

**Architecture:**
- Depends on galachain-sdk core primitives (`@gala-chain/api` ~2.3.4)
- Sophisticated mathematical libraries for tick-based pricing
- Advanced position and liquidity management systems

**Lending-Related Infrastructure:**
- **None identified** - No existing lending, borrowing, or collateral management
- No interest calculation systems
- No credit risk assessment tools
- No long-term loan tracking mechanisms

### GalaChain SDK Current Scope

**Relevant Existing Modules:**
- `loans/` - NFT-based asset lending (library loan model)
- `balances/` - Token balance management 
- `allowances/` - Permission and quota systems
- `locks/` - Token locking mechanisms
- `oracle/` - Price feed and assertion systems
- `fees/` - Protocol fee management

**Architectural Patterns:**
- Module-based organization by business domain
- Consistent error handling and validation patterns
- Reusable primitives across multiple contracts
- Clear separation between API types and chaincode logic

## Decision

**Selected Option**: Implement fungible token lending in **galachain-sdk** (Core SDK)

## Rationale

### Primary Factors

1. **Business Domain Separation**
   - Lending is fundamentally a credit/time-based business domain
   - Trading is fundamentally a market/exchange business domain
   - Different risk models, regulatory considerations, and user personas

2. **Architectural Precedent**
   - Existing NFT `loans/` module establishes lending as a core primitive
   - Natural evolution: `loans/` (NFTs) → `lending/` (fungibles)
   - Maintains consistency with established patterns

3. **Dependency Architecture**
   - Core SDK provides primitives that higher-level applications consume
   - DEX already depends on core SDK for fundamental operations
   - Placing lending in core enables natural dependency flow: DEX → Lending → Core Primitives

4. **Reusability and Scope**
   - Lending has applications beyond DeFi trading:
     - Gaming economies (guild lending, asset financing)
     - Supply chain finance
     - Institutional credit facilities
     - Cross-application liquidity provision
   - Core primitives should serve the broadest possible use case spectrum

5. **Implementation Velocity**
   - Single repository reduces coordination overhead
   - Access to existing testing and deployment infrastructure
   - Consistent versioning and dependency management

### Future Integration Strategy

**Phase 1: Core Implementation** (galachain-sdk)
- Basic lending primitives (offer, accept, repay)
- Interest calculation engines
- Collateral management systems
- Simple liquidation mechanisms (direct token transfers)

**Phase 2: DEX Integration** (dex repository)
- Advanced liquidation engine using DEX trading infrastructure
- Market-driven interest rate oracles
- Lending pool liquidity provision
- Cross-protocol yield optimization

**Integration Points:**
- DEX can implement `LiquidationEngine` interface using trading mechanisms
- DEX can provide market-based interest rate feeds
- Lending pools can serve as liquidity sources for DEX operations

## Implementation Implications

### Module Structure
```
chaincode/src/
├── loans/           # Existing NFT asset lending
├── lending/         # New fungible token lending
│   ├── core/        # Basic lending operations
│   ├── interest/    # Interest calculation
│   ├── collateral/  # Collateral management
│   └── risk/        # Risk assessment
```

### API Organization
```
chain-api/src/types/
├── loan.dtos.ts     # Existing NFT loan DTOs
├── lending.ts       # New fungible lending chain objects
├── lending.dtos.ts  # New fungible lending DTOs
└── LendingError.ts  # Lending-specific errors
```

### Dependency Management
- Core lending depends only on existing galachain-sdk primitives
- DEX repository can optionally depend on lending primitives
- Clear interface definitions enable pluggable implementations

## Risks and Mitigation

### Risk: Feature Scope Creep
**Mitigation**: Clear module boundaries and well-defined interfaces

### Risk: Performance Impact on Core SDK
**Mitigation**: Comprehensive testing and performance benchmarking

### Risk: Complex DEX Integration
**Mitigation**: Design clear integration interfaces from the start

### Risk: Maintenance Overhead
**Mitigation**: Consistent patterns with existing modules, thorough documentation

## Success Criteria

### Technical Success
- [ ] Lending module follows established galachain-sdk patterns
- [ ] Clean separation from existing loans module
- [ ] Performance meets or exceeds existing module benchmarks
- [ ] Integration interfaces support future DEX enhancement

### Business Success
- [ ] Lending primitives are reusable across multiple applications
- [ ] Implementation timeline meets project requirements
- [ ] Future DEX integration path is validated

### Architectural Success
- [ ] Dependency relationships remain clean and logical
- [ ] Module boundaries are well-defined and maintainable
- [ ] Decision supports long-term platform evolution

## References

- [Fungible Lending Design Document](./fungible-lending-design.md)
- [Fungible Lending Implementation Plan](./fungible-lending-implementation-plan.md)
- GalaChain SDK Architecture Patterns
- DEX Repository Analysis (ctx/dex/)

## Follow-up Actions

1. Update implementation plan to reflect core SDK location
2. Define integration interfaces for future DEX connectivity
3. Create module structure in galachain-sdk
4. Establish testing strategy aligned with core SDK patterns
5. Plan future DEX integration roadmap

---

*This Architecture Decision Record captures the rationale and context for implementing fungible token lending in the core galachain-sdk repository rather than the separate DEX repository. The decision prioritizes reusability, architectural consistency, and development velocity while maintaining clear paths for future advanced integrations.*