import { getNextTicketNumber } from '../utils/kv';
import { createChannel, modifyChannel, sendMessage } from '../discord/api';
import { Env } from '../types';

export function handleModelingModalOpen() {
  return {
    type: 9, // MODAL
    data: {
      custom_id: 'modal_modeling_submit',
      title: '🏠 SoonSoo Modeling 인테리어 의뢰 예약',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'q_nickname',
              label: '1. 인게임 닉네임을 기재해주세요.',
              style: 1,
              placeholder: '예) junghwansee',
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'q_artist',
              label: '2. 아티스트를 선택해주세요.',
              style: 1,
              placeholder: '예) junghwansee',
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'q_property_type',
              label: '3. 의뢰를 신청하는 부동산 종류를 기재해주세요.',
              style: 1,
              placeholder: '예) 그로브랜드 펜트하우스',
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'q_property_addr',
              label: '4. 의뢰를 신청하는 부동산 주소를 기재해주세요.',
              style: 1,
              placeholder: '예) jhsee-building',
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'q_theme',
              label: '5. 원하는 테마를 기재해주세요.',
              style: 2,
              placeholder: '예) 현대식 화이트 (사진은 티켓 생성 후 첨부)',
              required: true,
            },
          ],
        },
      ],
    },
  };
}

export async function handleModelingModalSubmit(interaction: any, env: Env) {
  const components = interaction.data.components;
  let nickname = '';
  let artist = '';
  let propType = '';
  let propAddr = '';
  let theme = '';

  for (const row of components) {
    for (const comp of row.components) {
      if (comp.custom_id === 'q_nickname') nickname = comp.value;
      if (comp.custom_id === 'q_artist') artist = comp.value;
      if (comp.custom_id === 'q_property_type') propType = comp.value;
      if (comp.custom_id === 'q_property_addr') propAddr = comp.value;
      if (comp.custom_id === 'q_theme') theme = comp.value;
    }
  }

  const num = await getNextTicketNumber('modeling', env);
  const channelName = `인테리어-의뢰-${num}-${nickname.toLowerCase().replace(/[^a-z0-9_-]/g, '')}`;

  const userId = interaction.member?.user?.id;
  const permissionOverwrites = [
    {
      id: env.GUILD_ID,
      type: 0,
      deny: '1024',
    },
    {
      id: userId,
      type: 1,
      allow: '68608',
    },
    {
      id: env.ROLE_OWNER,
      type: 0,
      allow: '68608',
    },
    {
      id: env.ROLE_GROUP_STAFF,
      type: 0,
      allow: '68608',
    },
    {
      id: env.ROLE_MODELING_DESIGNER,
      type: 0,
      allow: '68608',
    },
  ];

  // Create channel under CAT_MODELING_ACTIVE
  const newChannel = await createChannel(
    env.GUILD_ID,
    {
      name: channelName,
      type: 0,
      parent_id: env.CAT_MODELING_ACTIVE,
      permission_overwrites: permissionOverwrites,
    },
    env
  );

  // Send initial detail embed in the newly created channel
  await sendMessage(
    newChannel.id,
    {
      content: `<@${userId}> 님, 인테리어 의뢰 티켓이 생성되었습니다!`,
      embeds: [
        {
          title: '🏠 SOON SOO MODELING 인테리어 의뢰 예약서',
          color: 0x3498db,
          fields: [
            { name: '👤 닉네임', value: nickname, inline: true },
            { name: '🎨 지정 아티스트', value: artist, inline: true },
            { name: '🏢 부동산 종류', value: propType, inline: true },
            { name: '📍 부동산 주소', value: propAddr, inline: true },
            { name: '✨ 요청 테마', value: theme, inline: false },
            { name: '🖼️ 참고 사진', value: '원하시는 참고 사진이 있다면 이 채널에 첨부해 주세요.', inline: false },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 4,
              label: '🔒 의뢰 종료',
              custom_id: `modeling_close_${num}_${nickname}`,
            },
          ],
        },
      ],
    },
    env
  );

  return {
    type: 4,
    data: {
      content: `✅ 인테리어 의뢰 티켓이 생성되었습니다: <#${newChannel.id}>`,
      flags: 64,
    },
  };
}

export async function handleModelingClose(interaction: any, env: Env) {
  const member = interaction.member;
  const roles: string[] = member.roles || [];

  // Permission check: @순수모델링 디자이너 @대표 @그룹 관계자
  const allowedRoles = [
    env.ROLE_MODELING_DESIGNER,
    env.ROLE_OWNER,
    env.ROLE_GROUP_STAFF,
  ];

  const hasPermission = roles.some((r) => allowedRoles.includes(r));
  if (!hasPermission) {
    return {
      type: 4,
      data: {
        content: '❌ **의뢰 종료 권한이 없습니다.** (순수모델링 디자이너, 대표, 그룹 관계자 전용)',
        flags: 64,
      },
    };
  }

  const customId = interaction.data.custom_id;
  const parts = customId.replace('modeling_close_', '').split('_');
  const num = parts[0];
  const nickname = parts.slice(1).join('_');

  const channelId = interaction.channel_id;
  const closedName = `의뢰-종료-${num}-${nickname.toLowerCase().replace(/[^a-z0-9_-]/g, '')}`;

  // Update channel name & move to CAT_MODELING_CLOSED
  await modifyChannel(
    channelId,
    {
      name: closedName,
      parent_id: env.CAT_MODELING_CLOSED,
    },
    env
  );

  return {
    type: 4,
    data: {
      content: `🔒 **의뢰가 종료되었습니다.** 채널이 종료 카테고리로 이동되었습니다.`,
    },
  };
}
