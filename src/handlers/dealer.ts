import { createDMChannel, sendMessage, addReaction, getGuildMembers } from '../discord/api';
import { Env } from '../types';

export async function handleDealerCall(interaction: any, env: Env) {
  const member = interaction.member;
  const userId = member.user.id;
  const roles: string[] = member.roles || [];

  // Check if member has Platinum role
  if (!roles.includes(env.ROLE_PLATINUM_MEMBER)) {
    return {
      type: 4,
      data: {
        content: '❌ **SOON SOO CASINO THE PLATINUM** 회원만 딜러를 호출하실 수 있습니다.',
        flags: 64,
      },
    };
  }

  // Acknowledge interaction quickly
  // We need to fetch all dealers and send DM
  const allMembers = await getGuildMembers(env.GUILD_ID, env);
  const dealers = allMembers.filter((m: any) => m.roles && m.roles.includes(env.ROLE_CASINO_DEALER));

  if (!dealers || dealers.length === 0) {
    return {
      type: 4,
      data: {
        content: '⚠️ 현재 등록된 딜러가 없습니다. 잠시 후 다시 시도해 주세요.',
        flags: 64,
      },
    };
  }

  const callerMention = `<@${userId}>`;
  const callerName = member.user.global_name || member.user.username;

  // Send DM to each dealer concurrently
  const dmTasks = dealers.map(async (dealer: any) => {
    try {
      const dmChannel = await createDMChannel(dealer.user.id, env);
      const dmMessage = await sendMessage(
        dmChannel.id,
        {
          embeds: [
            {
              title: '🎲 [SOON SOO CASINO] THE PLATINUM 딜러 호출',
              description: `🔔 **SOON SOO CASINO THE PLATINUM 회원이 방문하였습니다.**\n신속히 집합하여주시기 바랍니다.\n\n호출한 플레이어: ${callerMention} (${callerName})`,
              color: 0xffd700,
              footer: { text: `호출 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}` },
            },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 3, // Success / Green
                  label: '✅ 출동 / 방문 예정 승인',
                  custom_id: `dealer_accept_${userId}`,
                },
              ],
            },
          ],
        },
        env
      );

      // Add checkmark reaction as specified in requirements
      try {
        await addReaction(dmChannel.id, dmMessage.id, '✅', env);
      } catch (err) {
        console.error('Failed to add reaction:', err);
      }
    } catch (e) {
      console.error(`Failed to send DM to dealer ${dealer.user.id}:`, e);
    }
  });

  await Promise.all(dmTasks);

  return {
    type: 4,
    data: {
      content: '✅ **딜러 호출이 성공적으로 발송되었습니다.**\n딜러가 수락하는 대로 DM으로 방문 알림이 전달됩니다.',
      flags: 64,
    },
  };
}

export async function handleDealerAccept(interaction: any, env: Env) {
  const customId = interaction.data.custom_id;
  const callerUserId = customId.replace('dealer_accept_', '');
  const dealerUser = interaction.user || interaction.member?.user;
  const dealerMention = `<@${dealerUser.id}>`;
  const dealerName = dealerUser.global_name || dealerUser.username;

  // Fetch all dealers to inform them as well
  const allMembers = await getGuildMembers(env.GUILD_ID, env);
  const dealers = allMembers.filter((m: any) => m.roles && m.roles.includes(env.ROLE_CASINO_DEALER));

  const acceptNoticeEmbed = {
    title: '🎲 [SOON SOO CASINO] THE PLATINUM 딜러 방문 확정',
    description: `✨ **${dealerMention} 딜러가 SOON SOO CASINO THE PLATINUM에 방문 예정입니다.**`,
    color: 0x00ff7f,
    timestamp: new Date().toISOString(),
  };

  // 1. Notify calling Player via DM
  try {
    const callerDm = await createDMChannel(callerUserId, env);
    await sendMessage(
      callerDm.id,
      { embeds: [acceptNoticeEmbed] },
      env
    );
  } catch (e) {
    console.error('Failed to send DM to calling player:', e);
  }

  // 2. Notify all Dealers via DM
  const dealerNotifyTasks = dealers.map(async (dealer: any) => {
    try {
      const dmChannel = await createDMChannel(dealer.user.id, env);
      await sendMessage(
        dmChannel.id,
        { embeds: [acceptNoticeEmbed] },
        env
      );
    } catch (e) {
      console.error(`Failed to send acceptance notice to dealer ${dealer.user.id}:`, e);
    }
  });

  await Promise.all(dealerNotifyTasks);

  // Update button in the DM interaction to show accepted state
  return {
    type: 7, // UPDATE_MESSAGE
    data: {
      content: `✅ **방문 예정을 완료하셨습니다.** (${dealerName} 딜러)`,
      embeds: [acceptNoticeEmbed],
      components: [], // Remove button after acceptance
    },
  };
}
