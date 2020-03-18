import { FixtureFactory } from '../src/FixtureFactory';
import { Fixture } from '../src/decorators';

const factory = new FixtureFactory({ logging: true });
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
console.log('author :', author);
