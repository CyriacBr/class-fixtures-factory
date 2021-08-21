import chalk from 'chalk';
import { Connection } from 'typeorm';
import { TypeORMFactoryPersistOptions } from '.';
import {
  Class,
  ClassMetadata,
  FactoryContext,
  FactoryStats,
  FixtureFactory,
} from '../..';
import { FactoryMakeFn, FactoryResult } from '../../FactoryResult';

export type PersistFn<R> = (
  stats: FactoryStats<R>,
  con: Connection,
  options?: TypeORMFactoryPersistOptions
) => Promise<boolean>;

export class TypeORMFactoryResult<
  T extends Class<any>,
  R = InstanceType<T>
> extends FactoryResult<T, R> {
  constructor(
    protected persistFn: PersistFn<R>,
    protected makeFn: FactoryMakeFn,
    protected factory: FixtureFactory,
    protected ctx: FactoryContext,
    protected classType: T,
    protected meta: ClassMetadata
  ) {
    super(makeFn, factory, ctx, classType, meta);
  }

  /**
   * Generate an entity and **attempts** to persist it and its relations
   * in a brute-force way.
   * This method is slow and can be unreliable, but is a no-brainer way
   * to persist entities with complex relationships.
   */
  async oneAndPersist(
    con: Connection,
    options?: TypeORMFactoryPersistOptions
  ): Promise<R> {
    const stats = this.withStats().one();
    const withoutError = await this.persistFn(stats, con, options);
    if (!withoutError) {
      this.factory.log(
        chalk.yellow('Error(s) occured when persisting entities'),
        true
      );
    }
    return stats.result;
  }

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
  async manyAndPersist(
    nbr: number,
    con: Connection,
    options?: TypeORMFactoryPersistOptions
  ): Promise<R[]> {
    return Promise.all(
      Array(nbr)
        .fill(0)
        .map(v =>
          new TypeORMFactoryResult(
            this.persistFn,
            this.makeFn,
            this.factory,
            this.ctx,
            this.classType,
            this.meta
          ).oneAndPersist(con, options)
        )
    );
  }
}
