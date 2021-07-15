import { Class } from '../common/typings';
import reflect, { PropertyReflection } from 'tinspector';
import { FixtureOptions } from '../decorators/Fixture';
import { getEnumValues } from '../common/utils';
import { BaseMetadataAdapter } from './BaseMetadataAdapter';

export interface ClassMetadata {
  name: string;
  properties: PropertyMetadata[];
}

export interface PropertyMetadata {
  name: string;
  type: string;
  scalar?: boolean;
  enum?: boolean;
  items?: any[];
  array?: boolean;
  ignore?: boolean;
  min?: number;
  max?: number;
  /**
   * A value that completely bypass everything and sets the generate value equals to its own
   */
  input?: (...args: any[]) => any;
  /**
   * An input provided by the internals or a provider to generate scalars
   */
  libraryInput?: (...args: any[]) => any;
  typeFromDecorator?: boolean;
}

export class MetadataStore {
  private static adapter: BaseMetadataAdapter;
  protected store: Record<string, ClassMetadata> = {};

  constructor(private readonly acceptPartialResult = false) {}

  static setAdapter(adapter: BaseMetadataAdapter) {
    MetadataStore.adapter = adapter;
  }

  /**
   * Retrieve the metadata of a given class from the store
   */
  get(classType: Class | string): ClassMetadata {
    const name = typeof classType === 'string' ? classType : classType.name;
    const value = this.store[name];
    if (!value) throw new Error(`Cannot find metadata for class "${name}"`);
    return value;
  }

  /**
   * Make type metadata for a class
   */
  make(classType: Class): ClassMetadata {
    const reflectMetadata = reflect(classType);
    const adapterMetadata = MetadataStore.adapter
      ? MetadataStore.adapter.makeOwnMetadata(classType)
      : [];

    const unknownTypes = new Set<string>();
    /**
     * First, get properties to generate from reflection
     */
    let properties = reflectMetadata.properties
      .map(prop => this.makePropertyMetadata(prop)!)
      .filter(Boolean);

    for (const reflectProp of properties) {
      if (reflectProp?.ignore || !!reflectProp?.input) continue;
      if (!reflectProp.type) {
        unknownTypes.add(reflectProp.name);
      }
    }

    /**
     * Merge with the properties made from the adapter
     * Basically the property from the adapter takes precedence unless
     * the Fixture decorator is used to ignore the property or a force a given value
     */
    for (const adapterMeta of adapterMetadata) {
      const defaultProp = properties.find(
        prop => prop.name === adapterMeta.propertyName
      );
      if (defaultProp?.ignore || !!defaultProp?.input) continue;
      const deducedProp = MetadataStore.adapter?.deduceMetadata?.(
        defaultProp,
        adapterMeta
      );
      if (deducedProp && deducedProp.type) {
        if (defaultProp) {
          properties = properties.map(prop =>
            prop.name === adapterMeta.propertyName ? deducedProp : prop
          );
        } else {
          properties.push(deducedProp);
        }
        unknownTypes.delete(adapterMeta.propertyName);
      } else {
        const typeResolved = !!properties.find(
          v => v.name === adapterMeta.propertyName && !!v.type
        );
        if (!typeResolved) {
          unknownTypes.add(adapterMeta.propertyName);
        }
      }
    }

    if (unknownTypes.size > 0) {
      throw new Error(
        `Couldn't extract the type of ${[...unknownTypes]
          .map(v => `"${v}"`)
          .join(', ')}. Use @Fixture({ type: () => Foo })`
      );
    }

    const classMetadata: ClassMetadata = {
      name: reflectMetadata.name,
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
        if (decorator.ignore) {
          return {
            ...meta,
            type: '',
            ignore: true,
          } as PropertyMetadata;
        }
        meta.input = decorator.get;
        meta.min = decorator.min || 1;
        meta.max = Math.max(decorator.max || 3, meta.min);
        let inputType: any = decorator.type?.();
        if (inputType) {
          meta.typeFromDecorator = true;
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
            meta.scalar = !meta.array;
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
        return meta as any;
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
