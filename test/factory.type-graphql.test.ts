import { FixtureFactory } from '../src/FixtureFactory';
import { Fixture } from '../src/decorators/Fixture';
import 'reflect-metadata';
import {
  Field,
  Float,
  ID,
  Int,
  InterfaceType,
  ObjectType,
  registerEnumType,
} from 'type-graphql';
import '../src/plugins/type-graphql';
import { GraphQLScalarType, Kind } from 'graphql';

describe(`FixtureFactory`, () => {
  const factory = new FixtureFactory();

  describe(`with type-graphql`, () => {
    it(`throws if type can't be resolved`, () => {
      @ObjectType()
      class Dummy {
        @Field(_type => null as any)
        val!: string;
      }
      expect(() => factory.register([Dummy])).toThrow(
        `Couldn't extract the type of "val". Use @Fixture({ type: () => Foo })`
      );
    });

    it(`@Fixture({ ignore: true }) takes precedence`, () => {
      @ObjectType()
      class Dummy {
        @Field()
        @Fixture({ ignore: true })
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toBeUndefined();
    });

    it(`@Fixture(() => any) takes precedence`, () => {
      @ObjectType()
      class Dummy {
        @Field()
        @Fixture(() => 'foo')
        val!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toBe('foo');
    });

    it(`ID type`, () => {
      @ObjectType()
      class Dummy {
        @Field(_type => ID)
        val!: any;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toBeDefined();
      expect(dummy.val).toMatch(
        /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/i
      );
    });

    it(`Int type`, () => {
      @ObjectType()
      class Dummy {
        @Field(_type => Int)
        val!: any;
        @Field()
        val2!: number;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toBeDefined();
      expect(typeof dummy.val).toBe('number');
      expect(dummy.val2).toBeDefined();
      expect(typeof dummy.val2).toBe('number');
    });

    it(`Float type`, () => {
      @ObjectType()
      class Dummy {
        @Field(_type => Float)
        val!: any;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toBeDefined();
      expect(typeof dummy.val).toBe('number');
      expect(String(dummy.val)).toMatch(/\d+\.\d+/i);
    });

    it(`String type`, () => {
      @ObjectType()
      class Dummy {
        @Field(_type => String)
        val!: any;
        @Field()
        val2!: string;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toBeDefined();
      expect(typeof dummy.val).toBe('string');
      expect(dummy.val2).toBeDefined();
      expect(typeof dummy.val2).toBe('string');
    });

    it(`Boolean type`, () => {
      @ObjectType()
      class Dummy {
        @Field(_type => Boolean)
        val!: any;
        @Field()
        val2!: boolean;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toBeDefined();
      expect(typeof dummy.val).toBe('boolean');
      expect(dummy.val2).toBeDefined();
      expect(typeof dummy.val2).toBe('boolean');
    });

    it(`Date type`, () => {
      @ObjectType()
      class Dummy {
        @Field(_type => Date)
        val!: any;
        @Field()
        val2!: Date;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toBeDefined();
      expect(dummy.val).toBeInstanceOf(Date);
      expect(dummy.val2).toBeDefined();
      expect(dummy.val2).toBeInstanceOf(Date);
    });

    it(`Custom scalar`, () => {
      const MyScalar = new GraphQLScalarType({
        name: 'MyType',
        description: 'Test scalar type',
        serialize(value: any): string {
          return String(value);
        },
        parseValue(value: unknown): number {
          return Number(value);
        },
        parseLiteral(ast): number {
          // check the type of received value
          if (ast.kind !== Kind.STRING) {
            throw new Error('MyType can only parse string values');
          }
          return Number(ast.value); // value from the client query
        },
      });

      @ObjectType()
      class Dummy {
        @Field(_type => MyScalar)
        val!: any;
      }
      expect(() => factory.register([Dummy])).toThrow(
        `Can't generate a value for custom TypeGraphQL scalar type "MyType"`
      );
    });

    it(`Enum type`, () => {
      enum Direction {
        UP,
        DOWN,
        LEFT,
        RIGHT,
      }
      registerEnumType(Direction, {
        name: 'Direction',
        description: 'The basic directions',
      });

      @ObjectType()
      class Dummy {
        @Field(_type => Direction)
        val!: Direction;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toBeDefined();
      expect(typeof dummy.val).toBe('string');
      expect(['UP', 'DOWN', 'LEFT', 'RIGHT']).toContain(dummy.val);
    });

    it(`Array types`, () => {
      @ObjectType()
      class Dummy {
        @Field(_type => [String])
        val!: any;
        @Fixture({ min: 10 })
        @Field(_type => [String])
        val2!: any;
      }
      factory.register([Dummy]);

      const dummy = factory.make(Dummy).one();
      expect(dummy.val).toBeDefined();
      expect(Array.isArray(dummy.val)).toBe(true);
      expect(typeof dummy.val[0]).toBe('string');
      expect(dummy.val2).toBeDefined();
      expect(Array.isArray(dummy.val2)).toBe(true);
      expect(dummy.val2.length >= 10).toBe(true);
      expect(typeof dummy.val2[0]).toBe('string');
    });

    it(`Interface type [implements]`, () => {
      @InterfaceType()
      abstract class IPerson {
        @Field()
        name!: string;
      }
      @ObjectType({ implements: IPerson })
      class Person implements IPerson {
        name!: string;
      }
      factory.register([Person]);

      const dummy = factory.make(Person).one();
      expect(dummy.name).toBeDefined();
      expect(typeof dummy.name).toBe('string');
    });

    it(`Interface type [extends]`, () => {
      @InterfaceType()
      abstract class IPerson {
        @Field()
        name!: string;
      }
      @ObjectType({ implements: IPerson })
      class Person extends IPerson {
        @Field()
        hasKids!: boolean;
      }
      factory.register([Person]);

      const dummy = factory.make(Person).one();
      expect(dummy.name).toBeDefined();
      expect(typeof dummy.name).toBe('string');
      expect(dummy.hasKids).toBeDefined();
      expect(typeof dummy.hasKids).toBe('boolean');
    });

    it(`Relationship`, () => {
      @ObjectType()
      class Book {
        @Field()
        title!: string;
      }
      @ObjectType()
      class Author {
        @Field()
        book!: Book;
        @Fixture({ max: 1 })
        @Field(() => [Book])
        books!: Book[];
      }
      factory.register([Book, Author]);

      const author = factory.make(Author).one();
      expect(author.book).toBeDefined();
      expect(typeof author.book.title).toBe('string');
      expect(Array.isArray(author.books)).toBe(true);
      expect(author.books[0]).toBeDefined();
      expect(typeof author.books[0].title).toBe('string');
    });
  });
});
