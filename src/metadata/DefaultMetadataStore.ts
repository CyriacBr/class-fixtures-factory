import {
  BaseMetadataStore,
  ClassMetadata,
  PropertyMetadata,
} from './BaseMetadataStore';
import { Class } from '../common/typings';
import reflect, { PropertyReflection } from 'tinspector';
import { FixtureOptions } from '../decorators/fixture';

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
    if (typeof decorator === 'function') {
      meta.input = decorator.bind(decorator, require('faker'));
    } else if (typeof decorator === 'string') {
      meta.input = () => decorator;
    } else if (typeof decorator === 'object') {
      if (decorator.ignore) return null;
      meta.input = decorator.get;
      const inputType = decorator.type?.();
      if (inputType) {
        if (Array.isArray(inputType)) {
          meta.array = true;
          if (inputType[0].prototype) {
            meta.type = inputType[0].name;
          } else {
            meta.type = 'enum';
            meta.enum = true;
          }
          meta.min = decorator.min || 1;
          meta.max = decorator.max || 3;
        } else {
          if ((inputType as any).prototype) {
            meta.type = (inputType as any).name;
          } else {
            meta.type = 'enum';
            meta.enum = true;
          }
        }
      }
    }
    console.log('meta :', meta);
    console.log('meta.input() :', meta.input?.());
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
    return meta as PropertyMetadata;
  }

  private getFixtureDecorator(prop: PropertyReflection): FixtureOptions {
    return prop.decorators.find(v => v.type === 'Fixture')?.value || null;
  }
}
