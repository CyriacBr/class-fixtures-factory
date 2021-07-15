import { MetadataStore } from '../../metadata';
import { TypeGraphQLAdapter } from './TypeGraphQLAdapter';

MetadataStore.setAdapter(new TypeGraphQLAdapter());
