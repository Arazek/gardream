export const environment = {
  production: false,
  apiUrl: 'https://localhost:4443/api/v1',
  wsUrl: 'wss://localhost:4443/api/v1/ws',
  keycloak: {
    url: 'https://keycloak.localhost:4443',
    realm: 'my-realm',
    clientId: 'my-app',
  },
};
