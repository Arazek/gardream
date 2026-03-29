import os

AUTHENTICATION_SOURCES = ['oauth2']
OAUTH2_AUTO_CREATE_USER = True
MASTER_PASSWORD_REQUIRED = False

OAUTH2_CONFIG = [
    {
        'OAUTH2_NAME': 'keycloak',
        'OAUTH2_DISPLAY_NAME': 'Keycloak',
        'OAUTH2_CLIENT_ID': os.environ.get('OAUTH2_CLIENT_ID', 'pgadmin'),
        'OAUTH2_CLIENT_SECRET': os.environ.get('OAUTH2_CLIENT_SECRET'),
        # Browser-side: uses external Keycloak URL (via Traefik)
        'OAUTH2_AUTHORIZATION_URL': os.environ.get('OAUTH2_AUTHORIZATION_URL'),
        # Server-side: routes directly through Docker DNS (http://keycloak:8080)
        'OAUTH2_TOKEN_URL': os.environ.get('OAUTH2_TOKEN_URL'),
        'OAUTH2_API_BASE_URL': os.environ.get('OAUTH2_API_BASE_URL'),
        'OAUTH2_SERVER_METADATA_URL': os.environ.get('OAUTH2_SERVER_METADATA_URL'),
        'OAUTH2_USERINFO_ENDPOINT': 'userinfo',
        'OAUTH2_SCOPE': 'openid email profile',
        'OAUTH2_ICON': 'fa-key',
        'OAUTH2_BUTTON_COLOR': '#4B7CF3',
    }
]
