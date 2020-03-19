import { FixtureFactory } from '../src/FixtureFactory';
import { Fixture } from '../src/decorators/Fixture';

describe(`FixtureFactory`, () => {
  const factory = new FixtureFactory({ logging: true });

  it(`makes metadata of registered entities`, () => {
    class DummyAuthor {}
    class DummyBook {}

    factory.register([DummyAuthor, DummyBook]);

    expect(factory.getStore().get(DummyAuthor)).toBeDefined();
    expect(factory.getStore().get(DummyBook)).toBeDefined();
  });

  describe(`factory result`, () => {
    it(`make().one()`, () => {
      class DummyAuthor {}
      factory.register([DummyAuthor]);

      const result = factory.make(DummyAuthor);
      expect(typeof result.one).toBe('function');
      expect(result.one()).toBeInstanceOf(DummyAuthor);
    });

    it(`make().many()`, () => {
      class DummyAuthor {}
      factory.register([DummyAuthor]);

      const result = factory.make(DummyAuthor);
      expect(typeof result.many).toBe('function');
      const authors = result.many(5);
      expect(Array.isArray(authors)).toBe(true);
      expect(authors.length).toBe(5);
      expect(authors[0]).toBeInstanceOf(DummyAuthor);
    });

    it(`make().ignore()`, () => {
      class DummyAuthor {
        @Fixture()
        name!: string;
        @Fixture()
        age!: string;
      }
      factory.register([DummyAuthor]);

      const result = factory
        .make(DummyAuthor)
        .ignore('age')
        .one();
      expect(result.age).toBeUndefined();
    });

    it(`make().with()`, () => {
      class DummyAuthor {
        @Fixture()
        name!: string;
      }
      factory.register([DummyAuthor]);

      const result = factory
        .make(DummyAuthor)
        .with({
          name: 'foo',
        })
        .one();
      expect(result.name).toBe('foo');
    });
  });

  describe(`generating properties`, () => {
    it(`@Fixture(string)`, () => {
      class Person {
        @Fixture('{{name.lastName}}')
        lastName!: string;
      }
      factory.register([Person]);

      const person = factory.make(Person).one();
      expect(typeof person.lastName).toBe('string');
    });

    it(`@Fixture(faker => string)`, () => {
      class Person {
        @Fixture(faker => faker?.name.lastName())
        lastName!: string;
      }
      factory.register([Person]);

      const person = factory.make(Person).one();
      expect(typeof person.lastName).toBe('string');
    });

    it(`@Fixture(() => any)`, () => {
      class Person {
        @Fixture(() => ({ foo: 'bar' }))
        obj: any;
      }
      factory.register([Person]);

      const person = factory.make(Person).one();
      expect(person.obj).toMatchObject({ foo: 'bar' });
    });

    it(`string`, () => {
      class Person {
        @Fixture()
        lastName!: string;
      }
      factory.register([Person]);

      const person = factory.make(Person).one();
      expect(typeof person.lastName).toBe('string');
    });

    it(`number`, () => {
      class Person {
        @Fixture()
        age!: number;
      }
      factory.register([Person]);

      const person = factory.make(Person).one();
      expect(typeof person.age).toBe('number');
    });

    it(`boolean`, () => {
      class Person {
        @Fixture()
        working!: boolean;
      }
      factory.register([Person]);

      const person = factory.make(Person).one();
      expect(typeof person.working).toBe('boolean');
    });

    it(`Date`, () => {
      class Person {
        @Fixture()
        birthdate!: Date;
      }
      factory.register([Person]);

      const person = factory.make(Person).one();
      expect(person.birthdate).toBeInstanceOf(Date);
    });

    it(`number enum`, () => {
      enum Mood {
        HAPPY,
        NEUTRAL,
        SAD,
      }
      class Person {
        @Fixture({ enum: Mood })
        mood!: Mood;
      }
      factory.register([Person]);

      const person = factory.make(Person).one();
      expect([0, 1, 2].includes(person.mood)).toBe(true);
    });

    it(`string enum`, () => {
      enum PetPreference {
        DOG = 'DOG',
        CAT = 'CAT',
      }
      class Person {
        @Fixture({ enum: PetPreference })
        petPreference!: PetPreference;
      }
      factory.register([Person]);

      const person = factory.make(Person).one();
      expect(['DOG', 'CAT'].includes(person.petPreference)).toBe(true);
    });

    it(`array`, () => {
      class Person {
        @Fixture({ type: () => [String], min: 3, max: 3 })
        surnames!: string[];
      }
      factory.register([Person]);

      const person = factory.make(Person).one();
      expect(Array.isArray(person.surnames)).toBe(true);
      expect(person.surnames.length).toBe(3);
      expect(typeof person.surnames[0]).toBe('string');
    });

    it(`class`, () => {
      class Book {
        @Fixture()
        title!: string;
      }
      class Person {
        @Fixture()
        book!: Book;
      }
      factory.register([Person, Book]);

      const person = factory.make(Person).one();
      expect(person.book).toBeInstanceOf(Book);
      expect(typeof person.book.title).toBe('string');
    });

    it(`class [prevent circular ref]`, () => {
      class Book {
        @Fixture()
        title!: string;
        @Fixture({ type: () => Person })
        author!: Person;
      }
      class Person {
        @Fixture({ type: () => Book })
        book!: Book;
      }
      factory.register([Person, Book]);

      const person = factory.make(Person).one();
      expect(person.book).toBeInstanceOf(Book);
      expect(person.book.author).toBeUndefined();
    });

    it(`multi-level nesting`, () => {
      class Author {
        @Fixture()
        name!: string;
        @Fixture({ type: () => [Book] })
        books!: Book[];
      }
      class Book {
        @Fixture()
        title!: string;
        @Fixture({ type: () => [BookTag] })
        tags!: BookTag[];
      }
      class BookTag {
        @Fixture()
        label!: string;
        @Fixture({ type: () => BookTagCategory })
        category!: BookTagCategory;
      }
      class BookTagCategory {
        @Fixture()
        label!: string;
      }
      factory.register([Author, Book, BookTag, BookTagCategory]);

      const author = factory.make(Author).one();
      expect(author.books[0]).toBeDefined();
      expect(author.books[0].tags[0]).toBeDefined();
      expect(author.books[0].tags[0].category).toBeDefined();
    });
  });
});