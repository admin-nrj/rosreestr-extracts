import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';

/**
 * Validator constraint that checks if the DTO object:
 * 1. Is not an array
 * 2. Contains at least one property with a defined value
 */
@ValidatorConstraint({ name: 'isNotEmptyObject', async: false })
export class IsNotEmptyObjectConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object;

    // Check if the body is an array (reject arrays)
    if (Array.isArray(object)) {
      return false;
    }

    if (!object || typeof object !== 'object') {
      return false;
    }

    const keys = Object.keys(object);

    // Check if there's at least one defined property
    // Filter out undefined values (optional fields not sent in request)

    return keys.some((key) => object[key] !== undefined);
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object;

    if (Array.isArray(object)) {
      return 'Body must be an object, not an array';
    }

    if (!object || typeof object !== 'object') {
      return 'Body must be a valid object';
    }

    return 'Body must contain at least one field';
  }
}

/**
 * Property decorator that validates the entire DTO object has at least one field.
 * Apply this to a dummy property in your DTO.
 *
 * @param validationOptions - Optional validation options
 *
 * @example
 * ```typescript
 * export class UpdateOrderDto {
 *   @IsNotEmptyObject()
 *   private readonly _validateNotEmpty?: any;
 *
 *   @IsOptional()
 *   @IsString()
 *   name?: string;
 * }
 * ```
 */
export function IsNotEmptyObject(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotEmptyObject',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsNotEmptyObjectConstraint,
    });
  };
}
