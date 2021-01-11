import { decorate } from 'tinspector';

export type FixtureOptions =
  | string
  | ((faker: Faker.FakerStatic) => string | undefined)
  | (() => any)
  | {
      type?: () => object;
      ignore?: boolean;
      enum?: object;
      min?: number;
      max?: number;
      get?: ((faker: Faker.FakerStatic) => string | undefined) | (() => any);
    };

/**
 * Decorator for providing metadata about a property
 * or for customizing the generate fixture
 * @param options
 */
export function Fixture(options?: FixtureOptions) {
  return decorate({
    type: 'Fixture',
    value: options,
  });
}
