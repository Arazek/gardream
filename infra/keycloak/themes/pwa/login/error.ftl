<#import "template.ftl" as layout>
<@layout.page title=msg("errorTitle")>

  <div class="auth-state">
    <div class="auth-state__icon auth-state__icon--error">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
      </svg>
    </div>
    <h2 class="auth-state__title">${msg("errorTitle")}</h2>
    <p class="auth-state__text">${kcSanitize(message.summary)?no_esc}</p>
    <#if client?? && client.baseUrl?has_content>
      <a href="${client.baseUrl}" class="auth-btn auth-btn--primary auth-btn--inline">
        ${msg("backToApplication")}
      </a>
    </#if>
  </div>

</@layout.page>
