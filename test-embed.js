const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const text = 'hello world';

  try {
    console.log('Generating embedding...');
    const result = await model.embedContent(text);
    console.log('Embedding length:', result.embedding.values.length);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
