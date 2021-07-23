import { SECRET } from './internals';

export class FactoryHooks {
  constructor(private allowWarnings = true) {}
  private afterValueGeneratedCallbacks: ((value: any) => any)[] = [];
  private onGenerateScalar!: <T extends number | Date>(min?: T, max?: T) => any;
  private valueOverride!: () => any;

  /**
   * Set this property to completely override the value
   * of the generated prop
   */
  setOverride(value: () => any) {
    if (this.valueOverride !== undefined) {
      this.warn(
        `"valueOverride" has already been set previously. A conflict may exist between your adapters`
      );
    }
    this.valueOverride = value;
  }
  /**
   * Set a callback to transform the value of the generated property
   */
  setOnGenerateScalar<T extends number | Date>(fn: (min?: T, max?: T) => any) {
    if (this.onGenerateScalar !== undefined) {
      this.warn(
        `"onGenerate" has already been set previously. A conflict may exist between your adapters`
      );
    }
    //@ts-ignore
    this.onGenerateScalar = fn;
  }
  /**
   * Add a callback to transform the value of a property
   * after it got generated
   */
  addAfterValueGenerated(fn: (value: any) => any) {
    this.afterValueGeneratedCallbacks.push(fn);
  }

  [SECRET] = {
    hasOverrodeValue: () => this.valueOverride !== undefined,
    getValueOverride: () => this.valueOverride?.(),

    hasGenerateScalarCallback: () => this.onGenerateScalar !== undefined,
    onGenerateScalar: (min?: number | Date, max?: number | Date) => {
      return this.onGenerateScalar?.(min, max);
    },
    afterValueGenerated: (value: any) => {
      for (const cb of this.afterValueGeneratedCallbacks) {
        value = cb(value);
      }
      return value;
    },
  };

  warn(msg: string) {
    if (!this.allowWarnings) return;
    console.warn(`[FixtureFactory] ${msg}`);
  }
}
