import { Connection, getMetadataArgsStorage } from 'typeorm';
import { Class, ClassMetadata } from '../..';
import {
  FactoryContext,
  FactoryStats,
  FixtureFactory,
  FactoryOptions,
} from '../../FixtureFactory';
import { makeUnique } from '../../utils/array';
import { TypeORMFactoryResult } from './TypeORMFactoryResult';

export interface TypeORMFactoryPersistOptions {
  disableWarning?: boolean;
  throwOnError?: boolean;
}

interface PathWithChildren {
  root: object;
  children: PathWithChildren[];
}

export class TypeORMFixtureFactory extends FixtureFactory {
  registerEntities() {
    const store = getMetadataArgsStorage();
    return this.register(store.tables.map(v => v.target as Class));
  }

  make<T extends Class>(
    classType: T,
    options?: FactoryOptions
  ): TypeORMFactoryResult<T> {
    return super.make(classType, options) as any;
  }

  _getResult<T extends Class>(
    ctx: FactoryContext,
    classType: T,
    meta: ClassMetadata
  ): TypeORMFactoryResult<T> {
    return new TypeORMFactoryResult<T>(
      this._persistFromStats.bind(this),
      this._make.bind(this),
      this,
      ctx,
      classType,
      meta
    );
  }

  /**
   * This method tries to save in DB all generated entities from the factory.
   * It uses a brute-force technique because tricky relationships can't be saved
   * as-is and right-away.
   */
  private async _persistFromStats<T extends Class>(
    stats: FactoryStats<T>,
    con: Connection,
    options?: TypeORMFactoryPersistOptions
  ) {
    let withoutError = true;
    /**
     * We transform the array of generated references into a tree
     * with dependencies.
     * From
     * [
     *  [a, b, c],
     *  [a, b, d]
     * ]
     * To
     * [
     *  {
     *    root: a,
     *    children: [
     *      { root: b, children: [ { root: c, children: [] }, { root: d, children: [] } ] }
     *    ]
     *  }
     * ]
     */
    const pathDeps = this._makePathDependencies(
      stats.paths.map(v => makeUnique(v.references))
    );
    await Promise.all(
      pathDeps.map(async item => {
        /**
         * For each entity in the dependencies from the bottom, we persist it.
         * With the previous example, c and d would be simultaneously saved, than b, and finally a
         */
        await this._walkPathBottomUp(item, entity =>
          con
            .getRepository(entity.constructor)
            .save(entity)
            .then(result => (entity = result))
            .catch(err => {
              if (!options?.disableWarning) {
                console.warn('Failed to persist ', entity.constructor.name);
                console.warn(err);
              }
              if (options?.throwOnError) {
                throw err;
              }
              withoutError = false;
            })
        );
      })
    );
    return withoutError;
  }

  /**
   * This method takes an array of paths and generate
   * a tree with dependencies for each element in the path.
   * It is used to significantly improve the performance of the brute-force
   * method used to persist entities.
   * Given the following paths,
   * ```ts
   * [
   *  [a, b, c, d1, e],
   *  [a, b, c, d2, e1, f],
   *  [a, b, c, d2, e1, f2],
   *  [z, z1]
   * ];
   * ```
   * the brute-force method would have to persist every entity in each paths, resulting in the entities a, b and c being uselessly saved 3 times.
   * This method would generate an array with a structure that eliminate redundancy and that is easy to walk over:
   * ```ts
   * {
   *  root: a,
   *  children: [
   *    {
   *      root: b,
   *      children: [
   *        {
   *          root: c,
   *          children: [
   *            { root: d1 ...},
   *            { root: d2 ...}
   *          ]
   *        }
   *      ]
   *    }
   *  ]
   * }
   * ```
   */
  private _makePathDependencies(paths: object[][]) {
    const result = new Array<PathWithChildren>();
    const processedRoots = new Set();
    for (const path of paths) {
      const root = path[0];
      if (processedRoots.has(root)) continue;
      processedRoots.add(root);
      const item = this._makePathDep(
        path,
        paths.filter(v => root === v[0])
      );
      if (item) {
        result.push(item);
      }
    }
    return result;
  }

  private _makePathDep(
    path: object[],
    otherPaths: object[][]
  ): PathWithChildren | undefined {
    if (!path || !path.length) return undefined;
    if (!otherPaths || !otherPaths.length) return undefined;
    const scope = otherPaths.map(v => v.slice(1));
    const children = this._makePathDependencies(scope);
    return {
      root: path[0],
      children,
    } as PathWithChildren;
  }

  /**
   * Walk dependencies from bottom
   */
  private async _walkPathBottomUp(
    item: PathWithChildren,
    fn: (root: object) => Promise<any>
  ) {
    await Promise.all(item.children.map(v => this._walkPathBottomUp(v, fn)));
    return fn(item.root);
  }

  /**
   * Walk dependencies from top
   */
  private async _walkPathTopDown(
    item: PathWithChildren,
    fn: (root: object) => Promise<any>
  ): Promise<any> {
    await fn(item.root);
    return Promise.all(item.children.map(v => this._walkPathTopDown(v, fn)));
  }
}
