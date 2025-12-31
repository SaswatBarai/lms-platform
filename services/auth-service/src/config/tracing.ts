import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Enable diagnostic logging for debugging
if (process.env.NODE_ENV === 'development') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// Configure the OTLP exporter with proper settings
const traceExporter = new OTLPTraceExporter({
  url: process.env.JAEGER_ENDPOINT || 'http://jaeger:4318/v1/traces',
  headers: {
    'Content-Type': 'application/json',
  },
  timeoutMillis: 15000, // 15 seconds timeout
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'auth-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable fs instrumentation to reduce noise
      },
    }),
  ],
});

// Start the SDK
try {
  sdk.start();
  console.log('✅ OpenTelemetry tracing initialized successfully');
  console.log(`📊 Exporting traces to: ${process.env.JAEGER_ENDPOINT || 'http://jaeger:4318/v1/traces'}`);
} catch (error: any) {
  console.error('❌ Failed to initialize OpenTelemetry tracing:', error);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    await sdk.shutdown();
    console.log('🛑 OpenTelemetry SDK shut down successfully');
  } catch (error: any) {
    console.error('❌ Error shutting down OpenTelemetry SDK:', error);
  } finally {
    process.exit(0);
  }
});

export { sdk };