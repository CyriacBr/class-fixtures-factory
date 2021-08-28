import {
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { Fixture } from '../../src';

@Entity({ tableName: 'users' })
export class MikroORMUser {
  @PrimaryKey()
  id!: number;

  @Unique()
  @Property()
  username!: string;

  @Unique()
  @Property()
  email!: string;

  @Property({ default: '' })
  bio!: string;

  @Property({ default: '' })
  image!: string;

  @Property()
  password!: string;

  @OneToMany(
    () => MikroORMArticle,
    (article: MikroORMArticle) => article.author
  )
  @Fixture({ max: 1 })
  articles = new Collection<MikroORMArticle>(this);

  @OneToMany(
    () => MikroORMComment,
    (comment: MikroORMComment) => comment.author
  )
  @Fixture({ max: 1 })
  comments = new Collection<MikroORMComment>(this);

  @OneToMany(
    () => MikroORMFavorite,
    (favorite: MikroORMFavorite) => favorite.user
  )
  @Fixture({ max: 1 })
  favorites = new Collection<MikroORMFavorite>(this);

  @OneToMany(
    () => MikroORMFollow,
    (follow: MikroORMFollow) => follow.follower
  )
  @Fixture({ max: 1 })
  followers = new Collection<MikroORMFollow>(this);

  @OneToMany(
    () => MikroORMFollow,
    (follow: MikroORMFollow) => follow.following
  )
  @Fixture({ max: 1 })
  following = new Collection<MikroORMFollow>(this);
}

@Entity({ tableName: 'articles' })
export class MikroORMArticle {
  @PrimaryKey()
  id!: number;

  @Unique()
  @Property()
  slug!: string;

  @Property()
  title!: string;

  @Property({ default: '' })
  description!: string;

  @Property({ default: '' })
  body!: string;

  @ManyToMany()
  @Fixture({ max: 1 })
  tagList = new Collection<MikroORMTag>(this);

  @ManyToOne()
  author!: MikroORMUser;

  @OneToMany(
    () => MikroORMComment,
    (comment: MikroORMComment) => comment.article
  )
  @Fixture({ max: 1 })
  comments = new Collection<MikroORMComment>(this);

  @OneToMany(
    () => MikroORMFavorite,
    (favorite: MikroORMFavorite) => favorite.article
  )
  @Fixture({ max: 1 })
  favorites = new Collection<MikroORMFavorite>(this);

  @Property()
  createdAt!: Date;

  @Property()
  updatedAt!: Date;
}

@Entity({ tableName: 'comments' })
export class MikroORMComment {
  @PrimaryKey()
  id!: number;

  @Property()
  body!: string;

  @ManyToOne()
  article!: MikroORMArticle;

  @ManyToOne()
  author!: MikroORMUser;

  @Property()
  createdAt!: Date;

  @Property()
  updatedAt!: Date;
}

@Entity({ tableName: 'favorites' })
@Unique({ properties: ['article', 'user'] })
export class MikroORMFavorite {
  @PrimaryKey()
  id!: number;

  @ManyToOne()
  article!: MikroORMArticle;

  @ManyToOne()
  user!: MikroORMUser;
}

@Entity({ tableName: 'follows' })
@Unique({ properties: ['follower', 'following'] })
export class MikroORMFollow {
  @PrimaryKey()
  id!: number;

  @ManyToOne()
  follower!: MikroORMUser;

  @ManyToOne()
  following!: MikroORMUser;
}

@Entity({ tableName: 'tags' })
export class MikroORMTag {
  @Fixture(faker => faker.random.uuid())
  @PrimaryKey()
  label!: string;

  @ManyToMany(
    () => MikroORMArticle,
    (article: MikroORMArticle) => article.tagList
  )
  @Fixture({ max: 1 })
  articles = new Collection<MikroORMArticle>(this);
}
