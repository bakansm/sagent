import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';
import { Sandbox } from '@e2b/code-interpreter';

const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET: z.string().optional(),
    // AUTH_DISCORD_ID: z.string(),
    // AUTH_DISCORD_SECRET: z.string(),
    DATABASE_URL: z.string().url(),
    E2B_API_KEY: z.string(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    GEMINI_API_KEY: z.string(),
    OPENAI_API_KEY: z.string(),
    PRIVY_APP_SECRET: z.string(),
    ADMIN_PRIVATE_KEY: z.string()
  },
  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_PRIVY_APP_ID: z.string(),
    NEXT_PUBLIC_PRIVY_CLIENT_ID: z.string()
  },
  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    E2B_API_KEY: process.env.E2B_API_KEY,
    NODE_ENV: "development",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET,
    ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_PRIVY_CLIENT_ID: process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true
});

async function getSandbox(sandboxId) {
  const sandbox = await Sandbox.connect(sandboxId, {
    apiKey: env.E2B_API_KEY
  });
  return sandbox;
}

export { env as e, getSandbox as g };
//# sourceMappingURL=utils.mjs.map
