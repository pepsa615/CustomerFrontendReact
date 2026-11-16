import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:4000/v1'),
  VITE_SUPPORT_EMAIL: z.string().email().default('support@pepsa.co'),
  VITE_SUPPORT_CHAT_URL: z.string().url().optional(),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
})

export const env = envSchema.parse(import.meta.env)
