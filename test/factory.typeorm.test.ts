import {
  Column,
  Connection,
  createConnection,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Fixture, FixtureFactory, PropertyMetadata } from '../src';
import '../src/plugins/typeorm';
import { inspect } from 'util';
import { connectToTypeORM } from './fixtures';
import { TypeORMFixtureFactory } from '../src/plugins/typeorm';
import {
  TypeORMArticle,
  TypeORMComment,
  TypeORMFavorite,
  TypeORMTag,
  TypeORMUser,
  TypeORMFollow,
} from './fixtures/typeorm-entities';

jest.setTimeout(30000 * 20);

describe(`FixtureFactory`, () => {
  const factory = new TypeORMFixtureFactory();

  describe(`with TypeORM`, () => {
    describe(`Generating primary and generated columns`, () => {
      it(`@PrimaryColumn[type = Number] is generated with incremental unique values`, () => {
        @Entity()
        class Dummy {
          @PrimaryColumn()
          id!: number;
        }
        factory.register([Dummy]);

        const dummies = factory.make(Dummy).many(10);
        for (let i = 0; i < 10; i++) {
          expect(dummies[i].id).toBe(i + 1);
        }
      });

      it(`@PrimaryColumn[type = String] is generated with a uuid`, () => {
        @Entity()
        class Dummy {
          @PrimaryColumn()
          id!: string;
        }
        factory.register([Dummy]);

        const dummy = factory.make(Dummy).one();
        expect(typeof dummy.id === 'string').toBe(true);
        expect(dummy.id).toMatch(
          /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/i
        );
      });

      it(`@PrimaryGeneratedColumn[type = Number] is not generated when "handleGeneratedColumns" is false`, () => {
        @Entity()
        class Dummy {
          @PrimaryGeneratedColumn()
          id!: number;
        }
        factory.register([Dummy]);

        const dummy = factory
          .make(Dummy, { handleGeneratedColumns: false })
          .one();
        expect(dummy.id).toBeUndefined();
      });

      it(`@PrimaryGeneratedColumn[type = Number] is generated when "handleGeneratedColumns" is true`, () => {
        @Entity()
        class Dummy {
          @PrimaryGeneratedColumn()
          id!: number;
        }
        factory.register([Dummy]);

        const dummy = factory
          .make(Dummy, { handleGeneratedColumns: true })
          .one();
        expect(typeof dummy.id === 'number').toBe(true);
        expect(dummy.id).not.toBeNaN();
      });

      it(`@PrimaryGeneratedColumn[type = String] is not generated when "handleGeneratedColumns" is false`, () => {
        @Entity()
        class Dummy {
          @PrimaryGeneratedColumn('uuid')
          id!: string;
        }
        factory.register([Dummy]);

        const dummy = factory
          .make(Dummy, { handleGeneratedColumns: false })
          .one();
        expect(dummy.id).toBeUndefined();
      });

      it(`@PrimaryGeneratedColumn[type = String] is generated when "handleGeneratedColumns" is true`, () => {
        @Entity()
        class Dummy {
          @PrimaryGeneratedColumn('uuid')
          id!: string;
        }
        factory.register([Dummy]);

        const dummy = factory
          .make(Dummy, { handleGeneratedColumns: true })
          .one();
        expect(typeof dummy.id === 'string').toBe(true);
        expect(dummy.id).toMatch(
          /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/i
        );
      });

      it(`@Generated[type = Number] is not generated when "handleGeneratedColumns" is false`, () => {
        @Entity()
        class Dummy {
          @Generated('increment')
          id!: number;
        }
        factory.register([Dummy]);

        const dummy = factory
          .make(Dummy, { handleGeneratedColumns: false })
          .one();
        expect(dummy.id).toBeUndefined();
      });

      it(`@Generated[type = Number] is generated when "handleGeneratedColumns" is true`, () => {
        @Entity()
        class Dummy {
          @Generated('increment')
          id!: number;
        }
        factory.register([Dummy]);

        const dummy = factory
          .make(Dummy, { handleGeneratedColumns: true })
          .one();
        expect(typeof dummy.id === 'number').toBe(true);
        expect(dummy.id).not.toBeNaN();
      });

      it(`@Generated[type = String] is not generated when "handleGeneratedColumns" is false`, () => {
        @Entity()
        class Dummy {
          @Generated('uuid')
          id!: string;
        }
        factory.register([Dummy]);

        const dummy = factory
          .make(Dummy, { handleGeneratedColumns: false })
          .one();
        expect(dummy.id).toBeUndefined();
      });

      it(`@Generated[type = String] is generated when "handleGeneratedColumns" is true`, () => {
        @Entity()
        class Dummy {
          @Generated('uuid')
          id!: string;
        }
        factory.register([Dummy]);

        const dummy = factory
          .make(Dummy, { handleGeneratedColumns: true })
          .one();
        expect(typeof dummy.id === 'string').toBe(true);
        expect(dummy.id).toMatch(
          /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/i
        );
      });

      it(`@CreateDateColumn, @UpdateDateColumn and @DeleteDateColumn are generated as Dates`, () => {
        @Entity()
        class Dummy {
          @CreateDateColumn()
          val1!: any;
          @UpdateDateColumn()
          val2!: any;
          @DeleteDateColumn()
          val3!: any;
        }
        factory.register([Dummy]);

        const dummy = factory.make(Dummy).one();
        expect(dummy.val1).toBeInstanceOf(Date);
        expect(dummy.val2).toBeInstanceOf(Date);
        expect(dummy.val3).toBeInstanceOf(Date);
      });
    });

    describe(`Generating normal columns`, () => {
      it(`@Column without specified type is correctly generated`, () => {
        @Entity()
        class Dummy {
          @Column()
          val1!: string;
          @Column()
          val2!: number;
          @Column()
          val3!: Date;
          @Column()
          val4!: boolean;
        }
        factory.register([Dummy]);

        const dummy = factory.make(Dummy).one();
        expect(typeof dummy.val1 === 'string').toBe(true);
        expect(typeof dummy.val2 === 'number').toBe(true);
        expect(dummy.val3).toBeInstanceOf(Date);
        expect(typeof dummy.val4 === 'boolean').toBe(true);
      });

      it(`@Column with specified type is correctly generated`, () => {
        @Entity()
        class Dummy {
          @Column('varchar')
          val1!: any;
          @Column('int2')
          val2!: any;
          @Column('timestamp')
          val3!: any;
          @Column('bool')
          val4!: boolean;
        }
        factory.register([Dummy]);

        const dummy = factory.make(Dummy).one();
        expect(typeof dummy.val1 === 'string').toBe(true);
        expect(typeof dummy.val2 === 'number').toBe(true);
        expect(dummy.val3).toBeInstanceOf(Date);
        expect(typeof dummy.val4 === 'boolean').toBe(true);
      });

      it(`@Column[string] generated length is restricted by options.length`, () => {
        @Entity()
        class Dummy {
          @Column({ length: 4 })
          val!: string;
        }
        factory.register([Dummy]);

        const metadata = factory.getStore().get(Dummy);
        const valMeta = metadata.properties.find(v => v.name === 'val');
        expect(valMeta).toMatchObject({
          max: 4,
        });

        const dummy = factory.make(Dummy).one();
        expect(typeof dummy.val === 'string').toBe(true);
        expect(dummy.val.length <= 4).toBe(true);
      });

      it(`@Column with options.default is generated with this value`, () => {
        @Entity()
        class Dummy {
          @Column({ default: 'lmao' })
          val!: string;
        }
        factory.register([Dummy]);

        const dummy = factory.make(Dummy).one();
        expect(dummy.val).toBe('lmao');
      });

      it(`@Column with options.default is not generated with this value when types mismatch`, () => {
        @Entity()
        class Dummy {
          @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
          val!: Date;
        }
        factory.register([Dummy]);

        const dummy = factory.make(Dummy).one();
        expect(dummy.val).toBeInstanceOf(Date);
      });

      it(`@Column[decimal] is correctly generated even with options.precision and options.scale`, () => {
        @Entity()
        class Dummy {
          @Column('decimal')
          val1!: number;
          @Column({ precision: 1, type: 'decimal' })
          val2!: number;
          @Column({ precision: 3, scale: 2, type: 'decimal' })
          val3!: number;
        }
        factory.register([Dummy]);

        const metadata = factory.getStore().get(Dummy);
        const val2Meta = metadata.properties.find(v => v.name === 'val2');
        const val3Meta = metadata.properties.find(v => v.name === 'val3');
        expect(val2Meta).toMatchObject({
          max: 9,
        });
        expect(val3Meta).toMatchObject({
          max: 999,
          precision: 2,
        });

        const dummy = factory.make(Dummy).one();
        expect(typeof dummy.val1).toBe('number');
        expect(dummy.val2 <= 9).toBe(true);
        expect(typeof dummy.val2).toBe('number');
        expect(dummy.val3 <= 999.99).toBe(true);
      });

      it(`@Column[TS enum] is correctly generated`, () => {
        enum UserRole {
          ADMIN = 'admin',
          EDITOR = 'editor',
          GHOST = 'ghost',
        }
        @Entity()
        class Dummy {
          @Column({
            type: 'enum',
            enum: UserRole,
          })
          val!: UserRole;
        }
        factory.register([Dummy]);

        const metadata = factory.getStore().get(Dummy);
        const valMeta = metadata.properties.find(v => v.name === 'val');
        expect(valMeta).toMatchObject({
          type: 'string',
          scalar: true,
          items: ['admin', 'editor', 'ghost'],
        });

        const dummy = factory.make(Dummy).one();
        expect(typeof dummy.val).toBe('string');
        expect(['admin', 'editor', 'ghost']).toContain(dummy.val);
      });

      it(`@Column[array enum] is correctly generated`, () => {
        enum UserRole {
          ADMIN = 'admin',
          EDITOR = 'editor',
          GHOST = 'ghost',
        }
        @Entity()
        class Dummy {
          @Column({
            type: 'enum',
            enum: ['admin', 'editor', 'ghost'],
          })
          val!: UserRole;
        }
        factory.register([Dummy]);

        const metadata = factory.getStore().get(Dummy);
        const valMeta = metadata.properties.find(v => v.name === 'val');
        expect(valMeta).toMatchObject({
          type: 'string',
          scalar: true,
          items: ['admin', 'editor', 'ghost'],
        });

        const dummy = factory.make(Dummy).one();
        expect(typeof dummy.val).toBe('string');
        expect(['admin', 'editor', 'ghost']).toContain(dummy.val);
      });

      it(`@Column[set] is correctly generated`, () => {
        enum UserRole {
          ADMIN = 'admin',
          EDITOR = 'editor',
          GHOST = 'ghost',
        }
        @Entity()
        class Dummy {
          @Column({
            type: 'set',
            enum: UserRole,
          })
          val!: UserRole[];
        }
        factory.register([Dummy]);

        const metadata = factory.getStore().get(Dummy);
        const valMeta = metadata.properties.find(v => v.name === 'val');
        expect(valMeta).toMatchObject({
          type: 'string',
          array: true,
          items: ['admin', 'editor', 'ghost'],
        });

        const dummy = factory.make(Dummy).one();
        expect(dummy.val).toBeInstanceOf(Array);
        dummy.val.forEach(v =>
          expect(['admin', 'editor', 'ghost']).toContain(v)
        );
      });

      it(`@Column[simple-array] is generated as an array of string`, () => {
        @Entity()
        class Dummy {
          @Column('simple-array')
          val!: any;
        }
        factory.register([Dummy]);

        const metadata = factory.getStore().get(Dummy);
        const valMeta = metadata.properties.find(v => v.name === 'val');
        expect(valMeta).toMatchObject({
          type: 'string',
          array: true,
        });

        const dummy = factory.make(Dummy).one();
        expect(dummy.val).toBeInstanceOf(Array);
        dummy.val.forEach((v: any) => expect(typeof v).toBe('string'));
      });

      it(`@Column[one-to-one] is correctly generated`, () => {
        @Entity()
        class Profile {
          @Column()
          gender!: string;
        }

        @Entity()
        class Dummy {
          @OneToOne(() => Profile)
          @JoinColumn()
          profile!: Profile;
        }
        factory.register([Dummy, Profile]);

        const metadata = factory.getStore().get(Dummy);
        const valMeta = metadata.properties.find(v => v.name === 'profile');
        expect(valMeta).toMatchObject({
          type: Profile,
        });

        const dummy = factory.make(Dummy).one();
        expect(dummy.profile).toBeInstanceOf(Profile);
        expect(dummy.profile.gender).not.toBeUndefined();
      });

      it(`@Column[one-to-many] is correctly generated`, () => {
        @Entity()
        class Photo {
          @Column()
          url!: string;

          @ManyToOne(
            () => Dummy,
            user => user.photos
          )
          user!: Dummy;
        }

        @Entity()
        class Dummy {
          @OneToMany(
            () => Photo,
            photo => photo.user
          )
          photos!: Photo[];
        }
        factory.register([Dummy, Photo]);

        const metadata = factory.getStore().get(Dummy);
        const photosMeta = metadata.properties.find(v => v.name === 'photos');
        expect(photosMeta).toMatchObject({
          type: Photo,
          array: true,
        });

        const dummy = factory.make(Dummy, { timeout: 99999 }).one();
        expect(dummy.photos).toBeInstanceOf(Array);
        dummy.photos.forEach(v => {
          expect(v).toBeInstanceOf(Photo);
          expect(v.user).not.toBeUndefined();
        });
      });

      it(`@Column[many-to-many] is correctly generated`, () => {
        @Entity()
        class Photo {
          @Column()
          url!: string;

          @OneToMany(
            () => Dummy,
            user => user.photos
          )
          users!: Dummy[];
        }

        @Entity()
        class Dummy {
          @OneToMany(
            () => Photo,
            photo => photo.users
          )
          photos!: Photo[];
        }
        factory.register([Dummy, Photo]);

        const metadata = factory.getStore().get(Dummy);
        const photosMeta = metadata.properties.find(v => v.name === 'photos');
        expect(photosMeta).toMatchObject({
          type: Photo,
          array: true,
        });

        const dummy = factory.make(Dummy, { timeout: 99999 }).one();
        expect(dummy.photos).toBeInstanceOf(Array);
        dummy.photos.forEach(v => {
          expect(v).toBeInstanceOf(Photo);
          expect(v.users).toBeInstanceOf(Array);
          v.users.forEach(v => expect(v).toBeInstanceOf(Dummy));
        });
      });

      it(`@Column[embedded] is correctly generated`, () => {
        class Name {
          @Column()
          first!: string;

          @Column()
          last!: string;
        }

        @Entity()
        class Dummy {
          @Column(() => Name)
          name!: Name;
          @Column(() => Name)
          names!: Name[];
        }
        factory.register([Dummy, Name]);

        const metadata = factory.getStore().get(Dummy);
        const nameMeta = metadata.properties.find(v => v.name === 'name');
        const namesMeta = metadata.properties.find(v => v.name === 'names');
        expect(nameMeta).toMatchObject<Partial<PropertyMetadata>>({
          type: Name,
          array: false,
        });
        expect(namesMeta).toMatchObject<Partial<PropertyMetadata>>({
          type: Name,
          array: true,
        });

        const dummy = factory.make(Dummy).one();
        expect(dummy.name).toBeInstanceOf(Name);
        expect(typeof dummy.name.first).toBe('string');
        expect(dummy.names).toBeInstanceOf(Array);
        expect(dummy.names[0]).toBeInstanceOf(Name);
        expect(typeof dummy.names[0].first).toBe('string');
      });

      describe(`Unique indexes are correctly generated`, () => {
        it(`@Index({ unique: true })`, () => {
          @Entity()
          class Dummy2 {}
          @Entity()
          class Dummy {
            @Index({ unique: true })
            @Column()
            val1!: string;
            @Index({ unique: true })
            @Column()
            val2!: number;
            @Index({ unique: true })
            @OneToOne(_ => Dummy2)
            val3!: Dummy2;
          }
          factory.register([Dummy, Dummy2]);

          const val1Meta = factory
            .getStore()
            .get(Dummy)
            .properties.find(v => v.name === 'val1');
          const val2Meta = factory
            .getStore()
            .get(Dummy)
            .properties.find(v => v.name === 'val2');
          const val3Meta = factory
            .getStore()
            .get(Dummy)
            .properties.find(v => v.name === 'val3');

          expect(val1Meta).toMatchObject({
            unique: true,
            type: 'string',
            scalar: true,
          });
          expect(val2Meta).toMatchObject({
            unique: true,
            type: 'number',
            scalar: true,
          });
          expect(val3Meta).toMatchObject({
            unique: true,
            type: Dummy2,
            scalar: false,
          });
        });

        it(`@Index([colA, colB], { unique: true })`, () => {
          @Entity()
          class Dummy2 {}
          @Index(['val1', 'val2'], { unique: true })
          @Index(['val3'], { unique: true })
          @Entity()
          class Dummy {
            @Column()
            val1!: string;
            @Column()
            val2!: number;
            @OneToOne(_ => Dummy2)
            val3!: Dummy2;
          }
          factory.register([Dummy, Dummy2]);

          const val1Meta = factory
            .getStore()
            .get(Dummy)
            .properties.find(v => v.name === 'val1');
          const val2Meta = factory
            .getStore()
            .get(Dummy)
            .properties.find(v => v.name === 'val2');
          const val3Meta = factory
            .getStore()
            .get(Dummy)
            .properties.find(v => v.name === 'val3');

          expect(val1Meta).toMatchObject({
            unique: true,
            type: 'string',
            uniqueCacheKey: 'val1-val2',
            scalar: true,
          });
          expect(val2Meta).toMatchObject({
            unique: true,
            type: 'number',
            uniqueCacheKey: 'val1-val2',
            scalar: true,
          });
          expect(val3Meta).toMatchObject({
            unique: true,
            type: Dummy2,
            uniqueCacheKey: 'val3',
            scalar: false,
          });
        });
      });
    });

    describe(`Persisting relationships`, () => {
      describe(`one-to-one`, () => {
        it(`no cascade`, async () => {
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

          await connectToTypeORM([DummyAuthor, DummyBook], async connection => {
            factory.registerEntities();

            const author = await factory
              .make(DummyAuthor)
              .oneAndPersist(connection);
            // console.log(inspect(author, { depth: Infinity, colors: true }));

            expect(author.id).toBeTruthy();
            expect(author.book.id).toBeTruthy();

            const authorInDB = await connection
              .getRepository(DummyAuthor)
              .findOneOrFail(author.id, {
                relations: ['book', 'book.author'],
              });

            expect(authorInDB.id).toBeTruthy();
            expect(authorInDB.book.id).toBeTruthy();
          });
        });

        it(`cascade on generated side`, async () => {
          @Entity()
          class DummyAuthor {
            @PrimaryGeneratedColumn()
            id!: number;
            @Column()
            name!: string;
            @OneToOne(
              _ => DummyBook,
              book => book.author,
              { cascade: true }
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

          await connectToTypeORM([DummyAuthor, DummyBook], async connection => {
            factory.registerEntities();

            const author = await factory
              .make(DummyAuthor)
              .oneAndPersist(connection);
            // console.log(inspect(author, { depth: Infinity, colors: true }));

            expect(author.id).toBeTruthy();
            expect(author.book.id).toBeTruthy();

            const authorInDB = await connection
              .getRepository(DummyAuthor)
              .findOneOrFail(author.id, {
                relations: ['book', 'book.author'],
              });

            expect(authorInDB.id).toBeTruthy();
            expect(authorInDB.book.id).toBeTruthy();
          });
        });

        it(`cascade not on generated side`, async () => {
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
              author => author.book,
              { cascade: true }
            )
            author!: DummyAuthor;
          }

          await connectToTypeORM([DummyAuthor, DummyBook], async connection => {
            factory.registerEntities();

            const author = await factory
              .make(DummyAuthor)
              .oneAndPersist(connection);
            // console.log(inspect(author, { depth: Infinity, colors: true }));

            expect(author.id).toBeTruthy();
            expect(author.book.id).toBeTruthy();

            const authorInDB = await connection
              .getRepository(DummyAuthor)
              .findOneOrFail(author.id, {
                relations: ['book', 'book.author'],
              });

            expect(authorInDB.id).toBeTruthy();
            expect(authorInDB.book.id).toBeTruthy();
          });
        });
      });

      describe(`one-to-many`, () => {
        it.skip(`no cascade`, async () => {
          @Entity()
          class DummyAuthor {
            @PrimaryGeneratedColumn()
            id!: number;
            @Column()
            name!: string;
            @OneToMany(
              _ => DummyBook,
              book => book.author
            )
            @JoinColumn()
            @Fixture({ min: 3, max: 3 })
            books!: DummyBook[];
          }
          @Entity()
          class DummyBook {
            @PrimaryGeneratedColumn()
            id!: number;
            @Column()
            title!: string;
            @ManyToOne(
              _ => DummyAuthor,
              author => author.books
            )
            author!: DummyAuthor;
          }

          await connectToTypeORM([DummyAuthor, DummyBook], async connection => {
            factory.registerEntities();

            const author = await factory
              .make(DummyAuthor)
              .oneAndPersist(connection);

            expect(author.id).toBeTruthy();
            for (const book of author.books) {
              expect(book.id).toBeTruthy();
              expect(book.author.id).toBe(author.id);
            }

            const authorInDB = await connection
              .getRepository(DummyAuthor)
              .findOneOrFail(author.id, {
                relations: ['books', 'books.author'],
              });
            const booksRepo = connection.getRepository(DummyBook);
            const booksCount = await booksRepo.count();

            expect(authorInDB.id).toBeTruthy();
            expect(booksCount).toBe(3);
            for (const book of authorInDB.books) {
              expect(book.id).toBeTruthy();
              expect(book.author.id).toBe(author.id);
            }
          });
        });

        it(`cascade on generated side`, async () => {
          @Entity()
          class DummyAuthor {
            @PrimaryGeneratedColumn()
            id!: number;
            @Column()
            name!: string;
            @OneToMany(
              _ => DummyBook,
              book => book.author,
              { cascade: true }
            )
            @JoinColumn()
            @Fixture({ min: 3, max: 3 })
            books!: DummyBook[];
          }
          @Entity()
          class DummyBook {
            @PrimaryGeneratedColumn()
            id!: number;
            @Column()
            title!: string;
            @ManyToOne(
              _ => DummyAuthor,
              author => author.books
            )
            author!: DummyAuthor;
          }

          await connectToTypeORM([DummyAuthor, DummyBook], async connection => {
            factory.registerEntities();

            const author = await factory
              .make(DummyAuthor)
              .oneAndPersist(connection);

            expect(author.id).toBeTruthy();
            for (const book of author.books) {
              expect(book.id).toBeTruthy();
              expect(book.author.id).toBe(author.id);
            }

            const authorInDB = await connection
              .getRepository(DummyAuthor)
              .findOneOrFail(author.id, {
                relations: ['books', 'books.author'],
              });
            const booksRepo = connection.getRepository(DummyBook);
            const booksCount = await booksRepo.count();

            expect(authorInDB.id).toBeTruthy();
            expect(booksCount).toBe(3);
            for (const book of authorInDB.books) {
              expect(book.id).toBeTruthy();
              expect(book.author.id).toBe(author.id);
            }
          });
        });

        it(`cascade not on generated side`, async () => {
          @Entity()
          class DummyAuthor {
            @PrimaryGeneratedColumn()
            id!: number;
            @Column()
            name!: string;
            @OneToMany(
              _ => DummyBook,
              book => book.author
            )
            @JoinColumn()
            @Fixture({ min: 3, max: 3 })
            books!: DummyBook[];
          }
          @Entity()
          class DummyBook {
            @PrimaryGeneratedColumn()
            id!: number;
            @Column()
            title!: string;
            @ManyToOne(
              _ => DummyAuthor,
              author => author.books,
              { cascade: true }
            )
            author!: DummyAuthor;
          }

          await connectToTypeORM([DummyAuthor, DummyBook], async connection => {
            factory.registerEntities();

            const author = await factory
              .make(DummyAuthor)
              .oneAndPersist(connection);

            expect(author.id).toBeTruthy();
            for (const book of author.books) {
              expect(book.id).toBeTruthy();
              expect(book.author.id).toBe(author.id);
            }

            const authorInDB = await connection
              .getRepository(DummyAuthor)
              .findOneOrFail(author.id, {
                relations: ['books', 'books.author'],
              });
            const booksRepo = connection.getRepository(DummyBook);
            const booksCount = await booksRepo.count();

            expect(authorInDB.id).toBeTruthy();
            expect(booksCount).toBe(3);
            for (const book of authorInDB.books) {
              expect(book.id).toBeTruthy();
              expect(book.author.id).toBe(author.id);
            }
          });
        });
      });

      describe(`many-to-many`, () => {
        it(`no cascade`, async () => {
          @Entity()
          class DummyAuthor {
            @PrimaryGeneratedColumn()
            id!: number;
            @Column()
            name!: string;
            @ManyToMany(
              _ => DummyBook,
              book => book.authors
            )
            @JoinTable({ name: 'author_books' })
            @Fixture({
              min: 2,
              reuseCircularRelationships: false,
            })
            books!: DummyBook[];
          }
          @Entity()
          class DummyBook {
            @PrimaryGeneratedColumn()
            id!: number;
            @Column()
            title!: string;
            @ManyToMany(
              _ => DummyAuthor,
              author => author.books
            )
            @Fixture({
              min: 2,
              reuseCircularRelationships: false,
            })
            authors!: DummyAuthor[];
          }

          await connectToTypeORM([DummyAuthor, DummyBook], async connection => {
            factory.registerEntities();

            const author = await factory
              .make(DummyAuthor)
              .oneAndPersist(connection);

            expect(author.id).not.toBeUndefined();
            expect(author.books[0].id).not.toBeUndefined();
            expect(author.books[0].authors[0].id).not.toBeUndefined();

            const savedAuthor = await connection
              .getRepository(DummyAuthor)
              .findOneOrFail(author.id, {
                relations: ['books', 'books.authors', 'books.authors.books'],
              });

            expect(savedAuthor.id).not.toBeUndefined();
            expect(savedAuthor.books[0].id).not.toBeUndefined();
            expect(savedAuthor.books[0].authors[0].id).not.toBeUndefined();
          });
        });

        it(`cascade on generated side`, async () => {
          @Entity()
          class DummyAuthor {
            @PrimaryGeneratedColumn()
            id!: number;
            @Column()
            name!: string;
            @ManyToMany(
              _ => DummyBook,
              book => book.authors,
              { cascade: true }
            )
            @JoinTable({ name: 'author_books' })
            @Fixture({
              min: 2,
              reuseCircularRelationships: false,
            })
            books!: DummyBook[];
          }
          @Entity()
          class DummyBook {
            @PrimaryGeneratedColumn()
            id!: number;
            @Column()
            title!: string;
            @ManyToMany(
              _ => DummyAuthor,
              author => author.books
            )
            @Fixture({
              min: 2,
              reuseCircularRelationships: false,
            })
            authors!: DummyAuthor[];
          }

          await connectToTypeORM([DummyAuthor, DummyBook], async connection => {
            factory.registerEntities();

            const author = await factory
              .make(DummyAuthor)
              .oneAndPersist(connection);

            expect(author.id).not.toBeUndefined();
            expect(author.books[0].id).not.toBeUndefined();
            expect(author.books[0].authors[0].id).not.toBeUndefined();

            const savedAuthor = await connection
              .getRepository(DummyAuthor)
              .findOneOrFail(author.id, {
                relations: ['books', 'books.authors', 'books.authors.books'],
              });

            expect(savedAuthor.id).not.toBeUndefined();
            expect(savedAuthor.books[0].id).not.toBeUndefined();
            expect(savedAuthor.books[0].authors[0].id).not.toBeUndefined();
          });
        });

        it(`cascade on opposite side`, async () => {
          @Entity()
          class DummyAuthor {
            @PrimaryGeneratedColumn()
            id!: number;
            @Column()
            name!: string;
            @ManyToMany(
              _ => DummyBook,
              book => book.authors
            )
            @JoinTable({ name: 'author_books' })
            @Fixture({
              min: 2,
              reuseCircularRelationships: false,
            })
            books!: DummyBook[];
          }
          @Entity()
          class DummyBook {
            @PrimaryGeneratedColumn()
            id!: number;
            @Column()
            title!: string;
            @ManyToMany(
              _ => DummyAuthor,
              author => author.books,
              { cascade: true }
            )
            @Fixture({
              min: 2,
              reuseCircularRelationships: false,
            })
            authors!: DummyAuthor[];
          }

          await connectToTypeORM([DummyAuthor, DummyBook], async connection => {
            factory.registerEntities();

            const author = await factory
              .make(DummyAuthor)
              .oneAndPersist(connection);

            expect(author.id).not.toBeUndefined();
            expect(author.books[0].id).not.toBeUndefined();
            expect(author.books[0].authors[0].id).not.toBeUndefined();

            const savedAuthor = await connection
              .getRepository(DummyAuthor)
              .findOneOrFail(author.id, {
                relations: ['books', 'books.authors', 'books.authors.books'],
              });

            expect(savedAuthor.id).not.toBeUndefined();
            expect(savedAuthor.books[0].id).not.toBeUndefined();
            expect(savedAuthor.books[0].authors[0].id).not.toBeUndefined();
          });
        });
      });

      it(`Real world scenario`, async () => {
        await connectToTypeORM(
          [
            TypeORMArticle,
            TypeORMComment,
            TypeORMFavorite,
            TypeORMTag,
            TypeORMUser,
            TypeORMFollow,
          ],
          async connection => {
            factory.registerEntities();

            const user = await factory
              .make(TypeORMUser, {
                reuseCircularRelationships: false,
              })
              .oneAndPersist(connection);

            expect(user.id).toBeDefined();
          }
        );
      });
    });
  });
});
