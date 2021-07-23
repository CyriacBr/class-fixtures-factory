import { BaseMetadataAdapter, PropertyMetadata } from '../../metadata';
import { getMetadataStorage, ID, Int, Float } from 'type-graphql';
import { GraphQLScalarType } from 'graphql';
import { FieldMetadata as BaseFieldMetadata } from 'type-graphql/dist/metadata/definitions';
import { Class } from '../..';
import faker from 'faker';
import { MetadataStorage } from 'type-graphql/dist/metadata/metadata-storage';
import { FactoryHooks } from '../../FactoryHooks';

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
    reflectProp: Readonly<PropertyMetadata> | undefined,
    ownProp: Readonly<FieldMetadata>,
    propHooks: FactoryHooks
  ): Partial<PropertyMetadata> {
    const prop: Partial<PropertyMetadata> = {
      name: ownProp.propertyName,
    };

    const gqlType = ownProp.getType();
    prop.array = ownProp.typeOptions.array;
    prop.scalar = !prop.array;

    switch (gqlType) {
      case ID:
        propHooks.setOnGenerateScalar(() => faker.random.uuid());
        return {
          ...prop,
          type: 'string',
        };
      case Int:
      case Number:
        return {
          ...prop,
          type: 'number',
        };
      case Float:
        propHooks.setOnGenerateScalar(() =>
          faker.random.number({
            precision: 0.01,
          })
        );
        return {
          ...prop,
          type: 'number',
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

    if (gqlType instanceof GraphQLScalarType && !reflectProp?.type) {
      throw new Error(
        `Can't generate a value for custom TypeGraphQL scalar type "${gqlType.name}"`
      );
    }

    const isEnum = this.store.enums.some(
      v => JSON.stringify(v.enumObj) === JSON.stringify(gqlType)
    );
    if (isEnum) {
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
      propHooks.setOnGenerateScalar(() =>
        faker.random.arrayElement(
          Object.entries(gqlType as Record<string, string | number>)
            .filter(([_, value]) => typeof value === 'string')
            .map(([_, value]) => value)
        )
      );
      return {
        ...prop,
        type: 'string',
        scalar: true,
      };
    }

    return prop;
  }
}
