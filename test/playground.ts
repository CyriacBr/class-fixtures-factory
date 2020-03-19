import { FixtureFactory } from '../src/FixtureFactory';
import { Fixture } from '../src/decorators';

const factory = new FixtureFactory({ logging: true });
class Address {
  @Fixture()
  city!: string;
}
class Author {
  @Fixture()
  name!: string;
  @Fixture()
  address!: Address;
  @Fixture({ type: () => [Book], min: 3, max: 6 })
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
factory.register([Author, Book, BookTag, BookTagCategory, Address]);

const author = factory.make(Author).one();
console.log('author :', author);
