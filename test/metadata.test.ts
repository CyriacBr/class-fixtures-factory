import { DefaultMetadataStore } from '../src/metadata/DefaultMetadataStore';
import { Fixture } from '../src/decorators/Fixture';
import {
  ClassMetadata,
  PropertyMetadata,
} from '../src/metadata/BaseMetadataStore';

enum Mood {
  HAPPY,
  NEUTRAL,
  SAD,
}
enum PetPreference {
  DOG = 'DOG',
  CAT = 'CAT',
}
const store = new DefaultMetadataStore();

describe('Metadata Store', () => {
  describe(`metadata extraction`, () => {
    class Author {
      @Fixture()
      firstName!: string;
      @Fixture('{{name.lastName}}')
      lastName!: string;
      @Fixture()
      age!: number;
      @Fixture()
      awarded!: boolean;
      @Fixture({ enum: Mood })
      mood!: Mood;
      @Fixture({ enum: PetPreference })
      petPreference!: PetPreference;
      @Fixture()
      position!: [number, number];
      @Fixture()
      surnames!: string[];
      books!: Book[];
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

    it(`throws is passing anything than a clas to type: () => Foo`, () => {});
  });
});
