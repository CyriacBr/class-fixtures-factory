import { decorate } from 'tinspector';

export type FixtureOptions =
  | string
  // eslint-disable-next-line no-undef
  | ((faker: Faker.FakerStatic) => string | undefined)
  | (() => any)
  | {
      type?: () => object;
      ignore?: boolean;
      enum?: object;
      min?: number | Date;
      max?: number | Date;
      precision?: number;
      // eslint-disable-next-line no-undef
      get?: ((faker: Faker.FakerStatic) => string | undefined) | (() => any);
      maxDepthLevel?: number;
      reuseCircularRelationships?: boolean;
      doNotReuseDirectFriendship?: boolean;
      maxOccurrencesPerPath?: number | ((value: number) => number);
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
