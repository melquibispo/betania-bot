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
    console.log('🤖 Chamando Anthropic API...');
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
    console.log('🤖 Resposta Anthropic status:', response.status);
    console.log('🤖 Dados:', JSON.stringify(data).substring(0, 300));
    
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
    console.log('📨 Evento:', body.event || 'desconhecido');

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
    console.log(`💬 Resposta gerada: ${reply.substring(0, 100)}`);
    await sendWhatsAppMessage(from, reply);
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
});

app.get('/', (req, res) => res.json({ status: 'online', service: 'Betânia Bot' }));
app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(PORT, () => console.log(`🤖 Betânia Bot rodando na porta ${PORT}`));
