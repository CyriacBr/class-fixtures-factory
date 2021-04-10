import { MetadataStore } from '../src/metadata/MetadataStore';
import { Fixture } from '../src/decorators/Fixture';
import { ClassMetadata, PropertyMetadata } from '../src/metadata/MetadataStore';

enum Mood {
  HAPPY,
  NEUTRAL,
  SAD,
}
enum PetPreference {
  DOG = 'DOG',
  CAT = 'CAT',
}
const store = new MetadataStore();

describe('Metadata Store', () => {
  describe(`metadata extraction`, () => {
    interface Address {
      city: string;
    }
    class Author {
      @Fixture()
      firstName!: string;
      @Fixture('{{name.lastName}}')
      lastName!: string;
      @Fixture({ get: () => '{{name.firstName}} {{name.lastName}}' })
      fullName!: string;
      @Fixture()
      age!: number;
      @Fixture()
      awarded!: boolean;
      @Fixture({ enum: Mood })
      mood!: Mood;
      @Fixture({ enum: PetPreference })
      petPreference!: PetPreference;
      @Fixture({ type: () => [Number], min: 2, max: 2 })
      position!: [number, number];
      @Fixture({ type: () => [String] })
      surnames!: string[];
      @Fixture()
      address!: Address;
      @Fixture({ type: () => [Book] })
      books!: Book[];
      @Fixture(faker => faker?.address.city())
      city!: string;
      @Fixture(() => ({ petName: 'foo' }))
      pet!: any;
      @Fixture({ ignore: true })
      foo!: string;
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

    it(`@Fixture({ get: (faker) => string) })`, () => {
      const fullNameProp = metadata.properties.find(p => p.name === 'fullName');

      expect(fullNameProp?.input).toBeDefined();
      expect(typeof fullNameProp?.input?.()).toBe('string');
    });

    it(`@Fixture({ ignore: true })`, () => {
      const fooProp = metadata.properties.find(p => p.name === 'foo');

      expect(fooProp?.ignore).toBe(true);
    });

    it(`string`, () => {
      const firstNameProp = metadata.properties.find(
        p => p.name === 'firstName'
      );

      expect(firstNameProp).toMatchObject({
        type: 'string',
      } as PropertyMetadata);
    });

    it(`number`, () => {
      const ageProp = metadata.properties.find(p => p.name === 'age');

      expect(ageProp).toMatchObject({
        type: 'number',
      } as PropertyMetadata);
    });

    it(`boolean`, () => {
      const awardedProp = metadata.properties.find(p => p.name === 'awarded');

      expect(awardedProp).toMatchObject({
        type: 'boolean',
      } as PropertyMetadata);
    });

    it(`number enum`, () => {
      const moodProp = metadata.properties.find(p => p.name === 'mood');

      expect(moodProp).toMatchObject({
        type: 'number',
        enum: true,
        items: [0, 1, 2],
      } as PropertyMetadata);
    });

    it(`string enum`, () => {
      const petPreferenceProp = metadata.properties.find(
        p => p.name === 'petPreference'
      );

      expect(petPreferenceProp).toMatchObject({
        type: 'string',
        enum: true,
        items: ['DOG', 'CAT'],
      } as PropertyMetadata);
    });

    it(`array`, () => {
      const surnamesProp = metadata.properties.find(p => p.name === 'surnames');

      expect(surnamesProp).toMatchObject({
        type: 'string',
        array: true,
      } as PropertyMetadata);
    });

    it(`class`, () => {
      const booksProp = metadata.properties.find(p => p.name === 'books');

      expect(booksProp).toMatchObject({
        type: 'Book',
        array: true,
      } as PropertyMetadata);
    });

    it(`array with min and max`, () => {
      const positionProp = metadata.properties.find(p => p.name === 'position');

      expect(positionProp).toMatchObject({
        type: 'number',
        array: true,
        max: 2,
        min: 2,
      } as PropertyMetadata);
    });

    it(`object`, () => {
      const addressProp = metadata.properties.find(p => p.name === 'address');

      expect(addressProp).toMatchObject({
        type: 'Object',
      } as PropertyMetadata);
    });

    it(`throws if an array type is used without @Fixture(type: () => Foo)`, () => {
      class Author {
        @Fixture()
        surnames!: string[];
      }
      expect(() => store.make(Author)).toThrow(
        'The type of "surnames" seems to be an array. Use @Fixture({ type: () => Foo })'
      );
    });

    it(`throws if anything than a class name is provided to @Fixture(type: () => Foo)`, () => {
      class Author {
        @Fixture({ type: () => ({ foo: 'bar' }) })
        pet!: any;
      }
      expect(() => store.make(Author)).toThrow(
        `Only pass class names to "type" in @Fixture({ type: () => Foo}) for "pet"`
      );
    });
  });
});
