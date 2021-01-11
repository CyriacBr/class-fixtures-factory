import { FixtureFactory, Assigner } from '../src/FixtureFactory';
import { Fixture } from '../src/decorators/Fixture';
import {
  IsIn,
  Equals,
  IsPositive,
  Min,
  Max,
  MinDate,
  MaxDate,
  Contains,
  IsAlpha,
  IsAlphanumeric,
  IsEmail,
  IsFQDN,
  IsHexColor,
  IsLowercase,
  IsUppercase,
  Length,
  MinLength,
  MaxLength,
  ArrayContains,
  ArrayMinSize,
  ArrayMaxSize,
  IsNegative,
  IsString,
  IsNumber,
  IsNumberString,
  IsDate,
  IsOptional,
} from 'class-validator';

describe(`FixtureFactory`, () => {
  const factory = new FixtureFactory({ logging: false });

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
      expect(book.tags[0].books).toBeUndefined();
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
      const factory = new FixtureFactory({ logging: true });
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

  describe(`with class-validator`, () => {
    it(`throws if type can't be resolved`, () => {
      class Dummy {
        @IsOptional()
        val!: string;
      }
      expect(() => factory.register([Dummy])).toThrow(
        `Couldn't extract the type of "val". Use @Fixture({ type: () => Foo })`
      );
    });

    it(`@IsIn()`, () => {
      class Dummy {
        @IsIn(['a', 'b', 'c'])
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(['a', 'b', 'c'].includes(dummy.val)).toBe(true);
    });

    it(`@Equals()`, () => {
      class Dummy {
        @Equals('foo')
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toBe('foo');
    });

    it(`@IsPositive()`, () => {
      class Dummy {
        @IsPositive()
        val!: number;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val > 0).toBe(true);
    });

    it(`@IsNegative()`, () => {
      class Dummy {
        @IsNegative()
        val!: number;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val < 0).toBe(true);
    });

    it(`@Min() `, () => {
      class Dummy {
        @Min(500)
        val!: number;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val >= 500).toBe(true);
    });

    it(`@Max() `, () => {
      class Dummy {
        @Max(500)
        val!: number;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val <= 500).toBe(true);
    });

    it(`@MinDate() `, () => {
      const date = new Date();
      class Dummy {
        @MinDate(date)
        val!: Date;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(+dummy.val > +date).toBe(true);
    });

    it(`@MaxDate() `, () => {
      const date = new Date();
      class Dummy {
        @MaxDate(date)
        val!: Date;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(+dummy.val < +date).toBe(true);
    });

    it(`@Contains() `, () => {
      class Dummy {
        @Contains('foo')
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val.includes('foo')).toBe(true);
    });

    it(`@IsAlpha() `, () => {
      class Dummy {
        @IsAlpha()
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).not.toMatch(/\d/);
    });

    it(`@IsAlphanumeric() `, () => {
      class Dummy {
        @IsAlphanumeric()
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(typeof dummy.val).toBe('string');
    });

    it(`@IsEmail() `, () => {
      class Dummy {
        @IsEmail()
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toMatch(/@.+\..+/);
    });

    it(`@IsFQDN() `, () => {
      class Dummy {
        @IsFQDN()
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toMatch(/.+\..+/);
    });

    it(`@IsHexColor() `, () => {
      class Dummy {
        @IsHexColor()
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toMatch(/^#/);
    });

    it(`@IsLowercase() `, () => {
      class Dummy {
        @IsLowercase()
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val.toLowerCase()).toBe(dummy.val);
    });

    it(`@IsUppercase() `, () => {
      class Dummy {
        @IsUppercase()
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val.toUpperCase()).toBe(dummy.val);
    });

    it(`@Length() `, () => {
      class Dummy {
        @Length(20, 30)
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      console.log('[Length]: ', dummy.val, dummy.val.length);
      expect(dummy.val.length >= 20 && dummy.val.length <= 30).toBe(true);
    });

    it(`@MinLength() `, () => {
      class Dummy {
        @MinLength(20)
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      console.log('[MinLength]: ', dummy.val, dummy.val.length);
      expect(dummy.val.length >= 20).toBe(true);
    });

    it(`@MaxLength() `, () => {
      class Dummy {
        @MaxLength(5)
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      console.log('[MaxLength]: ', dummy.val, dummy.val.length);
      expect(dummy.val.length <= 5).toBe(true);
    });

    it(`@ArrayContains() `, () => {
      class Dummy {
        @ArrayContains([1, 2])
        val!: any[];
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toEqual([1, 2]);
    });

    it(`@ArrayMinSize() `, () => {
      class Dummy {
        @ArrayMinSize(4)
        @Fixture({ type: () => [String] })
        val!: string[];
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      console.log('[ArrayMinSize] dummy :', dummy);
      expect(dummy.val.length >= 4).toBe(true);
    });

    it(`@ArrayMaxSize() `, () => {
      class Dummy {
        @ArrayMaxSize(2)
        @Fixture({ type: () => [String] })
        val!: string[];
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      console.log('[ArrayMaxSize] dummy :', dummy);
      expect(dummy.val.length <= 2).toBe(true);
    });

    it(`@IsString()`, () => {
      class Dummy {
        @IsString()
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(typeof dummy.val).toBe('string');
    });

    it(`@IsNumber()`, () => {
      class Dummy {
        @IsNumber()
        val!: number;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(typeof dummy.val).toBe('number');
    });

    it(`@IsNumberString()`, () => {
      class Dummy {
        @IsNumberString()
        val!: number;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(typeof dummy.val).toBe('number');
    });

    it(`@IsDate()`, () => {
      class Dummy {
        @IsDate()
        val!: Date;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toBeInstanceOf(Date);
    });

    describe(`Multiple decorators`, () => {
      it(`@IsOptional() with resolved type`, () => {
        class Dummy {
          @IsString()
          @IsOptional()
          val!: string;
        }
        factory.register([Dummy]);

        const dummy = factory.make(Dummy).one();
        expect(typeof dummy.val).toBe('string');
      });
    });
  });
});
