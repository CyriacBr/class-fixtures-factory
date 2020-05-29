import { ClassMetadata, PropertyMetadata } from './metadata';
import chalk from 'chalk';
import treeify from 'treeify';

export class FactoryLogger {
  private rootTree: any = {};
  private tree: any = {};
  private duplicates: Record<string, number> = {};

  start(meta: ClassMetadata, number = 0) {
    const entry = `Generated an instance of ${chalk.gray('"')}${chalk.cyan(
      meta.name
    )}${chalk.gray('"')}${number ? `${chalk.gray(` (${number})`)}` : ''}`;
    this.rootTree[entry] = {};
    this.tree = this.rootTree[entry];
  }

  onIgnoreProp(prop: PropertyMetadata) {
    const name = chalk.cyan(prop.name);
    this.tree[name] = chalk.gray(`(ignored)`);
  }

  onCustomProp(prop: PropertyMetadata) {
    const name = chalk.cyan(prop.name);
    this.tree[name] = chalk.gray(`(custom value)`);
  }

  onClassPropDone(prop: PropertyMetadata, targetLogger: FactoryLogger) {
    const name = chalk.cyan(prop.name);
    if (this.tree[name]) {
      const number = (this.duplicates[prop.name] =
        (this.duplicates[prop.name] || 0) + 1);
      const entry = (val: number) =>
        `Generated an instance of ${chalk.gray('"')}${chalk.cyan(
          prop.type
        )}${chalk.gray('"')}${chalk.gray(` (${val})`)}`;
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
