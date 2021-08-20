import { FixtureFactory } from '../src/FixtureFactory';
import { Fixture } from '../src/decorators';
import { inspect } from 'util';

const factory = new FixtureFactory({ logging: true });

// class DummyAuthor {
//   @Fixture({ type: () => DummyAuthor })
//   friend!: DummyAuthor;
//   @Fixture({ type: () => DummyShelf })
//   shelf!: DummyShelf;
// }
// class DummyShelf {
//   @Fixture({ type: () => DummyAuthor })
//   author!: DummyAuthor;
//   @Fixture({ type: () => DummyBook })
//   book!: DummyBook;
// }
// class DummyBook {
//   @Fixture({ type: () => DummyAuthor })
//   author!: DummyAuthor;
// }
// factory.register([DummyAuthor, DummyBook, DummyShelf]);

// const author = factory
//   .make(DummyAuthor, {
//     maxOccurrencesPerPath: 1,
//     reuseCircularRelationships: true,
//     logging: true,
//     timeout: 99999,
//   })
//   .one();

// console.log(inspect(author, { depth: Infinity, colors: true }));
// class DummyAuthor {
//   @Fixture({
//     type: () => [DummyBook],
//     min: 2,
//     max: 2,
//     reuseCircularRelationships: false,
//     maxOccurrencesPerPath: v => v + 2,
//   })
//   books!: DummyBook[];
// }
// class DummyBook {
//   @Fixture({
//     type: () => [DummyAuthor],
//     min: 2,
//     max: 2,
//     reuseCircularRelationships: false,
//     maxOccurrencesPerPath: v => v + 2,
//   })
//   authors!: DummyAuthor[];
// }
// factory.register([DummyAuthor, DummyBook]);

// const author = factory
//   .make(DummyAuthor, {
//     maxOccurrencesPerPath: 1,
//     reuseCircularRelationships: true,
//     logging: true,
//     timeout: 99999,
//   })
//   .withStats()
//   .one();

// console.log('author.paths :>> ', author.paths);
// console.log('author.instances :>> ', author.instances);
// console.log(inspect(author, { depth: Infinity, colors: true }));

// const author = factory.make(Author, { lazy: true }).one();
// console.log('author :', author);

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  getMetadataArgsStorage,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  Generated,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { TypeORMFixtureFactory } from '../src/plugins/typeorm/TypeORMFixtureFactory';
import '../src/plugins/typeorm';
import { connectToTypeORM } from './fixtures';

@Entity()
class DummyAuthor {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  name!: string;
  @OneToOne(
    _ => DummyBook,
    book => book.author
  )
  @JoinColumn()
  book!: DummyBook;
}
@Entity()
class DummyBook {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  title!: string;
  @OneToOne(
    _ => DummyAuthor,
    author => author.book
  )
  author!: DummyAuthor;
}

// //TODO: supports entitySchema

const tFactory = new TypeORMFixtureFactory({ logging: true });
tFactory.registerEntities();

(async () => {
  connectToTypeORM([DummyAuthor, DummyBook], async con => {
    const result = await tFactory.make(DummyAuthor).oneAndPersist(con);
    console.log(
      'generated: ',
      inspect(result, { depth: Infinity, colors: true })
    );
    const saved = await con
      .getRepository(DummyAuthor)
      .findOneOrFail(result.id, {
        relations: ['book', 'book.author'],
      });
    console.log('saved: ', inspect(saved, { depth: Infinity, colors: true }));
  });
})();

// @Entity()
// class Test {
//   @Index({ unique: true })
//   uniqueIndex!: string;
// }

// @Index(['a', 'b'], { unique: true })
// @Entity()
// class Test2 {
//   a!: string;
//   b!: number;
// }

// const store = getMetadataArgsStorage();
// console.log(inspect(store, { depth: Infinity, colors: true }));
