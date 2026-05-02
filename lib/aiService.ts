import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateNewQuestions(categoryName: string, difficulty: string, count: number, exclude: string[] = []) {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

  const nonce = Math.random().toString(36).substring(7)
  const excludePrompt = exclude.length > 0 
    ? `\nتجنب تماماً تكرار هذه الأسئلة (سواء بالنص أو المضمون):\n${exclude.slice(-40).map(q => `- ${q}`).join('\n')}`
    : ''

  const prompt = `
    أنت خبير مسابقات متخصص. كود العملية: ${nonce}.
    المطلوب: توليد ${count} أسئلة لـ "${categoryName}".
    
    القواعد الصارمة:
    1. الصعوبة: ${difficultyPrompt}.
    2. التنوع العميق: ابحث في "التفاصيل الدقيقة" (Deep Cuts). لا تكتفِ بالأسئلة المشهورة. 
       - في الألعاب: اسأل عن أسماء الممثلين، تواريخ الإصدار، تفاصيل الخرائط، إحصائيات الأسلحة.
       - في الأعلام: اسأل عن معاني الرموز، تاريخ التغيير، ألوان محددة في زوايا معينة.
    3. التنسيق: JSON array حصراً: [{"question": "...", "answer": "...", "difficulty": "easy/medium/hard"}]
    4. اللغة: عربية فصحى سليمة.
    5. منع التكرار: ${excludePrompt}
    6. أجب بمصفوفة JSON فقط.
  `

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('AI Raw Response:', text)
    
    // Find the first [ and last ] to extract JSON
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    
    if (start === -1 || end === -1) {
      throw new Error('No JSON array found in AI response')
    }
    
    const jsonStr = text.substring(start, end + 1)
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('AI Generation Error Details:', error)
    return []
  }
}
