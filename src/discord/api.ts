import { Env } from '../types';

const DISCORD_API = 'https://discord.com/api/v10';

export async function discordApi(endpoint: string, options: RequestInit = {}, env: Env) {
  const url = `${DISCORD_API}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bot ${env.BOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Discord API Error [${response.status}] ${endpoint}:`, errorText);
    throw new Error(`Discord API Error: ${response.status} ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return (await response.json()) as any;
}

// Role add/remove
export async function addRoleToMember(guildId: string, userId: string, roleId: string, env: Env) {
  return discordApi(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: 'PUT',
  }, env);
}

export async function removeRoleFromMember(guildId: string, userId: string, roleId: string, env: Env) {
  return discordApi(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: 'DELETE',
  }, env);
}

// Get Guild Members with specific role
export async function getGuildMembers(guildId: string, env: Env, limit = 1000) {
  return discordApi(`/guilds/${guildId}/members?limit=${limit}`, {
    method: 'GET',
  }, env);
}

// Create Direct Message Channel
export async function createDMChannel(recipientId: string, env: Env) {
  return discordApi('/users/@me/channels', {
    method: 'POST',
    body: JSON.stringify({ recipient_id: recipientId }),
  }, env);
}

// Send Message (Channel or DM)
export async function sendMessage(channelId: string, data: any, env: Env) {
  return discordApi(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, env);
}

// Add Reaction to Message
export async function addReaction(channelId: string, messageId: string, emoji: string, env: Env) {
  const encodedEmoji = encodeURIComponent(emoji);
  return discordApi(`/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/@me`, {
    method: 'PUT',
  }, env);
}

// Delete Reaction from Message
export async function deleteReaction(channelId: string, messageId: string, emoji: string, userId: string, env: Env) {
  const encodedEmoji = encodeURIComponent(emoji);
  return discordApi(`/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/${userId}`, {
    method: 'DELETE',
  }, env);
}

// Create Guild Channel
export async function createChannel(guildId: string, data: any, env: Env) {
  return discordApi(`/guilds/${guildId}/channels`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, env);
}

// Modify Channel
export async function modifyChannel(channelId: string, data: any, env: Env) {
  return discordApi(`/channels/${channelId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, env);
}

// Register Global or Guild Commands
export async function registerCommands(commands: any[], env: Env) {
  return discordApi(`/applications/${env.APPLICATION_ID}/guilds/${env.GUILD_ID}/commands`, {
    method: 'PUT',
    body: JSON.stringify(commands),
  }, env);
}
