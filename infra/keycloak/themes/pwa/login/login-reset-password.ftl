<#import "template.ftl" as layout>
<@layout.page title=msg("emailForgotTitle")>

  <h2 class="auth-heading">${msg("emailForgotTitle")}</h2>
  <p class="auth-subheading">${msg("emailInstruction")}</p>

  <form action="${url.loginAction}" method="post" class="auth-form">

    <div class="auth-field">
      <label class="auth-field__label" for="username">
        <#if !realm.loginWithEmailAllowed>${msg("username")}
        <#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}
        <#else>${msg("email")}
        </#if>
      </label>
      <input
        class="auth-field__input"
        id="username"
        name="username"
        type="text"
        value="${(auth.attemptedUsername!'')}"
        autocomplete="username"
        autofocus
      >
    </div>

    <button type="submit" class="auth-btn auth-btn--primary">${msg("doSubmit")}</button>

  </form>

  <p class="auth-footer">
    <a href="${url.loginUrl}" class="auth-link">&larr; ${msg("backToLogin")}</a>
  </p>

</@layout.page>
