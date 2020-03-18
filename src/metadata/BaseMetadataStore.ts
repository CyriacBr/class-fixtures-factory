import { Class } from '../common/typings';

export interface ClassMetadata {
  name: string;
  properties: PropertyMetadata[];
}

export interface PropertyMetadata {
  name: string;
  type: string;
  scalar?: boolean;
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
  get(classType: Class | string) {
    const name = typeof classType === 'string' ? classType : classType.name;
    const value = this.store[name];
    if (!value) throw new Error(`Cannot find metadata for class "${name}"`);
    return value;
  }
  abstract make(classType: Class): ClassMetadata;
}
