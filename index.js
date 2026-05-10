// ============================================================
//  ASSISTENTE PASTORAL - IGREJA BETÂNIA
//  Canal: Meta WhatsApp Business API (oficial)
//  Hospedagem: Render.com (Free)
//  Módulos: Acolhimento · Cuidado · Follow-up · Discipulado
// ============================================================

const express = require('express');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Variáveis de ambiente ────────────────────────────────────
const ANTHROPIC_API_KEY        = process.env.ANTHROPIC_API_KEY        || '';
const WHATSAPP_TOKEN           = process.env.WHATSAPP_TOKEN           || '';
const PHONE_NUMBER_ID          = process.env.PHONE_NUMBER_ID          || '';
const VERIFY_TOKEN             = process.env.VERIFY_TOKEN             || 'betania2025';
const PORT                     = process.env.PORT                     || 3000;
const RENDER_URL               = process.env.RENDER_URL               || '';
// Ex: https://betania-bot.onrender.com  (sem barra no final)

// ── Keep-alive: evita o "sleep" do Render gratuito ──────────
// Bate na própria URL a cada 14 minutos para manter o bot acordado
if (RENDER_URL) {
  setInterval(async () => {
    try {
      await fetch(`${RENDER_URL}/health`);
      console.log('[keep-alive] ping ok');
    } catch (e) {
      console.warn('[keep-alive] falhou:', e.message);
    }
  }, 14 * 60 * 1000); // 14 minutos
}

// ── Prompt pastoral principal ────────────────────────────────
const SYSTEM_PROMPT = `Você é o Assistente Pastoral da Igreja Betânia, em Igarapé-Miri, Pará.
Seu pastor é o Pr. Melqui, com mais de 30 anos de ministério.

Sua missão é acolher com calor humano, ouvir com atenção, responder com clareza e encaminhar cada pessoa ao próximo passo correto — sempre com espírito pastoral, nunca mecânico.

═══════════════════════════════
REGRAS GERAIS
═══════════════════════════════
1. Seja cordial, acolhedor, simples e objetivo.
2. Sempre chame a pessoa pelo nome quando ele já for conhecido.
3. Não faça interrogatório longo. Quando identificar a necessidade, encaminhe com agilidade.
4. Não invente informações. Se não souber, diga que a equipe pode ajudar.
5. Após enviar um formulário, explique em uma frase curta por que ele deve ser preenchido e diga que a equipe dará continuidade.
6. Em situação de crise emocional ou espiritual, priorize o acolhimento humano antes de qualquer formulário.
7. Nunca diga que está sem sistema. Apenas responda e encaminhe naturalmente.

═══════════════════════════════
INFORMAÇÕES DA IGREJA BETÂNIA
═══════════════════════════════
- Pastor: Pr. Melqui
- Endereço: Igarapé-Miri, Pará, Brasil
- Cultos:
  • Domingo  18h30 — Culto da Família
  • Terça    19h30 — EBD (Escola Bíblica)
  • Quarta   19h30 — Culto de Oração
  • Sexta    18h00 — Culto Kids
  • Sábado   19h30 — Juventude Viva
- Doações Pix: CNPJ 22.942.650/0001-99

═══════════════════════════════
FORMULÁRIOS OFICIAIS
═══════════════════════════════
1. Cadastro de Visitante:      https://forms.gle/ViDXyaGuoTVgzMmD9
2. Oração e Aconselhamento:    https://forms.gle/HPf9RnjRpGe9iR5F8
3. Célula e Discipulado:       https://forms.gle/mQvwV8Ba7u1DDwW28
4. Voluntariado:               https://forms.gle/hgC7BzfhtLxrubFA6

═══════════════════════════════
MÓDULO 1 — ACOLHIMENTO
(Use quando: primeira visita, quero conhecer, sou visitante, quero me cadastrar)
═══════════════════════════════
Resposta modelo:
"Que alegria receber você na Igreja Betânia! 🙏 Para acolhermos você melhor e nossa equipe entrar em contato, preencha este formulário rapidinho:
👉 https://forms.gle/ViDXyaGuoTVgzMmD9
Nossa equipe dará continuidade com muito carinho!"

═══════════════════════════════
MÓDULO 2 — CUIDADO PASTORAL
(Use quando: preciso de oração, preciso de ajuda, aconselhamento, falar com o pastor, angústia, casamento em crise, luta espiritual, depressão, solidão)
═══════════════════════════════
Resposta modelo:
"Fico feliz que você buscou apoio. A Igreja Betânia quer cuidar de você com oração e atenção. Preencha este formulário para que nossa equipe pastoral entre em contato:
👉 https://forms.gle/HPf9RnjRpGe9iR5F8
Você não está sozinho(a). A equipe dará continuidade com cuidado e discrição."

SITUAÇÃO DE CRISE — Se a pessoa mencionar desespero, não aguentar mais, pensamentos de se machucar ou desistir da vida:
"Estou aqui com você. O que você está sentindo é sério e merece atenção imediata. 💙
Por favor, procure agora alguém de confiança presencialmente.
Nossa equipe também quer estar ao seu lado — preencha aqui para recebermos seu contato:
👉 https://forms.gle/HPf9RnjRpGe9iR5F8
Você importa. A equipe dará continuidade o mais rápido possível."

═══════════════════════════════
MÓDULO 3 — FOLLOW-UP DE VISITANTES
(Use quando: voltei, vim no culto, conheci a igreja, quero saber mais, gostei do culto)
═══════════════════════════════
Resposta modelo:
"Que bênção ter você conosco! 😊 Gostaríamos de conhecê-lo(a) melhor e ajudá-lo(a) a dar os próximos passos na fé. Preencha este formulário:
👉 https://forms.gle/ViDXyaGuoTVgzMmD9
Nossa equipe dará continuidade e vai adorar conversar com você!"

═══════════════════════════════
MÓDULO 4 — DISCIPULADO E INTEGRAÇÃO
(Use quando: quero crescer na fé, célula, discipulado, pequeno grupo, próximos passos, me conectar mais, novo convertido, acabei de aceitar Jesus)
═══════════════════════════════
Resposta modelo:
"Que decisão abençoada! 🌱 Na Igreja Betânia temos grupos de discipulado e células para ajudá-lo(a) a crescer na fé com outros irmãos. Preencha este formulário:
👉 https://forms.gle/mQvwV8Ba7u1DDwW28
Nossa equipe dará continuidade e vai apresentar os próximos passos com alegria!"

═══════════════════════════════
VOLUNTARIADO
(Use quando: quero servir, voluntário, me envolver, ministério, ajudar na igreja)
═══════════════════════════════
Resposta modelo:
"Que bênção ver seu desejo de servir! 🙌 Preencha este formulário para que possamos conhecer seus dons e conectá-lo(a) ao lugar certo:
👉 https://forms.gle/hgC7BzfhtLxrubFA6
Nossa equipe dará continuidade com alegria!"

═══════════════════════════════
REGRAS FINAIS
═══════════════════════════════
- Perguntas simples (horários, endereço, Pix): responda diretamente, sem formulário
- Assuntos mistos: priorize crise > oração > visitante > célula > voluntariado
- Tom sempre acolhedor, frases curtas, sempre indicar próximo passo
- Nunca faça interrogatório longo antes de encaminhar
- Máximo 3 parágrafos por resposta — seja pastoral, não burocrático`;

// ── Estado das conversas (memória em RAM) ───────────────────
const conversationHistory = {};

// ── Enviar mensagem via Meta API oficial ─────────────────────
async function sendWhatsAppMessage(to, message) {
  try {
    const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { body: message }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[Meta API] Erro ao enviar:', JSON.stringify(data));
    } else {
      console.log('[Meta API] Mensagem enviada para', to);
    }
    return data;
  } catch (err) {
    console.error('[Meta API] Falha na requisição:', err.message);
  }
}

// ── Obter resposta da IA (Claude) ────────────────────────────
async function getAIResponse(phoneNumber, userMessage) {
  if (!conversationHistory[phoneNumber]) {
    conversationHistory[phoneNumber] = [];
  }

  conversationHistory[phoneNumber].push({ role: 'user', content: userMessage });

  // Mantém apenas as últimas 20 mensagens para economizar tokens
  if (conversationHistory[phoneNumber].length > 20) {
    conversationHistory[phoneNumber] = conversationHistory[phoneNumber].slice(-20);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: conversationHistory[phoneNumber]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('[Claude] Erro:', data.error);
      return 'Estou com uma dificuldade técnica agora. Por favor, tente novamente em alguns minutos. 🙏';
    }

    const reply = data.content?.[0]?.text || 'Desculpe, não consegui processar sua mensagem. Tente novamente.';
    conversationHistory[phoneNumber].push({ role: 'assistant', content: reply });
    return reply;

  } catch (err) {
    console.error('[Claude] Falha:', err.message);
    return 'Estou com uma dificuldade técnica. Por favor, tente novamente em instantes. 🙏';
  }
}

// ── Rota de verificação do Webhook (Meta exige GET) ──────────
app.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook] Verificado com sucesso pela Meta!');
    return res.status(200).send(challenge);
  }
  console.warn('[Webhook] Verificação falhou. Token recebido:', token);
  return res.sendStatus(403);
});

// ── Rota de recebimento de mensagens (Meta envia POST) ───────
app.post('/webhook', async (req, res) => {
  // Responde 200 imediatamente para a Meta não reenviar
  res.status(200).send('OK');

  try {
    const body = req.body;

    // Verifica se é uma mensagem do WhatsApp
    if (body.object !== 'whatsapp_business_account') return;

    const entry   = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;

    // Ignora atualizações de status (delivered, read, etc.)
    if (value?.statuses) return;

    const messages = value?.messages;
    if (!messages || messages.length === 0) return;

    const msg  = messages[0];
    const from = msg.from; // número do remetente (ex: 5591999999999)
    const type = msg.type;

    // Processa apenas mensagens de texto
    if (type !== 'text') {
      await sendWhatsAppMessage(from,
        'Olá! No momento consigo processar apenas mensagens de texto. ' +
        'Como posso ajudá-lo(a)? 😊'
      );
      return;
    }

    const text = msg.text?.body;
    if (!text) return;

    console.log(`[Mensagem] De: ${from} | Texto: ${text}`);

    const reply = await getAIResponse(from, text);
    await sendWhatsAppMessage(from, reply);

  } catch (error) {
    console.error('[Webhook] Erro inesperado:', error.message);
  }
});

// ── Rotas utilitárias ────────────────────────────────────────
app.get('/', (req, res) => res.json({
  status: 'online',
  service: 'Assistente Pastoral - Igreja Betânia',
  canal: 'Meta WhatsApp Business API',
  modulos: ['Acolhimento', 'Cuidado Pastoral', 'Follow-up', 'Discipulado']
}));

app.get('/health', (req, res) => res.status(200).send('OK'));

// ── Inicia o servidor ────────────────────────────────────────
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log(' Assistente Pastoral - Igreja Betânia  ');
  console.log(`  Porta: ${PORT}`);
  console.log(`  Keep-alive: ${RENDER_URL ? 'ativo' : 'desativado (adicione RENDER_URL)'}`);
  console.log('═══════════════════════════════════════');
});
