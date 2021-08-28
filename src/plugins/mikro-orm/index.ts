import { FixtureFactory } from '../../FixtureFactory';
import { MetadataStore } from '../../metadata';
import { MikroORMAdapter } from './MikroORMAdapter';
export * from './MikroORMFixtureFactory';

FixtureFactory.registerFactoryOptions({
  handlePrimaryColumns: false,
});

MetadataStore.addAdapter(new MikroORMAdapter());

declare module '../../FixtureFactory' {
  interface FactoryOptions {
    /**
     * If `true`, primary key columns will be generated with a value instead
     * of undefined.
     *
     * False by default.
     */
    handlePrimaryColumns?: boolean;
  }
}
