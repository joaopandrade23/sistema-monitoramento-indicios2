/**
 * Cliente único do Supabase para o frontend.
 *
 * IMPORTANTE:
 * 1. Use somente a URL pública do projeto.
 * 2. Use somente a Publishable key ou a chave anon pública.
 * 3. Nunca use service_role, secret key, senha do banco ou JWT secret.
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm";

const CONFIG = Object.freeze({
  URL: "https://sdktnkaxmewxajkpshni.supabase.co",
  PUBLISHABLE_KEY: "sb_publishable_2AWq-iYn9IoFpDDCMwvmdQ_ba3_Mhum",
});

function validarConfiguracao() {
  const urlNaoConfigurada = !CONFIG.URL || CONFIG.URL.includes("Base_Sistem_Indicios");
  const chaveNaoConfigurada = !CONFIG.PUBLISHABLE_KEY;

  if (urlNaoConfigurada || chaveNaoConfigurada) {
    throw new Error("CONFIG_INVALID_MISSING_KEYS");
  }

  let url;

  try {
    url = new URL(CONFIG.URL);
  } catch {
    throw new Error("CONFIG_INVALID_URL_FORMAT");
  }

  if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) {
    throw new Error("CONFIG_INVALID_URL_DOMAIN");
  }

  const chavePublicaValida =
    CONFIG.PUBLISHABLE_KEY.startsWith("sb_publishable_") ||
    CONFIG.PUBLISHABLE_KEY.startsWith("eyJ");

  if (!chavePublicaValida) {
    throw new Error("CONFIG_INVALID_KEY_FORMAT");
  }
}

validarConfiguracao();

export const supabase = createClient(
  CONFIG.URL,
  CONFIG.PUBLISHABLE_KEY,
  {
    db: {
      schema: "api",
    },

    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },

    global: {
      headers: {
        "X-Client-Info": "monitoramento-indicios-web/1.0",
      },
    },
  }
);
