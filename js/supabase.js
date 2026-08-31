/**
 * Cliente unico do Supabase para o frontend.
 *
 * IMPORTANTE:
 * 1. Substitua somente SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY.
 * 2. Use a Publishable key ou a chave anon publica.
 * 3. Nunca use service_role, secret key, senha do banco ou JWT secret aqui.
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm";

const SUPABASE_URL = "https://sdktnkaxmewxajkpshni.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2AWq-iYn9IoFpDDCMwvmdQ_ba3_Mhum";

function validarConfiguracao() {
  const urlNaoConfigurada =
    !SUPABASE_URL || SUPABASE_URL.includes("SEU-PROJETO");

  const chaveNaoConfigurada =
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY === "SUA-CHAVE-PUBLICA";

  if (urlNaoConfigurada || chaveNaoConfigurada) {
    throw new Error(
      "Supabase ainda nao configurado. Informe a URL do projeto e a chave publica em js/supabase.js."
    );
  }

  let url;

  try {
    url = new URL(SUPABASE_URL);
  } catch {
    throw new Error("A URL configurada para o Supabase e invalida.");
  }

  if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) {
    throw new Error(
      "A URL do Supabase deve usar HTTPS e o dominio oficial supabase.co."
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
