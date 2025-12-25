### Question


What's the best way to handle data validation in chaincode?


### Answer


GalaChain provides robust data validation through decorators and built-in validation hooks. Here's how to implement comprehensive validation:

1. Use class-validator decorators for property validation:
```typescript
import { ChainObject, IsNotEmpty, IsUserAlias, Min, Max } from '@gala-chain/api';

export class TokenMint extends ChainObject {
  @IsUserAlias()  // Validates user alias format
  @IsNotEmpty()   // Ensures field is not empty
  public readonly owner: UserAlias;

  @Min(0)         // Minimum value check
  @Max(1000000)   // Maximum value check
  public readonly quantity: BigNumber;

  @IsString()     // Type validation
  @Length(3, 50)  // String length validation
  public readonly tokenClass: string;

  @ValidateNested()  // Validates nested objects
  @Type(() => TokenMetadata)
  public readonly metadata?: TokenMetadata;
}
```

2. Implement custom validators for complex rules:
```typescript
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'customTokenRule', async: true })
class TokenRuleValidator implements ValidatorConstraintInterface {
  async validate(value: string, args: ValidationArguments) {
    // Custom validation logic
    return value.startsWith('GAME_') && value.length <= 32;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Token class must start with GAME_ and be <= 32 chars';
  }
}

export class GameToken extends ChainObject {
  @Validate(TokenRuleValidator)
  public readonly tokenClass: string;
}
```

3. Add validation in chaincode methods:
```typescript
@Submit()
async function mintToken(
  ctx: GalaChainContext,
  params: TokenMintParams
): Promise<TokenMint> {
  // Pre-validation checks
  if (!params.owner) {
    throw new ValidationError('Owner is required');
  }

  // Create and validate the mint object
  const mint = plainToClass(TokenMint, {
    ...params,
    timestamp: Date.now()
  });

  // This will throw if validation fails
  await validateOrReject(mint);

  // Additional business logic validation
  const existingBalance = await getBalance(ctx, params.owner);
  if (existingBalance.gt(MAX_ALLOWED)) {
    throw new ValidationError('Would exceed maximum allowed balance');
  }

  // Proceed with mint if all validation passes
  return putChainObject(ctx, mint);
}
```

4. Handle validation errors gracefully:
```typescript
try {
  await validateOrReject(tokenMint);
} catch (errors) {
  if (Array.isArray(errors)) {
    // Class-validator errors
    const messages = errors
      .map(err => Object.values(err.constraints))
      .flat();
    throw new ValidationError(`Invalid token mint: ${messages.join(', ')}`);
  }
  throw errors;
}
```

Key validation principles:
- Validate at the model level using decorators
- Add custom validators for complex rules
- Perform business logic validation in methods
- Always validate before state changes
- Handle validation errors consistently

Best practices:
- Use built-in validators when possible
- Keep validation rules close to data models
- Validate early in the request lifecycle
- Provide clear validation error messages
- Consider performance impact of async validators