export type PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
};

export type PublicEnvInput = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

export type PublicEnvKey = keyof PublicEnv;

const PUBLIC_ENV_KEYS: PublicEnvKey[] = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

function normalizeRequiredEnvValue(
  input: PublicEnvInput,
  key: PublicEnvKey,
): string {
  const value = input[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function validateSupabaseUrl(value: string): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must use http or https.");
  }

  return parsedUrl.origin;
}

export function validatePublicEnv(input: PublicEnvInput): PublicEnv {
  const env = Object.fromEntries(
    PUBLIC_ENV_KEYS.map((key) => [key, normalizeRequiredEnvValue(input, key)]),
  ) as PublicEnv;

  return {
    ...env,
    NEXT_PUBLIC_SUPABASE_URL: validateSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL),
  };
}
