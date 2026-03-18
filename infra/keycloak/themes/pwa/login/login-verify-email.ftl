<#import "template.ftl" as layout>
<@layout.page title=msg("emailVerifyTitle")>

  <div class="auth-state">
    <div class="auth-state__icon auth-state__icon--info">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
      </svg>
    </div>
    <h2 class="auth-state__title">${msg("emailVerifyTitle")}</h2>
    <p class="auth-state__text">
      ${msg("emailVerifyInstruction1", user.email!'')}
    </p>
    <p class="auth-state__text auth-state__text--muted">
      ${msg("emailVerifyInstruction2")}
      <a href="${url.loginAction}" class="auth-link">${msg("doClickHere")}</a>
      ${msg("emailVerifyInstruction3")}
    </p>
  </div>

</@layout.page>
