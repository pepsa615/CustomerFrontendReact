import { trace } from '@opentelemetry/api';
import { env } from './schemas/env';

export async function startTelemetry() {
  if (!env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT) return;
  const [web, base, exporter, resources, conventions] = await Promise.all([
    import('@opentelemetry/sdk-trace-web'),
    import('@opentelemetry/sdk-trace-base'),
    import('@opentelemetry/exporter-trace-otlp-http'),
    import('@opentelemetry/resources'),
    import('@opentelemetry/semantic-conventions'),
  ]);
  const { WebTracerProvider } = web;
  const { BatchSpanProcessor } = base;
  const { OTLPTraceExporter } = exporter;
  const { resourceFromAttributes } = resources;
  const { ATTR_SERVICE_NAME } = conventions;
  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'pepsa-customer-web' }),
    spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter({ url: `${env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, '')}/v1/traces` }))],
  });
  provider.register();
}

export const webTracer = trace.getTracer('pepsa-customer-web');
