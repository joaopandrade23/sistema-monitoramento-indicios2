import { supabase } from "./supabase.js";

const form = document.querySelector("#form-cadastro");
const nomeInput = document.querySelector("#nome-completo");
const codigoInput = document.querySelector("#codigo-usuario");
const emailInput = document.querySelector("#cadastro-email");
const submitButton = form.querySelector("button[type='submit']");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nomeCompleto = nomeInput.value.trim();
  const codigoUsuario = codigoInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();

  if (!nomeCompleto || !codigoUsuario || !email) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  submitButton.disabled = true;

  try {
    const { error } = await supabase
      .from("solicitacao_cadastro")
      .insert([
        {
          nome_completo: nomeCompleto,
          codigo_usuario: codigoUsuario,
          email_institucional: email,
        },
      ]);

    if (error) {
      if (error.code === "23505") { // Violação de e-mail único
        throw new Error("Este e-mail já possui uma solicitação enviada.");
      }
      throw new Error("Não foi possível enviar sua solicitação. Tente novamente.");
    }

    alert("Solicitação enviada com sucesso! Aguarde a análise da gestão.");
    form.reset();
    window.location.href = "./index.html";
  } catch (err) {
    alert(err.message);
  } finally {
    submitButton.disabled = false;
  }
});
