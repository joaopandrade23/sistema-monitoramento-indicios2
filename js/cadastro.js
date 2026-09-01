import { supabase } from "./supabase.js";

const form = document.querySelector("#form-cadastro");
const nomeInput = document.querySelector("#nome-completo");
const emailInput = document.querySelector("#cadastro-email");
const passwordInput = document.querySelector("#cadastro-password");
const confirmPasswordInput = document.querySelector("#confirmar-password");
const submitButton = form.querySelector("#signup-button");

// Dispara o balão nativo do navegador apontando para o campo com erro
function mostrarErroNativo(input, mensagem) {
  input.setCustomValidity(mensagem);
  input.reportValidity();
}

// Limpa o estado de erro assim que o usuário começa a digitar novamente
[nomeInput, emailInput, passwordInput, confirmPasswordInput].forEach((input) => {
  input.addEventListener("input", () => input.setCustomValidity(""));
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nomeCompleto = nomeInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Validações de campos obrigatórios
  if (!nomeCompleto) {
    mostrarErroNativo(nomeInput, "Preencha este campo.");
    return;
  }

  if (!email) {
    mostrarErroNativo(emailInput, "Preencha este campo.");
    return;
  }

  if (!password) {
    mostrarErroNativo(passwordInput, "Preencha este campo.");
    return;
  }

  // Validações de regra de negócio
  if (password.length < 8) {
    mostrarErroNativo(passwordInput, "A senha deve ter no mínimo 8 caracteres.");
    return;
  }

  if (password !== confirmPassword) {
    mostrarErroNativo(confirmPasswordInput, "As senhas não coincidem.");
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
      if (error.code === "23505") {
        mostrarErroNativo(emailInput, "Este e-mail já possui uma solicitação enviada.");
        return;
      }
      mostrarErroNativo(emailInput, "Não foi possível enviar sua solicitação. Tente novamente.");
      return;
    }

    alert("Solicitação enviada com sucesso! Aguarde a análise da gestão.");
    form.reset();
    window.location.href = "./index.html";
  } catch (err) {
    mostrarErroNativo(emailInput, err.message);
  } finally {
    submitButton.disabled = false;
  }
});
