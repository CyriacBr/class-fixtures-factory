import { MetadataStore, ClassMetadata, PropertyMetadata } from './metadata';
import { Class } from './common/typings';
import faker from 'faker';
import chalk from 'chalk';
import { FactoryLogger } from './FactoryLogger';
import { DeepKeyOf, DeepRequired } from 'utils/types';
import { SECRET } from './internals';

export interface FactoryResult<T> {
  one: () => T;
  many: (x: number) => T[];
  /**
   * Provide fixed values to properties of the generated classes.
   * ```ts
   * factory.make(Author).with({
   *    title: 'Fixed Title',
   *    'address.city': 'Support nested values',
   *    'books.0': anotherBookInstance
   * })
   * ```
   */
  with: (input: Record<string, any>) => FactoryResult<T>;
  /**
   * Paths to be excluded from being generated
   * ```ts
   * factory.make(Author).ignore(['title', 'address.city', 'books.0']);
   * ```
   *
   * Ignored paths result in undefined values
   */
  ignore: (...props: DeepKeyOf<T>[]) => FactoryResult<T>;
}

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
}

export interface FactoryContext {
  depthLevel: number;
  options: DeepRequired<FactoryOptions>;
  path: string[];
  pathReferences: InstanceType<Class>[];
  startDate: Date;
  userInput: Record<string, any>;
  ignoredPaths: string[];
}

export class FixtureFactory {
  private store = new MetadataStore();
  private classTypes: Record<string, Class> = {};
  private options!: DeepRequired<FactoryOptions>;
  private loggers: FactoryLogger[] = [];
  private assigner: Assigner = this.defaultAssigner.bind(this);

  private static DEFAULT_OPTIONS: DeepRequired<FactoryOptions> = {
    logging: false,
    maxDepthLevel: 100,
    maxOccurrencesPerPath: 1,
    reuseCircularRelationships: true,
    timeout: 3,
    lazy: false,
  };
  static registerFactoryOptions(opts: Record<string, any>) {
    Object.assign(FixtureFactory.DEFAULT_OPTIONS, opts);
  }

  constructor(options?: FactoryOptions) {
    this.options = {
      ...FixtureFactory.DEFAULT_OPTIONS,
      ...(options || {}),
    };
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

  newLogger(meta: ClassMetadata, lazy?: boolean) {
    this.loggers.unshift(new FactoryLogger());
    const logger = this.logger();
    logger?.start(meta, 0, lazy);
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
      this.store.make(classType, this.options);
      this.classTypes[classType.name] = classType;
    }
  }

  /**
   * Generate fixtures
   * @param classType
   */
  make<T extends Class>(
    classType: T,
    options: FactoryOptions = {}
  ): FactoryResult<InstanceType<T>> {
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
      startDate: new Date(),
      userInput: {},
      ignoredPaths: [],
    };

    const result: FactoryResult<InstanceType<T>> = {
      one: () => {
        let error = false;
        let object: any = {};
        const startDate = new Date();
        this.newLogger(meta, ctx.options.lazy);

        try {
          object = this._make(meta, classType, ctx);
        } catch (err) {
          this.log(
            chalk.red(`An error occurred while generating "${meta.name}"`),
            true
          );
          console.error(err);
          error = true;
        }

        const elapsed = +new Date() - +startDate;
        this.logger()?.[error ? 'onError' : 'onDone'](elapsed);
        this.printLogger(true);
        return error ? null : object;
      },
      many: (x: number) => {
        return [...Array(x).keys()].map(() => result.one());
      },
      // TODO: Once TS 4.4 hit, use: https://www.typescriptlang.org/play?ts=4.4.0-dev.20210627#code/C4TwDgpgBAIg9sACgJwgMwJYA8A8AVKCLYCAOwBMBnKS4ZDUgcwD4oBeKAoki6gIj5QA-FAFQAXFAAGAOgAkAbzwBfKQG4AUBtCRYECGADSEEAHk0+VhwAUGqFADaeALqFiZKo9IQAbhGSuImLidpxuPJ5wAEYAVhAAxsDCULb29gqOhlAMUACiWPEANgCu5BA4ANYmcGicADQ0IAC2UXCFzM4haWlSiobKisUU6AwQ5OEe1HgOhoGiQoKSAgMK8EiomLgw+kYm5vgzzszMqlDKDqH2+UWl5VUgNfWNLW0doQCUEqJ8Gp-ck9lSGh-LBkvk6ABDRI4GANWj0JisSTePzITTacDQACSpDAxWAOFME14UGicUSVigClCM0BegMxjMFjwEFoHSEknhDEYmmU6J00BZtHYVNCpAhTQgnLo3M09lacAqlEkCmAGGAhSlNBlTHOzl5-MxnFZSAhwAAFtQONsGXtmSbmBp4nBSMKwGbzZIbbsmfgHSKAOQKpUyAAMMjVGogAa0ztdSRItEkOLxBKFwEp1PsfGDlDDEfVmr4kgDhTaAbqoRzcEVeYAjAWo8WoAGITG+UA
      with: (input: Record<string, any>) => {
        Object.assign(ctx.userInput, input);
        return result;
      },
      ignore: (...paths: DeepKeyOf<T>[]) => {
        ctx.ignoredPaths = [...ctx.ignoredPaths, ...(paths as string[])];
        return result;
      },
    };
    return result;
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
            throw new Error(`Couldn't generate lazily "${p}" of "${meta.name}`);
          }
          let value = this.makeProperty(prop, meta, ctx);
          value = prop.hooks?.[SECRET].afterValueGenerated?.(value) ?? value;
          return (target[p] = value);
        },
      });
      ctx.pathReferences.push(proxy);
      return proxy;
    }

    ctx.pathReferences.push(object);
    for (const prop of meta.properties) {
      if (prop.ignore) continue;
      let value = this.makeProperty(prop, meta, ctx);
      value = prop.hooks?.[SECRET].afterValueGenerated?.(value) ?? value;
      this.assigner(prop, object, value);
    }
    return object;
  }

  protected makeProperty(
    prop: PropertyMetadata,
    meta: ClassMetadata,
    ctx: FactoryContext
  ): any {
    const convertedPath = [...ctx.path, prop.name]
      .map(v => v.split('.').reverse()[0])
      .join('.');
    if (ctx.ignoredPaths.includes(convertedPath)) {
      this.logger()?.onIgnoredProp(prop);
      return undefined;
    }
    for (const [path, pathValue] of Object.entries(ctx.userInput)) {
      if (path === convertedPath) {
        this.logger()?.onCustomProp(prop);
        return pathValue;
      }
    }

    if (prop.hooks?.[SECRET].hasOverrodeValue()) {
      const value = prop.hooks[SECRET].getValueOverride();
      this.logger()?.onAdapterProp(prop, value);
      return value;
    }
    if (prop.input) {
      this.logger()?.onCustomProp(prop);
      return prop.input();
    }
    if (prop.array) {
      return this.makeArrayProp(prop, meta, ctx);
    } else if (prop.scalar) {
      const value = this.makeScalarProperty(prop);
      this.logger()?.onNormalProp(prop, value);
      return value;
    }
    return this.makeObjectProp(meta, prop, ctx);
  }

  protected makeScalarProperty(prop: PropertyMetadata) {
    if (prop.items) {
      return faker.random.arrayElement(prop.items);
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
    const scalar = ['string', 'number', 'boolean', 'Date'].includes(prop.type);
    return [...Array(amount).keys()]
      .map((_, i) => {
        const newContext: FactoryContext = {
          ...ctx,
          path: [...ctx.path],
        };
        this.appendContextPath(newContext, String(i));
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
    newCtx.path = [...newCtx.path];
    this.appendContextPath(newCtx, `${meta.name}.${prop.name}`);
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
        this.logger()?.onReusedProp(prop);
        return lastInstance;
      }
      this.logger()?.onPropNotGenerated(prop);
      return undefined;
    }
    newCtx.depthLevel += 1;

    const oldLogger = this.logger();
    const logger = this.newLogger(refClassMeta, ctx.options.lazy);

    const value = this._make(refClassMeta, this.classTypes[prop.type], newCtx);
    newCtx.pathReferences.push(value);

    oldLogger?.onClassPropDone(prop, logger);
    this.disposeLogger();

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
