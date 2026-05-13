// ============================================================
//  ASSISTENTE PASTORAL - IGREJA BETÂNIA
//  Canal: Meta WhatsApp Business API (oficial)
//  Hospedagem: Render.com (Free)
//  Módulos: Acolhimento · Cuidado · Follow-up · Discipulado
//  v2.1 — Google Sheets + Contato Secretaria
// ============================================================

const express = require('express');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Variáveis de ambiente ────────────────────────────────────
const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY  || '';
const WHATSAPP_TOKEN     = process.env.WHATSAPP_TOKEN     || '';
const PHONE_NUMBER_ID    = process.env.PHONE_NUMBER_ID    || '';
const VERIFY_TOKEN       = process.env.VERIFY_TOKEN       || 'betania2025';
const PORT               = process.env.PORT               || 3000;
const RENDER_URL         = process.env.RENDER_URL         || '';
const GOOGLE_SCRIPT_URL  = process.env.GOOGLE_SCRIPT_URL  || '';

// ── Keep-alive: evita o "sleep" do Render gratuito ──────────
if (RENDER_URL) {
  setInterval(async () => {
    try {
      await fetch(`${RENDER_URL}/health`);
      console.log('[keep-alive] ping ok');
    } catch (e) {
      console.warn('[keep-alive] falhou:', e.message);
    }
  }, 14 * 60 * 1000);
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
8. Quando a pessoa informar o nome, sempre use-o nas respostas seguintes.

═══════════════════════════════
CONTATO DA SECRETARIA
═══════════════════════════════
WhatsApp da Secretaria: (91) 99346-4940

Use este contato nas seguintes situações:
- A pessoa pede para falar diretamente com o pastor
- A pessoa tem dúvida específica que o assistente não consegue responder
- A pessoa precisa de informações sobre eventos, reuniões ou assuntos administrativos
- A pessoa demonstra urgência ou insistência em falar com um humano
- Situações de crise onde o contato humano imediato é essencial

Resposta modelo para falar com o pastor:
"Entendo que você gostaria de falar diretamente com o Pr. Melqui. 🙏
Entre em contato com a secretaria da Igreja Betânia pelo WhatsApp:
👉 (91) 99346-4940
A equipe vai agendar o melhor momento para você!"

Resposta modelo para outras informações:
"Para informações mais específicas, nossa secretaria pode ajudá-lo(a) diretamente:
👉 (91) 99346-4940
Estamos à disposição com muito carinho!"

═══════════════════════════════
INFORMAÇÕES DA IGREJA BETÂNIA
═══════════════════════════════
- Pastor: Pr. Melqui
- Endereço: Igarapé-Miri, Pará, Brasil
- Secretaria: (91) 99346-4940
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
Nossa secretaria também quer estar ao seu lado — entre em contato agora:
👉 (91) 99346-4940
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
- Pedido para falar com o pastor: encaminhe para a secretaria (91) 99346-4940
- Dúvidas que o bot não sabe responder: encaminhe para a secretaria (91) 99346-4940
- Urgências e crises: encaminhe para a secretaria (91) 99346-4940 em vez do formulário
- Assuntos mistos: priorize crise > oração > visitante > célula > voluntariado
- Tom sempre acolhedor, frases curtas, sempre indicar próximo passo
- Nunca faça interrogatório longo antes de encaminhar
- Máximo 3 parágrafos por resposta — seja pastoral, não burocrático`;

// ── Estado das conversas (memória em RAM) ───────────────────
const conversationHistory = {};

// ── Memória de nomes por número de telefone ─────────────────
const nomesPorTelefone = {};

// ── Extrair nome da mensagem do usuário ─────────────────────
function extrairNome(texto) {
  const padroes = [
    /meu nome é\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /me chamo\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /pode me chamar de\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /aqui é\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /sou (?:o|a)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /sou\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /meu nome:\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /nome:\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i
  ];

  for (const padrao of padroes) {
    const match = texto.match(padrao);
    if (match) return match[1].trim();
  }
  return '';
}

// ── Detectar módulo pelo conteúdo da resposta ───────────────
function detectarModulo(textoResposta) {
  const r = textoResposta.toLowerCase();
  if (r.includes('hgc7bzfhtlxrubfa6')) return 'Voluntariado';
  if (r.includes('mqvwv8ba7u1ddww28')) return 'Discipulado';
  if (r.includes('hpf9rnjrpge9ir5f8')) return 'Cuidado Pastoral';
  if (r.includes('vidxyaguotvgzmmd9')) return 'Acolhimento/Visitante';
  if (r.includes('99346-4940'))        return 'Encaminhado à Secretaria';
  return 'Conversa Geral';
}

// ── Registrar no Google Sheets via Apps Script ───────────────
async function registrarNoSheets(telefone, mensagemUsuario, respostaBot) {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('[Sheets] GOOGLE_SCRIPT_URL não configurada. Pulando registro.');
    return;
  }

  const modulo = detectarModulo(respostaBot);

  if (modulo === 'Conversa Geral') {
    console.log('[Sheets] Conversa geral — não registrado.');
    return;
  }

  const nome = nomesPorTelefone[telefone] || extrairNome(mensagemUsuario) || '';

  try {
    const resposta = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telefone: telefone,
        nome:     nome,
        modulo:   modulo,
        mensagem: mensagemUsuario.substring(0, 200)
      })
    });

    const resultado = await resposta.json();
    if (resultado.status === 'ok') {
      console.log(`[Sheets] ✅ Registrado: ${telefone} | ${nome || 'sem nome'} | ${modulo}`);
    } else {
      console.warn('[Sheets] Resposta inesperada:', resultado);
    }
  } catch (err) {
    console.error('[Sheets] Erro ao registrar:', err.message);
  }
}

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
  res.status(200).send('OK');

  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') return;

    const entry   = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;

    if (value?.statuses) return;

    const messages = value?.messages;
    if (!messages || messages.length === 0) return;

    const msg  = messages[0];
    const from = msg.from;
    const type = msg.type;

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

    // Tenta extrair e memorizar o nome se ainda não foi capturado
    if (!nomesPorTelefone[from]) {
      const nomeEncontrado = extrairNome(text);
      if (nomeEncontrado) {
        nomesPorTelefone[from] = nomeEncontrado;
        console.log(`[Nome] Capturado: ${nomeEncontrado} | Telefone: ${from}`);
      }
    }

    const reply = await getAIResponse(from, text);
    await sendWhatsAppMessage(from, reply);

    // Registra na planilha de forma assíncrona (não bloqueia o bot)
    registrarNoSheets(from, text, reply).catch(err =>
      console.error('[Sheets] Erro silencioso:', err.message)
    );

  } catch (error) {
    console.error('[Webhook] Erro inesperado:', error.message);
  }
});

// ── Rotas utilitárias ────────────────────────────────────────
app.get('/', (req, res) => res.json({
  status: 'online',
  service: 'Assistente Pastoral - Igreja Betânia',
  versao: '2.1',
  canal: 'Meta WhatsApp Business API',
  modulos: ['Acolhimento', 'Cuidado Pastoral', 'Follow-up', 'Discipulado'],
  sheets: GOOGLE_SCRIPT_URL ? 'conectado' : 'não configurado'
}));

app.get('/health', (req, res) => res.status(200).send('OK'));

// ── Inicia o servidor ────────────────────────────────────────
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log(' Assistente Pastoral - Igreja Betânia  ');
  console.log(' v2.1 — Sheets + Secretaria            ');
  console.log(`  Porta: ${PORT}`);
  console.log(`  Keep-alive:    ${RENDER_URL       ? 'ativo'      : 'desativado (adicione RENDER_URL)'}`);
  console.log(`  Google Sheets: ${GOOGLE_SCRIPT_URL ? 'conectado' : 'desativado (adicione GOOGLE_SCRIPT_URL)'}`);
  console.log('═══════════════════════════════════════');
});
