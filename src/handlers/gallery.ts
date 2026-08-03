import { getNextTicketNumber } from '../utils/kv';
import { createChannel, modifyChannel, sendMessage } from '../discord/api';
import { Env } from '../types';

export function handleGalleryModalOpen() {
  return {
    type: 9, // MODAL
    data: {
      custom_id: 'modal_gallery_submit',
      title: '🎨 SoonSoo Gallery 작품 의뢰 작성',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'q_nickname',
              label: '1. 인게임 닉네임을 기재해주세요.',
              style: 1, // Short
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
              custom_id: 'q_size',
              label: '2. 원하시는 사이즈를 적어주세요.',
              style: 1,
              placeholder: '예) 4 X 4',
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'q_request',
              label: '3. 요청사항을 적어주세요.',
              style: 2, // Paragraph
              placeholder: '예) 아랫쪽 부분은 없애해주세요.',
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'q_photo_confirm',
              label: '4. 사진은 티켓 생성 후 업로드해주세요.',
              style: 1,
              placeholder: '네',
              value: '네',
              required: true,
            },
          ],
        },
      ],
    },
  };
}

export async function handleGalleryModalSubmit(interaction: any, env: Env) {
  const components = interaction.data.components;
  let nickname = '';
  let size = '';
  let requestStr = '';

  for (const row of components) {
    for (const comp of row.components) {
      if (comp.custom_id === 'q_nickname') nickname = comp.value;
      if (comp.custom_id === 'q_size') size = comp.value;
      if (comp.custom_id === 'q_request') requestStr = comp.value;
    }
  }

  const num = await getNextTicketNumber('gallery', env);
  const channelName = `작품-의뢰-${num}-${nickname.toLowerCase().replace(/[^a-z0-9_-]/g, '')}`;

  // Permission Overwrites for the new ticket channel
  const userId = interaction.member?.user?.id;
  const permissionOverwrites = [
    {
      id: env.GUILD_ID, // @everyone deny view
      type: 0,
      deny: '1024', // VIEW_CHANNEL = 1024
    },
    {
      id: userId, // Ticket creator allow view & send
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
      id: env.ROLE_GALLERY_ARTIST,
      type: 0,
      allow: '68608',
    },
    {
      id: env.ROLE_GALLERY_MANAGER,
      type: 0,
      allow: '68608',
    },
  ];

  // Create channel under CAT_GALLERY_ACTIVE
  const newChannel = await createChannel(
    env.GUILD_ID,
    {
      name: channelName,
      type: 0, // GUILD_TEXT
      parent_id: env.CAT_GALLERY_ACTIVE,
      permission_overwrites: permissionOverwrites,
    },
    env
  );

  // Send initial detail embed in the newly created channel
  await sendMessage(
    newChannel.id,
    {
      content: `<@${userId}> 님, 작품 의뢰 티켓이 생성되었습니다!`,
      embeds: [
        {
          title: '🎨 SOON SOO GALLERY 작품 의뢰서',
          color: 0x9b59b6,
          fields: [
            { name: '👤 닉네임', value: nickname, inline: true },
            { name: '📐 사이즈', value: size, inline: true },
            { name: '📝 요청사항', value: requestStr, inline: false },
            { name: '🖼️ 안내', value: '의뢰하고 싶으신 작품 사진은 이 채팅방에 직접 업로드해 주시기 바랍니다.', inline: false },
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
              style: 4, // Danger / Red
              label: '🔒 의뢰 종료',
              custom_id: `gallery_close_${num}_${nickname}`,
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
      content: `✅ 작품 의뢰 티켓이 생성되었습니다: <#${newChannel.id}>`,
      flags: 64,
    },
  };
}

export async function handleGalleryClose(interaction: any, env: Env) {
  const member = interaction.member;
  const roles: string[] = member.roles || [];

  // Permission check: @대표 @그룹 관계자 @순수갤러리 아티스트 @갤러리 매니저
  const allowedRoles = [
    env.ROLE_OWNER,
    env.ROLE_GROUP_STAFF,
    env.ROLE_GALLERY_ARTIST,
    env.ROLE_GALLERY_MANAGER,
  ];

  const hasPermission = roles.some((r) => allowedRoles.includes(r));
  if (!hasPermission) {
    return {
      type: 4,
      data: {
        content: '❌ **의뢰 종료 권한이 없습니다.** (대표, 그룹 관계자, 갤러리 아티스트, 갤러리 매니저 전용)',
        flags: 64,
      },
    };
  }

  const customId = interaction.data.custom_id;
  const parts = customId.replace('gallery_close_', '').split('_');
  const num = parts[0];
  const nickname = parts.slice(1).join('_');

  const channelId = interaction.channel_id;
  const closedName = `의뢰-종료-${num}-${nickname.toLowerCase().replace(/[^a-z0-9_-]/g, '')}`;

  // Update channel name & move to CAT_GALLERY_CLOSED
  await modifyChannel(
    channelId,
    {
      name: closedName,
      parent_id: env.CAT_GALLERY_CLOSED,
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
