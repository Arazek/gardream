<#import "template.ftl" as layout>
<@layout.page title=msg("updatePasswordTitle")>

  <h2 class="auth-heading">${msg("updatePasswordTitle")}</h2>

  <form action="${url.loginAction}" method="post" class="auth-form">

    <input type="text" name="username" value="${username}" autocomplete="username" style="display:none;" readonly>

    <div class="auth-field">
      <label class="auth-field__label" for="password-new">${msg("passwordNew")}</label>
      <input
        class="auth-field__input"
        id="password-new"
        name="password-new"
        type="password"
        autocomplete="new-password"
        autofocus
      >
    </div>

    <div class="auth-field">
      <label class="auth-field__label" for="password-confirm">${msg("passwordConfirm")}</label>
      <input
        class="auth-field__input"
        id="password-confirm"
        name="password-confirm"
        type="password"
        autocomplete="new-password"
      >
    </div>

    <#if isAppInitiatedAction??>
      <button type="submit" class="auth-btn auth-btn--primary" name="login-actions" value="update-password">
        ${msg("doSubmit")}
      </button>
      <button type="submit" class="auth-btn auth-btn--ghost" name="cancel-aia" value="true">
        ${msg("doCancel")}
      </button>
    <#else>
      <button type="submit" class="auth-btn auth-btn--primary">${msg("doSubmit")}</button>
    </#if>

  </form>

</@layout.page>
