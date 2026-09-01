/**
 * Cliente único do Supabase para o frontend.
 *
 * IMPORTANTE:
 * 1. Use somente a URL pública do projeto.
 * 2. Use somente a Publishable key ou a chave anon pública.
 * 3. Nunca use service_role, secret key, senha do banco ou JWT secret.
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm";

const SUPABASE_URL = "https://sdktnkaxmewxajkpshni.supabase.co";

/*
 * Insira aqui a sua chave anon / publishable do Supabase.
 */
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2AWq-iYn9IoFpDDCMwvmdQ_ba3_Mhum";

function validarConfiguracao() {
  const urlNaoConfigurada = !SUPABASE_URL || SUPABASE_URL.includes("SEU-PROJETO");
  const chaveNaoConfigurada = !SUPABASE_PUBLISHABLE_KEY;

  if (urlNaoConfigurada || chaveNaoConfigurada) {
    throw new Error(
      "Supabase ainda não configurado. Informe a URL do projeto e a chave pública."
    );
  }

  let url;

  try {
    url = new URL(SUPABASE_URL);
  } catch {
    throw new Error(
      "A URL configurada para o Supabase é inválida."
    );
  }

  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".supabase.co")
  ) {
    throw new Error(
      "A URL do Supabase deve usar HTTPS e o domínio oficial supabase.co."
    );
  }

  const chavePublicaValida =
    SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_") ||
    SUPABASE_PUBLISHABLE_KEY.startsWith("eyJ");

  if (!chavePublicaValida) {
    throw new Error(
      "A chave configurada não parece ser uma Publishable key ou anon public key."
    );
  }
}

validarConfiguracao();

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
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
