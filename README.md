![CI](https://github.com/CyriacBr/class-fixtures-factory/workflows/CI/badge.svg)

# class-fixtures-factory

This lightweight lib is a class factory to generate fixtures on the fly. However, contarly to most (or rather all)
libs out there, `class-fixtures-factory` generate fixtures from classes. This is handy when you
do not want to write custom schema to generate fixtures.  
Also, because the lib is based on emitted TypeScript's metadata, if you heavily
use decorators in your classes (when working with `class-validator`, `type-graphql`, for example), the setup will be even easier.

If you aren't familiar about what fixtures are, they are simply randomnly generated data and are often used for database
seeding or for testing.

## Features

- Generate fixtures on the fly at runtime
- Leverage `faker.js` for generating random values
- Support relationships between classes
- Customizable

## Usage

### General

Because `class-fixtures-factory` relies on metadata, you'll have to:

1. Register all the classes you're going to use
2. Annoate properties with decorators

```ts
import { FixtureFactory } from 'class-fixtures-factory';

const factory = new FixtureFactory();
factory.register([Author, Address, Book]);

// Generate a fixture
let author = factory.make(Author).one();
// Generate multiple fixtures
let authors = factory.make(Author).many(10);

// Ignore some properties at runtime
const partialAuthor = factory
  .make(Author)
  .ignore('address', 'age')
  .one(); // address and age are undefined

// Override properties at runtime
const agedAuthor = factory
  .make(Author)
  .with({
    age: 70,
    address: specialAddr, // any actual address entity object
  })
  .one();
```

### Customization

As stated previously, you'll need to annotate your class properties somehow, because types metadata
are used for generating fixtures.
The lib exposes a `Fixture` decorator for that purpose and for further customization.
If your properties are already annotated with decorators from the likes of `class-validator` and `type-graphql`,
there's no need to use `Fixture`. However, there are some cases where this decorator is **mandatory**;

- If the type is an array
- If the type is an enum

```ts
class Author {
  // decorator from class-validator
  // no need to use Fixture
  @IsString()
  name: string;

  @Fixture()
  age: number;

  @Fixture({ type: () => [Book] })
  books: Book[];

  @Fixture({ enum: Mood })
  mood: Mood = Mood.HAPPY;
}
```

Futhermore, `Fixture` can be used for further customization, using [faker.js](https://github.com/marak/Faker.js/#api), as stated:

```ts
export class Author extends BaseEntity {

  @Fixture(faker => faker.name.firstName())
  firstName: string;

  @Fixture('{{name.lastName}}')
  lastName: string;

  @Fixture(() => 24)
  age: number;

  @Enum()
  mood: Mood;

  @Fixture({ min: 3, max: 5 })
  books: Book[];

  // same as not using @Fixture at all
  @Fixture({ ignore: true })
  address: Address;
}
```

### API

See the API docs page [here](./docs/markdown/index.md).
