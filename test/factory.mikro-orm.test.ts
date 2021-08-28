import { Collection, MikroORM } from '@mikro-orm/core';
import { MikroORMFixtureFactory } from '../src/plugins/mikro-orm';
import { connectToMikroORM } from './fixtures';
import '../src/plugins/mikro-orm';
import {
  Address,
  Dummy,
  Dummy2,
  Dummy3,
  DummyWithUnique,
  DummyWithUnique2,
  ManyToManyDummyAuthor,
  ManyToManyDummyBook,
  OneToManyDummyAuthor,
  OneToManyDummyBook,
  OneToOneDummyAuthor,
  OneToOneDummyBook,
  Pet,
  Photo,
  Profile,
} from './fixtures/mikro-orm-fixture-entities';
import {
  MikroORMArticle,
  MikroORMComment,
  MikroORMFavorite,
  MikroORMFollow,
  MikroORMTag,
  MikroORMUser,
} from './fixtures/mikro-orm-entities';

jest.setTimeout(30000 * 20);

describe(`FixtureFactory`, () => {
  let factory: MikroORMFixtureFactory;
  let orm: MikroORM;

  beforeAll(async () => {
    await connectToMikroORM(
      [
        Dummy,
        Dummy2,
        Profile,
        Photo,
        Pet,
        Address,
        DummyWithUnique,
        Dummy3,
        DummyWithUnique2,
        OneToOneDummyAuthor,
        OneToOneDummyBook,
        OneToManyDummyAuthor,
        OneToManyDummyBook,
        ManyToManyDummyAuthor,
        ManyToManyDummyBook,
        MikroORMUser,
        MikroORMArticle,
        MikroORMComment,
        MikroORMFavorite,
        MikroORMFollow,
        MikroORMTag,
      ],
      _orm => {
        factory = new MikroORMFixtureFactory(_orm);
        orm = _orm;
      }
    );
  });

  describe(`With MikroORM`, () => {
    describe(`Generating primary columns`, () => {
      it(`@PrimaryKey[type = Number] is not generated when "handlePrimaryColumns" is false`, () => {
        const dummy = factory
          .make(Dummy, { handlePrimaryColumns: false })
          .one();
        expect(dummy.id).toBeUndefined();
      });

      it(`@PrimaryKey[type = Number] is generated when "handlePrimaryColumns" is true`, () => {
        const dummy = factory.make(Dummy, { handlePrimaryColumns: true }).one();
        expect(typeof dummy.id === 'number').toBe(true);
        expect(dummy.id).not.toBeNaN();
      });

      it(`@PrimaryKey[type = String] is not generated when "handlePrimaryColumns" is false`, () => {
        const dummy = factory
          .make(Dummy2, { handlePrimaryColumns: false })
          .one();
        expect(dummy.id).toBeUndefined();
      });

      it(`@PrimaryKey[type = String] is generated when "handlePrimaryColumns" is true`, () => {
        const dummy = factory
          .make(Dummy2, { handlePrimaryColumns: true })
          .one();
        expect(typeof dummy.id === 'string').toBe(true);
        expect(dummy.id).toMatch(
          /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/i
        );
      });
    });

    describe(`Generating normal columns`, () => {
      it(`Scalar columns are correctly generated`, () => {
        const dummy = factory.make(Dummy).one();
        expect(typeof dummy.strVal === 'string').toBe(true);
        expect(typeof dummy.nbrVal === 'number').toBe(true);
        expect(dummy.dateVal).toBeInstanceOf(Date);
        expect(typeof dummy.boolVal === 'boolean').toBe(true);
      });

      it(`Generated string is restricted by "length" option`, () => {
        const metadata = factory.getStore().get(Dummy);
        const propMeta = metadata.properties.find(v => v.name === 'strWithLen');
        expect(propMeta).toMatchObject({
          max: 4,
        });

        const dummy = factory.make(Dummy).one();
        expect(typeof dummy.strWithLen === 'string').toBe(true);
        expect(dummy.strWithLen.length <= 4).toBe(true);
      });

      it(`Generated property respect the "default" option`, () => {
        const dummy = factory.make(Dummy).one();
        expect(dummy.valWithDefault).toBe('lmao');
      });

      it(`String enums are correctly generated`, () => {
        const metadata = factory.getStore().get(Dummy);
        const propMeta = metadata.properties.find(v => v.name === 'role');
        expect(propMeta).toMatchObject({
          type: 'string',
          scalar: true,
          items: ['admin', 'moderator', 'user'],
        });

        const dummy = factory.make(Dummy).one();
        expect(typeof dummy.role).toBe('string');
        expect(['admin', 'moderator', 'user']).toContain(dummy.role);
      });

      it(`Number enums are correctly generated`, () => {
        const metadata = factory.getStore().get(Dummy);
        const propMeta = metadata.properties.find(v => v.name === 'status');
        expect(propMeta).toMatchObject({
          type: 'number',
          scalar: true,
          items: [0, 1],
        });

        const dummy = factory.make(Dummy).one();
        expect(typeof dummy.status).toBe('number');
        expect([0, 1]).toContain(dummy.status);
      });

      it(`one-to-one is correctly generated`, () => {
        const metadata = factory.getStore().get(Dummy);
        const propMeta = metadata.properties.find(v => v.name === 'profile');
        expect(propMeta).toMatchObject({
          type: 'Profile',
        });

        const dummy = factory.make(Dummy).one();
        expect(dummy.profile).toBeInstanceOf(Profile);
        expect(dummy.profile.gender).not.toBeUndefined();
      });

      it(`one-to-many is correctly generated`, () => {
        const metadata = factory.getStore().get(Dummy);
        const photosMeta = metadata.properties.find(v => v.name === 'photos');
        expect(photosMeta).toMatchObject({
          type: 'Photo',
          array: true,
        });

        const dummy = factory.make(Dummy).one();
        expect(dummy.photos).toBeInstanceOf(Collection);
        dummy.photos.getItems().forEach(v => {
          expect(v).toBeInstanceOf(Photo);
          expect(v.user).not.toBeUndefined();
        });
      });

      it(`many-to-many is correctly generated`, () => {
        const metadata = factory.getStore().get(Dummy);
        const petsMeta = metadata.properties.find(v => v.name === 'pets');
        expect(petsMeta).toMatchObject({
          type: 'Pet',
          array: true,
        });

        const dummy = factory.make(Dummy).one();
        expect(dummy.pets).toBeInstanceOf(Collection);
        dummy.pets.getItems().forEach(v => {
          expect(v).toBeInstanceOf(Pet);
          expect(v.users).toBeInstanceOf(Collection);
          v.users.getItems().forEach(v => {
            expect(v).toBeInstanceOf(Dummy);
          });
        });
      });

      it(`embedded is correctly generated`, () => {
        const metadata = factory.getStore().get(Dummy);
        const propMeta = metadata.properties.find(v => v.name === 'address');
        expect(propMeta).toMatchObject({
          type: 'Address',
        });

        const dummy = factory.make(Dummy).one();
        expect(dummy.address).toBeInstanceOf(Address);
        expect(dummy.address.city).not.toBeUndefined();
      });
    });

    describe(`Unique indexes are correctly handled`, () => {
      it(`@Unique(`, () => {
        const val1Meta = factory
          .getStore()
          .get(DummyWithUnique)
          .properties.find(v => v.name === 'val1');
        const val2Meta = factory
          .getStore()
          .get(DummyWithUnique)
          .properties.find(v => v.name === 'val2');
        const val3Meta = factory
          .getStore()
          .get(DummyWithUnique)
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
        // relationships are unique by default
        expect(val3Meta).toMatchObject({
          unique: true,
          type: 'Dummy3',
          scalar: false,
        });
      });

      it(`@Unique(properties: [colA, colB])`, () => {
        const val1Meta = factory
          .getStore()
          .get(DummyWithUnique2)
          .properties.find(v => v.name === 'val1');
        const val2Meta = factory
          .getStore()
          .get(DummyWithUnique2)
          .properties.find(v => v.name === 'val2');
        const val3Meta = factory
          .getStore()
          .get(DummyWithUnique2)
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
        // relationships are unique by default
        expect(val3Meta).toMatchObject({
          unique: true,
          type: 'Dummy3',
          scalar: false,
        });
      });
    });

    describe(`Persisting relationships`, () => {
      it(`one-to-one`, async () => {
        const author = await factory.make(OneToOneDummyAuthor).oneAndPersist();

        expect(author.id).toBeTruthy();
        expect(author.book.id).toBeTruthy();

        const authorInDB = await orm.em
          .getRepository(OneToOneDummyAuthor)
          .findOneOrFail(author.id, {
            populate: ['book', 'book.author'],
          });

        expect(authorInDB.id).toBeTruthy();
        expect(authorInDB.book.id).toBeTruthy();
      });

      it(`many-to-one`, async () => {
        const author = await factory.make(OneToManyDummyAuthor).oneAndPersist();

        expect(author.id).toBeTruthy();
        for (const book of author.books) {
          expect(book.id).toBeTruthy();
          expect(book.author.id).toBe(author.id);
        }

        const authorInDB = await orm.em
          .getRepository(OneToManyDummyAuthor)
          .findOneOrFail(author.id, {
            populate: ['books', 'books.author'],
          });
        const booksRepo = orm.em.getRepository(OneToManyDummyBook);
        const booksCount = await booksRepo.count();

        expect(authorInDB.id).toBeTruthy();
        expect(booksCount).toBe(3);
        for (const book of authorInDB.books) {
          expect(book.id).toBeTruthy();
          expect(book.author.id).toBe(author.id);
        }
      });

      it(`many-to-many`, async () => {
        const author = await factory
          .make(ManyToManyDummyAuthor)
          .oneAndPersist();

        expect(author.id).not.toBeUndefined();
        expect(author.books[0].id).not.toBeUndefined();
        expect(author.books[0].authors[0].id).not.toBeUndefined();

        const savedAuthor = await orm.em
          .getRepository(ManyToManyDummyAuthor)
          .findOneOrFail(author.id, {
            populate: ['books', 'books.authors', 'books.authors.books'],
          });

        expect(savedAuthor.id).not.toBeUndefined();
        expect(savedAuthor.books[0].id).not.toBeUndefined();
        expect(savedAuthor.books[0].authors[0].id).not.toBeUndefined();
      });

      it(`Real world scenario`, async () => {
        const user = await factory.make(MikroORMUser).oneAndPersist();

        expect(user.id).not.toBeUndefined();
      });
    });
  });
});
