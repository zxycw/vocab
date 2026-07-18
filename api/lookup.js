export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { word, phonetic, lang } = req.body;
  const langLabel = { en: '英文', ja: '日文', ko: '韓文' }[lang] || lang;

  const prompt = `你是語言學習助手，請查詢這個${langLabel}單字並用 JSON 回傳（只回傳 JSON，不要其他文字）：

單字：${word}
空耳：${phonetic || '（未提供）'}

格式：
{
  "pos": "詞性（中文，例如：名詞、動詞、形容詞、副詞、片語）",
  "meaning": "中文意思（簡潔，1~2句）",
  "example": "例句（用該語言原文）",
  "exampleZh": "例句中文翻譯",
  "ipa": "音標（英文用IPA，日文用假名，韓文用羅馬拼音，沒有就空字串）"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
