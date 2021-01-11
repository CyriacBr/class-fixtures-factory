import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import { getFromContainer, MetadataStorage } from 'class-validator';
import faker from 'faker';
import { PropertyMetadata } from '.';
import { Class } from '..';

interface WorkingData {
  type?: 'number' | 'decimal' | 'date' | 'alpha' | 'alphanumeric' | 'array';
  min?: number | Date;
  max?: number | Date;
  case?: 'lower' | 'upper';
  options?: any;
}

export class ClassValidatorAdapter {
  private metadata: Record<string, ValidationMetadata[]> = {};

  extractMedatada(classType: Class) {
    const metadata = getFromContainer(
      MetadataStorage
    ).getTargetValidationMetadatas(classType, '');
    return (this.metadata[classType.name] = metadata);
  }

  makePropertyMetadata(
    cvMeta: ValidationMetadata,
    existingProp: PropertyMetadata | undefined
  ): PropertyMetadata | Partial<PropertyMetadata> | null {
    const prop: Partial<PropertyMetadata> = {
      name: cvMeta.propertyName,
      ...(existingProp || {}),
    };
    const data: WorkingData = {
      type: null as any,
      max: null as any,
      min: null as any,
    };

    switch (cvMeta.type) {
      case 'isBoolean': {
        return {
          ...prop,
          type: prop.type || 'boolean',
          input: () => faker.random.boolean(),
        } as PropertyMetadata;
      }
      case 'isDate': {
        data.type = 'date';
        break;
      }
      case 'isString': {
        data.type = 'alpha';
        break;
      }
      case 'isNumber':
      case 'isInt':
      case 'isNumberString': {
        data.type = 'number';
        break;
      }
      case 'isIn': {
        const items = cvMeta.constraints[0];
        return {
          ...prop,
          type: prop.type || 'any',
          input: () => faker.random.arrayElement(items),
        } as PropertyMetadata;
      }
      case 'equals':
        return {
          ...prop,
          type: prop.type || 'any',
          input: () => cvMeta.constraints[0],
        };
      case 'isEmpty':
        return {
          ...prop,
          type: prop.type || 'any',
          input: () => null,
        };
      case 'isPositive':
        data.type = 'number';
        data.min = 1;
        break;
      case 'isNegative':
        data.type = 'number';
        data.max = -1;
        break;
      case 'min': {
        const value = cvMeta.constraints[0];
        data.type = 'number';
        data.min = value;
        break;
      }
      case 'max': {
        const value = cvMeta.constraints[0];
        data.type = 'number';
        data.max = value;
        break;
      }
      case 'minDate': {
        const value = cvMeta.constraints[0];
        data.type = 'date';
        data.min = value;
        break;
      }
      case 'maxDate': {
        const value = cvMeta.constraints[0];
        data.type = 'date';
        data.max = value;
        break;
      }
      case 'contains': {
        const value = cvMeta.constraints[0];
        return {
          ...prop,
          type: prop.type || 'any',
          input: () => `${faker.random.word()}${value}${faker.random.word()}`,
        };
      }
      case 'isAlpha':
        data.type = 'alpha';
        break;
      case 'isAlphanumeric':
        data.type = 'alphanumeric';
        break;
      case 'isDecimal':
        data.options = cvMeta.constraints[0];
        data.type = 'decimal';
        break;
      case 'isEmail':
        return {
          ...prop,
          type: 'string',
          input: () => faker.internet.email(),
        };
      case 'isFqdn':
        return {
          ...prop,
          type: 'string',
          input: () => faker.internet.domainName(),
        };
      case 'isHexColor':
        return {
          ...prop,
          type: 'string',
          input: () => faker.internet.color(),
        };
      case 'isLowercase':
        data.type = 'alpha';
        data.case = 'lower';
        break;
      case 'isUppercase':
        data.type = 'alpha';
        data.case = 'upper';
        break;
      case 'length': {
        const [min, max] = cvMeta.constraints;
        data.min = min;
        data.max = max || 6;
        data.type = 'alpha';
        break;
      }
      case 'minLength': {
        const value = cvMeta.constraints[0];
        data.min = value;
        data.type = 'alpha';
        break;
      }
      case 'maxLength': {
        const value = cvMeta.constraints[0];
        data.max = value;
        data.type = 'alpha';
        break;
      }
      case 'arrayContains': {
        const value = cvMeta.constraints[0];
        return {
          ...prop,
          type: 'string',
          input: () => value,
        };
      }
      case 'arrayMinSize': {
        const value = cvMeta.constraints[0];
        data.type = 'array';
        data.min = value;
        break;
      }
      case 'arrayMaxSize': {
        const value = cvMeta.constraints[0];
        data.type = 'array';
        data.max = value;
        break;
      }
    }

    if (typeof data.max === 'number' && !data.min) {
      data.min = data.max - 1;
    } else if (typeof data.min === 'number' && !data.max) {
      data.max = data.min + 1;
    }
    if (
      typeof data.max === 'number' &&
      typeof data.min === 'number' &&
      data.min > data.max
    ) {
      data.max = data.min + 1;
    }

    switch (data.type) {
      case 'number': {
        const min = data.min as number;
        const max = data.max as number;
        const sign = max < 0 ? -1 : 1;
        let value =
          sign *
          faker.random.number({
            min: Math.abs(min || sign),
            max: Math.abs(max || 10000),
          });
        return {
          ...prop,
          type: 'number',
          input: () => value,
        };
      }
      case 'decimal': {
        const min = data.min as number;
        const max = data.max as number;
        const digits = Number(data.options.decimal_digits || '1');
        const sign = max < 0 ? -1 : 1;
        let value =
          sign *
          parseFloat(
            faker.finance.amount(
              Math.abs(min || sign),
              Math.abs(max || 10000),
              digits
            )
          );
        return {
          ...prop,
          type: 'number',
          input: () => value,
        };
      }
      case 'date': {
        const min = data.min as Date;
        const max = data.max as Date;
        let value: Date;
        if (min) {
          value = faker.date.between(min, max || faker.date.future(1, min));
        } else if (max) {
          value = faker.date.between(min || faker.date.past(1, max), max);
        } else {
          value = faker.date.recent();
        }
        return {
          ...prop,
          type: 'Date',
          input: () => value,
        };
      }
      case 'alpha': {
        const min = data.min as number;
        const max = data.max as number;
        const ln = faker.random.number({ min: min || 5, max: max || 10 });
        const value = faker.lorem
          .sentence(100)
          .substr(0, ln)
          [data.case === 'lower' ? 'toLowerCase' : 'toUpperCase']();
        return {
          ...prop,
          type: 'string',
          input: () => value,
        };
      }
      case 'alphanumeric': {
        const min = data.min as number;
        const max = data.max as number;
        const ln = faker.random.number({ min: min || 5, max: max || 10 });
        return {
          ...prop,
          type: 'string',
          input: () =>
            faker.random
              .alphaNumeric(ln)
              [data.case === 'lower' ? 'toLowerCase' : 'toUpperCase'](),
        };
      }
      case 'array': {
        if (!prop.type) {
          throw new Error(
            `The type of "${cvMeta.propertyName}" seems to be an array. Use @Fixture({ type: () => Foo })`
          );
        }
        return {
          ...prop,
          max: (data.max as number) || prop.max,
          min: (data.min as number) || prop.min,
        };
      }
    }

    if (!prop.type) {
      return null;
    }

    return prop;
  }
}
