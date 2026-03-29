<#import "template.ftl" as layout>
<@layout.page title=msg("infoHeader")>

  <div class="auth-state">
    <div class="auth-state__icon auth-state__icon--success">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z" fill="currentColor"/>
      </svg>
    </div>
    <h2 class="auth-state__title">${msg("infoHeader")}</h2>
    <p class="auth-state__text">${kcSanitize(message.summary)?no_esc}</p>
    <#if requiredActions??>
      <ul class="auth-state__list">
        <#list requiredActions as action>
          <li>${msg("requiredAction.${action}")}</li>
        </#list>
      </ul>
    </#if>
    <#if skipLink??>
      <#-- skip link present, no back button needed -->
    <#elseif pageRedirectUri?has_content>
      <a href="${pageRedirectUri}" class="auth-btn auth-btn--primary auth-btn--inline">${msg("doClickHere")}</a>
    <#elseif actionUri?has_content>
      <a href="${actionUri}" class="auth-btn auth-btn--primary auth-btn--inline">${msg("proceedWithAction")}</a>
    <#elseif client?? && client.baseUrl?has_content>
      <a href="${client.baseUrl}" class="auth-btn auth-btn--ghost auth-btn--inline">${msg("backToApplication")}</a>
    </#if>
  </div>

</@layout.page>
