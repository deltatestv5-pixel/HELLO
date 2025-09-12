import { type User, type InsertUser } from "../../shared/schema.js";
import { storage } from "../storage.js";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
  throw new Error('Missing required Discord OAuth configuration: DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET must be set in environment variables');
}
const DISCORD_API_BASE = "https://discord.com/api/v10";

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string | null;
  accent_color?: number | null;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

export class DiscordAuthService {
  static async exchangeCodeForTokens(code: string, redirectUri: string): Promise<DiscordTokenResponse> {
    const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discord token exchange failed: ${error}`);
    }

    return response.json();
  }

  static async getDiscordUser(accessToken: string): Promise<DiscordUser> {
    const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get Discord user: ${error}`);
    }

    return response.json();
  }

  static async authenticateUser(code: string, redirectUri: string): Promise<User> {
    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code, redirectUri);
      
      // Validate token scopes
      const requiredScopes = ['identify', 'email'];
      const providedScopes = tokens.scope.split(' ');
      const hasMissingScopes = requiredScopes.some(scope => !providedScopes.includes(scope));
      
      if (hasMissingScopes) {
        throw new Error(`Missing required OAuth scopes. Required: ${requiredScopes.join(', ')}, Provided: ${providedScopes.join(', ')}`);
      }
      
      // Get user info from Discord
      const discordUser = await this.getDiscordUser(tokens.access_token);

      // Check if user exists
      let user = await storage.getUserByDiscordId(discordUser.id);

      if (user) {
        // Update existing user with new tokens and information
        user = await storage.updateUser(user.id, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatar: discordUser.avatar,
          tokenUpdatedAt: new Date(),
        });
      } else {
        // Create new user with enhanced information
        const insertUser: InsertUser = {
          discordId: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatar: discordUser.avatar,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenUpdatedAt: new Date(),
        };
        user = await storage.createUser(insertUser);
      }

      // Add user to Discord server if configured
      if (process.env.DISCORD_SERVER_INVITE && tokens.access_token) {
        try {
          await this.addUserToServer(discordUser.id, tokens.access_token);
        } catch (error) {
          console.warn('Failed to add user to Discord server:', error);
          // Don't fail authentication if server invite fails
        }
      }

      return user!;
    } catch (error) {
      console.error('Authentication error details:', error);
      throw error;
    }
  }

  static async addUserToServer(userId: string, accessToken: string): Promise<void> {
    // Extract server ID from invite URL
    const inviteCode = process.env.DISCORD_SERVER_INVITE?.split('discord.gg/')[1];
    if (!inviteCode) return;

    try {
      // Get guild info from invite
      const inviteResponse = await fetch(`${DISCORD_API_BASE}/invites/${inviteCode}`, {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      });

      if (!inviteResponse.ok) return;

      const inviteData = await inviteResponse.json();
      const guildId = inviteData.guild?.id;

      if (!guildId) return;

      // Add user to guild
      await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
        }),
      });
    } catch (error) {
      console.warn('Failed to add user to server:', error);
    }
  }

  static getAvatarUrl(user: User): string {
    if (user.avatar) {
      return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`;
    }
    const defaultAvatarNumber = parseInt(user.discriminator || '0') % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
  }

  static async refreshToken(refreshToken: string): Promise<DiscordTokenResponse> {
    const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discord token refresh failed: ${error}`);
    }

    return response.json();
  }

  static async refreshUserToken(userId: string): Promise<User | null> {
    try {
      // Get user from database
      const user = await storage.getUser(userId);
      if (!user || !user.refreshToken) return null;

      // Refresh the token
      const tokens = await this.refreshToken(user.refreshToken);

      // Update user with new tokens
      const updatedUser = await storage.updateUser(user.id, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenUpdatedAt: new Date(),
      });

      return updatedUser || null;
    } catch (error) {
      console.error('Failed to refresh user token:', error);
      return null;
    }
  }
}
