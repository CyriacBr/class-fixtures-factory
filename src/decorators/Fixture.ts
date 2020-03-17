import { decorateProperty } from 'tinspector';

export type FixtureOptions =
  | string
  | ((faker?: Faker.FakerStatic) => string | undefined)
  | (() => any)
  | {
      type?: () => object;
      ignore?: boolean;
      enum?: object;
      min?: number;
      max?: number;
      get?: ((faker?: Faker.FakerStatic) => string | undefined) | (() => any);
    };

export const FixtureMetadata: {
  [entityName: string]: {
    [prop: string]: FixtureOptions;
  };
} = {};

export function Fixture(options: FixtureOptions) {
  return decorateProperty({
    type: 'Fixture',
    value: options,
  });
}
