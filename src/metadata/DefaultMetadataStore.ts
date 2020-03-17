import {
  BaseMetadataStore,
  ClassMetadata,
  PropertyMetadata,
} from './BaseMetadataStore';
import { Class } from '../common/typings';
import reflect, { PropertyReflection } from 'tinspector';
import { FixtureOptions } from '../decorators/Fixture';
import { getEnumValues } from '../common/utils';

export class DefaultMetadataStore extends BaseMetadataStore {
  make(classType: Class): void {
    const metadata = reflect(classType);
    const classMetadata: ClassMetadata = {
      name: metadata.name,
      properties: metadata.properties
        .map(prop => this.makePropertyMetadata(prop)!)
        .filter(Boolean),
    };
    this.store[classType.name] = classMetadata;
  }

  private makePropertyMetadata(
    prop: PropertyReflection
  ): PropertyMetadata | null {
    const decorator = this.getFixtureDecorator(prop);
    const meta: Partial<PropertyMetadata> = {
      name: prop.name,
    };
    if (decorator) {
      if (typeof decorator === 'function') {
        meta.input = decorator.bind(decorator, require('faker'));
      } else if (typeof decorator === 'string') {
        meta.input = () => decorator;
      } else if (typeof decorator === 'object') {
        if (decorator.ignore) return null;
        meta.input = decorator.get;
        let inputType: any = decorator.type?.();
        if (inputType) {
          if (Array.isArray(inputType)) {
            inputType = inputType[0];
            meta.array = true;
            meta.min = decorator.min || 1;
            meta.max = decorator.max || 3;
          }
          if (!inputType.prototype) {
            throw new Error(
              `Only pass class names to "type" in @Fixture({ type: () => Foo})`
            );
          }
          meta.type = inputType.name;
        }
        if (decorator.enum) {
          meta.enum = true;
          meta.items = getEnumValues(decorator.enum);
        }
      }
    }
    console.log('prop :', prop);
    console.log('meta :', meta);
    if (!meta.type) {
      if (!prop.type) return null;
      else if (Array.isArray(prop.type)) {
        return null;
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
