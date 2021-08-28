import { ClassMetadata, PropertyMetadata } from './metadata';
import chalk from 'chalk';
import treeify from 'treeify';
import { dotPathSet } from './utils/dot-path';
import { inspect } from 'util';

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
  private tree: any = {};

  private appendLeaf(path: string[], value: any) {
    const transformedPath: string[] = [];
    for (const step of path) {
      let [className, propName] = step.split('.');
      if (propName) {
        transformedPath.push(
          `Generating ${chalk.cyan(className)}`,
          chalk.cyan(propName)
        );
      } else {
        transformedPath.push(chalk.cyan(className));
      }
    }
    dotPathSet(this.tree, transformedPath, value);
  }

  onGenerateObject(path: string[]) {
    this.appendLeaf(path, {});
  }

  onGenerateScalar(path: string[], value: any) {
    this.appendLeaf(path, inspect(value, { colors: true }));
  }

  onGenerateArray(path: string[]) {
    this.appendLeaf(path, {});
  }

  onIgnoreProp(path: string[]) {
    const label = chalk.grey('ignored');
    this.appendLeaf(path, label);
  }

  onCustomProp(path: string[]) {
    const label = chalk.grey('gen. by user');
    this.appendLeaf(path, label);
  }

  onOverrodeProp(path: string[]) {
    const label = chalk.grey('gen. by plugin');
    this.appendLeaf(path, label);
  }

  onReusedProp(path: string[]) {
    const label = chalk.grey('reused');
    this.appendLeaf(path, label);
  }

  onSkipProp(path: string[]) {
    const label = chalk.grey('skipped');
    this.appendLeaf(path, label);
  }

  onFinished(elapsedMs: number, error: boolean) {
    const label = `${
      error ? chalk.red('Error') : chalk.green('Done')
    } ${chalk.gray(`(${elapsedMs}ms)`)}`;
    const firstKey = Object.keys(this.tree)[0];
    if (this.tree[firstKey]) {
      this.tree[firstKey][label] = null;
    } else {
      this.tree[label] = null;
    }
  }

  log() {
    return treeify.asTree(this.tree, true, false);
  }
}
