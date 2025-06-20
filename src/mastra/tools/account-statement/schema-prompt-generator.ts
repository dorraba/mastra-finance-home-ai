import { z } from 'zod';

/**
 * Utility to generate AI prompts from Zod schemas
 * This creates detailed prompts that include field descriptions, validation rules, and enum options
 */
export const generatePromptFromSchema = (schema: z.ZodSchema): string => {
  const getSchemaDescription = (schema: any): string => {
    // Handle ZodObject
    if (schema._def?.typeName === 'ZodObject') {
      const shape = schema._def.shape();
      const fields = Object.entries(shape).map(([key, fieldSchema]: [string, any]) => {
        const fieldDesc = getFieldDescription(fieldSchema);
        return `  - **${key}**: ${fieldDesc}`;
      }).join('\n');
      
      return `Object with fields:\n${fields}`;
    }
    
    // Handle ZodUnion (for our enum-like structures)
    if (schema._def?.typeName === 'ZodUnion') {
      const options = schema._def.options.map((option: any) => {
        if (option._def?.typeName === 'ZodLiteral') {
          const value = option._def.value;
          const desc = option._def.description || '';
          return `    - "${value}": ${desc}`;
        }
        return `    - ${option._def?.value || 'unknown'}`;
      }).join('\n');
      
      return `Choose one of:\n${options}`;
    }
    
    return schema._def?.description || 'Field description not available';
  };
  
  return getSchemaDescription(schema);
};

/**
 * Helper function to extract field descriptions from Zod schema fields
 * Includes validation constraints and enum options
 */
export const getFieldDescription = (fieldSchema: any): string => {
  let desc = '';
  
  // Get base description
  if (fieldSchema._def?.description) {
    desc += fieldSchema._def.description;
  }
  
  // Handle string constraints
  if (fieldSchema._def?.typeName === 'ZodString') {
    const checks = fieldSchema._def.checks || [];
    const minLength = checks.find((c: any) => c.kind === 'min')?.value;
    const maxLength = checks.find((c: any) => c.kind === 'max')?.value;
    
    if (minLength || maxLength) {
      desc += ` (${minLength ? `min: ${minLength}` : ''}${minLength && maxLength ? ', ' : ''}${maxLength ? `max: ${maxLength}` : ''} characters)`;
    }
  }
  
  // Handle unions (our enum-like structures)
  if (fieldSchema._def?.typeName === 'ZodUnion') {
    const options = fieldSchema._def.options.map((option: any) => {
      if (option._def?.typeName === 'ZodLiteral') {
        return `"${option._def.value}"`;
      }
      return 'unknown';
    }).join(', ');
    desc += `\n    Valid values: ${options}`;
  }
  
  return desc;
}; 