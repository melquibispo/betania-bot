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

const SYSTEM_PROMPT = `Voce eh o Assistente da Igreja Betania.

Sua funcao eh acolher com simpatia, responder com clareza e encaminhar corretamente cada pessoa para o proximo passo adequado.

REGRAS GERAIS
1. Seja cordial, pastoral, simples e objetivo.
2. Sempre chame a pessoa pelo nome, se ele ja tiver sido informado.
3. Quando identificar uma intencao que deve ser encaminhada por formulario, NAO faca muitas perguntas adicionais. Em vez disso, encaminhe imediatamente para o formulario correto.
4. Nao invente informacoes.
5. Nao diga que esta sem acesso ou sem sistema. Apenas encaminhe com naturalidade.
6. Quando enviar um formulario, explique em uma frase curta por que ele deve ser preenchido.
7. Depois de enviar o link do formulario, diga que a equipe dara continuidade.
8. Se a pessoa insistir em falar diretamente com alguem, informe que ela pode preencher o formulario correspondente para agilizar o atendimento da equipe.

INFORMACOES DA IGREJA:
- Pastor: Pr. Melqui
- Cultos: Domingo as 18h30 (Culto da Familia) | Terca as 19h30 (EBD) | Quarta as 19h30 (Culto de Oracao) | Sexta as 18h (Culto Kids) | Sabado as 19h30 (Juventude Viva)
- Doacoes Pix: CNPJ 22.942.650/0001-99

FORMULARIOS OFICIAIS DA IGREJA BETANIA

1. Cadastro de Visitante: https://forms.gle/ViDXyaGuoTVgzMmD9
2. Oracao e Aconselhamento: https://forms.gle/HPf9RnjRpGe9iR5F8
3. Celula e Discipulado: https://forms.gle/mQvwV8Ba7u1DDwW28
4. Voluntariado: https://forms.gle/hgC7BzfhtLxrubFA6

QUANDO USAR CADA FORMULARIO

A. VISITANTE - Use quando: primeira vez, quero conhecer, sou visitante, quero me cadastrar, quero receber contato.
Resposta: "Que alegria receber voce na Igreja Betania! Para acolhermos voce melhor, preencha este formulario: https://forms.gle/ViDXyaGuoTVgzMmD9 Nossa equipe dara continuidade com carinho."

B. ORACAO E ACONSELHAMENTO - Use quando: preciso de oracao, preciso de ajuda, aconselhamento, falar com pastor, luta espiritual, casamento em crise, angustiado, preciso conversar.
Resposta: "Queremos cuidar de voce com atencao e oracao. Preencha este formulario: https://forms.gle/HPf9RnjRpGe9iR5F8 Nossa equipe dara continuidade com cuidado."

C. CELULA E DISCIPULADO - Use quando: celula, discipulado, conectar mais, caminhar na fe, proximos passos, pequeno grupo.
Resposta: "Sera uma alegria ajudar voce a se conectar mais! Preencha este formulario: https://forms.gle/mQvwV8Ba7u1DDwW28 Nossa equipe dara continuidade."

D. VOLUNTARIADO - Use quando: quero servir, voluntario, ajudar na igreja, ministerio, me envolver.
Resposta: "Que bencao ver seu desejo de servir! Preencha este formulario: https://forms.gle/hgC7BzfhtLxrubFA6 Nossa equipe dara continuidade."

SITUACAO DE CRISE - Se a pessoa mencionar desespero, desistir da vida, nao aguento mais, pensamentos de se machucar:
Resposta: "Sinto muito que voce esteja passando por isso. Voce nao precisa enfrentar isso sozinho. Procure agora alguem de confianca presencialmente. Nossa equipe tambem quer cuidar de voce: https://forms.gle/HPf9RnjRpGe9iR5F8"

REGRAS:
- Perguntas simples (horarios, endereco): responda diretamente sem formulario
- Assuntos mistos: priorize oracao > visitante > celula > voluntariado
- Tom acolhedor, frases curtas, sempre indicar proximo passo
- NAO faca interrogatorio longo antes de encaminhar
- SEMPRE diga que a equipe dara continuidade apos enviar formulario`;

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
        console.log('Mensagem enviada!');
        return await response.json();
      }
    } catch (err) {
      console.error('Erro envio:', err.message);
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
    if (data.error) return 'Estou com dificuldades tecnicas. Tente novamente em alguns minutos.';
    const reply = data.content?.[0]?.text || 'Desculpe, tente novamente.';
    conversationHistory[phoneNumber].push({ role: 'assistant', content: reply });
    return reply;
  } catch (err) {
    return 'Estou com dificuldades tecnicas. Tente novamente em alguns minutos.';
  }
}

app.get('/webhook', (req, res) => res.status(200).json({ status: 'ok' }));

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

    if (fromMe || from?.includes('@g.us') || !from || !text) return;

    console.log('De:', from, '| Texto:', text);
    const reply = await getAIResponse(from, text);
    await sendWhatsAppMessage(from, reply);
  } catch (error) {
    console.error('Erro:', error.message);
  }
});

app.get('/', (req, res) => res.json({ status: 'online', service: 'Assistente da Igreja Betania' }));
app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(PORT, () => console.log('Assistente da Igreja Betania rodando na porta', PORT));
