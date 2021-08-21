import chalk from 'chalk';
import { Class, ClassMetadata } from '.';
import { FactoryContext, FactoryStats, FixtureFactory } from './FixtureFactory';

export type FactoryMakeFn = <T extends Class>(
  meta: ClassMetadata,
  classType: T,
  ctx: FactoryContext
) => any;

export class FactoryResult<T extends Class, R = InstanceType<T>> {
  protected returnStats = false;
  constructor(
    protected makeFn: FactoryMakeFn,
    protected factory: FixtureFactory,
    protected ctx: FactoryContext,
    protected classType: T,
    protected meta: ClassMetadata
  ) {}

  one(): R {
    let error!: Error;
    let object: R = {} as any;
    const startDate = new Date();
    this.ctx.currentRef = object;

    try {
      object = this.makeFn(this.meta, this.classType, this.ctx);
    } catch (err) {
      this.factory.log(
        chalk.red(`An error occurred while generating "${this.meta.name}"`),
        true
      );
      if (
        err instanceof Error &&
        err.message.includes('Timeout: generating is taking too long')
      ) {
        // We discard the stacktrace because it is too long
        error = new Error(err.message);
      } else {
        error = err;
      }
      console.error(error);
    }

    const elapsed = +new Date() - +startDate;
    this.factory.logger.onFinished(elapsed, !!error);
    this.factory.log('\n' + this.factory.logger.log());

    if (error && !this.ctx.options.partialResultOnError) {
      throw error;
    }

    if (this.returnStats) {
      this.ctx.stats.result = object;
      return this.ctx.stats as any;
    }

    return object;
  }

  many(nbr: number): R[] {
    return Array(nbr)
      .fill(0)
      .map(_ =>
        new FactoryResult<T>(
          this.makeFn,
          this.factory,
          this.ctx,
          this.classType,
          this.meta
        ).one()
      );
  }

  ignore(...paths: string[]): this {
    this.ctx.ignoredPaths = [...this.ctx.ignoredPaths, ...(paths as string[])];
    return this;
  }
  // TODO: Once TS 4.4 hit, use: https://www.typescriptlang.org/play?ts=4.4.0-dev.20210627#code/C4TwDgpgBAIg9sACgJwgMwJYA8A8AVKCLYCAOwBMBnKS4ZDUgcwD4oBeKAoki6gIj5QA-FAFQAXFAAGAOgAkAbzwBfKQG4AUBtCRYECGADSEEAHk0+VhwAUGqFADaeALqFiZKo9IQAbhGSuImLidpxuPJ5wAEYAVhAAxsDCULb29gqOhlAMUACiWPEANgCu5BA4ANYmcGicADQ0IAC2UXCFzM4haWlSiobKisUU6AwQ5OEe1HgOhoGiQoKSAgMK8EiomLgw+kYm5vgzzszMqlDKDqH2+UWl5VUgNfWNLW0doQCUEqJ8Gp-ck9lSGh-LBkvk6ABDRI4GANWj0JisSTePzITTacDQACSpDAxWAOFME14UGicUSVigClCM0BegMxjMFjwEFoHSEknhDEYmmU6J00BZtHYVNCpAhTQgnLo3M09lacAqlEkCmAGGAhSlNBlTHOzl5-MxnFZSAhwAAFtQONsGXtmSbmBp4nBSMKwGbzZIbbsmfgHSKAOQKpUyAAMMjVGogAa0ztdSRItEkOLxBKFwEp1PsfGDlDDEfVmr4kgDhTaAbqoRzcEVeYAjAWo8WoAGITG+UA
  with(input: Record<string, any>): this {
    Object.assign(this.ctx.userInput, input);
    return this;
  }

  withStats(flag = true): FactoryResult<T, FactoryStats<R>> {
    this.returnStats = flag;
    return this as any;
  }
}
