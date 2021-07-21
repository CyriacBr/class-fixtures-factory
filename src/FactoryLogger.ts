import { ClassMetadata, PropertyMetadata } from './metadata';
import chalk from 'chalk';
import treeify from 'treeify';

export class FactoryLogger {
  /**
   * The final tree that will be logged by treeify.
   * It is an object with this structure:
   * ```js
   * {
   *  'New instance of Author': {
   *    name: 'Bob',
   *    'New instance of Book': {
   *      title: 'Food Barf'
   *    }
   *  }
   * }
   * ```
   */
  private rootTree: any = {};
  private tree: any = {};
  private duplicates: Record<string, number> = {};
  // TODO: Output lazy prop?
  private lazy = false;

  start(meta: ClassMetadata, number = 0, lazy?: boolean) {
    this.lazy = lazy ?? false;
    const entry = `New${
      lazy ? chalk.cyan(' lazy') : ''
    } instance of ${chalk.cyan(meta.name)}${
      number ? `${chalk.gray(` (${number})`)}` : ''
    }`;
    this.rootTree[entry] = {};
    this.tree = this.rootTree[entry];
  }

  onClassPropDone(prop: PropertyMetadata, targetLogger: FactoryLogger) {
    const name = chalk.cyan(prop.name);
    if (this.tree[name]) {
      const number = (this.duplicates[prop.name] =
        (this.duplicates[prop.name] || 0) + 1);
      const entry = (val: number) =>
        `New instance of ${chalk.cyan(prop.type)}${chalk.gray('"')}${chalk.gray(
          ` (${val})`
        )}`;
      const firstKey = Object.keys(this.tree[name])[0];
      if (number === 1) {
        this.tree[name][entry(number - 1)] = this.tree[name][firstKey];
        delete this.tree[name][firstKey];
      }
      this.tree[name][entry(number)] = targetLogger.rootTree;
    } else {
      this.tree[name] = targetLogger.rootTree;
    }
  }

  onNormalProp(prop: PropertyMetadata, value: any) {
    const name = chalk.cyan(prop.name);
    this.tree[name] = value;
  }

  onClassValidator(prop: PropertyMetadata, value: any) {
    const name = chalk.cyan(prop.name);
    this.tree[name] = `${chalk.gray('class-validator]')} ${value}`;
  }

  onReusedProp(prop: PropertyMetadata) {
    const name = chalk.cyan(prop.name);
    this.tree[name] = `${chalk.gray('reused')} ${chalk.cyan(prop.type)}`;
  }

  onPropNotGenerated(prop: PropertyMetadata) {
    const name = chalk.cyan(prop.name);
    this.tree[name] = `${chalk.gray('not generated')}`;
  }

  onIgnoredProp(prop: PropertyMetadata) {
    const name = chalk.cyan(prop.name);
    this.tree[name] = chalk.gray(`ignored`);
  }

  onCustomProp(prop: PropertyMetadata) {
    const name = chalk.cyan(prop.name);
    this.tree[name] = chalk.gray(`custom value`);
  }

  onDone(duration: number) {
    this.tree[`${chalk.green('Done')} ${chalk.gray(`(${duration}ms)`)}`] = null;
  }

  onError(duration: number) {
    this.tree[`${chalk.red('Error')} ${chalk.gray(`(${duration}ms)`)}`] = null;
  }

  log() {
    return treeify.asTree(this.rootTree, true, false);
  }
}
