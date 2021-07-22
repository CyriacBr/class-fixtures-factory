import { MetadataStore } from '../../metadata';
import { TypeGraphQLAdapter } from './TypeGraphQLAdapter';

MetadataStore.addAdapter(new TypeGraphQLAdapter());
