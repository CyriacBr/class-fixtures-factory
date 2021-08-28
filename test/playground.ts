import {
  Collection,
  Embeddable,
  Embedded,
  Entity,
  Enum,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { connectToMikroORM } from './fixtures';
import { inspect } from 'util';

export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}

export const enum UserStatus {
  DISABLED,
  ACTIVE,
}

@Unique({ properties: ['a', 'b'] })
@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  foo = 1;

  @Property()
  bar = 'abc';

  @Property()
  baz = new Date();

  @Enum()
  role!: UserRole; // string enum

  @Enum()
  status!: UserStatus; // numeric enum

  @Enum({ default: [UserRole.USER] })
  roles = [UserRole.USER];

  @Property()
  @Unique()
  email!: string;

  @Property()
  a!: string;

  @Property()
  b!: number;

  // @Property({ name: 'fullName' })
  // getFullName() {
  //   return 'foo';
  // }

  @Property({ persist: false })
  get fullName2() {
    return 'bar';
  }

  @OneToMany(
    () => Book,
    book => book.author
  )
  books = new Collection<Book>(this);

  @OneToOne()
  address!: Address;

  @Embedded()
  address2!: Address2;
}

@Entity()
class Book {
  @PrimaryKey()
  uuid!: string;

  @ManyToOne()
  author!: User;

  @ManyToMany()
  tags = new Collection<BookTag>(this);
}

@Entity()
class BookTag {
  @PrimaryKey()
  id!: number;

  @Property()
  label!: string;

  @ManyToMany(
    () => Book,
    book => book.tags
  )
  books = new Collection<Book>(this);
}

@Entity()
class Address {
  @PrimaryKey()
  id!: number;

  @Property()
  city!: string;

  @OneToOne(
    () => User,
    user => user.address
  )
  bestFriend2!: User;
}

@Embeddable()
export class Address2 {
  @Property()
  street!: string;

  @Property()
  postalCode!: string;

  @Property()
  city!: string;

  @Property()
  country!: string;
}

connectToMikroORM([User, Book, BookTag, Address, Address2], async orm => {
  const metadata = orm.getMetadata();
  console.log(inspect(metadata, { depth: 1, colors: true }));

  await orm.close();
}).catch(err => console.error(err));
