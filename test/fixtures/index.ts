import { Class, FixtureFactory } from '../../src';
import * as path from 'path';
import { Connection, createConnection } from 'typeorm';
import { MikroORM } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

export const factory = new FixtureFactory();

export async function connectToTypeORM(
  entities: Class[],
  action: (connection: Connection) => any
) {
  let connection: Connection;
  try {
    connection = await createConnection({
      type: 'sqlite',
      database: path.join(__dirname, './typeorm.sqlite'),
      entities,
      // logging: true,
    });
    await connection.synchronize(true);

    await action(connection);
  } finally {
    if (connection!) {
      await connection.close();
    }
  }
}

export async function connectToMikroORM(
  entities: Class[],
  action: (orm: MikroORM) => any
) {
  let orm: MikroORM;
  try {
    orm = await MikroORM.init({
      metadataProvider: TsMorphMetadataProvider,
      entities,
      dbName: path.join(__dirname, 'mikro-orm-temp', 'mikro-orm.sqlite'),
      type: 'sqlite',
      // debug: true,
      cache: {
        enabled: true,
        pretty: true,
        options: { cacheDir: path.join(__dirname, './mikro-orm-temp') },
      },
    });
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();

    await action(orm);
  } finally {
    if (orm!) {
      // await orm.close();
    }
  }
}
