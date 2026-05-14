const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `أنت خبير مسابقات متخصص. كود العملية: 123.
    المطلوب: توليد 3 أسئلة لـ "علم الفلك".
    القواعد الصارمة: 1. الصعوبة: easy. 2. التنسيق: JSON array حصراً: [{"question": "...", "answer": "...", "difficulty": "easy"}]
    أجب بمصفوفة JSON فقط.`;

  try {
    console.log('Generating content...');
    const result = await model.generateContent(prompt);
    console.log('Result:', result.response.text());
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
