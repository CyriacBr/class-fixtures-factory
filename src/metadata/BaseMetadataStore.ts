import { Class } from '../common/typings';

export interface ClassMetadata {
  name: string;
  properties: PropertyMetadata[];
}

export interface PropertyMetadata {
  name: string;
  type: string;
  enum?: boolean;
  items?: any[];
  array?: boolean;
  ignore?: boolean;
  min?: number;
  max?: number;
  input?: (...args: any[]) => any;
}

export abstract class BaseMetadataStore {
  protected store: Record<string, ClassMetadata> = {};
  get(classType: Class) {
    return this.store[classType.name];
  }
  abstract make(classType: Class): void;
}
