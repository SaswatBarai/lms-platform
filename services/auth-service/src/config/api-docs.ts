import { apiReference } from '@scalar/express-api-reference';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Application } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OPENAPI_PATH = process.env.OPENAPI_PATH || path.join(__dirname, '../../docs/openapi');

export const setupApiDocs = (app: Application) => {
  try {
    console.log(`🔍 Setting up API docs from path: ${OPENAPI_PATH}`);
    const spec = YAML.load(path.join(OPENAPI_PATH, 'openapi.yaml'));
    console.log('✅ OpenAPI document loaded successfully');

    // Serve the raw OpenAPI JSON (must be registered before apiReference so path is available)
    app.get('/api-docs/openapi.json', (_req, res) => res.json(spec));
    app.get('/auth/api/api-docs/openapi.json', (_req, res) => res.json(spec));

    const scalarConfig = {
      content: spec,
      theme: 'purple' as const,
    };

    app.use('/api-docs', apiReference(scalarConfig));
    app.use('/api-docs/', apiReference(scalarConfig));
    app.use('/auth/api/api-docs', apiReference(scalarConfig));
    app.use('/auth/api/api-docs/', apiReference(scalarConfig));

    console.log('📄 API Docs available at:');
    console.log('   - Direct: http://localhost:4001/api-docs');
    console.log('   - Via Kong: http://localhost:8000/auth/api/api-docs');
  } catch (error) {
    console.error('❌ Failed to load API documentation:', error);
  }
};
