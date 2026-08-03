import { Env } from './types';
import { handleRoleButton } from './handlers/roles';
import { handleDealerCall, handleDealerAccept } from './handlers/dealer';
import { handleGalleryModalOpen, handleGalleryModalSubmit, handleGalleryClose } from './handlers/gallery';
import { handleModelingModalOpen, handleModelingModalSubmit, handleModelingClose } from './handlers/modeling';
import { handleSetupPanelsCommand, registerAppCommands } from './commands/setup';

async function verifyDiscordRequest(rawBody: string, signature: string, timestamp: string, hexPublicKey: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const publicBuffer = new Uint8Array(hexPublicKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const signatureBuffer = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const messageData = encoder.encode(timestamp + rawBody);

    const key = await crypto.subtle.importKey(
      'raw',
      publicBuffer,
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['verify']
    );

    return await crypto.subtle.verify('Ed25519', key, signatureBuffer, messageData);
  } catch (e) {
    console.error('Signature verification error:', e);
    return false;
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('SoonSoo Bot Cloudflare Worker Running', { status: 200 });
    }

    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const rawBody = await request.text();

    if (!signature || !timestamp || !env.PUBLIC_KEY) {
      return new Response('Bad request signature headers', { status: 401 });
    }

    const isValidRequest = await verifyDiscordRequest(rawBody, signature, timestamp, env.PUBLIC_KEY);
    if (!isValidRequest) {
      return new Response('Invalid request signature', { status: 401 });
    }

    const interaction = JSON.parse(rawBody);

    // 1. PING (Type 1)
    if (interaction.type === 1) {
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. APPLICATION COMMANDS (Type 2)
    if (interaction.type === 2) {
      const { name } = interaction.data;

      if (name === '기모찌') {
        return new Response(
          JSON.stringify({
            type: 4,
            data: { content: '기모찌' },
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (name === 'setup-panels') {
        // Register slash commands if needed & setup panels
        ctx.waitUntil(registerAppCommands(env));
        const resData = await handleSetupPanelsCommand(interaction, env);
        return new Response(JSON.stringify(resData), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 3. MESSAGE COMPONENTS / BUTTONS (Type 3)
    if (interaction.type === 3) {
      const customId = interaction.data.custom_id;

      // Role buttons
      if (customId.startsWith('btn_role_')) {
        const resData = await handleRoleButton(interaction, env);
        return new Response(JSON.stringify(resData), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Dealer call button
      if (customId === 'btn_call_dealer') {
        const resData = await handleDealerCall(interaction, env);
        return new Response(JSON.stringify(resData), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Dealer accept button (in DM)
      if (customId.startsWith('dealer_accept_')) {
        const resData = await handleDealerAccept(interaction, env);
        return new Response(JSON.stringify(resData), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Gallery Modal Open button
      if (customId === 'btn_gallery_modal') {
        const resData = handleGalleryModalOpen();
        return new Response(JSON.stringify(resData), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Gallery Close button
      if (customId.startsWith('gallery_close_')) {
        const resData = await handleGalleryClose(interaction, env);
        return new Response(JSON.stringify(resData), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Modeling Modal Open button
      if (customId === 'btn_modeling_modal') {
        const resData = handleModelingModalOpen();
        return new Response(JSON.stringify(resData), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Modeling Close button
      if (customId.startsWith('modeling_close_')) {
        const resData = await handleModelingClose(interaction, env);
        return new Response(JSON.stringify(resData), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 4. MODAL SUBMIT (Type 5)
    if (interaction.type === 5) {
      const customId = interaction.data.custom_id;

      if (customId === 'modal_gallery_submit') {
        const resData = await handleGalleryModalSubmit(interaction, env);
        return new Response(JSON.stringify(resData), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (customId === 'modal_modeling_submit') {
        const resData = await handleModelingModalSubmit(interaction, env);
        return new Response(JSON.stringify(resData), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ type: 4, data: { content: 'Unhandled interaction' } }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
