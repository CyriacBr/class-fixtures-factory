import { FixtureFactory, Assigner } from '../src/FixtureFactory';
import { Fixture } from '../src/decorators/Fixture';
import { factory } from './fixtures';

describe(`FixtureFactory`, () => {
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
      class DummyBook {
        @Fixture()
        title!: string;
      }
      class DummyAuthor {
        @Fixture()
        name!: string;
        @Fixture()
        age!: string;
        @Fixture()
        book!: DummyBook;
      }
      factory.register([DummyAuthor, DummyBook]);

      const result = factory
        .make(DummyAuthor)
        .ignore('age', 'book.title')
        .one();
      expect(result.age).toBeUndefined();
      expect(result.book.title).toBeUndefined();
      expect(result.name).not.toBeUndefined();
    });

    describe(`make().with()`, () => {
      it(`replace a scalar`, () => {
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

      it(`replace an object`, () => {
        class DummyBook {}
        class DummyAuthor {
          @Fixture()
          book!: DummyBook;
        }
        factory.register([DummyAuthor, DummyBook]);

        const result = factory
          .make(DummyAuthor)
          .with({
            book: 'foo',
          })
          .one();
        expect(result.book).toBe('foo');
      });

      it(`replace a nested prop`, () => {
        class DummyBook {
          @Fixture()
          title!: string;
        }
        class DummyAuthor {
          @Fixture()
          book!: DummyBook;
        }
        factory.register([DummyAuthor, DummyBook]);

        const result = factory
          .make(DummyAuthor)
          .with({
            'book.title': 'foo',
          })
          .one();
        expect(result.book.title).toBe('foo');
      });

      it(`replace a nested prop through an array`, () => {
        class DummyBook {
          @Fixture({ get: () => 'bar' })
          title!: string;
        }
        class DummyAuthor {
          @Fixture({ type: () => [DummyBook], min: 2, max: 2 })
          books!: DummyBook[];
        }
        factory.register([DummyAuthor, DummyBook]);

        const result = factory
          .make(DummyAuthor)
          .with({
            'books.1.title': 'foo',
          })
          .one();
        expect(result.books[0].title).not.toBe('foo');
        expect(result.books[1].title).toBe('foo');
      });
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

    it(`@Fixture({ type })`, () => {
      class Person {
        @Fixture({ type: () => Number })
        value!: 'a' | 'b' | 'c';
      }
      factory.register([Person]);

      const person = factory.make(Person).one();
      expect(typeof person.value).toBe('number');
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

    it(`number with min and max`, () => {
      class Person {
        @Fixture({ min: 800, max: 1000 })
        age!: number;
      }
      factory.register([Person]);

      const person = factory.make(Person).one();
      expect(typeof person.age).toBe('number');
      expect(person.age >= 800 && person.age <= 1000).toBe(true);
    });

    it(`number with precision`, () => {
      class Person {
        @Fixture({ precision: 4, min: 1000, max: 1000.9999 })
        age!: number;
      }
      factory.register([Person]);

      const person = factory.make(Person).one();
      expect(typeof person.age).toBe('number');
      expect(person.age >= 1000.0001 && person.age <= 1000.9999).toBe(true);
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

    it(`class [many to many]`, () => {
      class Book {
        @Fixture({ type: () => [BookTag] })
        tags!: BookTag[];
      }
      class BookTag {
        @Fixture({ type: () => [Book] })
        books!: Book[];
      }
      factory.register([BookTag, Book]);

      const book = factory.make(Book).one();
      expect(book.tags[0]).toBeInstanceOf(BookTag);
      expect(book.tags[0].books[0]).toBeInstanceOf(Book);
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

    it(`custom assigner`, () => {
      const factory = new FixtureFactory();
      const assigner: Assigner = (prop, obj, _value) => {
        obj[prop.name] = 'foo';
      };
      const mock = jest.fn((...args: Parameters<Assigner>) =>
        assigner(...args)
      );
      class Author {
        @Fixture()
        name!: string;
      }
      factory.register([Author]);
      factory.setAssigner(mock);

      const author = factory.make(Author).one();

      expect(mock).toHaveBeenCalled();
      expect(author.name).toBe('foo');
    });
  });

  describe(`circular references support`, () => {
    describe(`depthLevel`, () => {
      it(`[maxDepthLevel = 0]`, () => {
        class DummyAuthor {
          @Fixture({ type: () => DummyBook })
          book!: DummyBook;
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory.make(DummyAuthor, { maxDepthLevel: 0 }).one();
        /**
         * no relationships are generated
         */
        expect(author.book).toBeUndefined();
      });

      it(`[maxDepthLevel = 0] with a one-to-many relationship`, () => {
        class DummyAuthor {
          @Fixture({ type: () => [DummyBook] })
          books!: DummyBook[];
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          title!: string;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory.make(DummyAuthor, { maxDepthLevel: 0 }).one();
        /**
         * no relationships are generated
         */
        expect(author.books.length).toBe(0);
      });

      it(`[maxDepthLevel = 3]`, () => {
        class DummyAuthor {
          @Fixture({ type: () => DummyBook })
          book!: DummyBook;
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxDepthLevel: 3,
            reuseCircularRelationships: false,
            maxOccurrencesPerPath: Infinity,
          })
          .one();
        /**
         * up tp 3 nested relationships are generated
         */
        expect(author.book).toBeDefined();
        expect(author.book.author).toBeDefined();
        expect(author.book.author.book).toBeDefined();
        expect(author.book.author.book.author).toBeUndefined();
      });

      it(`[maxDepthLevel = 3] with a one-to-many relationship`, () => {
        class DummyAuthor {
          @Fixture({ type: () => [DummyBook], min: 2, max: 2 })
          books!: DummyBook[];
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxDepthLevel: 3,
            reuseCircularRelationships: false,
            maxOccurrencesPerPath: Infinity,
          })
          .one();
        /**
         * up to 3 nested relationships are generated for each path
         */
        for (let i = 0; i < 2; i++) {
          expect(author.books[i]).toBeDefined();
          expect(author.books[i].author).toBeDefined();
          for (let j = 0; j < 2; j++) {
            expect(author.books[i].author.books[j]).toBeDefined();
            expect(author.books[i].author.books[j].author).toBeUndefined();
          }
        }
      });

      it(`[maxDepthLevel = 3] with a many-to-many relationship`, () => {
        class DummyAuthor {
          @Fixture({ type: () => [DummyBook], min: 2, max: 2 })
          books!: DummyBook[];
        }
        class DummyBook {
          @Fixture({ type: () => [DummyAuthor], min: 2, max: 2 })
          authors!: DummyAuthor[];
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxDepthLevel: 4,
            reuseCircularRelationships: false,
            maxOccurrencesPerPath: Infinity,
          })
          .one();
        /**
         * up to 4 nested relationships are generated for each path, including nested array paths
         */
        for (let i = 0; i < 2; i++) {
          expect(author.books[i]).toBeDefined();
          expect(author.books[i].authors[0]).toBeDefined();
          for (let j = 0; j < 2; j++) {
            expect(author.books[i].authors[0].books[j]).toBeDefined();
            expect(
              author.books[i].authors[0].books[j].authors[0]
            ).toBeDefined();
            expect(
              author.books[i].authors[0].books[j].authors[0].books[0]
            ).toBeUndefined();
          }
        }
      });

      it(`overrode at prop level`, () => {
        class DummyAuthor {
          @Fixture({ type: () => DummyBook })
          book!: DummyBook;
          @Fixture({ type: () => DummyBook, maxDepthLevel: 1 })
          book2!: DummyBook;
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory.make(DummyAuthor, { maxDepthLevel: 0 }).one();
        expect(author.book).toBeUndefined();
        expect(author.book2).toBeTruthy();
      });
    });

    // TODO: handle author.friend case
    describe(`reuseCircularRelationships`, () => {
      it(`[reuseCircularRelationships = false]`, () => {
        class DummyAuthor {
          @Fixture({ type: () => DummyBook })
          book!: DummyBook;
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 10,
            reuseCircularRelationships: false,
          })
          .one();
        /**
         * new instances are created for each relationship
         */
        expect(author.book.author).toBeInstanceOf(DummyAuthor);
        expect(author.book.author).not.toBe(author);
        expect(author.book.author.book).toBeInstanceOf(DummyBook);
        expect(author.book.author.book).not.toBe(author.book);
      });

      it(`[reuseCircularRelationships = false] with a one-to-many relationship`, () => {
        class DummyAuthor {
          @Fixture({ type: () => [DummyBook], min: 2, max: 2 })
          books!: DummyBook[];
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 10,
            reuseCircularRelationships: false,
          })
          .one();
        /**
         * new instances are created for each relationship
         */
        expect(author.books[0].author).toBeInstanceOf(DummyAuthor);
        expect(author.books[0].author).not.toBe(author);
        expect(author.books[0].author.books[0]).toBeInstanceOf(DummyBook);
        expect(author.books[0].author.books[0]).not.toBe(author.books[0]);
      });

      it(`[reuseCircularRelationships = false] with a many-to-many relationship`, () => {
        class DummyAuthor {
          @Fixture({ type: () => [DummyBook], min: 2, max: 2 })
          books!: DummyBook[];
        }
        class DummyBook {
          @Fixture({ type: () => [DummyAuthor], min: 2, max: 2 })
          authors!: DummyAuthor[];
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxDepthLevel: 10,
            maxOccurrencesPerPath: 10,
            reuseCircularRelationships: false,
          })
          .one();
        /**
         * new instances are created for each relationship
         */
        expect(author.books[0].authors[0]).toBeInstanceOf(DummyAuthor);
        expect(author.books[0].authors[0]).not.toBe(author);
        expect(author.books[0].authors[0].books[0]).toBeInstanceOf(DummyBook);
        expect(author.books[0].authors[0].books[0]).not.toBe(author.books[0]);
        expect(author.books[0].authors[0].books[0].authors[0]).toBeInstanceOf(
          DummyAuthor
        );
        expect(author.books[0].authors[0].books[0].authors[0]).not.toBe(author);
      });

      it(`[reuseCircularRelationships = true]`, () => {
        class DummyAuthor {
          @Fixture({ type: () => DummyBook })
          book!: DummyBook;
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 1,
            reuseCircularRelationships: true,
          })
          .one();
        /**
         * old instances are reused for each new relationship
         */
        expect(author.book.author).toBeInstanceOf(DummyAuthor);
        expect(author.book.author).toBe(author);
        expect(author.book.author.book).toBeInstanceOf(DummyBook);
        expect(author.book.author.book).toBe(author.book);
      });

      it(`[reuseCircularRelationships = true] with one-to-many relationship`, () => {
        class DummyAuthor {
          @Fixture({ type: () => [DummyBook], min: 2, max: 2 })
          books!: DummyBook[];
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 1,
            reuseCircularRelationships: true,
          })
          .one();
        /**
         * old instances are reused for each new relationship
         * but each instance in an array is unique
         */
        expect(author.books[0].author).toBeInstanceOf(DummyAuthor);
        expect(author.books[0].author).toBe(author);
        expect(author.books[1]).not.toBe(author.books[0]); // each instance in an array is unique
        expect(author.books[0].author.books[0]).toBeInstanceOf(DummyBook);
        expect(author.books[0].author.books[0]).toBe(author.books[0]);
      });

      it(`[reuseCircularRelationships = true] with many-to-many relationship`, () => {
        class DummyAuthor {
          @Fixture({ type: () => [DummyBook], min: 2, max: 2 })
          books!: DummyBook[];
        }
        class DummyBook {
          @Fixture({ type: () => [DummyAuthor], min: 2, max: 2 })
          authors!: DummyAuthor[];
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 1,
            reuseCircularRelationships: true,
          })
          .one();
        /**
         * old instances are reused for each new relationship
         * but each instance in an array is unique
         */
        expect(author.books[0].authors[0]).toBeInstanceOf(DummyAuthor);
        expect(author.books[0].authors[0]).toBe(author);
        expect(author.books[0].authors[1]).not.toBe(author); // each instance in an array is unique
        expect(author.books[0].authors[0].books[0]).toBeInstanceOf(DummyBook);
        expect(author.books[0].authors[0].books[0]).toBe(author.books[0]);
        expect(author.books[0].authors[0].books[0].authors[0]).toBeInstanceOf(
          DummyAuthor
        );
        expect(author.books[0].authors[0].books[0].authors[0]).toBe(author);
      });

      it(`[reuseCircularRelationships = true] reuse is based on path`, () => {
        class A {
          @Fixture({ type: () => [B], min: 2, max: 2 })
          bItems!: B[];
        }
        class B {
          @Fixture({ type: () => D })
          d!: D;
        }
        class C {
          @Fixture({ type: () => D })
          d!: D;
        }
        class D {
          @Fixture({ type: () => C })
          c!: C;
        }
        factory.register([A, B, C, D]);

        const a = factory
          .make(A, {
            maxOccurrencesPerPath: 1,
            reuseCircularRelationships: true,
          })
          .one();

        expect(a.bItems[0].d).not.toBe(a.bItems[1].d);
        expect(a.bItems[0].d.c.d).toBe(a.bItems[0].d);
        expect(a.bItems[1].d.c.d).toBe(a.bItems[1].d);
        expect(a.bItems[0].d.c.d).not.toBe(a.bItems[1].d.c.d); // reused D instance from first path is not the same from the second path
      });

      it(`[reuseCircularRelationships = true] direct friendships are not reused`, () => {
        class DummyAuthor {
          @Fixture({ type: () => DummyBook })
          book!: DummyBook;
          @Fixture({ type: () => DummyAuthor })
          friend!: DummyAuthor;
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 1,
            reuseCircularRelationships: true,
            doNotReuseDirectFriendship: true,
          })
          .one();

        expect(author.friend).not.toBe(author);
        expect(author.friend.book.author).toBe(author.friend);
        expect(author.friend.friend).toBe(author);
        expect(author.friend.book.author.friend).toBe(author);
      });

      it(`overrode at prop level`, () => {
        class DummyAuthor {
          @Fixture({ type: () => DummyBook })
          book!: DummyBook;
        }
        class DummyBook {
          @Fixture({
            type: () => DummyAuthor,
            reuseCircularRelationships: true,
            maxOccurrencesPerPath: 1,
          })
          author2!: DummyAuthor;
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 10,
            reuseCircularRelationships: false,
          })
          .one();
        /**
         * new instances are created for each relationship
         */
        expect(author.book.author).toBeInstanceOf(DummyAuthor);
        expect(author.book.author).not.toBe(author);
        expect(author.book.author2).toBe(author);
        expect(author.book.author.book).toBeInstanceOf(DummyBook);
        expect(author.book.author.book).not.toBe(author.book);
      });
    });

    describe(`maxOccurrencePerPath`, () => {
      it(`[maxOccurrencePerPath = 1]`, () => {
        class DummyAuthor {
          @Fixture({ type: () => DummyBook })
          book!: DummyBook;
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 1,
            reuseCircularRelationships: false,
          })
          .one();
        /**
         * the Author instance is created only once
         */
        expect(author.book.author).toBeUndefined();
      });

      it(`[maxOccurrencePerPath = 1] with one-to-many relationship`, () => {
        class DummyAuthor {
          @Fixture({ type: () => [DummyBook] })
          books!: DummyBook[];
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 1,
            reuseCircularRelationships: false,
          })
          .one();
        /**
         * the Author instance is created only once
         */
        expect(author.books[0].author).toBeUndefined();
      });

      it(`[maxOccurrencePerPath = 1] with many-to-many relationship`, () => {
        class DummyAuthor {
          @Fixture({ type: () => [DummyBook] })
          books!: DummyBook[];
        }
        class DummyBook {
          @Fixture({ type: () => [DummyAuthor] })
          authors!: DummyAuthor[];
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 1,
            reuseCircularRelationships: false,
          })
          .one();
        /**
         * the Author instance is created only once
         */
        expect(author.books[0].authors[0]).toBeUndefined();
      });

      it(`[maxOccurrencePerPath > 1]`, () => {
        class DummyAuthor {
          @Fixture({ type: () => DummyBook })
          book!: DummyBook;
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 2,
            reuseCircularRelationships: false,
          })
          .one();
        /**
         * the Author instance is created multiple times
         */
        expect(author.book.author).toBeDefined();
      });

      it(`[maxOccurrencePerPath > 1] with one-to-many relationship`, () => {
        class DummyAuthor {
          @Fixture({ type: () => [DummyBook] })
          books!: DummyBook[];
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 2,
            reuseCircularRelationships: false,
          })
          .one();
        /**
         * the Author instance is created multiple times
         */
        expect(author.books[0].author).toBeDefined();
      });

      it(`[maxOccurrencePerPath > 1] with many-to-many relationship`, () => {
        class DummyAuthor {
          @Fixture({ type: () => [DummyBook] })
          books!: DummyBook[];
        }
        class DummyBook {
          @Fixture({ type: () => [DummyAuthor] })
          authors!: DummyAuthor[];
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 2,
            reuseCircularRelationships: false,
          })
          .one();
        /**
         * the Author instance is created multiple times
         */
        expect(author.books[0].authors[0]).toBeDefined();
      });

      it(`overrode at prop level`, () => {
        class DummyAuthor {
          @Fixture({ type: () => DummyBook })
          book!: DummyBook;
        }
        class DummyBook {
          @Fixture({ type: () => DummyAuthor })
          author!: DummyAuthor;
          @Fixture({ type: () => DummyAuthor, maxOccurrencesPerPath: 2 })
          author2!: DummyAuthor;
        }
        factory.register([DummyAuthor, DummyBook]);

        const author = factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 1,
            reuseCircularRelationships: false,
          })
          .one();
        /**
         * the Author instance is created only once
         */
        expect(author.book.author).toBeUndefined();
        expect(author.book.author2).toBeTruthy();
      });
    });

    it(`timeout when factory takes too long`, () => {
      class DummyAuthor {
        @Fixture({ type: () => [DummyBook], min: 2, max: 2 })
        books!: DummyBook[];
      }
      class DummyBook {
        @Fixture({ type: () => [DummyAuthor], min: 2, max: 2 })
        authors!: DummyAuthor[];
      }
      factory.register([DummyAuthor, DummyBook]);

      expect(() =>
        factory
          .make(DummyAuthor, {
            maxOccurrencesPerPath: 10,
            reuseCircularRelationships: false,
            partialResultOnError: false,
            lazy: false, // when run through factory-lazy.test, lazy must be false, because a lazily generation cannot timeout
          })
          .one()
      ).toThrow();
    }, 4000);
  });
});
