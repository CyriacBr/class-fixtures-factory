import {
  BaseMetadataStore,
  ClassMetadata,
  PropertyMetadata,
} from './BaseMetadataStore';
import { Class } from '../common/typings';
import reflect, { PropertyReflection } from 'tinspector';
import { FixtureOptions } from '../decorators/Fixture';
import { getEnumValues } from '../common/utils';
import { ClassValidatorAdapter } from './ClassValidatorAdapter';

export class DefaultMetadataStore extends BaseMetadataStore {
  private cvAdapter = new ClassValidatorAdapter();

  constructor(private readonly acceptPartialResult = false) {
    super();
  }
  /**
   * Make type metadata for a class
   * @param classType
   */
  make(classType: Class): ClassMetadata {
    const rMetadata = reflect(classType);
    const cvMetadata = this.cvAdapter.extractMedatada(classType);

    let properties = rMetadata.properties
      .map(prop => this.makePropertyMetadata(prop)!)
      .filter(Boolean);
    for (const cvMeta of cvMetadata) {
      let existing = properties.find(prop => prop.name === cvMeta.propertyName);
      const deduced = this.cvAdapter.makePropertyMetadata(
        cvMeta,
        existing
      ) as PropertyMetadata;
      if (existing) {
        properties = properties.map(prop =>
          prop.name === cvMeta.propertyName ? deduced : existing!
        );
      } else {
        properties.push(deduced);
      }
    }

    const classMetadata: ClassMetadata = {
      name: rMetadata.name,
      properties: properties.filter(Boolean),
    };
    return (this.store[classType.name] = classMetadata);
  }

  private makePropertyMetadata(
    prop: PropertyReflection
  ): PropertyMetadata | null {
    const decorator = this.getFixtureDecorator(prop);
    const meta: Partial<PropertyMetadata> = {
      name: prop.name,
      scalar: prop.typeClassification === 'Primitive',
    };
    if (decorator) {
      if (typeof decorator === 'function') {
        meta.input = decorator.bind(decorator, require('faker'));
      } else if (typeof decorator === 'string') {
        meta.input = () => decorator;
      } else if (typeof decorator === 'object') {
        if (decorator.ignore) return null;
        meta.input = decorator.get;
        meta.min = decorator.min || 1;
        meta.max = decorator.max || 3;
        let inputType: any = decorator.type?.();
        if (inputType) {
          if (Array.isArray(inputType)) {
            inputType = inputType[0];
            meta.array = true;
          }
          if (!inputType.prototype) {
            throw new Error(
              `Only pass class names to "type" in @Fixture({ type: () => Foo}) for "${meta.name}"`
            );
          }
          const { name } = inputType;
          if (!['string', 'number', 'boolean'].includes(name.toLowerCase())) {
            meta.type = name;
          } else {
            meta.type = name.toLowerCase();
          }
        }
        if (decorator.enum) {
          meta.enum = true;
          meta.items = getEnumValues(decorator.enum);
        }
      }
    }
    if (!meta.type) {
      if (!prop.type) {
        if (this.acceptPartialResult) {
          return meta as PropertyMetadata;
        }
      } else if (Array.isArray(prop.type)) {
        throw new Error(
          `The type of "${meta.name}" seems to be an array. Use @Fixture({ type: () => Foo })`
        );
      } else if (prop.type instanceof Function) {
        const { name } = prop.type as Function;
        if (!['string', 'number', 'boolean'].includes(name.toLowerCase())) {
          meta.type = name;
        } else {
          meta.type = name.toLowerCase();
        }
      }
    }
    if (!meta.type) {
      throw new Error(
        `Couldn't extract the type of "${meta.name}". Use @Fixture({ type: () => Foo })`
      );
    }
    return meta as PropertyMetadata;
  }

  private getFixtureDecorator(prop: PropertyReflection): FixtureOptions {
    return prop.decorators.find(v => v.type === 'Fixture')?.value || null;
  }
}
