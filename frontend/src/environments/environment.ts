export const environment = {
  production: false,
  apiUrl: 'https://localhost:4443/api/v1',
  wsUrl: 'wss://localhost:4443/api/v1/ws',
  keycloak: {
    url: 'https://localhost:4443/auth',
    realm: 'pwa',
    clientId: 'pwa-frontend',
  },
};
