### Question


How do I implement role-based access control (RBAC) in chaincode?


### Answer


Role-based access control in GalaChain is implemented through the platform's built-in RBAC system, available beginning with version 2.0+ of the SDK. Here's how to use it effectively:

1. Available Role Checks:
```typescript
class GameContract extends Contract {
  @Submit()
  async adminOperation(ctx: GalaChainContext): Promise<void> {
    // Single role check
    if (!ctx.callingUser.hasRole('ADMIN')) {
      throw new Error('Admin access required');
    }
    
    // Multiple role check (any of these roles)
    if (!ctx.callingUser.hasAnyRole(['ADMIN', 'MODERATOR'])) {
      throw new Error('Admin or moderator access required');
    }
    
    // Organization membership check
    if (!ctx.callingUser.isMemberOf('GameStudio')) {
      throw new Error('Must be GameStudio member');
    }
  }
}
```

2. Common Role Patterns:
```typescript
class TokenContract extends Contract {
  // Use decorators to enforce role requirements
  @Submit()
  @RequireRole('MINTER')
  async mintTokens(
    ctx: GalaChainContext,
    params: { amount: number }
  ): Promise<void> {
    // Function body - role already verified by decorator
  }

  // Combine multiple role checks for complex permissions
  @Submit()
  async transferTokens(
    ctx: GalaChainContext,
    params: { to: string, amount: number }
  ): Promise<void> {
    const isAdmin = ctx.callingUser.hasRole('ADMIN');
    const isOwner = ctx.callingUser.id === params.to;
    
    if (!isAdmin && !isOwner) {
      throw new Error('Insufficient permissions');
    }
  }
}
```

3. Best Practices:
   - Check roles at the beginning of functions
   - Use descriptive role names that reflect responsibilities
   - Consider implementing custom role decorators for common patterns
   - Document role requirements in function comments
   - Keep role assignments minimal (principle of least privilege)

4. Important Notes:
   - Roles are managed through the GalaChain admin interface
   - Role assignments are immutable on chain
   - Role checks are performed automatically by the platform
   - Consider using role hierarchies for complex permissions

Remember: RBAC is a critical security feature. Always verify that role checks are working as expected in your test environment before deploying to production.