import { MetadataStore, ClassMetadata, PropertyMetadata } from './metadata';
import { Class } from './common/typings';
import faker from 'faker';
import chalk from 'chalk';
import { FactoryLogger } from './FactoryLogger';
import { DeepKeyOf, DeepRequired } from 'utils/types';
import { SECRET } from './internals';
import { FactoryResult } from './FactoryResult';

export type Assigner = (
  prop: PropertyMetadata,
  object: any,
  value: any
) => void;

export interface FactoryOptions {
  logging?: boolean;
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
   * This parameter defines wether to reuse a direct friend relation or not,
   * when `reuseCircularRelationships` is true.
   *
   * A friend relation is when an entity possess a property whose type is its own entity.
   * ```ts
   * class Author {
   *  friend: Author
   * }
   * ```
   * With `reuseCircularRelationship` to true, author.friend would be equals to the author itself,
   * which makes little sens in most case.
   * So, in order for the factory to generate more realistic entities, this parameter
   * when at true, disallows direct friendships to be reused.
   * So, even with `reuseCircularRelationships` to true, `author.friend` would not equals `author`,
   * a new entity will be generated.
   *
   * The default value is true
   *
   */
  doNotReuseDirectFriendship?: boolean;
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
  /**
   * Defines wether properties are generated on demand,
   * or eagerly. If this option is true, generated instances
   * will be wrapped with a `Proxy`
   */
  lazy?: boolean;
  /**
   * When an error arise when an object is being generated, the factory can either
   * return a partial result (with the previously successfully generated props only) or throw the error.
   *
   * false by default.
   * Note that when true, an error during generation will NOT throw.
   */
  partialResultOnError?: boolean;
  /**
   * A context to pass to registered metadata adapters
   */
  adapterContext?: any;
}

export interface FactoryContext {
  depthLevel: number;
  options: DeepRequired<FactoryOptions>;
  path: string[];
  pathReferences: InstanceType<Class>[];
  currentRef: any;
  startDate: Date;
  userInput: Record<string, any>;
  ignoredPaths: string[];
  arrayIndex?: number;
  stats: FactoryStats<any>;
}

export interface FactoryStats<T> {
  result: T;
  paths: {
    value: string[];
    references: Class[];
  }[];
  instances: WeakMap<Class, InstanceType<Class>[]>;
}

export class FixtureFactory {
  private store: MetadataStore;
  private classTypes: Record<string, Class> = {};
  private options!: DeepRequired<FactoryOptions>;
  private assigner: Assigner = this.defaultAssigner.bind(this);
  logger!: FactoryLogger;
  static Generator: { [name: string]: number } = {};

  //@ts-expect-error
  private static DEFAULT_OPTIONS: DeepRequired<FactoryOptions> = {
    logging: false,
    maxDepthLevel: 100,
    maxOccurrencesPerPath: 1,
    reuseCircularRelationships: true,
    doNotReuseDirectFriendship: true,
    timeout: 3,
    lazy: false,
    partialResultOnError: false,
  };
  static registerFactoryOptions(opts: Record<string, any>) {
    Object.assign(FixtureFactory.DEFAULT_OPTIONS, opts);
  }

  constructor(options?: FactoryOptions) {
    this.options = {
      ...FixtureFactory.DEFAULT_OPTIONS,
      ...(options || {}),
    };
    this.store = new MetadataStore(options?.adapterContext || {});
  }

  setOptions(options: FactoryOptions) {
    this.options = {
      ...FixtureFactory.DEFAULT_OPTIONS,
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

  /**
   * Register classes to be used by the factory
   * @param classTypes
   */
  register(classTypes: Class[]) {
    for (const classType of classTypes) {
      this.store.make(classType, this.options);
      this.classTypes[classType.name] = classType;
    }
  }

  /**
   * Generate fixtures
   * @param classType
   */
  make<T extends Class>(classType: T, options: FactoryOptions = {}) {
    const ctxOptions: DeepRequired<FactoryOptions> = {
      ...this.options,
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

    // TODO: Not needed? Or remake all registered classTypes with ctxOptions?
    this.store.make(classType, ctxOptions);
    const meta = this.store.get(classType);
    const ctx: FactoryContext = {
      depthLevel: 0,
      options: ctxOptions,
      path: [],
      pathReferences: [],
      currentRef: null,
      startDate: new Date(),
      userInput: {},
      ignoredPaths: [],
      stats: {
        result: null,
        instances: new WeakMap(),
        paths: [],
      },
    };
    this.logger = new FactoryLogger();

    return this._getResult(ctx, classType, meta);
  }

  protected _getResult<T extends Class>(
    ctx: FactoryContext,
    classType: T,
    meta: ClassMetadata
  ) {
    return new FactoryResult<T>(
      this._make.bind(this),
      this,
      ctx,
      classType,
      meta
    );
  }

  protected _make<T extends Class>(
    meta: ClassMetadata,
    classType: T,
    ctx: FactoryContext
  ) {
    const elapsed = new Date().getTime() - ctx.startDate.getTime();
    if (elapsed >= ctx.options.timeout * 1000) {
      throw new Error(
        `Timeout: generating is taking too long. Try lowering the value of "maxDepthLevel" and activate "reuseCircularRelationships"`
      );
    }

    const object = new classType();
    if (ctx.options.lazy) {
      const proxy = new Proxy(object, {
        get: (target, p) => {
          if (typeof p === 'symbol') return target[p];
          // - if the requested prop is already generated, we just return it
          if (p in target) return target[p];
          const prop = meta.properties.find(v => v.name === p);
          if (!prop) {
            return undefined;
          }
          const newCtx = this._preparePropertyGeneration(ctx, proxy);
          newCtx.path.push(`${meta.name}.${prop.name}`);
          let value = this.makeProperty(prop, meta, newCtx);
          value = prop.hooks?.[SECRET].afterValueGenerated?.(value) ?? value;
          // TODO: use assigner and prop.ignore too
          return (target[p] = value);
        },
      });
      this._prepareObjectGeneration(ctx, classType, proxy);
      return proxy;
    }

    this._prepareObjectGeneration(ctx, classType, object);
    for (const prop of meta.properties) {
      const newCtx = this._preparePropertyGeneration(ctx, object);
      newCtx.path.push(`${meta.name}.${prop.name}`);
      if (prop.ignore) continue;
      let value = this.makeProperty(prop, meta, newCtx);
      value = prop.hooks?.[SECRET].afterValueGenerated?.(value) ?? value;
      this.assigner(prop, object, value);
    }
    return object;
  }

  private _prepareObjectGeneration(
    ctx: FactoryContext,
    classType: Class,
    object: any
  ) {
    ctx.pathReferences.push(object);
    if (!ctx.stats.instances.has(classType)) {
      ctx.stats.instances.set(classType, []);
    }
    ctx.stats.instances.get(classType)!.push(object);
  }

  private _preparePropertyGeneration(ctx: FactoryContext, object: any) {
    ctx.stats.paths.push({
      value: [...ctx.path],
      references: [...ctx.pathReferences],
    });
    const newCtx: FactoryContext = {
      ...ctx,
      path: [...ctx.path],
      pathReferences: [...ctx.pathReferences],
      currentRef: object,
    };
    return newCtx;
  }

  protected makeProperty(
    prop: PropertyMetadata,
    meta: ClassMetadata,
    ctx: FactoryContext
  ): any {
    const convertedPath = ctx.path
      .map(v => v.split('.').reverse()[0])
      .join('.');
    if (ctx.ignoredPaths.includes(convertedPath)) {
      this.logger.onIgnoreProp(ctx.path);
      return undefined;
    }
    for (const [path, pathValue] of Object.entries(ctx.userInput)) {
      if (path === convertedPath) {
        this.logger.onCustomProp(ctx.path);
        return pathValue;
      }
    }

    if (prop.hooks?.[SECRET].hasOverrodeValue()) {
      const value = prop.hooks[SECRET].getValueOverride();
      this.logger.onOverrodeProp(ctx.path);
      return value;
    }
    if (prop.input) {
      this.logger.onCustomProp(ctx.path);
      return prop.input();
    }
    if (prop.array) {
      this.logger.onGenerateArray(ctx.path);
      return this.makeArrayProp(prop, meta, ctx);
    } else if (prop.scalar) {
      const value = this.makeScalarProperty(prop, meta);
      this.logger.onGenerateScalar(ctx.path, value);
      return value;
    }
    this.logger.onGenerateObject(ctx.path);
    return this.makeObjectProp(meta, prop, ctx);
  }

  protected makeScalarProperty(prop: PropertyMetadata, meta: ClassMetadata) {
    if (prop.items) {
      return faker.random.arrayElement(prop.items);
    }

    if (prop.unique) {
      if (prop.type !== 'number' && prop.type !== 'string') {
        throw new Error(
          `Unique index property "${prop.name}" cannot be generated has its type is neither a string or a number`
        );
      }
      const mainKey = prop.uniqueCacheKey || prop.name;
      const key = `${mainKey}-${meta.name}-${prop.type}`;
      if (prop.type === 'number' && !(key in FixtureFactory.Generator)) {
        FixtureFactory.Generator[key] = 0;
      }
      return prop.type === 'number'
        ? ++(FixtureFactory.Generator[key] as number)
        : faker.random.uuid();
    }

    let { min, max } = prop;
    let numberMin: number | undefined, numberMax: number | undefined;

    if (
      (min != null && typeof min === 'number') ||
      (max != null && typeof max === 'number')
    ) {
      numberMin = min != null && typeof min === 'number' ? min : 0;
      numberMax = max != null && typeof max === 'number' ? max : 0;
      if (!min) {
        numberMin = numberMax > 0 ? 0 : numberMax - 1000;
      } else if (!numberMax) {
        numberMax = numberMin > 0 ? numberMin + 1000 : 0;
      }
      if (numberMin > numberMax) {
        numberMax = numberMin + 1;
      }
    }

    switch (prop.type) {
      case 'string': {
        if (numberMin != null || numberMax != null) {
          if (prop.hooks?.[SECRET].hasGenerateScalarCallback()) {
            return prop.hooks[SECRET].onGenerateScalar(numberMin, numberMax);
          }
          const ln = faker.random.number({ min: numberMin, max: numberMax });
          let value = '';
          while (value.length < ln) {
            value += faker.random.word();
          }
          value = value.slice(0, ln);
          return value;
        }
        return (
          prop.hooks?.[SECRET].onGenerateScalar?.(undefined, undefined) ??
          faker.random.word()
        );
      }
      case 'alphanumeric': {
        if (numberMin != null || numberMax != null) {
          if (prop.hooks?.[SECRET].hasGenerateScalarCallback()) {
            return prop.hooks[SECRET].onGenerateScalar(numberMin, numberMax);
          }
          const ln = faker.random.number({ min: numberMin, max: numberMax });
          return faker.random.alphaNumeric(ln);
        }
        return (
          prop.hooks?.[SECRET].onGenerateScalar?.(undefined, undefined) ??
          faker.random.alphaNumeric()
        );
      }
      case 'number': {
        if (numberMin != null || numberMax != null) {
          return (
            prop.hooks?.[SECRET].onGenerateScalar?.(
              numberMin,
              numberMax,
              prop.precision
            ) ??
            faker.random.number({
              min: numberMin,
              max: numberMax,
              precision: prop.precision ? prop.precision / 100 : undefined,
            })
          );
        }
        return (
          prop.hooks?.[SECRET].onGenerateScalar?.(undefined, undefined) ??
          faker.random.number()
        );
      }
      case 'boolean':
        return (
          prop.hooks?.[SECRET].onGenerateScalar?.(undefined, undefined) ??
          faker.random.boolean()
        );
      case 'date':
      case 'Date': {
        if (
          (min != null && min instanceof Date) ||
          (max != null && max instanceof Date)
        ) {
          if (prop.hooks?.[SECRET].hasGenerateScalarCallback()) {
            return prop.hooks[SECRET].onGenerateScalar(min, max);
          }
          const dateMin = min != null && min instanceof Date ? min : null;
          const dateMax = max != null && max instanceof Date ? max : null;
          let value: Date;
          if (dateMin) {
            value = faker.date.between(
              dateMin,
              dateMax || faker.date.future(1, dateMin)
            );
          } else if (dateMax) {
            value = faker.date.between(
              dateMin || faker.date.past(1, dateMax),
              dateMax
            );
          } else {
            value = faker.date.recent();
          }
          return value;
        }
        return (
          prop.hooks?.[SECRET].onGenerateScalar?.(undefined, undefined) ??
          faker.date.recent()
        );
      }
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
      max: typeof prop.max === 'number' ? prop.max : 3,
      min: typeof prop.min === 'number' ? prop.min : 1,
    });
    const scalar = ['string', 'number', 'boolean', 'Date'].includes(
      prop.type as string
    );
    return [...Array(amount).keys()]
      .map((_, i) => {
        const newContext: FactoryContext = {
          ...ctx,
          path: [...ctx.path, String(i)],
          pathReferences: [...ctx.pathReferences],
          arrayIndex: i,
        };
        // this.appendContextPath(newContext, String(i));
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
    const typeName = typeof prop.type === 'string' ? prop.type : prop.type.name;

    const newCtx: FactoryContext = {
      ...ctx,
      arrayIndex: undefined,
    };
    const {
      reuseCircularRelationships,
      maxOccurrencesPerPath,
      maxDepthLevel,
      doNotReuseDirectFriendship,
    } = newCtx.options;
    let propReuseCircularRelationships =
      prop.reuseCircularRelationships ?? reuseCircularRelationships;
    let propDoNotReuseDirectFriendship =
      prop.doNotReuseDirectFriendship ?? doNotReuseDirectFriendship;
    if (prop.unique) {
      propReuseCircularRelationships = false;
    }

    const occurrenceNbr = newCtx.path.filter(v => v.startsWith(typeName))
      .length;
    /**
     * If we are generating an array item, we inflate the max number
     * of occurrence so that each item in the array is unique.
     * This is true unless reuseCircularRelationships is false,
     * as that'd lead to infinite generation
     */
    const inflatedMaxOccurrences = reuseCircularRelationships
      ? ctx.arrayIndex || 0
      : 0;

    let propMaxDepthLevel =
      typeof prop.maxDepthLevel === 'function'
        ? prop.maxDepthLevel(maxDepthLevel)
        : prop.maxDepthLevel ?? maxDepthLevel;
    let propMaxOccurrencesPerPath =
      typeof prop.maxOccurrencesPerPath === 'function'
        ? prop.maxOccurrencesPerPath(maxOccurrencesPerPath)
        : prop.maxOccurrencesPerPath ?? maxOccurrencesPerPath;
    propMaxOccurrencesPerPath += inflatedMaxOccurrences;
    if (prop.unique) {
      propMaxOccurrencesPerPath += 1;
      propMaxDepthLevel += 1;
    }

    if (
      newCtx.depthLevel >= propMaxDepthLevel ||
      occurrenceNbr >= propMaxOccurrencesPerPath
    ) {
      const instances = newCtx.pathReferences.filter(
        v => v.constructor.name === typeName
      );
      const getLastInstance = (): null | object => {
        let instance = instances.pop();
        if (!instance) return null;
        if (instance === newCtx.currentRef) return getLastInstance();
        return instance;
      };
      const lastInstance =
        ctx.arrayIndex != null
          ? instances.reverse()[ctx.arrayIndex] || instances.reverse()[0]
          : getLastInstance();
      const isFriendship = newCtx.currentRef.constructor.name === typeName;
      let skipGenerate = true;
      if (propReuseCircularRelationships) {
        if (lastInstance) {
          this.logger.onReusedProp(ctx.path);
          return lastInstance;
        } else if (isFriendship && propDoNotReuseDirectFriendship) {
          skipGenerate = false;
        }
      }
      if (skipGenerate) {
        this.logger.onSkipProp(ctx.path);
        return undefined;
      }
    }
    newCtx.depthLevel += 1;

    const value = this._make(refClassMeta, this.classTypes[typeName], newCtx);
    newCtx.pathReferences.push(value);

    return value;
  }

  appendContextPath(ctx: FactoryContext, newStep: string) {
    const lastStep = ctx.path.pop();
    if (!lastStep) {
      ctx.path = [newStep];
      return;
    }
    if (!isNaN(Number(lastStep))) {
      ctx.path = [...ctx.path, newStep, lastStep];
    } else {
      ctx.path = [...ctx.path, lastStep, newStep];
    }
  }
}
