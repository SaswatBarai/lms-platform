import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import type { Application } from 'express';

const SWAGGER_PATH = process.env.SWAGGER_PATH || path.join(process.cwd(), 'swagger');

export const setupSwagger = (app: Application) => {
  try {
    const swaggerDocument = YAML.load(path.join(SWAGGER_PATH, 'openapi.yaml'));

    const orangeTheme = `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #ff6b35 !important; }
      .swagger-ui .btn.authorize { background-color: #ff6b35; border-color: #ff6b35; }
      .swagger-ui .btn.authorize:hover { background-color: #ff8555; border-color: #ff8555; }
      .swagger-ui .scheme-container { background-color: #fff5f2; }
      .swagger-ui .opblock.opblock-post { background: #fff5f2; border-color: #ff6b35; }
      .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #ff6b35; }
      .swagger-ui .opblock.opblock-get { background: #fff5f2; border-color: #ff6b35; }
      .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #ff6b35; }
      .swagger-ui .opblock.opblock-put { background: #fff5f2; border-color: #ff6b35; }
      .swagger-ui .opblock.opblock-put .opblock-summary { border-color: #ff6b35; }
      .swagger-ui .opblock.opblock-delete { background: #fff5f2; border-color: #ff6b35; }
      .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #ff6b35; }
      .swagger-ui .opblock.opblock-patch { background: #fff5f2; border-color: #ff6b35; }
      .swagger-ui .opblock.opblock-patch .opblock-summary { border-color: #ff6b35; }
      .swagger-ui .opblock-tag { color: #ff6b35; }
      .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #ff6b35; }
      .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #ff6b35; }
      .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #ff6b35; }
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #ff6b35; }
      .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #ff6b35; }
      .swagger-ui .btn.execute { background-color: #ff6b35; border-color: #ff6b35; }
      .swagger-ui .btn.execute:hover { background-color: #ff8555; border-color: #ff8555; }
      .swagger-ui .btn.cancel { background-color: #ff6b35; border-color: #ff6b35; }
      .swagger-ui .btn.cancel:hover { background-color: #ff8555; border-color: #ff8555; }
      .swagger-ui a { color: #ff6b35; }
      .swagger-ui a.nostyle { color: inherit; }
      .swagger-ui .parameter__name { color: #ff6b35; }
      .swagger-ui .model-title { color: #ff6b35; }
      .swagger-ui .prop-name { color: #ff6b35; }
      .swagger-ui .response-col_links { color: #ff6b35; }
      .swagger-ui .tab li.active button { color: #ff6b35; border-bottom-color: #ff6b35; }
      .swagger-ui .opblock.opblock-post .opblock-summary:hover { background-color: #ffe8e0; }
      .swagger-ui .opblock.opblock-get .opblock-summary:hover { background-color: #ffe8e0; }
      .swagger-ui .opblock.opblock-put .opblock-summary:hover { background-color: #ffe8e0; }
      .swagger-ui .opblock.opblock-delete .opblock-summary:hover { background-color: #ffe8e0; }
      .swagger-ui .opblock.opblock-patch .opblock-summary:hover { background-color: #ffe8e0; }
      
      /* Response Status Colors */
      .swagger-ui .response-col_status[data-code="200"],
      .swagger-ui .response-col_status[data-code="201"],
      .swagger-ui .response-col_status[data-code="204"] {
        color: #28a745 !important;
        font-weight: bold;
      }
      .swagger-ui .response-col_status[data-code="200"]::before,
      .swagger-ui .response-col_status[data-code="201"]::before,
      .swagger-ui .response-col_status[data-code="204"]::before {
        content: "✓ ";
        color: #28a745;
      }
      
      .swagger-ui .response-col_status[data-code="400"],
      .swagger-ui .response-col_status[data-code="422"] {
        color: #ffc107 !important;
        font-weight: bold;
      }
      .swagger-ui .response-col_status[data-code="400"]::before,
      .swagger-ui .response-col_status[data-code="422"]::before {
        content: "⚠ ";
        color: #ffc107;
      }
      
      .swagger-ui .response-col_status[data-code="401"],
      .swagger-ui .response-col_status[data-code="403"] {
        color: #ff9800 !important;
        font-weight: bold;
      }
      .swagger-ui .response-col_status[data-code="401"]::before,
      .swagger-ui .response-col_status[data-code="403"]::before {
        content: "🔒 ";
        color: #ff9800;
      }
      
      .swagger-ui .response-col_status[data-code="404"] {
        color: #6c757d !important;
        font-weight: bold;
      }
      .swagger-ui .response-col_status[data-code="404"]::before {
        content: "❌ ";
        color: #6c757d;
      }
      
      .swagger-ui .response-col_status[data-code="409"] {
        color: #ff6b35 !important;
        font-weight: bold;
      }
      .swagger-ui .response-col_status[data-code="409"]::before {
        content: "⚠ ";
        color: #ff6b35;
      }
      
      .swagger-ui .response-col_status[data-code="429"] {
        color: #e91e63 !important;
        font-weight: bold;
      }
      .swagger-ui .response-col_status[data-code="429"]::before {
        content: "⏱ ";
        color: #e91e63;
      }
      
      .swagger-ui .response-col_status[data-code="500"],
      .swagger-ui .response-col_status[data-code="502"],
      .swagger-ui .response-col_status[data-code="503"] {
        color: #dc3545 !important;
        font-weight: bold;
      }
      .swagger-ui .response-col_status[data-code="500"]::before,
      .swagger-ui .response-col_status[data-code="502"]::before,
      .swagger-ui .response-col_status[data-code="503"]::before {
        content: "✗ ";
        color: #dc3545;
      }
      
      /* Response Body Colors */
      .swagger-ui .response .response-col_status[data-code="200"] ~ .response-col_description,
      .swagger-ui .response .response-col_status[data-code="201"] ~ .response-col_description,
      .swagger-ui .response .response-col_status[data-code="204"] ~ .response-col_description {
        color: #28a745;
      }
      
      .swagger-ui .response .response-col_status[data-code="400"] ~ .response-col_description,
      .swagger-ui .response .response-col_status[data-code="422"] ~ .response-col_description {
        color: #ffc107;
      }
      
      .swagger-ui .response .response-col_status[data-code="401"] ~ .response-col_description,
      .swagger-ui .response .response-col_status[data-code="403"] ~ .response-col_description {
        color: #ff9800;
      }
      
      .swagger-ui .response .response-col_status[data-code="404"] ~ .response-col_description {
        color: #6c757d;
      }
      
      .swagger-ui .response .response-col_status[data-code="409"] ~ .response-col_description {
        color: #ff6b35;
      }
      
      .swagger-ui .response .response-col_status[data-code="429"] ~ .response-col_description {
        color: #e91e63;
      }
      
      .swagger-ui .response .response-col_status[data-code="500"] ~ .response-col_description,
      .swagger-ui .response .response-col_status[data-code="502"] ~ .response-col_description,
      .swagger-ui .response .response-col_status[data-code="503"] ~ .response-col_description {
        color: #dc3545;
      }
      
      /* Live Response Colors */
      .swagger-ui .live-response .response-col_status[data-code="200"],
      .swagger-ui .live-response .response-col_status[data-code="201"],
      .swagger-ui .live-response .response-col_status[data-code="204"] {
        background-color: #d4edda !important;
        border-left: 4px solid #28a745 !important;
        padding: 8px;
        border-radius: 4px;
      }
      
      .swagger-ui .live-response .response-col_status[data-code="400"],
      .swagger-ui .live-response .response-col_status[data-code="422"] {
        background-color: #fff3cd !important;
        border-left: 4px solid #ffc107 !important;
        padding: 8px;
        border-radius: 4px;
      }
      
      .swagger-ui .live-response .response-col_status[data-code="401"],
      .swagger-ui .live-response .response-col_status[data-code="403"] {
        background-color: #ffe0b2 !important;
        border-left: 4px solid #ff9800 !important;
        padding: 8px;
        border-radius: 4px;
      }
      
      .swagger-ui .live-response .response-col_status[data-code="404"] {
        background-color: #e9ecef !important;
        border-left: 4px solid #6c757d !important;
        padding: 8px;
        border-radius: 4px;
      }
      
      .swagger-ui .live-response .response-col_status[data-code="409"] {
        background-color: #ffe8e0 !important;
        border-left: 4px solid #ff6b35 !important;
        padding: 8px;
        border-radius: 4px;
      }
      
      .swagger-ui .live-response .response-col_status[data-code="429"] {
        background-color: #fce4ec !important;
        border-left: 4px solid #e91e63 !important;
        padding: 8px;
        border-radius: 4px;
      }
      
      .swagger-ui .live-response .response-col_status[data-code="500"],
      .swagger-ui .live-response .response-col_status[data-code="502"],
      .swagger-ui .live-response .response-col_status[data-code="503"] {
        background-color: #f8d7da !important;
        border-left: 4px solid #dc3545 !important;
        padding: 8px;
        border-radius: 4px;
      }
    `;

    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        explorer: true,
        customCss: orangeTheme,
        customSiteTitle: "LMS Auth Service API",
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          requestInterceptor: (req: any) => {
            // Ensure requests go through properly
            return req;
          },
          responseInterceptor: (res: any) => {
            // Handle responses properly
            return res;
          },
          tryItOutEnabled: true
        }
      })
    );

    app.use(
      '/auth/api/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        explorer: true,
        customCss: orangeTheme,
        customSiteTitle: "LMS Auth Service API",
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          requestInterceptor: (req: any) => {
            // Ensure requests go through properly
            return req;
          },
          responseInterceptor: (res: any) => {
            // Handle responses properly
            return res;
          },
          tryItOutEnabled: true
        }
      })
    );

    console.log('📄 Swagger Docs available at /api-docs (via Kong: http://localhost:8000/auth/api/api-docs)');
  } catch (error) {
    console.error('❌ Failed to load Swagger API documentation:', error);
  }
};

