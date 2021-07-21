import { factory } from './fixtures';

describe(`Lazy FixtureFactory`, () => {
  factory.setOptions({ lazy: true });
  require('./factory.test');
});
