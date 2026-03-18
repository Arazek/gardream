<#import "template.ftl" as layout>
<@layout.page title=msg("loginProfileTitle")>

  <h2 class="auth-heading">${msg("loginProfileTitle")}</h2>

  <form action="${url.loginAction}" method="post" class="auth-form">

    <#if !realm.registrationEmailAsUsername>
      <div class="auth-field">
        <label class="auth-field__label" for="username">${msg("username")}</label>
        <input
          class="auth-field__input"
          id="username"
          name="username"
          type="text"
          value="${(user.username!'')}"
          autocomplete="username"
        >
      </div>
    </#if>

    <div class="auth-field">
      <label class="auth-field__label" for="email">${msg("email")}</label>
      <input
        class="auth-field__input"
        id="email"
        name="email"
        type="text"
        value="${(user.email!'')}"
        autocomplete="email"
      >
    </div>

    <div class="auth-field">
      <label class="auth-field__label" for="firstName">${msg("firstName")}</label>
      <input
        class="auth-field__input"
        id="firstName"
        name="firstName"
        type="text"
        value="${(user.firstName!'')}"
        autocomplete="given-name"
      >
    </div>

    <div class="auth-field">
      <label class="auth-field__label" for="lastName">${msg("lastName")}</label>
      <input
        class="auth-field__input"
        id="lastName"
        name="lastName"
        type="text"
        value="${(user.lastName!'')}"
        autocomplete="family-name"
      >
    </div>

    <button type="submit" class="auth-btn auth-btn--primary">${msg("doSubmit")}</button>

  </form>

</@layout.page>
