import { FactoryHooks } from 'FactoryHooks';
import { FactoryOptions } from '..';
import { Class } from '../common';
import { DeepRequired } from '../utils';
import { PropertyMetadata } from './MetadataStore';

export interface BasePropertyMetadata {
  propertyName: string;
}

/**
 * A class to extend to create a custom adapter.
 * An adapter has two goal:
 * - to make an array of PropertyMetadata based on a given class
 * - to infer the correct metadata given the default metadata from reflection and the metadata made previously
 */
export abstract class BaseMetadataAdapter<
  MetadataType extends BasePropertyMetadata = BasePropertyMetadata
> {
  /**
   * Returns the metadata from the perspective of the adapter.
   */
  abstract makeOwnMetadata(
    classType: Class,
    adapterContext: any,
    options?: DeepRequired<FactoryOptions>
  ): MetadataType[];

  /**
   * When a metadata from reflection exists and this adapter also proposed
   * its own metadata, this method needs to resolve this conflict and return
   * the correct metadata to infer
   * @param reflectProp default metadata constructed from reflection by the library, this can be undefined
   * @param ownProp the metadata this adapter made from makeMetadata
   */
  abstract deduceMetadata(
    reflectProp: Readonly<PropertyMetadata> | undefined,
    ownProp: Readonly<MetadataType>,
    propHooks: FactoryHooks,
    adapterContext: any
  ): Partial<PropertyMetadata>;
}
