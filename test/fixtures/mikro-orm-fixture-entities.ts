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
import { Fixture } from '../../src';

enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}

const enum UserStatus {
  DISABLED,
  ACTIVE,
}

@Entity()
export class Dummy {
  @PrimaryKey()
  id!: number;
  @Property()
  strVal!: string;
  @Property()
  nbrVal!: number;
  @Property()
  dateVal!: Date;
  @Property()
  boolVal!: boolean;
  @Property({ length: 4 })
  strWithLen!: string;
  @Property({ default: 'lmao' })
  valWithDefault!: any;
  @Enum()
  role!: UserRole;
  @Enum()
  status!: UserStatus;
  @OneToOne()
  profile!: Profile;
  @OneToMany(
    () => Photo,
    photo => photo.user
  )
  photos = new Collection<Photo>(this);
  @ManyToMany()
  pets = new Collection<Pet>(this);
  @Embedded()
  address!: Address;
}
@Entity()
export class Dummy2 {
  @PrimaryKey()
  id!: string;
}
@Entity()
export class Profile {
  @PrimaryKey()
  id!: number;
  @Property()
  gender!: string;
}
@Entity()
export class Photo {
  @PrimaryKey()
  id!: number;
  @Property()
  url!: string;
  @ManyToOne()
  user!: Dummy;
}
@Entity()
export class Pet {
  @PrimaryKey()
  id!: number;
  @ManyToMany(
    () => Dummy,
    dummy => dummy.pets
  )
  users = new Collection<Dummy>(this);
}
@Embeddable()
export class Address {
  @Property()
  street!: string;

  @Property()
  postalCode!: string;

  @Property()
  city!: string;

  @Property()
  country!: string;
}

@Entity()
export class Dummy3 {
  @PrimaryKey()
  id!: number;
}
@Entity()
export class DummyWithUnique {
  @PrimaryKey()
  id!: number;
  @Unique()
  @Property()
  val1!: string;
  @Unique()
  @Property()
  val2!: number;
  @OneToOne()
  val3!: Dummy3;
}
@Unique({ properties: ['val1', 'val2'] })
@Entity()
export class DummyWithUnique2 {
  @PrimaryKey()
  id!: number;
  @Property()
  val1!: string;
  @Property()
  val2!: number;
  @OneToOne()
  val3!: Dummy3;
}

@Entity()
export class OneToOneDummyAuthor {
  @PrimaryKey()
  id!: number;
  @Property()
  name!: string;
  @OneToOne()
  book!: OneToOneDummyBook;
}
@Entity()
export class OneToOneDummyBook {
  @PrimaryKey()
  id!: number;
  @Property()
  title!: string;
  @OneToOne(
    _ => OneToOneDummyAuthor,
    author => author.book
  )
  author!: OneToOneDummyAuthor;
}

@Entity()
export class OneToManyDummyAuthor {
  @PrimaryKey()
  id!: number;
  @Property()
  name!: string;
  @OneToMany(
    _ => OneToManyDummyBook,
    book => book.author
  )
  @Fixture({ min: 3, max: 3 })
  books = new Collection<OneToManyDummyBook>(this);
}
@Entity()
export class OneToManyDummyBook {
  @PrimaryKey()
  id!: number;
  @Property()
  title!: string;
  @ManyToOne()
  author!: OneToManyDummyAuthor;
}

@Entity()
export class ManyToManyDummyAuthor {
  @PrimaryKey()
  id!: number;
  @Property()
  name!: string;
  @ManyToMany()
  @Fixture({
    min: 2,
  })
  books = new Collection<ManyToManyDummyBook>(this);
}
@Entity()
export class ManyToManyDummyBook {
  @PrimaryKey()
  id!: number;
  @Property()
  title!: string;
  @ManyToMany(
    () => ManyToManyDummyAuthor,
    author => author.books
  )
  @Fixture({
    min: 2,
  })
  authors = new Collection<ManyToManyDummyAuthor>(this);
}
