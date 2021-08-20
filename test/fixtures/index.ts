import { Class, FixtureFactory } from '../../src';
import * as path from 'path';
import { Connection, createConnection } from 'typeorm';

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
