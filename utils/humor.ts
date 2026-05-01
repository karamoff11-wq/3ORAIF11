export type HumorCategory = 'correct' | 'wrong' | 'streakLost' | 'win' | 'lose' | 'noOne';

const MESSAGES: Record<HumorCategory, string[]> = {
  correct: [
    "🔥 أسطورة والله!",
    "😎 أبو العريف بنفسه!",
    "💯 دماغك شغال 100%",
    "🚀 ولا غلطة!",
    "👑 احترام!",
    "✨ يا عيني عليك!",
    "🎯 في منتصف الجبهة!"
  ],
  wrong: [
    "😂 شو هالإجابة يا زلمة؟",
    "💀 ركّز شوي!",
    "😅 حاول مرة تانية",
    "🤦‍♂️ لااااا!",
    "👀 مين علّمك هيك؟",
    "🙈 جيبولي شاي أروّق!",
    "📉 طارت النقاط!"
  ],
  streakLost: [
    "💔 راحت الستريك!",
    "😤 كنت ماشي صح!",
    "🔥 ارجع ابنِها من جديد!",
    "😭 خربت السلسلة يا كبير!"
  ],
  win: [
    "🏆 أنت الملك!",
    "👑 أبو العريف الحقيقي!",
    "🔥 اكتسحتهم!",
    "🌟 نهاية ولا أروع!"
  ],
  lose: [
    "😈 بدك تنتقم؟",
    "😂 انجلدت بصراحة",
    "👀 مباراة ثانية؟",
    "💀 هاردلك، تعيش وتاكل غيرها!"
  ],
  noOne: [
    "🤷‍♂️ معقول ولا حد عرف؟",
    "💤 نمتوا ولا إيه؟",
    "🥶 سؤال مجمد للكل!"
  ]
};

/**
 * Returns a random humor message based on the category.
 */
export function getRandomHumor(category: HumorCategory): string {
  const messages = MESSAGES[category];
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}
