import { MetadataStore } from '../../metadata';
import { ClassValidatorAdapter } from './ClassValidatorAdapter';

MetadataStore.addAdapter(new ClassValidatorAdapter());
