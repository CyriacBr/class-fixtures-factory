import { MikroORM } from '@mikro-orm/core';
import { Class, ClassMetadata, FactoryContext, FixtureFactory } from '../..';
import { FactoryMakeFn, FactoryResult } from '../../FactoryResult';

export class MikroORMFactoryResult<
  T extends Class<any>,
  R = InstanceType<T>
> extends FactoryResult<T, R> {
  constructor(
    protected orm: MikroORM,
    protected makeFn: FactoryMakeFn,
    protected factory: FixtureFactory,
    protected ctx: FactoryContext,
    protected classType: T,
    protected meta: ClassMetadata
  ) {
    super(makeFn, factory, ctx, classType, meta);
  }

  /**
   * Generate an entity and persist it into the database
   */
  async oneAndPersist(): Promise<R> {
    const stats = this.withStats().one();
    this.orm.em.persist(stats.result);
    await this.orm.em.flush();
    return stats.result;
  }

  /**
   * Generate multiple instances of an entity, persist them.
   * Flushing happen after all entities have been generated.
   */
  async manyAndPersist(nbr: number): Promise<R[]> {
    const result: R[] = Array(nbr)
      .fill(0)
      .map(v =>
        new MikroORMFactoryResult(
          this.orm,
          this.makeFn,
          this.factory,
          this.ctx,
          this.classType,
          this.meta
        ).one()
      );
    await this.orm.em.flush();
    return result;
  }
}
