import { DefaultMetadataStore } from '../src/metadata/DefaultMetadataStore';
import { Fixture } from '../src/decorators/fixture';
import {
  ClassMetadata,
  PropertyMetadata,
} from '../src/metadata/BaseMetadataStore';

enum Mood {
  NEUTRAL,
}
const store = new DefaultMetadataStore();

describe('Metadata Store', () => {
  describe(`metadata extraction`, () => {
    class Author {
      firstName!: string;
      @Fixture('{{name.lastName}}')
      lastName!: string;
      books!: Book[];
      mood!: Mood;
      @Fixture(faker => faker?.address.city())
      city!: string;
      @Fixture(() => ({ petName: 'foo' }))
      pet!: any;
    }
    class Book {
      author!: Author;
    }
    let metadata: ClassMetadata;

    beforeAll(() => {
      store.make(Author);
      metadata = store.get(Author);
    });

    it(`@Fixture(string)`, () => {
      const lastNameProp = metadata.properties.find(p => p.name === 'lastName');

      expect(lastNameProp?.input).toBeDefined();
      expect(lastNameProp?.input?.()).toBe('{{name.lastName}}');
    });

    it(`@Fixture((faker) => string))`, () => {
      const cityProp = metadata.properties.find(p => p.name === 'city');

      expect(cityProp?.input).toBeDefined();
      expect(typeof cityProp?.input?.()).toBe('string');
    });

    it(`@Fixture(() => any))`, () => {
      const petProp = metadata.properties.find(p => p.name === 'pet');

      expect(petProp?.input).toBeDefined();
      expect(petProp?.input?.()).toMatchObject({ petName: 'foo' });
    });

    it(`string without decorator`, () => {
      const firstNameProp = metadata.properties.find(
        p => p.name === 'firstName'
      );

      expect(firstNameProp).toMatchObject({
        type: 'string',
        enum: false,
        array: false,
        ignore: false,
        input: undefined,
      } as PropertyMetadata);
    });
  });
});
