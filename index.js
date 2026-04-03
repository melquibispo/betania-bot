const express = require('express');
const app = express();
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const INSTANCE_NAME = process.env.INSTANCE_NAME || 'betania';
const PORT = process.env.PORT || 3000;

const SYSTEM_PROMPT = `Você é o assistente virtual oficial da Igreja Betânia, uma igreja evangélica brasileira pastoreada pelo Pr. Melqui, com mais de 30 anos de ministério.

Seu nome é "Betânia Bot" e você atende membros, visitantes e interessados pelo WhatsApp.

INFORMAÇÕES DA IGREJA:
- Nome: Igreja Betânia
- Pastor: Pr. Melqui
- Cultos: Domingo às 18h30 (Culto da Família) | Terça às 19h30 (EBD — Escola Bíblica Dominical) | Quarta às 19h30 (Culto de Oração) | Sexta às 18h (Culto Kids) | Sábado às 19h30 (Juventude Viva)
- Doações Pix: CNPJ 22.942.650/0001-99
- Ministérios: Ministério de Louvor, Ministério de Mulheres de Excelência, Ministério de Jovens, Escola Bíblica Dominical, Ministério de Intercessão
- Contato com pastores: peça nome + assunto e informe que será encaminhado ao Pr. Melqui
- Cadastro de visitantes: peça nome, bairro/cidade e como conheceu a igreja

INSTRUÇÕES:
- Responda SEMPRE em português do Brasil, de forma calorosa, pastoral e acolhedora
- Para pedidos de oração: ofereça uma oração breve e genuína com base bíblica
- Para aconselhamento: ouça com empatia, ofereça apoio e versículos relevantes
- Nunca invente informações que não estejam neste contexto
- Seja conciso (máx. 5 linhas) mas completo
- Sempre termine convidando para continuar ajudando
- Não responda mensagens de grupos, apenas conversas individuais`;

// Histórico de conversas por número
const conversationHistory = {};

async function sendWhatsAppMessage(to, message) {
  const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY
    },
    body: JSON.stringify({
      number: to,
      text: message
    })
  });
  return response.json();
}

async function getAIResponse(phoneNumber, userMessage) {
  if (!conversationHistory[phoneNumber]) {
    conversationHistory[phoneNumber] = [];
  }

  conversationHistory[phoneNumber].push({
    role: 'user',
    content: userMessage
  });

  // Manter apenas as últimas 10 mensagens por conversa
  if (conversationHistory[phoneNumber].length > 20) {
    conversationHistory[phoneNumber] = conversationHistory[phoneNumber].slice(-20);
  }

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
  const reply = data.content?.[0]?.text || 'Desculpe, não consegui processar sua mensagem. Tente novamente.';

  conversationHistory[phoneNumber].push({
    role: 'assistant',
    content: reply
  });

  return reply;
}

// Webhook que recebe mensagens do WhatsApp
app.post('/webhook', async (req, res) => {
  res.status(200).send('OK');

  try {
    const body = req.body;

    // Ignorar mensagens que não sejam do tipo correto
    if (body.event !== 'messages.upsert') return;

    const message = body.data?.messages?.[0] || body.data;
    if (!message) return;

    // Ignorar mensagens enviadas pelo próprio bot
    if (message.key?.fromMe) return;

    // Ignorar mensagens de grupos
    if (message.key?.remoteJid?.includes('@g.us')) return;

    const from = message.key?.remoteJid;
    const text = message.message?.conversation ||
                 message.message?.extendedTextMessage?.text ||
                 message.message?.imageMessage?.caption;

    if (!from || !text) return;

    console.log(`📩 Mensagem de ${from}: ${text}`);

    const reply = await getAIResponse(from, text);
    await sendWhatsAppMessage(from, reply);

    console.log(`✅ Resposta enviada para ${from}`);

  } catch (error) {
    console.error('Erro no webhook:', error);
  }
});

// Rota de verificação
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Betânia Bot',
    message: 'Agente IA da Igreja Betânia funcionando!'
  });
});

app.listen(PORT, () => {
  console.log(`🤖 Betânia Bot rodando na porta ${PORT}`);
});
