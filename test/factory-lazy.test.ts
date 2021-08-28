import { factory } from './fixtures';

describe(`Lazy Mode`, () => {
  factory.setOptions({ lazy: true });
  require('./factory.test');
});
