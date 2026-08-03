import { registerCommands, sendMessage } from '../discord/api';
import { Env } from '../types';

export const COMMANDS = [
  {
    name: '기모찌',
    description: '기모찌 응답 커맨드',
  },
  {
    name: 'setup-panels',
    description: 'SoonSoo 알림 설정, 딜러 호출, 갤러리/모델링 의뢰 패널을 배치합니다. (어드민 전용)',
  },
];

export async function setupAllPanels(env: Env) {
  // 1. Role Setup Panel
  await sendMessage(
    env.CHANNEL_ROLE_SETUP,
    {
      embeds: [
        {
          title: '🔔 SoonSoo 알림 설정 채널',
          description: `원하시는 소식을 받고싶으신 브랜드를 선택하여 주세요.\n*알람 역할을 부여받으신 상태에서 선택시 해당 역할이 삭제됩니다.*`,
          color: 0x5865f2,
          thumbnail: { url: 'https://i.imgur.com/8Q9Z1qZ.png' },
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1, // Primary (Blue)
              label: '🔔 SoonSoo Casino',
              custom_id: 'btn_role_casino',
            },
            {
              type: 2,
              style: 1,
              label: '🔔 SoonSoo Gallery',
              custom_id: 'btn_role_gallery',
            },
            {
              type: 2,
              style: 1,
              label: '🔔 This is eat',
              custom_id: 'btn_role_thisiseat',
            },
            {
              type: 2,
              style: 1,
              label: '🔔 SoonSoo Modeling',
              custom_id: 'btn_role_modeling',
            },
            {
              type: 2,
              style: 1,
              label: '🔔 Double S Pacific',
              custom_id: 'btn_role_pacific',
            },
          ],
        },
      ],
    },
    env
  );

  // 2. Dealer Call Panel
  await sendMessage(
    env.CHANNEL_DEALER_CALL,
    {
      embeds: [
        {
          title: '🎲 THE PLATINUM 딜러 호출',
          description: `방문 후 딜러 부재중시 아래 버튼을 눌러 딜러를 호출하실 수 있습니다.\n\n⚠️ *(장난 호출시 the platinum 회원이 박탈 되실 수 있습니다.)*`,
          color: 0xf1c40f,
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3, // Success / Green
              label: '🔔 딜러 호출',
              custom_id: 'btn_call_dealer',
            },
          ],
        },
      ],
    },
    env
  );

  // 3. SoonSoo Gallery Request Panel
  await sendMessage(
    env.CHANNEL_GALLERY_REQ,
    {
      embeds: [
        {
          title: '🎨 SoonSoo Gallery 작품 의뢰',
          description: `작품 의뢰를 원하시는 고객님 께서는 아래 버튼을 클릭하여 차트 작성 후 제출하여주시기 바랍니다.`,
          color: 0xe91e63,
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              label: '📋 차트 작성',
              custom_id: 'btn_gallery_modal',
            },
          ],
        },
      ],
    },
    env
  );

  // 4. SoonSoo Modeling Request Panel
  await sendMessage(
    env.CHANNEL_MODELING_REQ,
    {
      embeds: [
        {
          title: '🏠 SoonSoo Modeling 의뢰 예약',
          description: `인테리어 의뢰를 원하시는 고객님 께서는 아래 버튼을 클릭하여 차트 작성 후 제출하여주시기 바랍니다.`,
          color: 0x1abc9c,
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              label: '📋 차트 작성',
              custom_id: 'btn_modeling_modal',
            },
          ],
        },
      ],
    },
    env
  );
}

export async function handleSetupPanelsCommand(interaction: any, env: Env) {
  await setupAllPanels(env);
  return {
    type: 4,
    data: {
      content: '✅ 모든 안내 및 신청 패널(Embed + 버튼)이 성공적으로 배치되었습니다!',
      flags: 64,
    },
  };
}

export async function registerAppCommands(env: Env) {
  return registerCommands(COMMANDS, env);
}
