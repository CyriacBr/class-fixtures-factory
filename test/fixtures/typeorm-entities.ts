import { IsEmail } from 'class-validator';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  ManyToMany,
  JoinTable,
  OneToMany,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { Fixture } from '../../src';

@Entity('users')
export class TypeORMUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column()
  username!: string;

  @Index({ unique: true })
  @Column()
  email!: string;

  @Column({ default: '' })
  bio!: string;

  @Column({ default: '' })
  image!: string;

  @Column()
  password!: string;

  @OneToMany(
    () => TypeORMArticle,
    (article: TypeORMArticle) => article.author,
    { cascade: true }
  )
  @Fixture({ max: 1 })
  articles!: TypeORMArticle[];

  @OneToMany(
    () => TypeORMComment,
    (comment: TypeORMComment) => comment.author,
    { cascade: true }
  )
  @Fixture({ max: 1 })
  comments!: TypeORMComment[];

  @OneToMany(
    () => TypeORMFavorite,
    (favorite: TypeORMFavorite) => favorite.user,
    { cascade: true }
  )
  @Fixture({ max: 1 })
  favorites!: TypeORMFavorite[];

  @OneToMany(
    () => TypeORMFollow,
    (follow: TypeORMFollow) => follow.follower,
    { cascade: true }
  )
  @Fixture({ max: 1 })
  followers!: TypeORMFollow[];

  @OneToMany(
    () => TypeORMFollow,
    (follow: TypeORMFollow) => follow.following,
    { cascade: true }
  )
  @Fixture({ max: 1 })
  following!: TypeORMFollow[];
}

@Entity('articles')
export class TypeORMArticle {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column()
  slug!: string;

  @Column()
  title!: string;

  @Column({ default: '' })
  description!: string;

  @Column({ default: '' })
  body!: string;

  @ManyToMany(
    () => TypeORMTag,
    (tag: TypeORMTag) => tag.articles,
    { cascade: true }
  )
  @JoinTable()
  @Fixture({ max: 1, reuseCircularRelationships: false })
  tagList!: TypeORMTag[];

  @ManyToOne(
    () => TypeORMUser,
    (user: TypeORMUser) => user.articles
  )
  author!: TypeORMUser;

  @OneToMany(
    () => TypeORMComment,
    (comment: TypeORMComment) => comment.article
  )
  @Fixture({ max: 1 })
  comments!: TypeORMComment[];

  @OneToMany(
    () => TypeORMFavorite,
    (favorite: TypeORMFavorite) => favorite.article
  )
  @Fixture({ max: 1 })
  favorites!: TypeORMFavorite[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}

@Entity('comments')
export class TypeORMComment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  body!: string;

  @ManyToOne(
    () => TypeORMArticle,
    (article: TypeORMArticle) => article.comments
  )
  article!: TypeORMArticle;

  @ManyToOne(
    () => TypeORMUser,
    (user: TypeORMUser) => user.comments,
    { eager: true }
  )
  author!: TypeORMUser;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}

@Entity('favorites')
@Index(['article', 'user'], { unique: true })
export class TypeORMFavorite {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(
    () => TypeORMArticle,
    (article: TypeORMArticle) => article.favorites
  )
  article!: TypeORMArticle;

  @ManyToOne(
    () => TypeORMUser,
    (user: TypeORMUser) => user.favorites
  )
  user!: TypeORMUser;
}

@Entity('follows')
@Index(['follower', 'following'], { unique: true })
export class TypeORMFollow {
  @PrimaryGeneratedColumn()
  id!: number;

  // @Fixture({ maxOccurrencesPerPath: v => v + 1 })
  @ManyToOne(
    () => TypeORMUser,
    (user: TypeORMUser) => user.followers
  )
  follower!: TypeORMUser;

  // @Fixture({ maxOccurrencesPerPath: v => v + 1 })
  @ManyToOne(
    () => TypeORMUser,
    (user: TypeORMUser) => user.following
  )
  following!: TypeORMUser;
}

@Entity('tags')
export class TypeORMTag {
  @PrimaryColumn()
  label!: string;

  @ManyToMany(
    () => TypeORMArticle,
    (article: TypeORMArticle) => article.tagList
  )
  @Fixture({ max: 1, reuseCircularRelationships: false })
  articles!: TypeORMArticle[];
}
