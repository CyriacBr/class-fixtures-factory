import {
  BaseMetadataStore,
  DefaultMetadataStore,
  ClassMetadata,
  PropertyMetadata,
} from './metadata';
import { Class } from './common/typings';
import faker from 'faker';
import chalk from 'chalk';
import { FactoryLogger } from './FactoryLogger';

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

export type Assigner = (
  prop: PropertyMetadata,
  object: any,
  value: any
) => void;

export class FixtureFactory {
  private store: BaseMetadataStore;
  private classTypes: Record<string, Class> = {};
  private DEFAULT_OPTIONS: FactoryOptions = {
    logging: false,
    maxDepth: 4,
  };
  private options!: FactoryOptions;
  private depthness: string[] = [];
  private loggers: FactoryLogger[] = [];
  private assigner: Assigner = this.defaultAssigner.bind(this);

  constructor(options?: FactoryOptions) {
    this.store = new DefaultMetadataStore();
    this.options = {
      ...this.DEFAULT_OPTIONS,
      ...(options || {}),
    };
  }

  private defaultAssigner(prop: PropertyMetadata, object: any, value: any) {
    object[prop.name] = value;
  }

  /**
   * Set a function to take charge of assigning values to
   * generated objects
   * @param fn
   */
  setAssigner(fn: Assigner) {
    this.assigner = fn;
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
  log(msg: string, force = false) {
    if (force || this.options.logging) {
      console.log(chalk.gray('[FixtureFactory] '), msg);
    }
  }

  newLogger(meta: ClassMetadata) {
    this.loggers.unshift(new FactoryLogger());
    const logger = this.logger();
    logger.start(meta);
    return logger;
  }

  logger() {
    return this.loggers[0];
  }

  printLogger(dispose = false) {
    const logger = this.logger();
    if (!logger) return;
    this.log('\n' + logger.log());
    if (dispose) {
      this.disposeLogger();
    }
  }

  disposeLogger() {
    this.loggers.shift();
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
        let error = false;
        let object: any = {};
        const startDate = new Date();
        this.newLogger(meta);

        try {
          object = this._make(meta, classType, propsToIgnore);
          for (const [key, value] of Object.entries(userInput)) {
            object[key] = value;
          }
        } catch (err) {
          this.log(
            chalk.red(`An error occured while generating "${meta.name}"`),
            true
          );
          console.error(err);
          error = true;
        }

        const elapsed = +new Date() - +startDate;
        this.logger()[error ? 'onError' : 'onDone'](elapsed);
        this.printLogger(true);
        return error ? null : object;
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
      this.assigner(prop, object, this.makeProperty(prop, meta));
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
      this.logger().onCustomProp(prop);
      return prop.input();
    }
    if (prop.scalar) {
      const value = this.makeScalarProperty(prop);
      this.logger().onNormalProp(prop, value);
      return value;
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

    const oldLogger = this.logger();
    const logger = this.newLogger(refClassMeta);

    const value = this._make(
      refClassMeta,
      this.classTypes[prop.type],
      props.map(p => p.name)
    );

    oldLogger.onClassPropDone(prop, logger);
    this.disposeLogger();

    return value;
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
