import { Collection, MikroORM } from '@mikro-orm/core';
import { Class, ClassMetadata, PropertyMetadata } from '../..';
import {
  FactoryContext,
  FactoryOptions,
  FixtureFactory,
} from '../../FixtureFactory';
import { MikroORMFactoryResult } from './MikroORMFactoryResult';

export class MikroORMFixtureFactory extends FixtureFactory {
  constructor(protected orm: MikroORM, options?: FactoryOptions) {
    super({
      ...(options || {}),
      adapterContext: {
        orm,
      },
    });
    this.registerEntities();
    this.setAssigner(this.assignerFn.bind(this));
  }

  private registerEntities() {
    const metadata = this.orm.getMetadata();
    const entityNames = Object.keys(metadata.getAll()).filter(
      v => v[0] === v[0].toUpperCase()
    );
    for (const name of entityNames) {
      const classType = metadata.get(name).class;
      this.register([classType]);
    }
  }

  private assignerFn(prop: PropertyMetadata, obj: any, value: any) {
    if (Array.isArray(value) && obj[prop.name] instanceof Collection) {
      (obj[prop.name] as Collection<any>).add(...value);
    } else {
      obj[prop.name] = value;
    }
  }

  make<T extends Class>(
    classType: T,
    options?: FactoryOptions
  ): MikroORMFactoryResult<T> {
    return super.make(classType, options) as any;
  }

  _getResult<T extends Class>(
    ctx: FactoryContext,
    classType: T,
    meta: ClassMetadata
  ): MikroORMFactoryResult<T> {
    return new MikroORMFactoryResult<T>(
      this.orm,
      this._make.bind(this),
      this,
      ctx,
      classType,
      meta
    );
  }
}
