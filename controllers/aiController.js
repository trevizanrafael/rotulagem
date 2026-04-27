const https = require('https');

/**
 * POST /chat/ia
 * Body (JSON):
 *   prompt      : string | null
 *   images      : Array<{ base64: string, mimeType: string }> | null  ← suporta múltiplas páginas (PDF)
 *   imageBase64 : string | null   ← compatibilidade legado (imagem única)
 *   mimeType    : string | null
 */
const postChat = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ ok: false, mensagem: 'Não autenticado.' });
  }

  const { prompt, images, imageBase64, mimeType } = req.body;

  // Normaliza: aceita tanto array `images` quanto campos legados `imageBase64/mimeType`
  let imageList = [];
  if (Array.isArray(images) && images.length > 0) {
    imageList = images; // [{ base64, mimeType }]
  } else if (imageBase64 && mimeType) {
    imageList = [{ base64: imageBase64, mimeType }];
  }

  if (!prompt && imageList.length === 0) {
    return res.status(400).json({ ok: false, mensagem: 'Envie um texto ou imagem/PDF.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, mensagem: 'Chave da API OpenRouter não configurada.' });
  }

  // Monta o conteúdo da mensagem: todas as imagens primeiro, depois o texto
  const contentParts = [];

  for (const img of imageList) {
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: `data:${img.mimeType};base64,${img.base64}`,
      },
    });
  }

  contentParts.push({
    type: 'text',
    text: prompt || (imageList.length > 1 ? `Analise estas ${imageList.length} páginas do rótulo.` : 'Analise esta imagem.'),
  });

  // Modelo com visão: openai/gpt-4o
  const payload = JSON.stringify({
    model: 'openai/gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'Você é um assistente especializado em auditoria de rótulos de produtos lácteos. Analise imagens e texto enviados pelo auditor e forneça respostas claras, precisas e em português. Quando receber múltiplas páginas de um PDF, analise todas as páginas em conjunto.',
      },
      {
        role: 'user',
        content: contentParts,
      },
    ],
    max_tokens: 2048,
  });

  const options = {
    hostname: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'FoodTech Rotulagem',
    },
  };

  try {
    const resposta = await new Promise((resolve, reject) => {
      const req = https.request(options, (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          try {
            // Converte Buffer completo para string UTF-8 (evita chars corrompidos)
            const data = Buffer.concat(chunks).toString('utf8');
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Resposta inválida da API'));
          }
        });
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    if (resposta.error) {
      console.error('OpenRouter error:', resposta.error);
      return res.json({ ok: false, mensagem: resposta.error.message || 'Erro da API.' });
    }

    const texto = resposta.choices?.[0]?.message?.content;
    if (!texto) {
      return res.json({ ok: false, mensagem: 'Sem resposta da IA.' });
    }

    return res.json({ ok: true, resposta: texto });
  } catch (err) {
    console.error('Erro ao chamar OpenRouter:', err.message);
    return res.status(500).json({ ok: false, mensagem: 'Erro ao se comunicar com a IA.' });
  }
};

module.exports = { postChat };
