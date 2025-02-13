import { BigNumber } from "bignumber.js";
import { ValidationArguments, ValidationOptions, registerDecorator } from "class-validator";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

export function IsNonZeroBigNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isNonZeroBigNumber",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return value instanceof BigNumber && !value.isZero();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a BigNumber and cannot be zero.`;
        }
      }
    });
  };
}
