import { supabase } from "./supabase.js";

const form = document.querySelector("#form-cadastro");
const nomeInput = document.querySelector("#nome-completo");
const emailInput = document.querySelector("#cadastro-email");
const passwordInput = document.querySelector("#cadastro-password");
const confirmPasswordInput = document.querySelector("#confirmar-password");
const submitButton = form.querySelector("#signup-button");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nomeCompleto = nomeInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Valida se todos os campos do HTML foram preenchidos
  if (!nomeCompleto || !email || !password || !confirmPassword) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  // Validações das senhas
  if (password.length < 8) {
    alert("A senha deve ter no mínimo 8 caracteres.");
    return;
  }

  if (password !== confirmPassword) {
    alert("As senhas não coincidem. Digite novamente.");
    return;
  }

  submitButton.disabled = true;

  try {
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
      if (error.code === "23505") { // Código PostgreSQL para violação de registro único
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
