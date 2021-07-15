import { BaseMetadataAdapter, PropertyMetadata } from '../../metadata';
import { getMetadataStorage, ID, Int, Float } from 'type-graphql';
import { GraphQLScalarType } from 'graphql';
import { FieldMetadata as BaseFieldMetadata } from 'type-graphql/dist/metadata/definitions';
import { Class } from '../..';
import faker from 'faker';
import { MetadataStorage } from 'type-graphql/dist/metadata/metadata-storage';

interface FieldMetadata extends BaseFieldMetadata {
  propertyName: string;
}

export class TypeGraphQLAdapter extends BaseMetadataAdapter<FieldMetadata> {
  private store!: MetadataStorage;

  makeOwnMetadata(classType: Class): FieldMetadata[] {
    const store = (this.store = getMetadataStorage());
    const objectType = store.objectTypes.find(v => v.target === classType);
    const fields = store.fields.filter(v => v.target === classType);
    if (objectType && objectType.interfaceClasses) {
      for (const interfaceClass of objectType.interfaceClasses) {
        fields.push(...store.fields.filter(v => v.target === interfaceClass));
      }
    }
    return fields.map(v => ({
      ...v,
      propertyName: v.name,
    }));
  }

  deduceMetadata(
    defaultProp: PropertyMetadata | undefined,
    ownProp: FieldMetadata
  ): PropertyMetadata | null {
    const prop: PropertyMetadata = {
      name: ownProp.propertyName,
      type: '',
      ...(defaultProp || {}),
    };

    const gqlType = ownProp.getType();
    prop.array = ownProp.typeOptions.array;
    prop.scalar = !prop.array;

    switch (gqlType) {
      case ID:
        return {
          ...prop,
          type: 'string',
          libraryInput: () => faker.random.uuid(),
        };
      case Int:
      case Number:
        return {
          ...prop,
          type: 'number',
        };
      case Float:
        return {
          ...prop,
          type: 'number',
          libraryInput: () =>
            faker.random.number({
              precision: 0.01,
            }),
        };
      case Boolean:
        return {
          ...prop,
          type: 'boolean',
        };
      case String:
        return {
          ...prop,
          type: 'string',
        };
      case Date:
        return {
          ...prop,
          type: 'Date',
        };
      default:
        prop.type = (gqlType as Function)?.name;
        prop.scalar = !prop.type;
        break;
    }

    if (gqlType instanceof GraphQLScalarType && !defaultProp?.type) {
      throw new Error(
        `Can't generate a value for custom TypeGraphQL scalar type "${gqlType.name}"`
      );
    }

    const isEnum = this.store.enums.some(
      v => JSON.stringify(v.enumObj) === JSON.stringify(gqlType)
    );
    if (isEnum) {
      return {
        ...prop,
        type: 'string',
        scalar: true,
        /**
         * Generate a random value within the string values of a registered enum
         * With gqlType as
         * {
         *  '0': 'UP',
         *  '1': 'DOWN',
         *  '2': 'LEFT',
         *  '3': 'RIGHT',
         *  UP: 0,
         *  DOWN: 1,
         *  LEFT: 2,
         *  RIGHT: 3
         *  }
         * generates a value between 'UP', 'DOWN', 'LEFT' and 'RIGHT
         */
        libraryInput: () =>
          faker.random.arrayElement(
            Object.entries(gqlType as Record<string, string | number>)
              .filter(([_, value]) => typeof value === 'string')
              .map(([_, value]) => value)
          ),
      };
    }

    if (!prop.type) {
      return null;
    }

    return prop;
  }
}
