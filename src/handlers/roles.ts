import { addRoleToMember, removeRoleFromMember } from '../discord/api';
import { Env } from '../types';

export async function handleRoleButton(interaction: any, env: Env) {
  const customId = interaction.data.custom_id;
  const member = interaction.member;
  const userId = member.user.id;
  const currentRoles: string[] = member.roles || [];

  const roleMap: Record<string, string> = {
    btn_role_casino: env.ROLE_NOTIF_CASINO,
    btn_role_gallery: env.ROLE_NOTIF_GALLERY,
    btn_role_thisiseat: env.ROLE_NOTIF_THISISEAT,
    btn_role_modeling: env.ROLE_NOTIF_MODELING,
    btn_role_pacific: env.ROLE_NOTIF_PACIFIC,
  };

  const targetRoleId = roleMap[customId];
  if (!targetRoleId) {
    return {
      type: 4,
      data: { content: '알 수 없는 역할 요청입니다.', flags: 64 },
    };
  }

  const hasRole = currentRoles.includes(targetRoleId);

  if (hasRole) {
    await removeRoleFromMember(env.GUILD_ID, userId, targetRoleId, env);
    return {
      type: 4,
      data: {
        content: `✅ <@&${targetRoleId}> 알림 역할이 삭제되었습니다.`,
        flags: 64,
      },
    };
  } else {
    await addRoleToMember(env.GUILD_ID, userId, targetRoleId, env);
    return {
      type: 4,
      data: {
        content: `🔔 <@&${targetRoleId}> 알림 역할이 부여되었습니다!`,
        flags: 64,
      },
    };
  }
}
