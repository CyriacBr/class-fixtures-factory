import {
  BaseMetadataStore,
  DefaultMetadataStore,
  ClassMetadata,
  PropertyMetadata,
} from './metadata';
import { Class } from './common/typings';
import faker from 'faker';
import chalk from 'chalk';
import treeify from 'treeify';

export interface FactoryOptions {
  logging?: boolean;
  maxDepth?: number;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>;
};

export interface FactoryResult<T> {
  one: () => T;
  many: (x: number) => T[];
  with: (input: DeepPartial<T>) => FactoryResult<T>;
  ignore: (...props: (keyof T)[]) => FactoryResult<T>;
}

export class FixtureFactory {
  private store: BaseMetadataStore;
  private classTypes: Record<string, Class> = {};
  private DEFAULT_OPTIONS: FactoryOptions = {
    logging: false,
    maxDepth: 4,
  };
  private options!: FactoryOptions;
  private depthness: string[] = [];

  constructor(options?: FactoryOptions) {
    this.store = new DefaultMetadataStore();
    this.options = {
      ...this.DEFAULT_OPTIONS,
      ...(options || {}),
    };
  }

  /**
   * You can set a custom metadata store
   * for extension purposes.
   * The store should extends `BaseMetadataStore`
   * @param store
   */
  setMetadataStore(store: BaseMetadataStore) {
    this.store = store;
  }

  /**
   * Returns the instance of the metadata store
   */
  getStore() {
    return this.store;
  }

  /**
   * Attemps to log a message.
   * Won't work if logging is disabled.
   * @param msg
   */
  log(msg: string) {
    if (this.options.logging) {
      console.log(chalk.gray('[FixtureFactory] '), msg);
    }
  }

  private logResult(object: any, meta: ClassMetadata, duration: number) {
    if (!this.options.logging) return;
    const populateTree = (
      object: any,
      meta: ClassMetadata,
      _tree: any = {},
      number = 0
    ) => {
      const tree: any = (_tree[
        `Generated an instance of ${chalk.gray('"')}${chalk.cyan(
          meta.name
        )}${chalk.gray('"')}${number ? `${chalk.gray(` (${number})`)}` : ''}`
      ] = {});

      for (const prop of meta.properties) {
        const name = chalk.cyan(prop.name);
        const value = object[prop.name];
        if (prop.ignore) {
          tree[name] = chalk.gray(`(ignored)`);
        } else if (prop.input) {
          tree[name] = chalk.gray(`(custom value)`);
        } else if (
          typeof value === 'object' &&
          value.constructor &&
          !(value instanceof Date) &&
          !Array.isArray(value)
        ) {
          tree[name] = {};
          const meta = this.store.get(prop.type);
          populateTree(value, meta, tree[name]);
        } else if (Array.isArray(value)) {
          tree[name] = {};
          const meta = this.store.get(prop.type);
          for (const [i, item] of Object.entries(value)) {
            populateTree(item, meta, tree[name], Number(i) + 1);
          }
        } else {
          tree[name] = value;
        }
      }
      if (meta.properties.length === 0) {
        tree['chalk.gray(`(no properties)`)'] = null;
      }
    };
    const tree: any = {};
    populateTree(object, meta, tree);
    tree[`${chalk.green('Done')} ${chalk.gray(`(${duration}ms)`)}`] = null;
    this.log('\n' + treeify.asTree(tree, true, false));
  }

  /**
   * Register classes to be used by the factory
   * @param classTypes
   */
  register(classTypes: Class[]) {
    for (const classType of classTypes) {
      this.store.make(classType);
      this.classTypes[classType.name] = classType;
    }
  }

  /**
   * Generate fixtures
   * @param classType
   */
  make<T extends Class>(classType: T): FactoryResult<InstanceType<T>> {
    this.store.make(classType);
    const meta = this.store.get(classType);
    let propsToIgnore: string[] = [];
    let userInput: DeepPartial<T> = {};

    this.depthness = [];

    const result: FactoryResult<InstanceType<T>> = {
      one: () => {
        const startDate = new Date();

        const object = this._make(meta, classType, propsToIgnore);
        for (const [key, value] of Object.entries(userInput)) {
          object[key] = value;
        }

        const elapsed = +new Date() - +startDate;
        this.logResult(object, meta, elapsed);
        return object;
      },
      many: (x: number) => {
        return [...Array(x).keys()].map(() => result.one());
      },
      with: (input: DeepPartial<T>) => {
        userInput = input;
        for (const key of Object.keys(input)) {
          propsToIgnore.push(key);
        }
        return result;
      },
      ignore: (...props: any[]) => {
        propsToIgnore = propsToIgnore.concat(props as string[]);
        return result;
      },
    };
    return result;
  }

  protected _make(
    meta: ClassMetadata,
    classType: Class,
    propsToIgnore: string[] = []
  ) {
    this.depthness.push(classType.name);

    const object = new classType();
    for (const prop of meta.properties) {
      if (propsToIgnore.includes(prop.name)) continue;
      if (this.shouldIgnoreProperty(prop)) continue;
      object[prop.name] = this.makeProperty(prop, meta);
    }
    return object;
  }

  protected shouldIgnoreProperty(prop: PropertyMetadata) {
    //if (prop.type === 'method') return true;
    if (prop.ignore) return true;
    return false;
  }

  protected makeProperty(prop: PropertyMetadata, meta: ClassMetadata): any {
    if (prop.input) {
      return prop.input();
    }
    if (prop.scalar) {
      return this.makeScalarProperty(prop);
    } else if (prop.array) {
      return this.makeArrayProp(prop, meta);
    }
    return this.makeObjectProp(meta, prop);
  }

  protected makeScalarProperty(prop: PropertyMetadata) {
    if (prop.enum) {
      if (prop.items) {
        return faker.random.arrayElement(prop.items);
      }
    }
    switch (prop.type) {
      case 'string':
        return faker.random.word();
      case 'number':
        return faker.random.number();
      case 'boolean':
        return faker.random.boolean();
      case 'Date':
        return faker.date.recent();
      default:
        break;
    }
    throw new Error(`Can't generate a value for this scalar`);
  }

  private makeArrayProp(prop: PropertyMetadata, meta: ClassMetadata) {
    const amount = faker.random.number({
      max: prop.max,
      min: prop.min,
    });
    if (['string', 'number', 'boolean', 'Date'].includes(prop.type)) {
      return [...Array(amount).keys()].map(() =>
        this.makeProperty(
          {
            ...prop,
            array: false,
            scalar: true,
          },
          meta
        )
      );
    }
    return [...Array(amount).keys()].map(() =>
      this.makeProperty(
        {
          ...prop,
          array: false,
        },
        meta
      )
    );
  }

  private makeObjectProp(meta: ClassMetadata, prop: PropertyMetadata) {
    const refClassMeta = this.store.get(prop.type);
    const props = this.findRefSideProps(meta, prop);
    return this._make(
      refClassMeta,
      this.classTypes[prop.type],
      props.map(p => p.name)
    );
  }

  private findRefSideProps(meta: ClassMetadata, prop: PropertyMetadata) {
    const props: PropertyMetadata[] = [];
    const refClassMeta = this.store.get(prop.type);
    for (const refProp of refClassMeta.properties) {
      if (refProp.type === meta.name) {
        props.push(refProp);
      }
    }
    return props;
  }
}
