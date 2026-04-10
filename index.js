const express = require('express');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE_TOKEN = process.env.EVOLUTION_INSTANCE_TOKEN || '';
const INSTANCE_NAME = process.env.INSTANCE_NAME || 'betania';
const PORT = process.env.PORT || 3000;

const SYSTEM_PROMPT = `Você é o Assistente da Igreja Betânia, uma igreja evangélica brasileira pastoreada pelo Pr. Melqui, com mais de 30 anos de ministério.

Seu nome é "Assistente da Igreja Betânia" e você atende membros, visitantes e interessados pelo WhatsApp.

INFORMAÇÕES DA IGREJA:
- Nome: Igreja Betânia
- Pastor: Pr. Melqui
- Cultos: Domingo às 18h30 (Culto da Família) | Terça às 19h30 (EBD — Escola Bíblica Dominical) | Quarta às 19h30 (Culto de Oração) | Sexta às 18h (Culto Kids) | Sábado às 19h30 (Juventude Viva)
- Doações Pix: CNPJ 22.942.650/0001-99
- Ministérios: Ministério de Louvor, Ministério de Mulheres de Excelência, Ministério de Jovens, Escola Bíblica Dominical, Ministério de Intercessão
- Contato com pastores: peça nome + assunto e informe que será encaminhado ao Pr. Melqui
- Cadastro de visitantes: peça nome, bairro/cidade e como conheceu a igreja

IDENTIFICAÇÃO DO USUÁRIO:
- Na primeira mensagem de cada conversa, apresente-se e pergunte o nome da pessoa e se é homem ou mulher
- Exemplo: "Olá! Sou o Assistente da Igreja Betânia 😊 Para te atender melhor, poderia me dizer seu nome e se é irmão ou irmã?"
- Após a pessoa se identificar, use o nome dela e o gênero correto em todas as respostas seguintes
- Se a pessoa disser que é homem: use "irmão", "bem-vindo", "querido irmão" etc.
- Se a pessoa disser que é mulher: use "irmã", "bem-vinda", "querida irmã" etc.
- Se a pessoa não informar o gênero, use o nome apenas, sem pronomes de gênero
- Nunca use "(a)" ou formas genéricas como "bem-vindo(a)"

REGRAS DE RESPOSTA — MUITO IMPORTANTE:
- Responda APENAS o que foi perguntado — sem adicionar informações extras não solicitadas
- Se perguntaram sobre Pix, responda só sobre Pix
- Se perguntaram sobre cultos, responda só sobre cultos
- Se perguntaram sobre oração, ore e nada mais
- Seja DIRETO e CONCISO — máximo 4 linhas por resposta
- Não liste ministérios, eventos ou outras informações a menos que seja especificamente perguntado
- Responda SEMPRE em português do Brasil, de forma calorosa e pastoral
- Para pedidos de oração: ofereça uma oração breve e genuína com base bíblica
- Para aconselhamento: ouça com empatia e ofereça apoio
- Nunca invente informações que não estejam neste contexto
- Sempre termine com UMA pergunta ou convite simples para continuar ajudando`;

const conversationHistory = {};

async function sendWhatsAppMessage(to, message) {
  const keys = [EVOLUTION_INSTANCE_TOKEN, EVOLUTION_API_KEY].filter(Boolean);
  for (const key of keys) {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': key },
        body: JSON.stringify({ number: to, text: message })
      });
      if (response.ok) {
        console.log('✅ Mensagem enviada!');
        return await response.json();
      } else {
        const err = await response.text();
        console.log(`⚠️ Status ${response.status}: ${err.substring(0, 150)}`);
      }
    } catch (err) {
      console.error(`❌ Erro envio: ${err.message}`);
    }
  }
}

async function getAIResponse(phoneNumber, userMessage) {
  if (!conversationHistory[phoneNumber]) conversationHistory[phoneNumber] = [];
  conversationHistory[phoneNumber].push({ role: 'user', content: userMessage });
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
      console.error('❌ Erro Anthropic:', data.error.message);
      return 'Estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns minutos. 🙏';
    }

    const reply = data.content?.[0]?.text || 'Desculpe, tente novamente.';
    conversationHistory[phoneNumber].push({ role: 'assistant', content: reply });
    return reply;
  } catch (err) {
    console.error('❌ Erro chamada Anthropic:', err.message);
    return 'Estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns minutos. 🙏';
  }
}

app.get('/webhook', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/webhook', async (req, res) => {
  res.status(200).send('OK');
  try {
    const body = req.body;

    let from = null, text = null, fromMe = false;

    if (body.data?.messages?.[0]) {
      const msg = body.data.messages[0];
      fromMe = msg.key?.fromMe;
      from = msg.key?.remoteJid;
      text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    }
    if (!text && body.data?.key) {
      fromMe = body.data.key?.fromMe;
      from = body.data.key?.remoteJid;
      text = body.data.message?.conversation || body.data.message?.extendedTextMessage?.text;
    }

    if (fromMe) return;
    if (from?.includes('@g.us')) return;
    if (!from || !text) return;

    console.log(`📩 De: ${from} | Texto: ${text}`);
    const reply = await getAIResponse(from, text);
    await sendWhatsAppMessage(from, reply);
    console.log('✅ Respondido!');
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
});

app.get('/', (req, res) => res.json({ status: 'online', service: 'Assistente da Igreja Betânia' }));
app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(PORT, () => console.log(`⛪ Assistente da Igreja Betânia rodando na porta ${PORT}`));
