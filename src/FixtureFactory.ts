import { MetadataStore, ClassMetadata, PropertyMetadata } from './metadata';
import { Class } from './common/typings';
import faker from 'faker';
import chalk from 'chalk';
import { FactoryLogger } from './FactoryLogger';

export interface FactoryOptions {
  logging?: boolean;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>;
};

type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends Array<infer U>
    ? Array<DeepRequired<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepRequired<U>>
    : DeepRequired<T[P]>;
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

export interface FactoryMakeOptions {
  /**
   * Defines how deep relationships should be generated.
   * With a level of 0, no relationships are generated at all
   * Relationships that are not generated result in undefined properties, or link to previous
   * references when `reuseCircularRelationships` is true
   *
   * The default level of depth is 100
   */
  maxDepthLevel?: number;
  /**
   * Defines if circular relationships should be reused, or if new instances should be
   * generated for every relationship.
   * For example, let's say we have an `Author` class which has a `book` property. Likewise,
   * the `Book` class also has an `author` property. So, trying to generate the `Author` class
   * will lead to an infinite chain: Author -> Book -> Author -> Book, and so on.
   *
   * If `reuseCircularRelationships` is set to false, a new object is created each time, up
   * to the limit of `maxDepthLevel` and according to `maxOccurrencesPerPath`. The resulting tree will look like this:
   * Author (instance 1) -> Book (instance 1) -> Author (instance 2) -> Book (instance 2) and so on.
   *
   * If `reuseCircularRelationships` is set to true, previous relationships are reused.
   * `make(Author)` will generate a new `Author` object, then a new `Book` object as well,
   * but the property `book.author` will point to the previous object, and will not lead to a new created
   * object. We'll have a circular reference.
   *
   * The default value is true
   */
  reuseCircularRelationships?: boolean;
  /**
   * This parameter defines how many instance of the same class should be generated per path.
   * It helps to prevent infinite instances from circular relationships that are not direct.
   * Let's say we have these relationships:
   * - User -> Book (User.book)
   * - Book -> Shelf (Book.shelf)
   * - Shelf -> User (Shelf.owner)
   *
   * We have this indirect circular relationship: User -> Book -> Shelf -> User
   * `maxDepthLevel` can stop circular relationships from causing infinite instances, but it doesn't give you much control
   * over where the path will stop. `maxOccurrencesPerPath` does.
   * If it is set to 1, only one instance per generated class are allowed on the same path.
   * For example, `make(User)` will generate User, then Book (User.book), then Shelf (Book.shelf), but will
   * not generate User (Shelf.owner) once again, as an instance of User as already been created.
   * Shelf.owner will be undefined, or will link to the previous `User` occurrence if `reuseCircularRelationships` is set to true.
   *
   * The default value is 1
   */
  maxOccurrencesPerPath?: number;
  /**
   * A timeout in seconds to prevent cases where the factory would generate an absurd amount
   * of objects. This could happen with many-to-many relationships and with `reuseCircularRelationships` set to false.
   * The factory will throw when a timeout happens.
   *
   * Default value is 3
   */
  timeout?: number;
}

export interface FactoryContext {
  depthLevel: number;
  options: DeepRequired<FactoryMakeOptions>;
  path: string[];
  pathReferences: InstanceType<Class>[];
  startDate: Date;
}

export class FixtureFactory {
  private store = new MetadataStore();
  private classTypes: Record<string, Class> = {};
  private DEFAULT_OPTIONS: FactoryOptions = {
    logging: false,
  };
  private DEFAULT_MAKE_OPTIONS: DeepRequired<FactoryMakeOptions> = {
    maxDepthLevel: 100,
    maxOccurrencesPerPath: 1,
    reuseCircularRelationships: true,
    timeout: 3,
  };
  private options!: FactoryOptions;
  private loggers: FactoryLogger[] = [];
  private assigner: Assigner = this.defaultAssigner.bind(this);

  constructor(options?: FactoryOptions) {
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
   * Returns the instance of the metadata store
   */
  getStore() {
    return this.store;
  }

  /**
   * Attempts to log a message.
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
  make<T extends Class>(
    classType: T,
    options: FactoryMakeOptions = {}
  ): FactoryResult<InstanceType<T>> {
    const ctxOptions: DeepRequired<FactoryMakeOptions> = {
      ...this.DEFAULT_MAKE_OPTIONS,
      ...(options || {}),
    };

    if (
      ctxOptions.maxDepthLevel === Infinity &&
      ctxOptions.maxOccurrencesPerPath === Infinity
    ) {
      throw new Error(
        `"maxDepthLevel" and "maxOccurrencesPerPath" can't be both Infinity`
      );
    }

    this.store.make(classType);
    const meta = this.store.get(classType);
    let propsToIgnore: string[] = [];
    let userInput: DeepPartial<T> = {};
    const ctx: FactoryContext = {
      depthLevel: 0,
      options: ctxOptions,
      path: [],
      pathReferences: [],
      startDate: new Date(),
    };

    // TODO: Add timeout in case generating stuff takes too long. It can happen depending on settings
    const result: FactoryResult<InstanceType<T>> = {
      one: () => {
        let error = false;
        let object: any = {};
        const startDate = new Date();
        this.newLogger(meta);

        try {
          object = this._make(meta, classType, propsToIgnore, ctx);
          for (const [key, value] of Object.entries(userInput)) {
            object[key] = value;
          }
        } catch (err) {
          this.log(
            chalk.red(`An error occurred while generating "${meta.name}"`),
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

  protected _make<T extends Class>(
    meta: ClassMetadata,
    classType: T,
    propsToIgnore: string[] = [],
    ctx: FactoryContext
  ) {
    const elapsed = new Date().getTime() - ctx.startDate.getTime();
    if (elapsed >= ctx.options.timeout * 1000) {
      throw new Error(
        `Timeout: generating is taking too long. Try lowering the value of "maxDepthLevel" and activate "reuseCircularRelationships"`
      );
    }

    const object = new classType();
    ctx.pathReferences.push(object);
    for (const prop of meta.properties) {
      if (propsToIgnore.includes(prop.name)) continue;
      if (this.shouldIgnoreProperty(prop)) continue;
      this.assigner(prop, object, this.makeProperty(prop, meta, ctx));
    }
    return object;
  }

  protected shouldIgnoreProperty(prop: PropertyMetadata) {
    //if (prop.type === 'method') return true;
    if (prop.ignore) return true;
    return false;
  }

  protected makeProperty(
    prop: PropertyMetadata,
    meta: ClassMetadata,
    ctx: FactoryContext
  ): any {
    if (prop.input) {
      this.logger().onCustomProp(prop);
      return prop.input();
    }
    if (prop.array) {
      return this.makeArrayProp(prop, meta, ctx);
    } else if (prop.scalar) {
      const value = prop.libraryInput?.() || this.makeScalarProperty(prop);
      this.logger().onNormalProp(prop, value);
      return value;
    }
    return this.makeObjectProp(meta, prop, ctx);
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
    throw new Error(`Can't generate a value for this scalar: ${prop.type}`);
  }

  private makeArrayProp(
    prop: PropertyMetadata,
    meta: ClassMetadata,
    ctx: FactoryContext
  ) {
    const amount = faker.random.number({
      max: prop.max ?? 3,
      min: prop.min ?? 1,
    });
    const scalar = ['string', 'number', 'boolean', 'Date'].includes(prop.type);
    return [...Array(amount).keys()]
      .map((_, i) => {
        const newContext: FactoryContext = {
          ...ctx,
          path: [...ctx.path, String(i)],
        };
        return this.makeProperty(
          {
            ...prop,
            array: false,
            scalar,
          },
          meta,
          newContext
        );
      })
      .filter(Boolean);
  }

  private makeObjectProp(
    meta: ClassMetadata,
    prop: PropertyMetadata,
    ctx: FactoryContext
  ) {
    const refClassMeta = this.store.get(prop.type);

    const newCtx: FactoryContext = { ...ctx, path: [...ctx.path] };
    newCtx.path = [...newCtx.path, `${meta.name}.${prop.name}`];
    const occurrenceNbr = newCtx.path.filter(v => v.startsWith(prop.type))
      .length;
    if (
      newCtx.depthLevel >= newCtx.options.maxDepthLevel! ||
      occurrenceNbr >= newCtx.options.maxOccurrencesPerPath!
    ) {
      const lastInstance = [...newCtx.pathReferences]
        .reverse()
        .find(v => v.constructor.name === prop.type);
      if (lastInstance && newCtx.options.reuseCircularRelationships) {
        this.logger().onReusedProp(prop);
        return lastInstance;
      }
      this.logger().onPropNotGenerated(prop);
      return undefined;
    }
    newCtx.depthLevel += 1;

    const oldLogger = this.logger();
    const logger = this.newLogger(refClassMeta);

    const value = this._make(
      refClassMeta,
      this.classTypes[prop.type],
      [], //TODO: supports nested ignoreProps (with path)
      newCtx
    );
    newCtx.pathReferences.push(value);

    oldLogger.onClassPropDone(prop, logger);
    this.disposeLogger();

    return value;
  }
}
