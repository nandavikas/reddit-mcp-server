import { DiskStore, OAuthProvider, OAuthProxy } from "fastmcp/auth"

import type { OAuthSession } from "fastmcp/auth"

export const REDDIT_MCP_SCOPES = ["identity", "read", "history", "save", "submit", "edit"] as const

export type RedditOAuthSession = OAuthSession

export type RedditOAuthProviderConfig = {
  readonly baseUrl: string
  readonly clientId: string
  readonly clientSecret: string
  readonly encryptionKey: string
  readonly jwtSigningKey: string
  readonly storagePath: string
}

/**
 * Presents the MCP OAuth 2.1 endpoints ChatGPT expects, while using Reddit as
 * the upstream identity and authorization provider. FastMCP stores only an
 * encrypted Reddit token set and issues its own short-lived MCP access tokens.
 */
export class RedditOAuthProvider extends OAuthProvider<RedditOAuthSession> {
  private readonly redditConfig: RedditOAuthProviderConfig

  constructor(config: RedditOAuthProviderConfig) {
    super({
      allowedRedirectUriPatterns: [
        "https://chatgpt.com/connector/oauth/*",
        "https://chatgpt.com/connector_platform_oauth_redirect",
      ],
      baseUrl: config.baseUrl,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      consentRequired: true,
      encryptionKey: config.encryptionKey,
      jwtSigningKey: config.jwtSigningKey,
      authorizationEndpoint: "https://www.reddit.com/api/v1/authorize",
      scopes: [...REDDIT_MCP_SCOPES],
      tokenEndpoint: "https://www.reddit.com/api/v1/access_token",
    })
    this.redditConfig = config
  }

  protected createProxy(): OAuthProxy {
    return new OAuthProxy({
      allowedRedirectUriPatterns: [
        "https://chatgpt.com/connector/oauth/*",
        "https://chatgpt.com/connector_platform_oauth_redirect",
      ],
      allowPlainPkce: false,
      baseUrl: this.redditConfig.baseUrl,
      consentRequired: true,
      encryptionKey: this.redditConfig.encryptionKey,
      extraAuthorizationParams: { duration: "permanent" },
      jwtSigningKey: this.redditConfig.jwtSigningKey,
      scopes: [...REDDIT_MCP_SCOPES],
      tokenStorage: new DiskStore({ directory: this.redditConfig.storagePath }),
      upstreamAuthorizationEndpoint: "https://www.reddit.com/api/v1/authorize",
      upstreamClientId: this.redditConfig.clientId,
      upstreamClientSecret: this.redditConfig.clientSecret,
      upstreamTokenEndpoint: "https://www.reddit.com/api/v1/access_token",
    })
  }

  protected getAuthorizationEndpoint(): string {
    return "https://www.reddit.com/api/v1/authorize"
  }

  protected getDefaultScopes(): string[] {
    return [...REDDIT_MCP_SCOPES]
  }

  protected getTokenEndpoint(): string {
    return "https://www.reddit.com/api/v1/access_token"
  }
}

