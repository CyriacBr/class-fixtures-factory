import { MetadataStore } from '../../metadata';
import { ClassValidatorAdapter } from './ClassValidatorAdapter';

MetadataStore.setAdapter(new ClassValidatorAdapter());
