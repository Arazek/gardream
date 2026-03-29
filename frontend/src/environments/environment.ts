export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
  wsUrl: 'ws://localhost:8000/api/v1/ws',
  keycloak: {
    url: 'https://gateway.localhost/keycloak',
    realm: 'gardream',
    clientId: 'pwa-frontend',
  },
};
