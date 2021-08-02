import { FixtureFactory } from '../src/FixtureFactory';
import { Fixture } from '../src/decorators';
import { inspect } from 'util';

const factory = new FixtureFactory({ logging: true });
// class Address {
//   @Fixture()
//   city!: string;
// }
// class Author {
//   @Fixture()
//   name!: string;
//   @Fixture()
//   address!: Address;
//   @Fixture({ type: () => [Book], min: 3, max: 6 })
//   books!: Book[];
// }
// class Book {
//   @Fixture()
//   title!: string;
//   @Fixture({ type: () => [BookTag] })
//   tags!: BookTag[];
// }
// class BookTag {
//   @Fixture()
//   label!: string;
//   @Fixture({ type: () => BookTagCategory })
//   category!: BookTagCategory;
// }
// class BookTagCategory {
//   @Fixture()
//   label!: string;
// }
// factory.register([Author, Book, BookTag, BookTagCategory, Address]);

class DummyAuthor {
  @Fixture({ type: () => [DummyBook], min: 2, max: 2 })
  books!: DummyBook[];

  @Fixture({ type: () => DummyAuthor })
  friend!: DummyAuthor;

  @Fixture({ type: () => DummyAuthor, ignore: true })
  friend2!: DummyAuthor;

  @Fixture()
  name!: string;

  @Fixture({ ignore: true })
  name2!: string;

  @Fixture()
  age!: number;
}
class DummyBook {
  @Fixture({ type: () => [DummyAuthor], min: 2, max: 2 })
  authors!: DummyAuthor[];

  @Fixture()
  title!: string;

  @Fixture(() => 'test')
  title2!: string;
}
factory.register([DummyAuthor, DummyBook]);

const author = factory
  .make(DummyAuthor, {
    maxOccurrencesPerPath: 1,
    reuseCircularRelationships: true,
    logging: true,
    timeout: 99999,
  })
  .one();

console.log(inspect(author, { depth: Infinity, colors: true }));

// const author = factory.make(Author, { lazy: true }).one();
// console.log('author :', author);

// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   getMetadataArgsStorage,
//   PrimaryColumn,
//   CreateDateColumn,
//   UpdateDateColumn,
//   DeleteDateColumn,
//   VersionColumn,
//   Generated,
//   OneToOne,
//   JoinColumn,
//   ManyToOne,
//   OneToMany,
// } from 'typeorm';

// enum UserRole {
//   ADMIN = 'admin',
//   EDITOR = 'editor',
//   GHOST = 'ghost',
// }

// type UserRoleType = 'admin' | 'editor' | 'ghost';

// export class Name {
//   @Column()
//   first!: string;

//   @Column()
//   last!: string;
// }

// @Entity()
// class User {
//   @PrimaryColumn()
//   id!: number;

//   @CreateDateColumn()
//   createdAt!: Date;

//   @UpdateDateColumn()
//   updatedAt!: Date;

//   @DeleteDateColumn()
//   deletedAt!: Date;

//   @VersionColumn()
//   version!: number;

//   @Column('varchar', { length: 200 })
//   firstName!: string;

//   @Column()
//   lastName!: string;

//   @Column()
//   bool!: boolean;

//   @Column('int')
//   age!: number;

//   @Column({
//     type: 'enum',
//     enum: UserRole,
//     default: UserRole.GHOST,
//   })
//   role!: UserRole;

//   @Column({
//     type: 'enum',
//     enum: ['admin', 'editor', 'ghost'],
//     default: 'ghost',
//   })
//   role2!: UserRoleType;

//   @Column({
//     type: 'set',
//     enum: UserRole,
//     default: [UserRole.GHOST, UserRole.EDITOR],
//   })
//   roles!: UserRole[];

//   @Column({
//     type: 'set',
//     enum: ['admin', 'editor', 'ghost'],
//     default: ['ghost', 'editor'],
//   })
//   roles2!: UserRoleType[];

//   @Column('simple-array')
//   names!: string[];

//   @Column('simple-json')
//   profile!: { name: string; nickname: string };

//   @Column()
//   @Generated('uuid')
//   uuid!: string;

//   @Column({ default: 'foo' })
//   valWithDefault!: string;

//   @Column({ precision: 3 })
//   valWithPrecision!: number;

//   @Column(() => Name)
//   name!: Name;

//   @OneToOne(() => Profile)
//   @JoinColumn()
//   profile2!: Profile;

//   @OneToMany(
//     () => Photo,
//     photo => photo.user
//   )
//   photos!: Photo[];
// }

// class User2 {
//   @PrimaryGeneratedColumn()
//   id!: number;
// }

// class User3 {
//   @PrimaryGeneratedColumn('uuid')
//   id!: string;
// }

// class User4 {
//   @PrimaryColumn()
//   firstName!: string;

//   @PrimaryColumn()
//   lastName!: string;
// }

// @Entity()
// export class Profile {
//   @PrimaryGeneratedColumn()
//   id!: number;

//   @Column()
//   gender!: string;

//   @Column()
//   photo!: string;
// }

// @Entity()
// export class Photo {
//   @Column()
//   url!: string;

//   @ManyToOne(
//     () => User,
//     user => user.photos
//   )
//   user!: User;
// }

// //TODO: supports entitySchema

// const store = getMetadataArgsStorage();
// console.log('store :>> ', inspect(store, { depth: Infinity, colors: true }));
// //@ts-ignore
// console.log('store.relations[0].type() :>> ', store.relations[0].type());
