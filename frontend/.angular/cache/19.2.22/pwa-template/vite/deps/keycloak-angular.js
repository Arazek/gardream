import {
  HTTP_INTERCEPTORS,
  HttpHeaders
} from "./chunk-ULXA7SSF.js";
import {
  CommonModule
} from "./chunk-NE4YYZ2Y.js";
import {
  isPlatformBrowser
} from "./chunk-CM2WGR5C.js";
import {
  Directive,
  EnvironmentInjector,
  Injectable,
  InjectionToken,
  Input,
  NgModule,
  NgZone,
  PLATFORM_ID,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  runInInjectionContext,
  setClassMetadata,
  signal,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵinject
} from "./chunk-DJNHPH6Y.js";
import {
  fromEvent
} from "./chunk-IC62NIWK.js";
import "./chunk-ISM5WLAM.js";
import {
  Subject,
  combineLatest,
  debounceTime,
  from,
  map,
  mergeMap,
  of,
  takeUntil
} from "./chunk-ZZ67MR3E.js";
import {
  __async,
  __spreadProps,
  __spreadValues
} from "./chunk-WDMUDEB6.js";

// node_modules/keycloak-js/lib/keycloak.js
var CONTENT_TYPE_JSON = "application/json";
var Keycloak = class {
  /** @type {Pick<PromiseWithResolvers<boolean>, 'resolve' | 'reject'>[]} */
  #refreshQueue = [];
  /** @type {KeycloakAdapter} */
  #adapter;
  /** @type {boolean} */
  #useNonce = true;
  /** @type {CallbackStorage} */
  #callbackStorage;
  #logInfo = this.#createLogger(console.info);
  #logWarn = this.#createLogger(console.warn);
  /** @type {LoginIframe} */
  #loginIframe = {
    enable: true,
    callbackList: [],
    interval: 5
  };
  /** @type {KeycloakConfig} config */
  #config;
  didInitialize = false;
  authenticated = false;
  loginRequired = false;
  /** @type {KeycloakResponseMode} */
  responseMode = "fragment";
  /** @type {KeycloakResponseType} */
  responseType = "code";
  /** @type {KeycloakFlow} */
  flow = "standard";
  /** @type {number?} */
  timeSkew = null;
  /** @type {string=} */
  redirectUri;
  /** @type {string=} */
  silentCheckSsoRedirectUri;
  /** @type {boolean} */
  silentCheckSsoFallback = true;
  /** @type {KeycloakPkceMethod} */
  pkceMethod = "S256";
  enableLogging = false;
  /** @type {'GET' | 'POST'} */
  logoutMethod = "GET";
  /** @type {string=} */
  scope;
  messageReceiveTimeout = 1e4;
  /** @type {string=} */
  idToken;
  /** @type {KeycloakTokenParsed=} */
  idTokenParsed;
  /** @type {string=} */
  token;
  /** @type {KeycloakTokenParsed=} */
  tokenParsed;
  /** @type {string=} */
  refreshToken;
  /** @type {KeycloakTokenParsed=} */
  refreshTokenParsed;
  /** @type {string=} */
  clientId;
  /** @type {string=} */
  sessionId;
  /** @type {string=} */
  subject;
  /** @type {string=} */
  authServerUrl;
  /** @type {string=} */
  realm;
  /** @type {KeycloakRoles=} */
  realmAccess;
  /** @type {KeycloakResourceAccess=} */
  resourceAccess;
  /** @type {KeycloakProfile=} */
  profile;
  /** @type {{}=} */
  userInfo;
  /** @type {Endpoints} */
  endpoints;
  /** @type {number=} */
  tokenTimeoutHandle;
  /** @type {() => void=} */
  onAuthSuccess;
  /** @type {(errorData?: KeycloakError) => void=} */
  onAuthError;
  /** @type {() => void=} */
  onAuthRefreshSuccess;
  /** @type {() => void=} */
  onAuthRefreshError;
  /** @type {() => void=} */
  onTokenExpired;
  /** @type {() => void=} */
  onAuthLogout;
  /** @type {(authenticated: boolean) => void=} */
  onReady;
  /** @type {(status: 'success' | 'cancelled' | 'error', action: string) => void=} */
  onActionUpdate;
  /**
   * @param {KeycloakConfig} config
   */
  constructor(config) {
    if (typeof config !== "string" && !isObject(config)) {
      throw new Error("The 'Keycloak' constructor must be provided with a configuration object, or a URL to a JSON configuration file.");
    }
    if (isObject(config)) {
      const requiredProperties = "oidcProvider" in config ? ["clientId"] : ["url", "realm", "clientId"];
      for (const property of requiredProperties) {
        if (!(property in config)) {
          throw new Error(`The configuration object is missing the required '${property}' property.`);
        }
      }
    }
    if (!globalThis.isSecureContext) {
      this.#logWarn("[KEYCLOAK] Keycloak JS must be used in a 'secure context' to function properly as it relies on browser APIs that are otherwise not available.\nContinuing to run your application insecurely will lead to unexpected behavior and breakage.\n\nFor more information see: https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts");
    }
    this.#config = config;
  }
  /**
   * @param {KeycloakInitOptions} initOptions
   * @returns {Promise<boolean>}
   */
  init = (..._0) => __async(this, [..._0], function* (initOptions = {}) {
    if (this.didInitialize) {
      throw new Error("A 'Keycloak' instance can only be initialized once.");
    }
    this.didInitialize = true;
    this.#callbackStorage = createCallbackStorage();
    const adapters = ["default", "cordova", "cordova-native"];
    if (typeof initOptions.adapter === "string" && adapters.includes(initOptions.adapter)) {
      this.#adapter = this.#loadAdapter(initOptions.adapter);
    } else if (typeof initOptions.adapter === "object") {
      this.#adapter = initOptions.adapter;
    } else if ("Cordova" in window || "cordova" in window) {
      this.#adapter = this.#loadAdapter("cordova");
    } else {
      this.#adapter = this.#loadAdapter("default");
    }
    if (typeof initOptions.useNonce !== "undefined") {
      this.#useNonce = initOptions.useNonce;
    }
    if (typeof initOptions.checkLoginIframe !== "undefined") {
      this.#loginIframe.enable = initOptions.checkLoginIframe;
    }
    if (initOptions.checkLoginIframeInterval) {
      this.#loginIframe.interval = initOptions.checkLoginIframeInterval;
    }
    if (initOptions.onLoad === "login-required") {
      this.loginRequired = true;
    }
    if (initOptions.responseMode) {
      if (initOptions.responseMode === "query" || initOptions.responseMode === "fragment") {
        this.responseMode = initOptions.responseMode;
      } else {
        throw new Error("Invalid value for responseMode");
      }
    }
    if (initOptions.flow) {
      switch (initOptions.flow) {
        case "standard":
          this.responseType = "code";
          break;
        case "implicit":
          this.responseType = "id_token token";
          break;
        case "hybrid":
          this.responseType = "code id_token token";
          break;
        default:
          throw new Error("Invalid value for flow");
      }
      this.flow = initOptions.flow;
    }
    if (typeof initOptions.timeSkew === "number") {
      this.timeSkew = initOptions.timeSkew;
    }
    if (initOptions.redirectUri) {
      this.redirectUri = initOptions.redirectUri;
    }
    if (initOptions.silentCheckSsoRedirectUri) {
      this.silentCheckSsoRedirectUri = initOptions.silentCheckSsoRedirectUri;
    }
    if (typeof initOptions.silentCheckSsoFallback === "boolean") {
      this.silentCheckSsoFallback = initOptions.silentCheckSsoFallback;
    }
    if (typeof initOptions.pkceMethod !== "undefined") {
      if (initOptions.pkceMethod !== "S256" && initOptions.pkceMethod !== false) {
        throw new TypeError(`Invalid value for pkceMethod', expected 'S256' or false but got ${initOptions.pkceMethod}.`);
      }
      this.pkceMethod = initOptions.pkceMethod;
    }
    if (typeof initOptions.enableLogging === "boolean") {
      this.enableLogging = initOptions.enableLogging;
    }
    if (initOptions.logoutMethod === "POST") {
      this.logoutMethod = "POST";
    }
    if (typeof initOptions.scope === "string") {
      this.scope = initOptions.scope;
    }
    if (typeof initOptions.messageReceiveTimeout === "number" && initOptions.messageReceiveTimeout > 0) {
      this.messageReceiveTimeout = initOptions.messageReceiveTimeout;
    }
    yield this.#loadConfig();
    yield this.#check3pCookiesSupported();
    yield this.#processInit(initOptions);
    this.onReady?.(this.authenticated);
    return this.authenticated;
  });
  /**
   * @param {"default" | "cordova" | "cordova-native"} type
   * @returns {KeycloakAdapter}
   */
  #loadAdapter(type) {
    if (type === "default") {
      return this.#loadDefaultAdapter();
    }
    if (type === "cordova") {
      this.#loginIframe.enable = false;
      return this.#loadCordovaAdapter();
    }
    if (type === "cordova-native") {
      this.#loginIframe.enable = false;
      return this.#loadCordovaNativeAdapter();
    }
    throw new Error("invalid adapter type: " + type);
  }
  /**
   * @returns {KeycloakAdapter}
   */
  #loadDefaultAdapter() {
    const redirectUri = (options) => {
      return options?.redirectUri || this.redirectUri || globalThis.location.href;
    };
    return {
      login: (options) => __async(this, null, function* () {
        window.location.assign(yield this.createLoginUrl(options));
        return yield new Promise(() => {
        });
      }),
      logout: (options) => __async(this, null, function* () {
        const logoutMethod = options?.logoutMethod ?? this.logoutMethod;
        if (logoutMethod === "GET") {
          window.location.replace(this.createLogoutUrl(options));
          return;
        }
        const form = document.createElement("form");
        form.setAttribute("method", "POST");
        form.setAttribute("action", this.createLogoutUrl(options));
        form.style.display = "none";
        const data = {
          id_token_hint: this.idToken,
          client_id: this.clientId,
          post_logout_redirect_uri: redirectUri(options)
        };
        for (const [name, value] of Object.entries(data)) {
          const input = document.createElement("input");
          input.setAttribute("type", "hidden");
          input.setAttribute("name", name);
          input.setAttribute(
            "value",
            /** @type {string} */
            value
          );
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
      }),
      register: (options) => __async(this, null, function* () {
        window.location.assign(yield this.createRegisterUrl(options));
        return yield new Promise(() => {
        });
      }),
      accountManagement: () => __async(this, null, function* () {
        const accountUrl = this.createAccountUrl();
        if (typeof accountUrl !== "undefined") {
          window.location.href = accountUrl;
        } else {
          throw new Error("Not supported by the OIDC server");
        }
        return yield new Promise(() => {
        });
      }),
      redirectUri
    };
  }
  /**
   * @returns {KeycloakAdapter}
   */
  #loadCordovaAdapter() {
    const cordovaOpenWindowWrapper = (loginUrl, target, options) => {
      if (window.cordova && window.cordova.InAppBrowser) {
        return window.cordova.InAppBrowser.open(loginUrl, target, options);
      } else {
        return window.open(loginUrl, target, options);
      }
    };
    const shallowCloneCordovaOptions = (userOptions) => {
      if (userOptions && userOptions.cordovaOptions) {
        return Object.keys(userOptions.cordovaOptions).reduce((options, optionName) => {
          options[optionName] = userOptions.cordovaOptions[optionName];
          return options;
        }, {});
      } else {
        return {};
      }
    };
    const formatCordovaOptions = (cordovaOptions) => {
      return Object.keys(cordovaOptions).reduce((options, optionName) => {
        options.push(optionName + "=" + cordovaOptions[optionName]);
        return options;
      }, []).join(",");
    };
    const createCordovaOptions = (userOptions) => {
      const cordovaOptions = shallowCloneCordovaOptions(userOptions);
      cordovaOptions.location = "no";
      if (userOptions && userOptions.prompt === "none") {
        cordovaOptions.hidden = "yes";
      }
      return formatCordovaOptions(cordovaOptions);
    };
    const getCordovaRedirectUri = () => {
      return this.redirectUri || "http://localhost";
    };
    return {
      login: (options) => __async(this, null, function* () {
        const cordovaOptions = createCordovaOptions(options);
        const loginUrl = yield this.createLoginUrl(options);
        const ref = cordovaOpenWindowWrapper(loginUrl, "_blank", cordovaOptions);
        let completed = false;
        let closed = false;
        function closeBrowser() {
          closed = true;
          ref.close();
        }
        ;
        return yield new Promise((resolve, reject) => {
          ref.addEventListener("loadstart", (event) => __async(this, null, function* () {
            if (event.url.indexOf(getCordovaRedirectUri()) === 0) {
              const callback = this.#parseCallback(event.url);
              try {
                yield this.#processCallback(callback);
                resolve();
              } catch (error) {
                reject(error);
              }
              closeBrowser();
              completed = true;
            }
          }));
          ref.addEventListener("loaderror", (event) => __async(this, null, function* () {
            if (!completed) {
              if (event.url.indexOf(getCordovaRedirectUri()) === 0) {
                const callback = this.#parseCallback(event.url);
                try {
                  yield this.#processCallback(callback);
                  resolve();
                } catch (error) {
                  reject(error);
                }
                closeBrowser();
                completed = true;
              } else {
                reject(new Error("Unable to process login."));
                closeBrowser();
              }
            }
          }));
          ref.addEventListener("exit", function(event) {
            if (!closed) {
              reject(new Error("User closed the login window."));
            }
          });
        });
      }),
      logout: (options) => __async(this, null, function* () {
        const logoutUrl = this.createLogoutUrl(options);
        const ref = cordovaOpenWindowWrapper(logoutUrl, "_blank", "location=no,hidden=yes,clearcache=yes");
        let error = false;
        ref.addEventListener("loadstart", (event) => {
          if (event.url.indexOf(getCordovaRedirectUri()) === 0) {
            ref.close();
          }
        });
        ref.addEventListener("loaderror", (event) => {
          if (event.url.indexOf(getCordovaRedirectUri()) === 0) {
            ref.close();
          } else {
            error = true;
            ref.close();
          }
        });
        yield new Promise((resolve, reject) => {
          ref.addEventListener("exit", () => {
            if (error) {
              reject(new Error("User closed the login window."));
            } else {
              this.clearToken();
              resolve();
            }
          });
        });
      }),
      register: (options) => __async(this, null, function* () {
        const registerUrl = yield this.createRegisterUrl();
        const cordovaOptions = createCordovaOptions(options);
        const ref = cordovaOpenWindowWrapper(registerUrl, "_blank", cordovaOptions);
        const promise = new Promise((resolve, reject) => {
          ref.addEventListener("loadstart", (event) => __async(this, null, function* () {
            if (event.url.indexOf(getCordovaRedirectUri()) === 0) {
              ref.close();
              const oauth = this.#parseCallback(event.url);
              try {
                yield this.#processCallback(oauth);
                resolve();
              } catch (error) {
                reject(error);
              }
            }
          }));
        });
        yield promise;
      }),
      accountManagement: () => __async(this, null, function* () {
        const accountUrl = this.createAccountUrl();
        if (typeof accountUrl !== "undefined") {
          const ref = cordovaOpenWindowWrapper(accountUrl, "_blank", "location=no");
          ref.addEventListener("loadstart", function(event) {
            if (event.url.indexOf(getCordovaRedirectUri()) === 0) {
              ref.close();
            }
          });
        } else {
          throw new Error("Not supported by the OIDC server");
        }
      }),
      redirectUri: () => {
        return getCordovaRedirectUri();
      }
    };
  }
  /**
   * @returns {KeycloakAdapter}
   */
  #loadCordovaNativeAdapter() {
    return {
      login: (options) => __async(this, null, function* () {
        const loginUrl = yield this.createLoginUrl(options);
        yield new Promise((resolve, reject) => {
          universalLinks.subscribe("keycloak", (event) => __async(this, null, function* () {
            universalLinks.unsubscribe("keycloak");
            window.cordova.plugins.browsertab.close();
            const oauth = this.#parseCallback(event.url);
            try {
              yield this.#processCallback(oauth);
              resolve();
            } catch (error) {
              reject(error);
            }
          }));
          window.cordova.plugins.browsertab.openUrl(loginUrl);
        });
      }),
      logout: (options) => __async(this, null, function* () {
        const logoutUrl = this.createLogoutUrl(options);
        yield new Promise((resolve) => {
          universalLinks.subscribe("keycloak", () => {
            universalLinks.unsubscribe("keycloak");
            window.cordova.plugins.browsertab.close();
            this.clearToken();
            resolve();
          });
          window.cordova.plugins.browsertab.openUrl(logoutUrl);
        });
      }),
      register: (options) => __async(this, null, function* () {
        const registerUrl = yield this.createRegisterUrl(options);
        yield new Promise((resolve, reject) => {
          universalLinks.subscribe("keycloak", (event) => __async(this, null, function* () {
            universalLinks.unsubscribe("keycloak");
            window.cordova.plugins.browsertab.close();
            const oauth = this.#parseCallback(event.url);
            try {
              yield this.#processCallback(oauth);
              resolve();
            } catch (error) {
              reject(error);
            }
          }));
          window.cordova.plugins.browsertab.openUrl(registerUrl);
        });
      }),
      accountManagement: () => __async(this, null, function* () {
        const accountUrl = this.createAccountUrl();
        if (typeof accountUrl !== "undefined") {
          window.cordova.plugins.browsertab.openUrl(accountUrl);
        } else {
          throw new Error("Not supported by the OIDC server");
        }
      }),
      redirectUri: (options) => {
        if (options && options.redirectUri) {
          return options.redirectUri;
        } else if (this.redirectUri) {
          return this.redirectUri;
        } else {
          return "http://localhost";
        }
      }
    };
  }
  /**
   * @returns {Promise<void>}
   */
  #loadConfig() {
    return __async(this, null, function* () {
      if (typeof this.#config === "string") {
        const jsonConfig = yield fetchJsonConfig(this.#config);
        this.authServerUrl = jsonConfig["auth-server-url"];
        this.realm = jsonConfig.realm;
        this.clientId = jsonConfig.resource;
        this.#setupEndpoints();
      } else {
        this.clientId = this.#config.clientId;
        if ("oidcProvider" in this.#config) {
          yield this.#loadOidcConfig(this.#config.oidcProvider);
        } else {
          this.authServerUrl = this.#config.url;
          this.realm = this.#config.realm;
          this.#setupEndpoints();
        }
      }
    });
  }
  /**
   * @returns {void}
   */
  #setupEndpoints() {
    this.endpoints = {
      authorize: () => {
        return this.#getRealmUrl() + "/protocol/openid-connect/auth";
      },
      token: () => {
        return this.#getRealmUrl() + "/protocol/openid-connect/token";
      },
      logout: () => {
        return this.#getRealmUrl() + "/protocol/openid-connect/logout";
      },
      checkSessionIframe: () => {
        return this.#getRealmUrl() + "/protocol/openid-connect/login-status-iframe.html";
      },
      thirdPartyCookiesIframe: () => {
        return this.#getRealmUrl() + "/protocol/openid-connect/3p-cookies/step1.html";
      },
      register: () => {
        return this.#getRealmUrl() + "/protocol/openid-connect/registrations";
      },
      userinfo: () => {
        return this.#getRealmUrl() + "/protocol/openid-connect/userinfo";
      }
    };
  }
  /**
   * @param {string | OpenIdProviderMetadata} oidcProvider
   * @returns {Promise<void>}
   */
  #loadOidcConfig(oidcProvider) {
    return __async(this, null, function* () {
      if (typeof oidcProvider === "string") {
        const url = `${stripTrailingSlash(oidcProvider)}/.well-known/openid-configuration`;
        const openIdConfig = yield fetchOpenIdConfig(url);
        this.#setupOidcEndpoints(openIdConfig);
      } else {
        this.#setupOidcEndpoints(oidcProvider);
      }
    });
  }
  /**
   * @param {OpenIdProviderMetadata} config
   * @returns {void}
   */
  #setupOidcEndpoints(config) {
    this.endpoints = {
      authorize() {
        return config.authorization_endpoint;
      },
      token() {
        return config.token_endpoint;
      },
      logout() {
        if (!config.end_session_endpoint) {
          throw new Error("Not supported by the OIDC server");
        }
        return config.end_session_endpoint;
      },
      checkSessionIframe() {
        if (!config.check_session_iframe) {
          throw new Error("Not supported by the OIDC server");
        }
        return config.check_session_iframe;
      },
      register() {
        throw new Error('Redirection to "Register user" page not supported in standard OIDC mode');
      },
      userinfo() {
        if (!config.userinfo_endpoint) {
          throw new Error("Not supported by the OIDC server");
        }
        return config.userinfo_endpoint;
      }
    };
  }
  /**
   * @returns {Promise<void>}
   */
  #check3pCookiesSupported() {
    return __async(this, null, function* () {
      if (!this.#loginIframe.enable && !this.silentCheckSsoRedirectUri || typeof this.endpoints.thirdPartyCookiesIframe !== "function") {
        return;
      }
      const iframe = document.createElement("iframe");
      iframe.setAttribute("src", this.endpoints.thirdPartyCookiesIframe());
      iframe.setAttribute("sandbox", "allow-storage-access-by-user-activation allow-scripts allow-same-origin");
      iframe.setAttribute("title", "keycloak-3p-check-iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      const promise = new Promise((resolve) => {
        const messageCallback = (event) => {
          if (iframe.contentWindow !== event.source) {
            return;
          }
          if (event.data !== "supported" && event.data !== "unsupported") {
            return;
          } else if (event.data === "unsupported") {
            this.#logWarn("[KEYCLOAK] Your browser is blocking access to 3rd-party cookies, this means:\n\n - It is not possible to retrieve tokens without redirecting to the Keycloak server (a.k.a. no support for silent authentication).\n - It is not possible to automatically detect changes to the session status (such as the user logging out in another tab).\n\nFor more information see: https://www.keycloak.org/securing-apps/javascript-adapter#_modern_browsers");
            this.#loginIframe.enable = false;
            if (this.silentCheckSsoFallback) {
              this.silentCheckSsoRedirectUri = void 0;
            }
          }
          document.body.removeChild(iframe);
          window.removeEventListener("message", messageCallback);
          resolve();
        };
        window.addEventListener("message", messageCallback, false);
      });
      return yield applyTimeoutToPromise(promise, this.messageReceiveTimeout, "Timeout when waiting for 3rd party check iframe message.");
    });
  }
  /**
   * @param {KeycloakInitOptions} initOptions
   * @returns {Promise<void>}
   */
  #processInit(initOptions) {
    return __async(this, null, function* () {
      const callback = this.#parseCallback(window.location.href);
      if (callback?.newUrl) {
        window.history.replaceState(window.history.state, "", callback.newUrl);
      }
      if (callback && callback.valid) {
        yield this.#setupCheckLoginIframe();
        yield this.#processCallback(callback);
        return;
      }
      const doLogin = (prompt) => __async(this, null, function* () {
        const options = {};
        if (!prompt) {
          options.prompt = "none";
        }
        if (initOptions.locale) {
          options.locale = initOptions.locale;
        }
        yield this.login(options);
      });
      const onLoad = () => __async(this, null, function* () {
        switch (initOptions.onLoad) {
          case "check-sso":
            if (this.#loginIframe.enable) {
              yield this.#setupCheckLoginIframe();
              const unchanged = yield this.#checkLoginIframe();
              if (!unchanged) {
                this.silentCheckSsoRedirectUri ? yield this.#checkSsoSilently() : yield doLogin(false);
              }
            } else {
              this.silentCheckSsoRedirectUri ? yield this.#checkSsoSilently() : yield doLogin(false);
            }
            break;
          case "login-required":
            yield doLogin(true);
            break;
          default:
            throw new Error("Invalid value for onLoad");
        }
      });
      if (initOptions.token && initOptions.refreshToken) {
        this.#setToken(initOptions.token, initOptions.refreshToken, initOptions.idToken);
        if (this.#loginIframe.enable) {
          yield this.#setupCheckLoginIframe();
          const unchanged = yield this.#checkLoginIframe();
          if (unchanged) {
            this.onAuthSuccess?.();
            this.#scheduleCheckIframe();
          }
        } else {
          try {
            yield this.updateToken(-1);
            this.onAuthSuccess?.();
          } catch (error) {
            this.onAuthError?.();
            if (initOptions.onLoad) {
              yield onLoad();
            } else {
              throw error;
            }
          }
        }
      } else if (initOptions.onLoad) {
        yield onLoad();
      }
    });
  }
  /**
   * @returns {Promise<void>}
   */
  #setupCheckLoginIframe() {
    return __async(this, null, function* () {
      if (!this.#loginIframe.enable || this.#loginIframe.iframe) {
        return;
      }
      const iframe = document.createElement("iframe");
      this.#loginIframe.iframe = iframe;
      iframe.setAttribute("src", this.endpoints.checkSessionIframe());
      iframe.setAttribute("sandbox", "allow-storage-access-by-user-activation allow-scripts allow-same-origin");
      iframe.setAttribute("title", "keycloak-session-iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      const messageCallback = (event) => {
        if (event.origin !== this.#loginIframe.iframeOrigin || this.#loginIframe.iframe?.contentWindow !== event.source) {
          return;
        }
        if (!(event.data === "unchanged" || event.data === "changed" || event.data === "error")) {
          return;
        }
        if (event.data !== "unchanged") {
          this.clearToken();
        }
        const callbacks = this.#loginIframe.callbackList;
        this.#loginIframe.callbackList = [];
        for (const callback of callbacks.reverse()) {
          if (event.data === "error") {
            callback(new Error("Error while checking login iframe"));
          } else {
            callback(null, event.data === "unchanged");
          }
        }
      };
      window.addEventListener("message", messageCallback, false);
      const promise = new Promise((resolve) => {
        iframe.addEventListener("load", () => {
          const authUrl = this.endpoints.authorize();
          if (authUrl.startsWith("/")) {
            this.#loginIframe.iframeOrigin = globalThis.location.origin;
          } else {
            this.#loginIframe.iframeOrigin = new URL(authUrl).origin;
          }
          resolve();
        });
      });
      yield promise;
    });
  }
  /**
   * @returns {Promise<boolean | undefined>}
   */
  #checkLoginIframe() {
    return __async(this, null, function* () {
      if (!this.#loginIframe.iframe || !this.#loginIframe.iframeOrigin) {
        return;
      }
      const message = `${this.clientId} ${this.sessionId ? this.sessionId : ""}`;
      const origin = this.#loginIframe.iframeOrigin;
      const promise = new Promise((resolve, reject) => {
        const callback = (error, result) => error ? reject(error) : resolve(
          /** @type {boolean} */
          result
        );
        this.#loginIframe.callbackList.push(callback);
        if (this.#loginIframe.callbackList.length === 1) {
          this.#loginIframe.iframe?.contentWindow?.postMessage(message, origin);
        }
      });
      return yield promise;
    });
  }
  /**
   * @returns {Promise<void>}
   */
  #checkSsoSilently() {
    return __async(this, null, function* () {
      const iframe = document.createElement("iframe");
      const src = yield this.createLoginUrl({
        prompt: "none",
        redirectUri: this.silentCheckSsoRedirectUri
      });
      iframe.setAttribute("src", src);
      iframe.setAttribute("sandbox", "allow-storage-access-by-user-activation allow-scripts allow-same-origin");
      iframe.setAttribute("title", "keycloak-silent-check-sso");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      return yield new Promise((resolve, reject) => {
        const messageCallback = (event) => __async(this, null, function* () {
          if (event.origin !== window.location.origin || iframe.contentWindow !== event.source) {
            return;
          }
          const oauth = this.#parseCallback(event.data);
          try {
            yield this.#processCallback(oauth);
            resolve();
          } catch (error) {
            reject(error);
          }
          document.body.removeChild(iframe);
          window.removeEventListener("message", messageCallback);
        });
        window.addEventListener("message", messageCallback);
      });
    });
  }
  /**
   * @param {string} url
   */
  #parseCallback(url) {
    const oauth = this.#parseCallbackUrl(url);
    if (!oauth) {
      return;
    }
    const oauthState = this.#callbackStorage.get(oauth.state);
    if (oauthState) {
      oauth.valid = true;
      oauth.redirectUri = oauthState.redirectUri;
      oauth.storedNonce = oauthState.nonce;
      oauth.prompt = oauthState.prompt;
      oauth.pkceCodeVerifier = oauthState.pkceCodeVerifier;
      oauth.loginOptions = oauthState.loginOptions;
    }
    return oauth;
  }
  /**
   * @param {string} urlString
   */
  #parseCallbackUrl(urlString) {
    let supportedParams = [];
    switch (this.flow) {
      case "standard":
        supportedParams = ["code", "state", "session_state", "kc_action_status", "kc_action", "iss"];
        break;
      case "implicit":
        supportedParams = ["access_token", "token_type", "id_token", "state", "session_state", "expires_in", "kc_action_status", "kc_action", "iss"];
        break;
      case "hybrid":
        supportedParams = ["access_token", "token_type", "id_token", "code", "state", "session_state", "expires_in", "kc_action_status", "kc_action", "iss"];
        break;
    }
    supportedParams.push("error");
    supportedParams.push("error_description");
    supportedParams.push("error_uri");
    const url = new URL(urlString);
    let newUrl = "";
    let parsed;
    if (this.responseMode === "query" && url.searchParams.size > 0) {
      parsed = this.#parseCallbackParams(url.search, supportedParams);
      url.search = parsed.paramsString;
      newUrl = url.toString();
    } else if (this.responseMode === "fragment" && url.hash.length > 0) {
      parsed = this.#parseCallbackParams(url.hash.substring(1), supportedParams);
      url.hash = parsed.paramsString;
      newUrl = url.toString();
    }
    if (parsed?.oauthParams) {
      if (this.flow === "standard" || this.flow === "hybrid") {
        if ((parsed.oauthParams.code || parsed.oauthParams.error) && parsed.oauthParams.state) {
          parsed.oauthParams.newUrl = newUrl;
          return parsed.oauthParams;
        }
      } else if (this.flow === "implicit") {
        if ((parsed.oauthParams.access_token || parsed.oauthParams.error) && parsed.oauthParams.state) {
          parsed.oauthParams.newUrl = newUrl;
          return parsed.oauthParams;
        }
      }
    }
  }
  /**
   * @typedef {Object} ParsedCallbackParams
   * @property {string} paramsString
   * @property {Record<string, string | undefined>} oauthParams
   */
  /**
   * @param {string} paramsString
   * @param {string[]} supportedParams
   * @returns {ParsedCallbackParams}
   */
  #parseCallbackParams(paramsString, supportedParams) {
    const params = paramsString.split("&");
    const oauthParams = {};
    let result = "";
    for (const param of params.reverse()) {
      const entry = new URLSearchParams(param).entries().next().value;
      if (!entry) {
        result = "&" + result;
        continue;
      }
      const [key, value] = entry;
      if (supportedParams.includes(key) && !(key in oauthParams)) {
        oauthParams[key] = value;
      } else {
        result = result.length === 0 ? param : param + "&" + result;
      }
    }
    return {
      paramsString: result,
      oauthParams
    };
  }
  #processCallback(oauth) {
    return __async(this, null, function* () {
      const {
        code,
        error,
        prompt
      } = oauth;
      let timeLocal = (/* @__PURE__ */ new Date()).getTime();
      const authSuccess = (accessToken, refreshToken, idToken) => {
        timeLocal = (timeLocal + (/* @__PURE__ */ new Date()).getTime()) / 2;
        this.#setToken(accessToken, refreshToken, idToken, timeLocal);
        if (this.#useNonce && this.idTokenParsed && this.idTokenParsed.nonce !== oauth.storedNonce) {
          this.#logInfo("[KEYCLOAK] Invalid nonce, clearing token");
          this.clearToken();
          throw new Error("Invalid nonce.");
        }
      };
      if (oauth.kc_action_status) {
        this.onActionUpdate && this.onActionUpdate(oauth.kc_action_status, oauth.kc_action);
      }
      if (error) {
        if (prompt !== "none") {
          if (oauth.error_description && oauth.error_description === "authentication_expired") {
            yield this.login(oauth.loginOptions);
          } else {
            const errorData = {
              error,
              error_description: oauth.error_description
            };
            this.onAuthError?.(errorData);
            throw errorData;
          }
        }
        return;
      } else if (this.flow !== "standard" && (oauth.access_token || oauth.id_token)) {
        authSuccess(oauth.access_token, void 0, oauth.id_token);
        this.onAuthSuccess?.();
      }
      if (this.flow !== "implicit" && code) {
        try {
          const response = yield fetchAccessToken(
            this.endpoints.token(),
            code,
            /** @type {string} */
            this.clientId,
            oauth.redirectUri,
            oauth.pkceCodeVerifier
          );
          authSuccess(response.access_token, response.refresh_token, response.id_token);
          if (this.flow === "standard") {
            this.onAuthSuccess?.();
          }
          this.#scheduleCheckIframe();
        } catch (error2) {
          this.onAuthError?.();
          throw error2;
        }
      }
    });
  }
  #scheduleCheckIframe() {
    return __async(this, null, function* () {
      if (this.#loginIframe.enable && this.token) {
        yield waitForTimeout(this.#loginIframe.interval * 1e3);
        const unchanged = yield this.#checkLoginIframe();
        if (unchanged) {
          yield this.#scheduleCheckIframe();
        }
      }
    });
  }
  /**
   * @param {KeycloakLoginOptions} [options]
   * @returns {Promise<void>}
   */
  login = (options) => {
    return this.#adapter.login(options);
  };
  /**
   * @param {KeycloakLoginOptions} [options]
   * @returns {Promise<string>}
   */
  createLoginUrl = (options) => __async(this, null, function* () {
    const state = createUUID();
    const nonce = createUUID();
    const redirectUri = this.#adapter.redirectUri(options);
    const callbackState = {
      state,
      nonce,
      redirectUri,
      loginOptions: options
    };
    if (options?.prompt) {
      callbackState.prompt = options.prompt;
    }
    const url = options?.action === "register" ? this.endpoints.register() : this.endpoints.authorize();
    let scope = options?.scope || this.scope;
    const scopeValues = scope ? scope.split(" ") : [];
    if (!scopeValues.includes("openid")) {
      scopeValues.unshift("openid");
    }
    scope = scopeValues.join(" ");
    const params = new URLSearchParams([[
      "client_id",
      /** @type {string} */
      this.clientId
    ], ["redirect_uri", redirectUri], ["state", state], ["response_mode", this.responseMode], ["response_type", this.responseType], ["scope", scope]]);
    if (this.#useNonce) {
      params.append("nonce", nonce);
    }
    if (options?.prompt) {
      params.append("prompt", options.prompt);
    }
    if (typeof options?.maxAge === "number") {
      params.append("max_age", options.maxAge.toString());
    }
    if (options?.loginHint) {
      params.append("login_hint", options.loginHint);
    }
    if (options?.idpHint) {
      params.append("kc_idp_hint", options.idpHint);
    }
    if (options?.action && options.action !== "register") {
      params.append("kc_action", options.action);
    }
    if (options?.locale) {
      params.append("ui_locales", options.locale);
    }
    if (options?.acr) {
      params.append("claims", buildClaimsParameter(options.acr));
    }
    if (options?.acrValues) {
      params.append("acr_values", options.acrValues);
    }
    if (this.pkceMethod) {
      try {
        const codeVerifier = generateCodeVerifier(96);
        const pkceChallenge = yield generatePkceChallenge(this.pkceMethod, codeVerifier);
        callbackState.pkceCodeVerifier = codeVerifier;
        params.append("code_challenge", pkceChallenge);
        params.append("code_challenge_method", this.pkceMethod);
      } catch (error) {
        throw new Error("Failed to generate PKCE challenge.", {
          cause: error
        });
      }
    }
    this.#callbackStorage.add(callbackState);
    return `${url}?${params.toString()}`;
  });
  /**
   * @param {KeycloakLogoutOptions} [options]
   * @returns {Promise<void>}
   */
  logout = (options) => {
    return this.#adapter.logout(options);
  };
  /**
   * @param {KeycloakLogoutOptions} [options]
   * @returns {string}
   */
  createLogoutUrl = (options) => {
    const logoutMethod = options?.logoutMethod ?? this.logoutMethod;
    const url = this.endpoints.logout();
    if (logoutMethod === "POST") {
      return url;
    }
    const params = new URLSearchParams([[
      "client_id",
      /** @type {string} */
      this.clientId
    ], ["post_logout_redirect_uri", this.#adapter.redirectUri(options)]]);
    if (this.idToken) {
      params.append("id_token_hint", this.idToken);
    }
    return `${url}?${params.toString()}`;
  };
  /**
   * @param {KeycloakRegisterOptions} [options]
   * @returns {Promise<void>}
   */
  register = (options) => {
    return this.#adapter.register(options);
  };
  /**
   * @param {KeycloakRegisterOptions} [options]
   * @returns {Promise<string>}
   */
  createRegisterUrl = (options) => {
    return this.createLoginUrl(__spreadProps(__spreadValues({}, options), {
      action: "register"
    }));
  };
  /**
   * @param {KeycloakAccountOptions} [options]
   * @returns {string}
   */
  createAccountUrl = (options) => {
    const url = this.#getRealmUrl();
    if (!url) {
      throw new Error("Unable to create account URL, make sure the adapter is not configured using a generic OIDC provider.");
    }
    const params = new URLSearchParams([[
      "referrer",
      /** @type {string} */
      this.clientId
    ], ["referrer_uri", this.#adapter.redirectUri(options)]]);
    return `${url}/account?${params.toString()}`;
  };
  /**
   * @returns {Promise<void>}
   */
  accountManagement = () => {
    return this.#adapter.accountManagement();
  };
  /**
   * @param {string} role
   * @returns {boolean}
   */
  hasRealmRole = (role) => {
    const access = this.realmAccess;
    return !!access && access.roles.indexOf(role) >= 0;
  };
  /**
   * @param {string} role
   * @param {string} [resource]
   * @returns {boolean}
   */
  hasResourceRole = (role, resource) => {
    if (!this.resourceAccess) {
      return false;
    }
    const access = this.resourceAccess[resource || /** @type {string} */
    this.clientId];
    return !!access && access.roles.indexOf(role) >= 0;
  };
  /**
   * @returns {Promise<KeycloakProfile>}
   */
  loadUserProfile = () => __async(this, null, function* () {
    const realmUrl = this.#getRealmUrl();
    if (!realmUrl) {
      throw new Error("Unable to load user profile, make sure the adapter is not configured using a generic OIDC provider.");
    }
    const url = `${realmUrl}/account`;
    const profile = yield fetchJSON(url, {
      headers: [buildAuthorizationHeader(this.token)]
    });
    return this.profile = profile;
  });
  /**
   * @returns {Promise<{}>}
   */
  loadUserInfo = () => __async(this, null, function* () {
    const url = this.endpoints.userinfo();
    const userInfo = yield fetchJSON(url, {
      headers: [buildAuthorizationHeader(this.token)]
    });
    return this.userInfo = userInfo;
  });
  /**
   * @param {number} [minValidity]
   * @returns {boolean}
   */
  isTokenExpired = (minValidity) => {
    if (!this.tokenParsed || !this.refreshToken && this.flow !== "implicit") {
      throw new Error("Not authenticated");
    }
    if (this.timeSkew == null) {
      this.#logInfo("[KEYCLOAK] Unable to determine if token is expired as timeskew is not set");
      return true;
    }
    if (typeof this.tokenParsed.exp !== "number") {
      return false;
    }
    let expiresIn = this.tokenParsed.exp - Math.ceil((/* @__PURE__ */ new Date()).getTime() / 1e3) + this.timeSkew;
    if (minValidity) {
      if (isNaN(minValidity)) {
        throw new Error("Invalid minValidity");
      }
      expiresIn -= minValidity;
    }
    return expiresIn < 0;
  };
  /**
   * @param {number} minValidity
   * @returns {Promise<boolean>}
   */
  updateToken = (minValidity) => __async(this, null, function* () {
    if (!this.refreshToken) {
      throw new Error("Unable to update token, no refresh token available.");
    }
    minValidity = minValidity || 5;
    if (this.#loginIframe.enable) {
      yield this.#checkLoginIframe();
    }
    let refreshToken = false;
    if (minValidity === -1) {
      refreshToken = true;
      this.#logInfo("[KEYCLOAK] Refreshing token: forced refresh");
    } else if (!this.tokenParsed || this.isTokenExpired(minValidity)) {
      refreshToken = true;
      this.#logInfo("[KEYCLOAK] Refreshing token: token expired");
    }
    if (!refreshToken) {
      return false;
    }
    const {
      promise,
      resolve,
      reject
    } = Promise.withResolvers();
    this.#refreshQueue.push({
      resolve,
      reject
    });
    if (this.#refreshQueue.length === 1) {
      const url = this.endpoints.token();
      let timeLocal = (/* @__PURE__ */ new Date()).getTime();
      try {
        const response = yield fetchRefreshToken(
          url,
          this.refreshToken,
          /** @type {string} */
          this.clientId
        );
        this.#logInfo("[KEYCLOAK] Token refreshed");
        timeLocal = (timeLocal + (/* @__PURE__ */ new Date()).getTime()) / 2;
        this.#setToken(response.access_token, response.refresh_token, response.id_token, timeLocal);
        this.onAuthRefreshSuccess?.();
        for (let p = this.#refreshQueue.pop(); p != null; p = this.#refreshQueue.pop()) {
          p.resolve(true);
        }
      } catch (error) {
        this.#logWarn("[KEYCLOAK] Failed to refresh token");
        if (error instanceof NetworkError && error.response.status === 400) {
          this.clearToken();
        }
        this.onAuthRefreshError?.();
        for (let p = this.#refreshQueue.pop(); p != null; p = this.#refreshQueue.pop()) {
          p.reject(error);
        }
      }
    }
    return yield promise;
  });
  clearToken = () => {
    if (this.token) {
      this.#setToken();
      this.onAuthLogout?.();
      if (this.loginRequired) {
        this.login();
      }
    }
  };
  /**
   * @param {string} [token]
   * @param {string} [refreshToken]
   * @param {string} [idToken]
   * @param {number} [timeLocal]
   */
  #setToken(token, refreshToken, idToken, timeLocal) {
    if (this.tokenTimeoutHandle) {
      clearTimeout(this.tokenTimeoutHandle);
      this.tokenTimeoutHandle = void 0;
    }
    if (refreshToken) {
      this.refreshToken = refreshToken;
      this.refreshTokenParsed = decodeToken(refreshToken);
    } else {
      delete this.refreshToken;
      delete this.refreshTokenParsed;
    }
    if (idToken) {
      this.idToken = idToken;
      this.idTokenParsed = decodeToken(idToken);
    } else {
      delete this.idToken;
      delete this.idTokenParsed;
    }
    if (token) {
      this.token = token;
      this.tokenParsed = decodeToken(token);
      this.sessionId = this.tokenParsed.sid;
      this.authenticated = true;
      this.subject = this.tokenParsed.sub;
      this.realmAccess = this.tokenParsed.realm_access;
      this.resourceAccess = this.tokenParsed.resource_access;
      if (timeLocal) {
        this.timeSkew = Math.floor(timeLocal / 1e3) - this.tokenParsed.iat;
      }
      if (this.timeSkew !== null) {
        this.#logInfo("[KEYCLOAK] Estimated time difference between browser and server is " + this.timeSkew + " seconds");
        if (this.onTokenExpired) {
          const expiresIn = (this.tokenParsed.exp - (/* @__PURE__ */ new Date()).getTime() / 1e3 + this.timeSkew) * 1e3;
          this.#logInfo("[KEYCLOAK] Token expires in " + Math.round(expiresIn / 1e3) + " s");
          if (expiresIn <= 0) {
            this.onTokenExpired();
          } else {
            this.tokenTimeoutHandle = window.setTimeout(this.onTokenExpired, expiresIn);
          }
        }
      }
    } else {
      delete this.token;
      delete this.tokenParsed;
      delete this.subject;
      delete this.realmAccess;
      delete this.resourceAccess;
      this.authenticated = false;
    }
  }
  /**
   * @returns {string=}
   */
  #getRealmUrl() {
    if (typeof this.authServerUrl === "undefined") {
      return;
    }
    return `${stripTrailingSlash(this.authServerUrl)}/realms/${encodeURIComponent(
      /** @type {string} */
      this.realm
    )}`;
  }
  /**
   * @param {Function} fn
   * @returns {(message: string) => void}
   */
  #createLogger(fn) {
    return (message) => {
      if (this.enableLogging) {
        fn.call(console, message);
      }
    };
  }
};
function createUUID() {
  if (typeof crypto === "undefined" || typeof crypto.randomUUID === "undefined") {
    throw new Error("Web Crypto API is not available.");
  }
  return crypto.randomUUID();
}
function buildClaimsParameter(requestedAcr) {
  return JSON.stringify({
    id_token: {
      acr: requestedAcr
    }
  });
}
function generateCodeVerifier(len) {
  return generateRandomString(len, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");
}
function generatePkceChallenge(pkceMethod, codeVerifier) {
  return __async(this, null, function* () {
    if (pkceMethod !== "S256") {
      throw new TypeError(`Invalid value for 'pkceMethod', expected 'S256' but got '${pkceMethod}'.`);
    }
    const hashBytes = new Uint8Array(yield sha256Digest(codeVerifier));
    const encodedHash = bytesToBase64(hashBytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    return encodedHash;
  });
}
function generateRandomString(len, alphabet) {
  const randomData = generateRandomData(len);
  const chars = new Array(len);
  for (let i = 0; i < len; i++) {
    chars[i] = alphabet.charCodeAt(randomData[i] % alphabet.length);
  }
  return String.fromCharCode.apply(null, chars);
}
function generateRandomData(len) {
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues === "undefined") {
    throw new Error("Web Crypto API is not available.");
  }
  return crypto.getRandomValues(new Uint8Array(len));
}
function applyTimeoutToPromise(promise, timeout, errorMessage) {
  let timeoutHandle;
  const timeoutPromise = new Promise(function(resolve, reject) {
    timeoutHandle = window.setTimeout(function() {
      reject(new Error(errorMessage || "Promise is not settled within timeout of " + timeout + "ms"));
    }, timeout);
  });
  return Promise.race([promise, timeoutPromise]).finally(function() {
    clearTimeout(timeoutHandle);
  });
}
function createCallbackStorage() {
  try {
    return new LocalStorage();
  } catch (err) {
    return new CookieStorage();
  }
}
var STORAGE_KEY_PREFIX = "kc-callback-";
var LocalStorage = class {
  constructor() {
    globalThis.localStorage.setItem("kc-test", "test");
    globalThis.localStorage.removeItem("kc-test");
  }
  /**
   * @param {string} [state]
   * @returns {CallbackState | null}
   */
  get(state) {
    if (!state) {
      return null;
    }
    this.#clearInvalidValues();
    const key = STORAGE_KEY_PREFIX + state;
    const value = globalThis.localStorage.getItem(key);
    if (value) {
      globalThis.localStorage.removeItem(key);
      return JSON.parse(value);
    }
    return null;
  }
  /**
   * @param {CallbackState} state
   */
  add(state) {
    this.#clearInvalidValues();
    const key = STORAGE_KEY_PREFIX + state.state;
    const value = JSON.stringify(__spreadProps(__spreadValues({}, state), {
      // Set the expiry time to 1 hour from now.
      expires: Date.now() + 60 * 60 * 1e3
    }));
    try {
      globalThis.localStorage.setItem(key, value);
    } catch (error) {
      this.#clearAllValues();
      globalThis.localStorage.setItem(key, value);
    }
  }
  /**
   * Clears all values from local storage that are no longer valid.
   */
  #clearInvalidValues() {
    const currentTime = Date.now();
    for (const [key, value] of this.#getStoredEntries()) {
      const expiry = this.#parseExpiry(value);
      if (expiry === null || expiry < currentTime) {
        globalThis.localStorage.removeItem(key);
      }
    }
  }
  /**
   * Clears all known values from local storage.
   */
  #clearAllValues() {
    for (const [key] of this.#getStoredEntries()) {
      globalThis.localStorage.removeItem(key);
    }
  }
  /**
   * Gets all entries stored in local storage that are known to be managed by this class.
   * @returns {[string, string][]} An array of key-value pairs.
   */
  #getStoredEntries() {
    return Object.entries(globalThis.localStorage).filter(([key]) => key.startsWith(STORAGE_KEY_PREFIX));
  }
  /**
   * Parses the expiry time from a value stored in local storage.
   * @param {string} value
   * @returns {number | null} The expiry time in milliseconds, or `null` if the value is malformed.
   */
  #parseExpiry(value) {
    let parsedValue;
    try {
      parsedValue = JSON.parse(value);
    } catch (error) {
      return null;
    }
    if (isObject(parsedValue) && "expires" in parsedValue && typeof parsedValue.expires === "number") {
      return parsedValue.expires;
    }
    return null;
  }
};
var CookieStorage = class {
  /**
   * @param {string} [state]
   * @returns {CallbackState | null}
   */
  get(state) {
    if (!state) {
      return null;
    }
    const value = this.#getCookie(STORAGE_KEY_PREFIX + state);
    this.#setCookie(STORAGE_KEY_PREFIX + state, "", this.#cookieExpiration(-100));
    if (value) {
      return JSON.parse(value);
    }
    return null;
  }
  /**
   * @param {CallbackState} state
   */
  add(state) {
    this.#setCookie(STORAGE_KEY_PREFIX + state.state, JSON.stringify(state), this.#cookieExpiration(60));
  }
  /**
   * @param {string} key
   * @returns
   */
  #getCookie(key) {
    const name = key + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }
  /**
   * @param {string} key
   * @param {string} value
   * @param {Date} expirationDate
   */
  #setCookie(key, value, expirationDate) {
    const cookie = key + "=" + value + "; expires=" + expirationDate.toUTCString() + "; ";
    document.cookie = cookie;
  }
  /**
   * @param {number} minutes
   * @returns {Date}
   */
  #cookieExpiration(minutes) {
    const exp = /* @__PURE__ */ new Date();
    exp.setTime(exp.getTime() + minutes * 60 * 1e3);
    return exp;
  }
};
function bytesToBase64(bytes) {
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
}
function sha256Digest(message) {
  return __async(this, null, function* () {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    if (typeof crypto === "undefined" || typeof crypto.subtle === "undefined") {
      throw new Error("Web Crypto API is not available.");
    }
    return yield crypto.subtle.digest("SHA-256", data);
  });
}
function decodeToken(token) {
  const [, payload] = token.split(".");
  if (typeof payload !== "string") {
    throw new Error("Unable to decode token, payload not found.");
  }
  let decoded;
  try {
    decoded = base64UrlDecode(payload);
  } catch (error) {
    throw new Error("Unable to decode token, payload is not a valid Base64URL value.", {
      cause: error
    });
  }
  try {
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error("Unable to decode token, payload is not a valid JSON value.", {
      cause: error
    });
  }
}
function base64UrlDecode(input) {
  let output = input.replaceAll("-", "+").replaceAll("_", "/");
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += "==";
      break;
    case 3:
      output += "=";
      break;
    default:
      throw new Error("Input is not of the correct length.");
  }
  try {
    return b64DecodeUnicode(output);
  } catch (error) {
    return atob(output);
  }
}
function b64DecodeUnicode(input) {
  return decodeURIComponent(atob(input).replace(/(.)/g, (m, p) => {
    let code = p.charCodeAt(0).toString(16).toUpperCase();
    if (code.length < 2) {
      code = "0" + code;
    }
    return "%" + code;
  }));
}
function isObject(input) {
  return typeof input === "object" && input !== null;
}
function fetchJsonConfig(url) {
  return __async(this, null, function* () {
    return yield fetchJSON(url);
  });
}
function fetchOpenIdConfig(url) {
  return __async(this, null, function* () {
    return yield fetchJSON(url);
  });
}
function fetchAccessToken(url, code, clientId, redirectUri, pkceCodeVerifier) {
  return __async(this, null, function* () {
    const body = new URLSearchParams([["code", code], ["grant_type", "authorization_code"], ["client_id", clientId], ["redirect_uri", redirectUri]]);
    if (pkceCodeVerifier) {
      body.append("code_verifier", pkceCodeVerifier);
    }
    return yield fetchJSON(url, {
      method: "POST",
      credentials: "include",
      body
    });
  });
}
function fetchRefreshToken(url, refreshToken, clientId) {
  return __async(this, null, function* () {
    const body = new URLSearchParams([["grant_type", "refresh_token"], ["refresh_token", refreshToken], ["client_id", clientId]]);
    return yield fetchJSON(url, {
      method: "POST",
      credentials: "include",
      body
    });
  });
}
function fetchJSON(_0) {
  return __async(this, arguments, function* (url, init = {}) {
    const headers = new Headers(init.headers);
    headers.set("Accept", CONTENT_TYPE_JSON);
    const response = yield fetchWithErrorHandling(url, __spreadProps(__spreadValues({}, init), {
      headers
    }));
    return yield response.json();
  });
}
function fetchWithErrorHandling(url, init) {
  return __async(this, null, function* () {
    const response = yield fetch(url, init);
    if (!response.ok) {
      throw new NetworkError("Server responded with an invalid status.", {
        response
      });
    }
    return response;
  });
}
function buildAuthorizationHeader(token) {
  if (!token) {
    throw new Error("Unable to build authorization header, token is not set, make sure the user is authenticated.");
  }
  return ["Authorization", `bearer ${token}`];
}
function stripTrailingSlash(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
var NetworkError = class extends Error {
  /** @type {Response} */
  response;
  /**
   * @param {string} message
   * @param {NetworkErrorOptions} options
   */
  constructor(message, options) {
    super(message, options);
    this.response = options.response;
  }
};
var waitForTimeout = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

// node_modules/keycloak-angular/fesm2022/keycloak-angular.mjs
var KeycloakEventTypeLegacy;
(function(KeycloakEventTypeLegacy2) {
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnAuthError"] = 0] = "OnAuthError";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnAuthLogout"] = 1] = "OnAuthLogout";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnAuthRefreshError"] = 2] = "OnAuthRefreshError";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnAuthRefreshSuccess"] = 3] = "OnAuthRefreshSuccess";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnAuthSuccess"] = 4] = "OnAuthSuccess";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnReady"] = 5] = "OnReady";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnTokenExpired"] = 6] = "OnTokenExpired";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnActionUpdate"] = 7] = "OnActionUpdate";
})(KeycloakEventTypeLegacy || (KeycloakEventTypeLegacy = {}));
var KeycloakAuthGuard = class {
  constructor(router, keycloakAngular) {
    this.router = router;
    this.keycloakAngular = keycloakAngular;
  }
  /**
   * CanActivate checks if the user is logged in and get the full list of roles (REALM + CLIENT)
   * of the logged user. This values are set to authenticated and roles params.
   *
   * @param route
   * @param state
   */
  canActivate(route, state) {
    return __async(this, null, function* () {
      try {
        this.authenticated = yield this.keycloakAngular.isLoggedIn();
        this.roles = yield this.keycloakAngular.getUserRoles(true);
        return yield this.isAccessAllowed(route, state);
      } catch (error) {
        throw new Error("An error happened during access validation. Details:" + error);
      }
    });
  }
};
var KeycloakService = class _KeycloakService {
  constructor() {
    this._keycloakEvents$ = new Subject();
  }
  /**
   * Binds the keycloak-js events to the keycloakEvents Subject
   * which is a good way to monitor for changes, if needed.
   *
   * The keycloakEvents returns the keycloak-js event type and any
   * argument if the source function provides any.
   */
  bindsKeycloakEvents() {
    this._instance.onAuthError = (errorData) => {
      this._keycloakEvents$.next({
        args: errorData,
        type: KeycloakEventTypeLegacy.OnAuthError
      });
    };
    this._instance.onAuthLogout = () => {
      this._keycloakEvents$.next({
        type: KeycloakEventTypeLegacy.OnAuthLogout
      });
    };
    this._instance.onAuthRefreshSuccess = () => {
      this._keycloakEvents$.next({
        type: KeycloakEventTypeLegacy.OnAuthRefreshSuccess
      });
    };
    this._instance.onAuthRefreshError = () => {
      this._keycloakEvents$.next({
        type: KeycloakEventTypeLegacy.OnAuthRefreshError
      });
    };
    this._instance.onAuthSuccess = () => {
      this._keycloakEvents$.next({
        type: KeycloakEventTypeLegacy.OnAuthSuccess
      });
    };
    this._instance.onTokenExpired = () => {
      this._keycloakEvents$.next({
        type: KeycloakEventTypeLegacy.OnTokenExpired
      });
    };
    this._instance.onActionUpdate = (state) => {
      this._keycloakEvents$.next({
        args: state,
        type: KeycloakEventTypeLegacy.OnActionUpdate
      });
    };
    this._instance.onReady = (authenticated) => {
      this._keycloakEvents$.next({
        args: authenticated,
        type: KeycloakEventTypeLegacy.OnReady
      });
    };
  }
  /**
   * Loads all bearerExcludedUrl content in a uniform type: ExcludedUrl,
   * so it becomes easier to handle.
   *
   * @param bearerExcludedUrls array of strings or ExcludedUrl that includes
   * the url and HttpMethod.
   */
  loadExcludedUrls(bearerExcludedUrls) {
    const excludedUrls = [];
    for (const item of bearerExcludedUrls) {
      let excludedUrl;
      if (typeof item === "string") {
        excludedUrl = {
          urlPattern: new RegExp(item, "i"),
          httpMethods: []
        };
      } else {
        excludedUrl = {
          urlPattern: new RegExp(item.url, "i"),
          httpMethods: item.httpMethods
        };
      }
      excludedUrls.push(excludedUrl);
    }
    return excludedUrls;
  }
  /**
   * Handles the class values initialization.
   *
   * @param options
   */
  initServiceValues({
    enableBearerInterceptor = true,
    loadUserProfileAtStartUp = false,
    bearerExcludedUrls = [],
    authorizationHeaderName = "Authorization",
    bearerPrefix = "Bearer",
    initOptions,
    updateMinValidity = 20,
    shouldAddToken = () => true,
    shouldUpdateToken = () => true
  }) {
    this._enableBearerInterceptor = enableBearerInterceptor;
    this._loadUserProfileAtStartUp = loadUserProfileAtStartUp;
    this._authorizationHeaderName = authorizationHeaderName;
    this._bearerPrefix = bearerPrefix.trim().concat(" ");
    this._excludedUrls = this.loadExcludedUrls(bearerExcludedUrls);
    this._silentRefresh = initOptions ? initOptions.flow === "implicit" : false;
    this._updateMinValidity = updateMinValidity;
    this.shouldAddToken = shouldAddToken;
    this.shouldUpdateToken = shouldUpdateToken;
  }
  /**
   * Keycloak initialization. It should be called to initialize the adapter.
   * Options is an object with 2 main parameters: config and initOptions. The first one
   * will be used to create the Keycloak instance. The second one are options to initialize the
   * keycloak instance.
   *
   * @param options
   * Config: may be a string representing the keycloak URI or an object with the
   * following content:
   * - url: Keycloak json URL
   * - realm: realm name
   * - clientId: client id
   *
   * initOptions:
   * Options to initialize the Keycloak adapter, matches the options as provided by Keycloak itself.
   *
   * enableBearerInterceptor:
   * Flag to indicate if the bearer will added to the authorization header.
   *
   * loadUserProfileInStartUp:
   * Indicates that the user profile should be loaded at the keycloak initialization,
   * just after the login.
   *
   * bearerExcludedUrls:
   * String Array to exclude the urls that should not have the Authorization Header automatically
   * added.
   *
   * authorizationHeaderName:
   * This value will be used as the Authorization Http Header name.
   *
   * bearerPrefix:
   * This value will be included in the Authorization Http Header param.
   *
   * tokenUpdateExcludedHeaders:
   * Array of Http Header key/value maps that should not trigger the token to be updated.
   *
   * updateMinValidity:
   * This value determines if the token will be refreshed based on its expiration time.
   *
   * @returns
   * A Promise with a boolean indicating if the initialization was successful.
   */
  init() {
    return __async(this, arguments, function* (options = {}) {
      this.initServiceValues(options);
      const {
        config,
        initOptions
      } = options;
      this._instance = new Keycloak(config);
      this.bindsKeycloakEvents();
      const authenticated = yield this._instance.init(initOptions);
      if (authenticated && this._loadUserProfileAtStartUp) {
        yield this.loadUserProfile();
      }
      return authenticated;
    });
  }
  /**
   * Redirects to login form on (options is an optional object with redirectUri and/or
   * prompt fields).
   *
   * @param options
   * Object, where:
   *  - redirectUri: Specifies the uri to redirect to after login.
   *  - prompt:By default the login screen is displayed if the user is not logged-in to Keycloak.
   * To only authenticate to the application if the user is already logged-in and not display the
   * login page if the user is not logged-in, set this option to none. To always require
   * re-authentication and ignore SSO, set this option to login .
   *  - maxAge: Used just if user is already authenticated. Specifies maximum time since the
   * authentication of user happened. If user is already authenticated for longer time than
   * maxAge, the SSO is ignored and he will need to re-authenticate again.
   *  - loginHint: Used to pre-fill the username/email field on the login form.
   *  - action: If value is 'register' then user is redirected to registration page, otherwise to
   * login page.
   *  - locale: Specifies the desired locale for the UI.
   * @returns
   * A void Promise if the login is successful and after the user profile loading.
   */
  login() {
    return __async(this, arguments, function* (options = {}) {
      yield this._instance.login(options);
      if (this._loadUserProfileAtStartUp) {
        yield this.loadUserProfile();
      }
    });
  }
  /**
   * Redirects to logout.
   *
   * @param redirectUri
   * Specifies the uri to redirect to after logout.
   * @returns
   * A void Promise if the logout was successful, cleaning also the userProfile.
   */
  logout(redirectUri) {
    return __async(this, null, function* () {
      const options = {
        redirectUri
      };
      yield this._instance.logout(options);
      this._userProfile = void 0;
    });
  }
  /**
   * Redirects to registration form. Shortcut for login with option
   * action = 'register'. Options are same as for the login method but 'action' is set to
   * 'register'.
   *
   * @param options
   * login options
   * @returns
   * A void Promise if the register flow was successful.
   */
  register() {
    return __async(this, arguments, function* (options = {
      action: "register"
    }) {
      yield this._instance.register(options);
    });
  }
  /**
   * Check if the user has access to the specified role. It will look for roles in
   * realm and the given resource, but will not check if the user is logged in for better performance.
   *
   * @param role
   * role name
   * @param resource
   * resource name. If not specified, `clientId` is used
   * @returns
   * A boolean meaning if the user has the specified Role.
   */
  isUserInRole(role, resource) {
    let hasRole;
    hasRole = this._instance.hasResourceRole(role, resource);
    if (!hasRole) {
      hasRole = this._instance.hasRealmRole(role);
    }
    return hasRole;
  }
  /**
   * Return the roles of the logged user. The realmRoles parameter, with default value
   * true, will return the resource roles and realm roles associated with the logged user. If set to false
   * it will only return the resource roles. The resource parameter, if specified, will return only resource roles
   * associated with the given resource.
   *
   * @param realmRoles
   * Set to false to exclude realm roles (only client roles)
   * @param resource
   * resource name If not specified, returns roles from all resources
   * @returns
   * Array of Roles associated with the logged user.
   */
  getUserRoles(realmRoles = true, resource) {
    let roles = [];
    if (this._instance.resourceAccess) {
      Object.keys(this._instance.resourceAccess).forEach((key) => {
        if (resource && resource !== key) {
          return;
        }
        const resourceAccess = this._instance.resourceAccess[key];
        const clientRoles = resourceAccess["roles"] || [];
        roles = roles.concat(clientRoles);
      });
    }
    if (realmRoles && this._instance.realmAccess) {
      const realmRoles2 = this._instance.realmAccess["roles"] || [];
      roles.push(...realmRoles2);
    }
    return roles;
  }
  /**
   * Check if user is logged in.
   *
   * @returns
   * A boolean that indicates if the user is logged in.
   */
  isLoggedIn() {
    if (!this._instance) {
      return false;
    }
    return this._instance.authenticated;
  }
  /**
   * Returns true if the token has less than minValidity seconds left before
   * it expires.
   *
   * @param minValidity
   * Seconds left. (minValidity) is optional. Default value is 0.
   * @returns
   * Boolean indicating if the token is expired.
   */
  isTokenExpired(minValidity = 0) {
    return this._instance.isTokenExpired(minValidity);
  }
  /**
   * If the token expires within _updateMinValidity seconds the token is refreshed. If the
   * session status iframe is enabled, the session status is also checked.
   * Returns a promise telling if the token was refreshed or not. If the session is not active
   * anymore, the promise is rejected.
   *
   * @param minValidity
   * Seconds left. (minValidity is optional, if not specified updateMinValidity - default 20 is used)
   * @returns
   * Promise with a boolean indicating if the token was succesfully updated.
   */
  updateToken() {
    return __async(this, arguments, function* (minValidity = this._updateMinValidity) {
      if (this._silentRefresh) {
        if (this.isTokenExpired()) {
          throw new Error("Failed to refresh the token, or the session is expired");
        }
        return true;
      }
      if (!this._instance) {
        throw new Error("Keycloak Angular library is not initialized.");
      }
      try {
        return yield this._instance.updateToken(minValidity);
      } catch (error) {
        return false;
      }
    });
  }
  /**
   * Loads the user profile.
   * Returns promise to set functions to be invoked if the profile was loaded
   * successfully, or if the profile could not be loaded.
   *
   * @param forceReload
   * If true will force the loadUserProfile even if its already loaded.
   * @returns
   * A promise with the KeycloakProfile data loaded.
   */
  loadUserProfile(forceReload = false) {
    return __async(this, null, function* () {
      if (this._userProfile && !forceReload) {
        return this._userProfile;
      }
      if (!this._instance.authenticated) {
        throw new Error("The user profile was not loaded as the user is not logged in.");
      }
      return this._userProfile = yield this._instance.loadUserProfile();
    });
  }
  /**
   * Returns the authenticated token.
   */
  getToken() {
    return __async(this, null, function* () {
      return this._instance.token;
    });
  }
  /**
   * Returns the logged username.
   *
   * @returns
   * The logged username.
   */
  getUsername() {
    if (!this._userProfile) {
      throw new Error("User not logged in or user profile was not loaded.");
    }
    return this._userProfile.username;
  }
  /**
   * Clear authentication state, including tokens. This can be useful if application
   * has detected the session was expired, for example if updating token fails.
   * Invoking this results in onAuthLogout callback listener being invoked.
   */
  clearToken() {
    this._instance.clearToken();
  }
  /**
   * Adds a valid token in header. The key & value format is:
   * Authorization Bearer <token>.
   * If the headers param is undefined it will create the Angular headers object.
   *
   * @param headers
   * Updated header with Authorization and Keycloak token.
   * @returns
   * An observable with with the HTTP Authorization header and the current token.
   */
  addTokenToHeader(headers = new HttpHeaders()) {
    return from(this.getToken()).pipe(map((token) => token ? headers.set(this._authorizationHeaderName, this._bearerPrefix + token) : headers));
  }
  /**
   * Returns the original Keycloak instance, if you need any customization that
   * this Angular service does not support yet. Use with caution.
   *
   * @returns
   * The KeycloakInstance from keycloak-js.
   */
  getKeycloakInstance() {
    return this._instance;
  }
  /**
   * @deprecated
   * Returns the excluded URLs that should not be considered by
   * the http interceptor which automatically adds the authorization header in the Http Request.
   *
   * @returns
   * The excluded urls that must not be intercepted by the KeycloakBearerInterceptor.
   */
  get excludedUrls() {
    return this._excludedUrls;
  }
  /**
   * Flag to indicate if the bearer will be added to the authorization header.
   *
   * @returns
   * Returns if the bearer interceptor was set to be disabled.
   */
  get enableBearerInterceptor() {
    return this._enableBearerInterceptor;
  }
  /**
   * Keycloak subject to monitor the events triggered by keycloak-js.
   * The following events as available (as described at keycloak docs -
   * https://www.keycloak.org/docs/latest/securing_apps/index.html#callback-events):
   * - OnAuthError
   * - OnAuthLogout
   * - OnAuthRefreshError
   * - OnAuthRefreshSuccess
   * - OnAuthSuccess
   * - OnReady
   * - OnTokenExpire
   * In each occurrence of any of these, this subject will return the event type,
   * described at {@link KeycloakEventTypeLegacy} enum and the function args from the keycloak-js
   * if provided any.
   *
   * @returns
   * A subject with the {@link KeycloakEventLegacy} which describes the event type and attaches the
   * function args.
   */
  get keycloakEvents$() {
    return this._keycloakEvents$;
  }
  static {
    this.ɵfac = function KeycloakService_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _KeycloakService)();
    };
  }
  static {
    this.ɵprov = ɵɵdefineInjectable({
      token: _KeycloakService,
      factory: _KeycloakService.ɵfac
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(KeycloakService, [{
    type: Injectable
  }], null, null);
})();
var KeycloakBearerInterceptor = class _KeycloakBearerInterceptor {
  constructor(keycloak) {
    this.keycloak = keycloak;
  }
  /**
   * Calls to update the keycloak token if the request should update the token.
   *
   * @param req http request from @angular http module.
   * @returns
   * A promise boolean for the token update or noop result.
   */
  conditionallyUpdateToken(req) {
    return __async(this, null, function* () {
      if (this.keycloak.shouldUpdateToken(req)) {
        return yield this.keycloak.updateToken();
      }
      return true;
    });
  }
  /**
   * @deprecated
   * Checks if the url is excluded from having the Bearer Authorization
   * header added.
   *
   * @param req http request from @angular http module.
   * @param excludedUrlRegex contains the url pattern and the http methods,
   * excluded from adding the bearer at the Http Request.
   */
  isUrlExcluded({
    method,
    url
  }, {
    urlPattern,
    httpMethods
  }) {
    const httpTest = httpMethods.length === 0 || httpMethods.join().indexOf(method.toUpperCase()) > -1;
    const urlTest = urlPattern.test(url);
    return httpTest && urlTest;
  }
  /**
   * Intercept implementation that checks if the request url matches the excludedUrls.
   * If not, adds the Authorization header to the request if the user is logged in.
   *
   * @param req
   * @param next
   */
  intercept(req, next) {
    const {
      enableBearerInterceptor,
      excludedUrls
    } = this.keycloak;
    if (!enableBearerInterceptor) {
      return next.handle(req);
    }
    const shallPass = !this.keycloak.shouldAddToken(req) || excludedUrls.findIndex((item) => this.isUrlExcluded(req, item)) > -1;
    if (shallPass) {
      return next.handle(req);
    }
    return combineLatest([from(this.conditionallyUpdateToken(req)), of(this.keycloak.isLoggedIn())]).pipe(mergeMap(([_, isLoggedIn]) => isLoggedIn ? this.handleRequestWithTokenHeader(req, next) : next.handle(req)));
  }
  /**
   * Adds the token of the current user to the Authorization header
   *
   * @param req
   * @param next
   */
  handleRequestWithTokenHeader(req, next) {
    return this.keycloak.addTokenToHeader(req.headers).pipe(mergeMap((headersWithBearer) => {
      const kcReq = req.clone({
        headers: headersWithBearer
      });
      return next.handle(kcReq);
    }));
  }
  static {
    this.ɵfac = function KeycloakBearerInterceptor_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _KeycloakBearerInterceptor)(ɵɵinject(KeycloakService));
    };
  }
  static {
    this.ɵprov = ɵɵdefineInjectable({
      token: _KeycloakBearerInterceptor,
      factory: _KeycloakBearerInterceptor.ɵfac
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(KeycloakBearerInterceptor, [{
    type: Injectable
  }], () => [{
    type: KeycloakService
  }], null);
})();
var CoreModule = class _CoreModule {
  static {
    this.ɵfac = function CoreModule_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _CoreModule)();
    };
  }
  static {
    this.ɵmod = ɵɵdefineNgModule({
      type: _CoreModule,
      imports: [CommonModule]
    });
  }
  static {
    this.ɵinj = ɵɵdefineInjector({
      providers: [KeycloakService, {
        provide: HTTP_INTERCEPTORS,
        useClass: KeycloakBearerInterceptor,
        multi: true
      }],
      imports: [CommonModule]
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CoreModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule],
      providers: [KeycloakService, {
        provide: HTTP_INTERCEPTORS,
        useClass: KeycloakBearerInterceptor,
        multi: true
      }]
    }]
  }], null, null);
})();
var KeycloakAngularModule = class _KeycloakAngularModule {
  static {
    this.ɵfac = function KeycloakAngularModule_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _KeycloakAngularModule)();
    };
  }
  static {
    this.ɵmod = ɵɵdefineNgModule({
      type: _KeycloakAngularModule,
      imports: [CoreModule]
    });
  }
  static {
    this.ɵinj = ɵɵdefineInjector({
      imports: [CoreModule]
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(KeycloakAngularModule, [{
    type: NgModule,
    args: [{
      imports: [CoreModule]
    }]
  }], null, null);
})();
var KeycloakEventType;
(function(KeycloakEventType2) {
  KeycloakEventType2["KeycloakAngularNotInitialized"] = "KeycloakAngularNotInitialized";
  KeycloakEventType2["KeycloakAngularInit"] = "KeycloakAngularInit";
  KeycloakEventType2["AuthError"] = "AuthError";
  KeycloakEventType2["AuthLogout"] = "AuthLogout";
  KeycloakEventType2["AuthRefreshError"] = "AuthRefreshError";
  KeycloakEventType2["AuthRefreshSuccess"] = "AuthRefreshSuccess";
  KeycloakEventType2["AuthSuccess"] = "AuthSuccess";
  KeycloakEventType2["Ready"] = "Ready";
  KeycloakEventType2["TokenExpired"] = "TokenExpired";
  KeycloakEventType2["ActionUpdate"] = "ActionUpdate";
})(KeycloakEventType || (KeycloakEventType = {}));
var typeEventArgs = (args) => args;
var createKeycloakSignal = (keycloak) => {
  const keycloakSignal = signal({
    type: KeycloakEventType.KeycloakAngularInit
  });
  if (!keycloak) {
    keycloakSignal.set({
      type: KeycloakEventType.KeycloakAngularNotInitialized
    });
    return keycloakSignal;
  }
  keycloak.onReady = (authenticated) => {
    keycloakSignal.set({
      type: KeycloakEventType.Ready,
      args: authenticated
    });
  };
  keycloak.onAuthError = (errorData) => {
    keycloakSignal.set({
      type: KeycloakEventType.AuthError,
      args: errorData
    });
  };
  keycloak.onAuthLogout = () => {
    keycloakSignal.set({
      type: KeycloakEventType.AuthLogout
    });
  };
  keycloak.onActionUpdate = (status, action) => {
    keycloakSignal.set({
      type: KeycloakEventType.ActionUpdate,
      args: {
        status,
        action
      }
    });
  };
  keycloak.onAuthRefreshError = () => {
    keycloakSignal.set({
      type: KeycloakEventType.AuthRefreshError
    });
  };
  keycloak.onAuthRefreshSuccess = () => {
    keycloakSignal.set({
      type: KeycloakEventType.AuthRefreshSuccess
    });
  };
  keycloak.onAuthSuccess = () => {
    keycloakSignal.set({
      type: KeycloakEventType.AuthSuccess
    });
  };
  keycloak.onTokenExpired = () => {
    keycloakSignal.set({
      type: KeycloakEventType.TokenExpired
    });
  };
  return keycloakSignal;
};
var KEYCLOAK_EVENT_SIGNAL = new InjectionToken("Keycloak Events Signal");
var HasRolesDirective = class _HasRolesDirective {
  constructor(templateRef, viewContainer, keycloak) {
    this.templateRef = templateRef;
    this.viewContainer = viewContainer;
    this.keycloak = keycloak;
    this.roles = [];
    this.checkRealm = false;
    this.viewContainer.clear();
    const keycloakSignal = inject(KEYCLOAK_EVENT_SIGNAL);
    effect(() => {
      const keycloakEvent = keycloakSignal();
      if (keycloakEvent.type !== KeycloakEventType.Ready) {
        return;
      }
      const authenticated = typeEventArgs(keycloakEvent.args);
      if (authenticated) {
        this.render();
      }
    });
  }
  render() {
    const hasAccess = this.checkUserRoles();
    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
  /**
   * Checks if the user has at least one of the specified roles in the resource or realm.
   * @returns True if the user has access, false otherwise.
   */
  checkUserRoles() {
    const hasResourceRole = this.roles.some((role) => this.keycloak.hasResourceRole(role, this.resource));
    const hasRealmRole = this.checkRealm ? this.roles.some((role) => this.keycloak.hasRealmRole(role)) : false;
    return hasResourceRole || hasRealmRole;
  }
  static {
    this.ɵfac = function HasRolesDirective_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _HasRolesDirective)(ɵɵdirectiveInject(TemplateRef), ɵɵdirectiveInject(ViewContainerRef), ɵɵdirectiveInject(Keycloak));
    };
  }
  static {
    this.ɵdir = ɵɵdefineDirective({
      type: _HasRolesDirective,
      selectors: [["", "kaHasRoles", ""]],
      inputs: {
        roles: [0, "kaHasRoles", "roles"],
        resource: [0, "kaHasRolesResource", "resource"],
        checkRealm: [0, "kaHasRolesCheckRealm", "checkRealm"]
      }
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HasRolesDirective, [{
    type: Directive,
    args: [{
      selector: "[kaHasRoles]"
    }]
  }], () => [{
    type: TemplateRef
  }, {
    type: ViewContainerRef
  }, {
    type: Keycloak
  }], {
    roles: [{
      type: Input,
      args: ["kaHasRoles"]
    }],
    resource: [{
      type: Input,
      args: ["kaHasRolesResource"]
    }],
    checkRealm: [{
      type: Input,
      args: ["kaHasRolesCheckRealm"]
    }]
  });
})();
var UserActivityService = class _UserActivityService {
  constructor(ngZone) {
    this.ngZone = ngZone;
    this.lastActivity = signal(Date.now());
    this.destroy$ = new Subject();
    this.lastActivitySignal = computed(() => this.lastActivity());
  }
  /**
   * Starts monitoring user activity events (`mousemove`, `touchstart`, `keydown`, `click`, `scroll`)
   * and updates the last activity timestamp using RxJS with debounce.
   * The events are processed outside Angular zone for performance optimization.
   */
  startMonitoring() {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    if (!isBrowser) {
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      const events = ["mousemove", "touchstart", "keydown", "click", "scroll"];
      events.forEach((event) => {
        fromEvent(window, event).pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.updateLastActivity());
      });
    });
  }
  /**
   * Updates the last activity timestamp to the current time.
   * This method runs inside Angular's zone to ensure reactivity with Angular signals.
   */
  updateLastActivity() {
    this.ngZone.run(() => {
      this.lastActivity.set(Date.now());
    });
  }
  /**
   * Retrieves the timestamp of the last recorded user activity.
   * @returns {number} The last activity timestamp in milliseconds since epoch.
   */
  get lastActivityTime() {
    return this.lastActivity();
  }
  /**
   * Determines whether the user interacted with the application, meaning it is activily using the application, based on
   * the specified duration.
   * @param timeout - The inactivity timeout in milliseconds.
   * @returns {boolean} `true` if the user is inactive, otherwise `false`.
   */
  isActive(timeout) {
    return Date.now() - this.lastActivityTime < timeout;
  }
  /**
   * Cleans up RxJS subscriptions and resources when the service is destroyed.
   * This method is automatically called by Angular when the service is removed.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  static {
    this.ɵfac = function UserActivityService_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _UserActivityService)(ɵɵinject(NgZone));
    };
  }
  static {
    this.ɵprov = ɵɵdefineInjectable({
      token: _UserActivityService,
      factory: _UserActivityService.ɵfac
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UserActivityService, [{
    type: Injectable
  }], () => [{
    type: NgZone
  }], null);
})();
var AutoRefreshTokenService = class _AutoRefreshTokenService {
  constructor(keycloak, userActivity) {
    this.keycloak = keycloak;
    this.userActivity = userActivity;
    this.options = this.defaultOptions;
    this.initialized = false;
    const keycloakSignal = inject(KEYCLOAK_EVENT_SIGNAL);
    effect(() => {
      const keycloakEvent = keycloakSignal();
      if (keycloakEvent.type === KeycloakEventType.TokenExpired) {
        this.processTokenExpiredEvent();
      }
    });
  }
  get defaultOptions() {
    return {
      sessionTimeout: 3e5,
      onInactivityTimeout: "logout"
    };
  }
  executeOnInactivityTimeout() {
    switch (this.options.onInactivityTimeout) {
      case "login":
        this.keycloak.login().catch((error) => console.error("Failed to execute the login call", error));
        break;
      case "logout":
        this.keycloak.logout().catch((error) => console.error("Failed to execute the logout call", error));
        break;
      default:
        break;
    }
  }
  processTokenExpiredEvent() {
    if (!this.initialized || !this.keycloak.authenticated) {
      return;
    }
    if (this.userActivity.isActive(this.options.sessionTimeout)) {
      this.keycloak.updateToken().catch(() => this.executeOnInactivityTimeout());
    } else {
      this.executeOnInactivityTimeout();
    }
  }
  start(options) {
    this.options = __spreadValues(__spreadValues({}, this.defaultOptions), options);
    this.initialized = true;
    this.userActivity.startMonitoring();
  }
  static {
    this.ɵfac = function AutoRefreshTokenService_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _AutoRefreshTokenService)(ɵɵinject(Keycloak), ɵɵinject(UserActivityService));
    };
  }
  static {
    this.ɵprov = ɵɵdefineInjectable({
      token: _AutoRefreshTokenService,
      factory: _AutoRefreshTokenService.ɵfac
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AutoRefreshTokenService, [{
    type: Injectable
  }], () => [{
    type: Keycloak
  }, {
    type: UserActivityService
  }], null);
})();
function withAutoRefreshToken(options) {
  return {
    configure: () => {
      const autoRefreshTokenService = inject(AutoRefreshTokenService);
      autoRefreshTokenService.start(options);
    }
  };
}
var mapResourceRoles = (resourceAccess = {}) => {
  return Object.entries(resourceAccess).reduce((roles, [key, value]) => {
    roles[key] = value.roles;
    return roles;
  }, {});
};
var createAuthGuard = (isAccessAllowed) => {
  return (next, state) => {
    const keycloak = inject(Keycloak);
    const authenticated = keycloak?.authenticated ?? false;
    const grantedRoles = {
      resourceRoles: mapResourceRoles(keycloak?.resourceAccess),
      realmRoles: keycloak?.realmAccess?.roles ?? []
    };
    const authData = {
      authenticated,
      keycloak,
      grantedRoles
    };
    return isAccessAllowed(next, state, authData);
  };
};
var BEARER_PREFIX = "Bearer";
var AUTHORIZATION_HEADER_NAME = "Authorization";
var createInterceptorCondition = (value) => __spreadProps(__spreadValues({}, value), {
  bearerPrefix: value.bearerPrefix ?? BEARER_PREFIX,
  authorizationHeaderName: value.authorizationHeaderName ?? AUTHORIZATION_HEADER_NAME,
  shouldUpdateToken: value.shouldUpdateToken ?? (() => true)
});
var conditionallyUpdateToken = (_0, _1, _2) => __async(null, [_0, _1, _2], function* (req, keycloak, {
  shouldUpdateToken = (_) => true
}) {
  if (shouldUpdateToken(req)) {
    return yield keycloak.updateToken().catch(() => false);
  }
  return true;
});
var addAuthorizationHeader = (req, next, keycloak, condition) => {
  const {
    bearerPrefix = BEARER_PREFIX,
    authorizationHeaderName = AUTHORIZATION_HEADER_NAME
  } = condition;
  const clonedRequest = req.clone({
    setHeaders: {
      [authorizationHeaderName]: `${bearerPrefix} ${keycloak.token}`
    }
  });
  return next(clonedRequest);
};
var CUSTOM_BEARER_TOKEN_INTERCEPTOR_CONFIG = new InjectionToken("Include the bearer token as implemented by the provided function");
var customBearerTokenInterceptor = (req, next) => {
  const conditions = inject(CUSTOM_BEARER_TOKEN_INTERCEPTOR_CONFIG) ?? [];
  const keycloak = inject(Keycloak);
  const matchingCondition = conditions.find((condition) => __async(null, null, function* () {
    return yield condition.shouldAddToken(req, next, keycloak);
  }));
  if (!matchingCondition) {
    return next(req);
  }
  return from(conditionallyUpdateToken(req, keycloak, matchingCondition)).pipe(mergeMap(() => keycloak.authenticated ? addAuthorizationHeader(req, next, keycloak, matchingCondition) : next(req)));
};
var INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG = new InjectionToken("Include the bearer token when explicitly defined int the URL pattern condition");
var findMatchingCondition = ({
  method,
  url
}, {
  urlPattern,
  httpMethods = []
}) => {
  const httpMethodTest = httpMethods.length === 0 || httpMethods.join().indexOf(method.toUpperCase()) > -1;
  const urlTest = urlPattern.test(url);
  return httpMethodTest && urlTest;
};
var includeBearerTokenInterceptor = (req, next) => {
  const conditions = inject(INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG) ?? [];
  const matchingCondition = conditions.find((condition) => findMatchingCondition(req, condition));
  if (!matchingCondition) {
    return next(req);
  }
  const keycloak = inject(Keycloak);
  return from(conditionallyUpdateToken(req, keycloak, matchingCondition)).pipe(mergeMap(() => keycloak.authenticated ? addAuthorizationHeader(req, next, keycloak, matchingCondition) : next(req)));
};
var provideKeycloakInAppInitializer = (keycloak, options) => {
  const {
    initOptions,
    features = []
  } = options;
  if (!initOptions) {
    return [];
  }
  return provideAppInitializer(() => __async(null, null, function* () {
    const injector = inject(EnvironmentInjector);
    runInInjectionContext(injector, () => features.forEach((feature) => feature.configure()));
    yield keycloak.init(initOptions).catch((error) => console.error("Keycloak initialization failed", error));
  }));
};
function provideKeycloak(options) {
  const keycloak = new Keycloak(options.config);
  const providers = options.providers ?? [];
  const keycloakSignal = createKeycloakSignal(keycloak);
  return makeEnvironmentProviders([{
    provide: KEYCLOAK_EVENT_SIGNAL,
    useValue: keycloakSignal
  }, {
    provide: Keycloak,
    useValue: keycloak
  }, ...providers, provideKeycloakInAppInitializer(keycloak, options)]);
}
export {
  AutoRefreshTokenService,
  CUSTOM_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  CoreModule,
  HasRolesDirective,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  KEYCLOAK_EVENT_SIGNAL,
  KeycloakAngularModule,
  KeycloakAuthGuard,
  KeycloakBearerInterceptor,
  KeycloakEventType,
  KeycloakEventTypeLegacy,
  KeycloakService,
  UserActivityService,
  addAuthorizationHeader,
  conditionallyUpdateToken,
  createAuthGuard,
  createInterceptorCondition,
  createKeycloakSignal,
  customBearerTokenInterceptor,
  includeBearerTokenInterceptor,
  provideKeycloak,
  typeEventArgs,
  withAutoRefreshToken
};
/*! Bundled license information:

keycloak-angular/fesm2022/keycloak-angular.mjs:
  (**
   * @license
   * Copyright Mauricio Gemelli Vigolo and contributors.
   *
   * Use of this source code is governed by a MIT-style license that can be
   * found in the LICENSE file at https://github.com/mauriciovigolo/keycloak-angular/blob/main/LICENSE.md
   *)
  (**
   * @license
   * Copyright Mauricio Gemelli Vigolo All Rights Reserved.
   *
   * Use of this source code is governed by a MIT-style license that can be
   * found in the LICENSE file at https://github.com/mauriciovigolo/keycloak-angular/blob/main/LICENSE.md
   *)
*/
//# sourceMappingURL=keycloak-angular.js.map
