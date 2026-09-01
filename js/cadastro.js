import { supabase } from "./supabase.js";

const form = document.querySelector("#form-cadastro");
const nomeInput = document.querySelector("#nome-completo");
const emailInput = document.querySelector("#cadastro-email");
const passwordInput = document.querySelector("#cadastro-password");
const confirmPasswordInput = document.querySelector("#confirmar-password");
const submitButton = form.querySelector("button[type='submit']");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nomeCompleto = nomeInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // 1. Validações de preenchimento e regra de negócio
  if (!nomeCompleto || !email || !password || !confirmPassword) {
    alert("Por favor, preencha todos os campos do formulário.");
    return;
  }

  if (password.length < 8) {
    alert("A senha deve conter no mínimo 8 caracteres.");
    return;
  }

  if (password !== confirmPassword) {
    alert("As senhas inseridas não coincidem.");
    return;
  }

  submitButton.disabled = true;

  try {
    // 2. Envio para a tabela de solicitações do Supabase
    const { error } = await supabase
      .from("solicitacao_cadastro")
      .insert([
        {
          nome_completo: nomeCompleto,
          email_institucional: email,
          senha: password,
        },
      ]);

    if (error) {
      if (error.code === "23505") { // Código de erro do Postgres para violação de UNIQUE
        throw new Error("Este e-mail já possui uma solicitação em andamento.");
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
