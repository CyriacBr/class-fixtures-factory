export * from './TypeORMFixtureFactory';
import { FixtureFactory } from '../../FixtureFactory';
import { MetadataStore } from '../../metadata';
import { TypeORMMetadataAdapter } from './TypeORMAdapter';

FixtureFactory.registerFactoryOptions({
  handleGeneratedColumns: false,
});

MetadataStore.addAdapter(new TypeORMMetadataAdapter());

declare module '../../FixtureFactory' {
  interface FactoryOptions {
    handleGeneratedColumns?: boolean;
  }
}
