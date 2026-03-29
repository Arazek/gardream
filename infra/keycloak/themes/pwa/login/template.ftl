<#--
  Base layout macro — imported by every page FTL.
  Usage: <@layout.page title="..."> ... </@layout.page>
-->
<#macro page title="">
<!DOCTYPE html>
<html lang="${lang!'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title><#if title?has_content>${title} — </#if>${(realm.displayName!'')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${url.resourcesPath}/css/login.css">
</head>
<body class="auth-body">
  <div class="auth-layout">
    <div class="auth-card">

      <div class="auth-brand">
        <div class="auth-brand__icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 3L4 7.5V16.5L12 21L20 16.5V7.5L12 3Z" fill="white" opacity="0.25"/>
            <path d="M12 6.5L7 9.25V14.75L12 17.5L17 14.75V9.25L12 6.5Z" fill="white" opacity="0.5"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>
        </div>
        <span class="auth-brand__name">${(realm.displayName!'')}</span>
      </div>

      <#if message?has_content>
        <div class="auth-alert auth-alert--${message.type}" role="alert">
          ${kcSanitize(message.summary)?no_esc}
        </div>
      </#if>

      <#nested>

    </div>
  </div>
</body>
</html>
</#macro>
