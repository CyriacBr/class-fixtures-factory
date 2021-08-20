import { getMetadataArgsStorage } from 'typeorm';
import { ColumnMetadataArgs } from 'typeorm/metadata-args/ColumnMetadataArgs';
import { GeneratedMetadataArgs } from 'typeorm/metadata-args/GeneratedMetadataArgs';
import { RelationMetadataArgs } from 'typeorm/metadata-args/RelationMetadataArgs';
import { Class } from '../../common';
import { FactoryHooks } from '../../FactoryHooks';
import { BaseMetadataAdapter, PropertyMetadata } from '../../metadata';
import { DeepRequired } from '../../utils';
import { FactoryOptions } from '../../FixtureFactory';
import { EmbeddedMetadataArgs } from 'typeorm/metadata-args/EmbeddedMetadataArgs';
import { IndexMetadataArgs } from 'typeorm/metadata-args/IndexMetadataArgs';

interface Metadata {
  propertyName: string;
  column?: ColumnMetadataArgs;
  generation?: GeneratedMetadataArgs;
  relation?: RelationMetadataArgs;
  embed?: EmbeddedMetadataArgs;
  indexes: IndexMetadataArgs[];
}

export class TypeORMMetadataAdapter extends BaseMetadataAdapter<Metadata> {
  options!: DeepRequired<FactoryOptions> | undefined;
  typeMapping: Record<any, string | undefined> = {
    [Number as any]: 'number',
    [String as any]: 'string',
    [Boolean as any]: 'boolean',
    [Date as any]: 'date',
    uuid: 'string',

    // TODO: also infer min/max values
    bit: 'number',
    int: 'number',
    int2: 'number',
    int4: 'number',
    int8: 'number',
    integer: 'number',
    tinyint: 'number',
    smallint: 'number',
    mediumint: 'number',
    bigint: 'number',
    real: 'number',
    float: 'number',
    float4: 'number',
    float8: 'number',
    money: 'number',
    double: 'number',
    'double precision': 'number',
    dec: 'number',
    decimal: 'number',
    numeric: 'number',
    fixed: 'number',

    bool: 'boolean',
    boolean: 'boolean',

    date: 'date',
    datetime: 'date',
    timestamp: 'date',
    time: 'date',
    year: 'number',

    char: 'string',
    nchar: 'string',
    'national char': 'string',
    varchar: 'string',
    nvarchar: 'string',
    'national varchar': 'string',
    text: 'string',
    tinytext: 'string',
    mediumtext: 'string',
    blob: 'string',
    longtext: 'string',
    tinyblob: 'string',
    mediumblob: 'string',
    longblob: 'string',
    // TODO: properly handle binary types?
    binary: 'string',
    varbinary: 'string',

    enum: 'enum',
    set: 'set',
    'simple-array': 'simple-array',
  };

  makeOwnMetadata(
    classType: Class<any>,
    options?: DeepRequired<FactoryOptions>
  ): Metadata[] {
    this.options = options;
    const store = getMetadataArgsStorage();
    const columns = store.columns.filter(v => v.target === classType);
    const generations = store.generations.filter(v => v.target === classType);
    const relations = store.relations.filter(v => v.target === classType);
    const embeddeds = store.embeddeds.filter(v => v.target === classType);
    const indexes = store.indices.filter(v => v.target === classType);

    const propertyNames = [
      ...new Set([
        ...columns.map(v => v.propertyName),
        ...generations.map(v => v.propertyName),
        ...relations.map(v => v.propertyName),
        ...embeddeds.map(v => v.propertyName),
        ...indexes
          .map(v => (Array.isArray(v.columns) ? (v.columns as string[]) : []))
          .flat(),
      ]),
    ];

    return propertyNames.map(propName => {
      return {
        propertyName: propName,
        column: columns.find(v => v.propertyName === propName),
        generation: generations.find(v => v.propertyName === propName),
        relation: relations.find(v => v.propertyName === propName),
        embed: embeddeds.find(v => v.propertyName === propName),
        indexes: indexes.filter(
          v =>
            Array.isArray(v.columns) &&
            (v.columns as string[]).includes(propName)
        ),
      };
    });
  }

  deduceMetadata(
    _reflectProp: Readonly<PropertyMetadata> | undefined,
    ownProp: Readonly<Metadata>,
    propHooks: FactoryHooks
  ): Partial<PropertyMetadata> {
    const prop: Partial<PropertyMetadata> = {
      name: ownProp.propertyName,
    };

    const type = this.typeMapping[ownProp.column?.options.type as any];
    const options = ownProp.column?.options;

    const uniqueIndex = ownProp.indexes.find(v => !!v.unique);
    if (uniqueIndex) {
      prop.unique = true;
      prop.uniqueCacheKey = (uniqueIndex.columns as string[]).join('-');
    }

    if (ownProp.column?.options.default != null) {
      const { default: _default } = ownProp.column?.options;
      const value = typeof _default === 'function' ? _default() : _default;
      if (!(typeof value === 'string' && type !== 'string')) {
        propHooks.setOverride(() => _default);
        return {
          ...prop,
          type,
        };
      }
    }

    if (['enum', 'set'].includes(type!)) {
      return {
        ...prop,
        scalar: type === 'enum',
        array: type === 'set',
        type: 'string',
        items: Object.values(ownProp.column?.options?.enum || {}),
      };
    } else if (type === 'simple-array') {
      return {
        ...prop,
        array: true,
        type: 'string',
      };
    }

    if (ownProp.relation?.type) {
      return {
        ...prop,
        //@ts-expect-error
        type: ownProp.relation?.type(),
        scalar: false,
        array: ['one-to-many', 'many-to-many'].includes(
          ownProp.relation.relationType
        ),
      };
    }

    if (ownProp.embed?.type) {
      return {
        ...prop,
        //@ts-expect-error
        type: ownProp.embed?.type(),
        scalar: false,
        array: ownProp.embed.isArray,
      };
    }

    //- If the property is a primary key or is a generated column
    if (ownProp.column?.options.primary || !!ownProp.generation) {
      let scopeType = type;
      switch (ownProp.generation?.strategy) {
        case 'increment':
          scopeType = 'number';
          break;
        case 'uuid':
          scopeType = 'string';
          break;
      }
      /**
       * If it doesn't have a generation strategy, we generate a random unique value
       */
      if (this.options?.handleGeneratedColumns || !ownProp.generation) {
        if (scopeType !== 'number' && scopeType !== 'string') {
          return prop;
        }
        return {
          ...prop,
          type: scopeType,
          scalar: true,
          unique: true,
        };
      }
      /**
       * If it does, we generate undefined: values are handled by the DB when entities are persisted
       */
      propHooks.setOverride(() => undefined);
      return {
        ...prop,
        type: scopeType,
      };
    }

    switch (ownProp.column?.mode) {
      case 'createDate':
      case 'updateDate':
      case 'deleteDate':
        return {
          ...prop,
          type: 'date',
          scalar: true,
        };
      case 'version':
        propHooks.setOverride(() => 1);
        return {
          ...prop,
          type: 'number',
          scalar: true,
        };
    }

    if (type === 'string') {
      prop.max = ownProp.column?.options.length
        ? Number(ownProp.column?.options.length)
        : undefined;
    } else if (
      type === 'number' &&
      (options?.precision != null || options?.scale != null)
    ) {
      const max = options.precision
        ? Number(
            Array(options.precision)
              .fill(9)
              .join('')
          )
        : undefined;
      prop.max = max;
      prop.precision = options.scale;
    }

    return {
      ...prop,
      type,
      scalar: true,
    };
  }
}
