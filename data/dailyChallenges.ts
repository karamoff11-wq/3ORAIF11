export interface DailyQuestion {
  id: string;
  questionAr: string;
  questionEn: string;
  optionsAr: string[];
  optionsEn: string[];
  correct: number;
  xp: number;
}

export const DAILY_QUESTIONS: DailyQuestion[] = [
  // ─── MONTH 1: QUANTUM PHYSICS & ADVANCED COSMOLOGY ───
  {
    id: 'd1',
    questionAr: 'ما هو اسم الجسيم الأولي الذي يُعتقد أنه المسؤول عن إعطاء المادة كتلتها في النموذج المعياري لفيزياء الجسيمات؟',
    questionEn: 'What is the name of the elementary particle thought to be responsible for giving matter its mass in the Standard Model of particle physics?',
    optionsAr: ['بوزون هيغز', 'كوارك قمي', 'غلوون', 'نيوترينو'],
    optionsEn: ['Higgs Boson', 'Top Quark', 'Gluon', 'Neutrino'],
    correct: 0,
    xp: 500
  },
  {
    id: 'd2',
    questionAr: 'ما هي القيمة التقريبية لحد تشاندراسيخار، والذي يمثل أقصى كتلة يمكن أن يمتلكها قزم أبيض مستقر قبل أن ينهار إلى نجم نيوتروني أو ثقب أسود؟',
    questionEn: 'What is the approximate value of the Chandrasekhar limit, representing the maximum mass a stable white dwarf star can have before collapsing into a neutron star or black hole?',
    optionsAr: ['٣.٢٠ كتلة شمسية', '١.٤٤ كتلة شمسية', '٠.٨٥ كتلة شمسية', '٥.٠٠ كتلة شمسية'],
    optionsEn: ['3.20 solar masses', '1.44 solar masses', '0.85 solar masses', '5.00 solar masses'],
    correct: 1,
    xp: 600
  },
  {
    id: 'd3',
    questionAr: 'في ميكانيكا الكم، ما هو المبدأ الذي ينص على أنه لا يمكن لجسيمين فرميونيين متطابقين أن يشغلا نفس الحالة الكمية في نفس الوقت؟',
    questionEn: 'In quantum mechanics, what principle states that no two identical fermions can occupy the same quantum state simultaneously?',
    optionsAr: ['مبدأ عدم اليقين لهيزنبرغ', 'تأثير زيمان', 'مبدأ استبعاد باولي', 'مبدأ التراكب'],
    optionsEn: ['Heisenberg Uncertainty Principle', 'Zeeman Effect', 'Pauli Exclusion Principle', 'Superposition Principle'],
    correct: 2,
    xp: 550
  },
  {
    id: 'd4',
    questionAr: 'أي من الظواهر الكونية التالية يُعتقد أنها المصدر الأساسي لإنتاج العناصر الثقيلة جداً مثل الذهب والبلاتين في الكون؟',
    questionEn: 'Which of the following cosmic phenomena is believed to be the primary source for producing extremely heavy elements like gold and platinum in the universe?',
    optionsAr: ['الاندماج النووي في شمسنا', 'إشعاع هوكينغ', 'السدم الكوكبية', 'اصطدام النجوم النيوترونية (الكيلونوفا)'],
    optionsEn: ['Nuclear fusion in our Sun', 'Hawking Radiation', 'Planetary Nebulae', 'Neutron star collisions (Kilonova)'],
    correct: 3,
    xp: 650
  },
  {
    id: 'd5',
    questionAr: 'ما هو الاسم الذي يُطلق على درجة الحرارة النظرية التي تتوقف عندها الحركة الحرارية للذرات تماماً (الصفر المطلق) بوحدة الكلفن؟',
    questionEn: 'What is the theoretical temperature at which thermal motion of atoms completely ceases (Absolute Zero) in Kelvin?',
    optionsAr: ['صفر كلفن', '-٢٧٣.١٥ كلفن', '١٠٠ كلفن', '-١٠٠ كلفن'],
    optionsEn: ['0 Kelvin', '-273.15 Kelvin', '100 Kelvin', '-100 Kelvin'],
    correct: 0,
    xp: 450
  },
  {
    id: 'd6',
    questionAr: 'ما هي القوة الأساسية الأضعف بين القوى الأربع الأساسية في الطبيعة، على الرغم من أن مداها يمتد إلى ما لا نهاية؟',
    questionEn: 'Which fundamental force is the weakest of the four fundamental forces in nature, despite having an infinite range?',
    optionsAr: ['القوة النووية الضعيفة', 'قوة الجاذبية', 'القوة الكهرومغناطيسية', 'القوة النووية القوية'],
    optionsEn: ['Weak nuclear force', 'Gravitational force', 'Electromagnetic force', 'Strong nuclear force'],
    correct: 1,
    xp: 500
  },
  {
    id: 'd7',
    questionAr: 'في الديناميكا الحرارية، ما هو القانون الذي ينص على أن الإنتروبيا الكلية لنظام معزول لا يمكن أن تتناقص بمرور الوقت؟',
    questionEn: 'In thermodynamics, which law states that the total entropy of an isolated system can never decrease over time?',
    optionsAr: ['القانون الأول للديناميكا الحرارية', 'قانون بويل', 'القانون الثاني للديناميكا الحرارية', 'القانون الصفري'],
    optionsEn: ['First Law of Thermodynamics', 'Boyle\'s Law', 'Second Law of Thermodynamics', 'Zeroth Law'],
    correct: 2,
    xp: 500
  },
  {
    id: 'd8',
    questionAr: 'أي عالم فيزياء اقترح معادلة الموجة الشهيرة التي تصف تطور الحالة الكمية لنظام فيزيائي بمرور الوقت؟',
    questionEn: 'Which physicist proposed the famous wave equation that describes how the quantum state of a physical system changes over time?',
    optionsAr: ['نيلز بور', 'فيرنر هيزنبرغ', 'ماكس بلانك', 'إروين شرودنغر'],
    optionsEn: ['Niels Bohr', 'Werner Heisenberg', 'Max Planck', 'Erwin Schrödinger'],
    correct: 3,
    xp: 550
  },
  {
    id: 'd9',
    questionAr: 'ما هو الجسيم الافتراضي الذي يُفترض أنه يحمل قوة الجاذبية في نظريات الجاذبية الكمية؟',
    questionEn: 'What is the hypothetical elementary particle postulated to mediate the force of gravity in quantum gravity theories?',
    optionsAr: ['الغرافتون (Graviton)', 'الفوتون (Photon)', 'التاكيون (Tachyon)', 'البوزيترون (Positron)'],
    optionsEn: ['Graviton', 'Photon', 'Tachyon', 'Positron'],
    correct: 0,
    xp: 600
  },
  {
    id: 'd10',
    questionAr: 'ما هي النظرية الفيزيائية التي توحد ميكانيكا الكم والنسبية العامة بافتراض أن الجسيمات النقطية هي في الواقع خيوط أحادية البعد تهتز بترددات مختلفة؟',
    questionEn: 'What physical theory unifies quantum mechanics and general relativity by positing that point-like particles are actually one-dimensional vibrating strings?',
    optionsAr: ['النموذج المعياري', 'نظرية الأوتار الفائقة', 'الديناميكا اللونية الكمية', 'الحلقة الكمية للجاذبية'],
    optionsEn: ['Standard Model', 'Superstring Theory', 'Quantum Chromodynamics', 'Loop Quantum Gravity'],
    correct: 1,
    xp: 650
  },

  // ─── MONTH 2: ANCIENT & MEDIEVAL HISTORY ───
  {
    id: 'd11',
    questionAr: 'في أي عام تم توقيع معاهدة ويستفاليا التي أنهت حرب الثلاثين عاماً وأرست أسس الدولة القومية الحديثة؟',
    questionEn: 'In what year was the Treaty of Westphalia signed, ending the Thirty Years\' War and laying the foundations for the modern nation-state?',
    optionsAr: ['١٦١٨', '١٧١٣', '١٦٤٨', '١٥٩٨'],
    optionsEn: ['1618', '1713', '1648', '1598'],
    correct: 2,
    xp: 550
  },
  {
    id: 'd12',
    questionAr: 'من هي الإمبراطورة الوحيدة في تاريخ الصين التي حكمت كإمبراطورة ذات سيادة كاملة وأسست سلالة زو (Zhou) الخاصة بها؟',
    questionEn: 'Who was the only female sovereign empress in Chinese history who ruled in her own right and founded her own Zhou dynasty?',
    optionsAr: ['تسيشي (Cixi)', 'يانغ غويفي (Yang Guifei)', 'بان تشاو (Ban Zhao)', 'وو شيتيان (Wu Zetian)'],
    optionsEn: ['Cixi', 'Yang Guifei', 'Ban Zhao', 'Wu Zetian'],
    correct: 3,
    xp: 600
  },
  {
    id: 'd13',
    questionAr: 'ما هي المعركة التاريخية الفاصلة التي وقعت عام ١٠٧١ م والتي انتصر فيها السلاجقة بقيادة ألب أرسلان على الإمبراطورية البيزنطية؟',
    questionEn: 'What pivotal historic battle took place in 1071 AD, where the Seljuk Turks under Alp Arslan defeated the Byzantine Empire?',
    optionsAr: ['معركة ملاذ كرد (Manzikert)', 'معركة حطين', 'معركة عين جالوت', 'معركة نيقوبوليس'],
    optionsEn: ['Battle of Manzikert', 'Battle of Hattin', 'Battle of Ain Jalut', 'Battle of Nicopolis'],
    correct: 0,
    xp: 500
  },
  {
    id: 'd14',
    questionAr: 'من هو القائد العسكري القرطاجي الشهير الذي قاد جيشه مع الفيلة عبر جبال الألب لغزو روما خلال الحرب البونيقية الثانية؟',
    questionEn: 'Who was the famous Carthaginian military commander who led his army, including war elephants, across the Alps to invade Rome during the Second Punic War?',
    optionsAr: ['هاميلكار برقا', 'حنبعل (Hannibal)', 'صدربعل', 'سكيبيو الإفريقي'],
    optionsEn: ['Hamilcar Barca', 'Hannibal', 'Hasdrubal', 'Scipio Africanus'],
    correct: 1,
    xp: 450
  },
  {
    id: 'd15',
    questionAr: 'أي ملك بابلي اشتهر بسن واحدة من أقدم القوانين المكتوبة في التاريخ الإنساني والتي حُفرت على مسلة من حجر الديوريت الأسود؟',
    questionEn: 'Which Babylonian king is renowned for enacting one of the oldest deciphered written legal codes in human history, carved onto a black diorite stele?',
    optionsAr: ['نبوخذ نصر الثاني', 'سرجون الأكدي', 'حمورابي', 'كورش الكبير'],
    optionsEn: ['Nebuchadnezzar II', 'Sargon of Akkad', 'Hammurabi', 'Cyrus the Great'],
    correct: 2,
    xp: 400
  },
  {
    id: 'd16',
    questionAr: 'ما اسم الإمبراطور الروماني الذي أصدر مرسوم ميلانو عام ٣١٣ م والذي منح الحرية الدينية للمسيحيين في جميع أنحاء الإمبراطورية؟',
    questionEn: 'What was the name of the Roman Emperor who issued the Edict of Milan in 313 AD, granting religious freedom to Christians across the empire?',
    optionsAr: ['أغسطس قيصر', 'ماركوس أوريليوس', 'نيرون', 'قسطنطين العظيم'],
    optionsEn: ['Augustus Caesar', 'Marcus Aurelius', 'Nero', 'Constantine the Great'],
    correct: 3,
    xp: 500
  },
  {
    id: 'd17',
    questionAr: 'في أي معركة حاسمة هزم الإسكندر الأكبر الملك الفارسي داريوس الثالث للمرة الأخيرة عام ٣٣١ ق.م، مما أدى إلى سقوط الإمبراطورية الأخمينية؟',
    questionEn: 'In which decisive battle did Alexander the Great defeat Persian King Darius III for the final time in 331 BC, leading to the fall of the Achaemenid Empire?',
    optionsAr: ['معركة غوغميلا (Gaugamela)', 'معركة إسوس', 'معركة ماراثون', 'معركة ثيرموبيل'],
    optionsEn: ['Battle of Gaugamela', 'Battle of Issus', 'Battle of Marathon', 'Battle of Thermopylae'],
    correct: 0,
    xp: 550
  },
  {
    id: 'd18',
    questionAr: 'ما هي المدينة الإسبانية التي كانت عاصمة الخلافة الأموية في الأندلس واشتهرت بمكتبتها الضخمة وقصر الزهراء؟',
    questionEn: 'Which Spanish city served as the capital of the Umayyad Caliphate in Al-Andalus, famed for its massive library and Medina Azahara?',
    optionsAr: ['غرناطة (Granada)', 'قرطبة (Cordoba)', 'إشبيلية (Seville)', 'طليطلة (Toledo)'],
    optionsEn: ['Granada', 'Cordoba', 'Seville', 'Toledo'],
    correct: 1,
    xp: 450
  },
  {
    id: 'd19',
    questionAr: 'من هو الفيلسوف الإغريقي الذي حُكم عليه بالإعدام بشرب سم الشوكران عام ٣٩٩ ق.م بتهمة إفساد شباب أثينا؟',
    questionEn: 'Who was the Greek philosopher sentenced to death by drinking hemlock poison in 399 BC on charges of corrupting the youth of Athens?',
    optionsAr: ['أفلاطون', 'أرسطو', 'سقراط', 'ديوجين'],
    optionsEn: ['Plato', 'Aristotle', 'Socrates', 'Diogenes'],
    correct: 2,
    xp: 500
  },
  {
    id: 'd20',
    questionAr: 'ما اسم الإمبراطورية الهندية القديمة التي أسسها تشاندراغوبتا وحكمها لاحقاً الملك العظيم أشوكا الذي اعتنق البوذية ونشر السلام؟',
    questionEn: 'What ancient Indian empire was founded by Chandragupta and later ruled by the great Ashoka, who embraced Buddhism and promoted peace?',
    optionsAr: ['إمبراطورية غوبتا', 'إمبراطورية موغال', 'إمبراطورية تشولا', 'الإمبراطورية الماورية (Maurya)'],
    optionsEn: ['Gupta Empire', 'Mughal Empire', 'Chola Empire', 'Maurya Empire'],
    correct: 3,
    xp: 600
  },

  // ─── MONTH 3: COMPUTER SCIENCE & CRYPTOGRAPHY ───
  {
    id: 'd21',
    questionAr: 'ما هي اللغة البرمجية التي استُخدمت لكتابة نظام التحكم في رحلة أبولو ١١ إلى القمر والتي صممتها مارغريت هاميلتون وفريقها؟',
    questionEn: 'What programming language was used to write the Apollo 11 guidance system control software, designed by Margaret Hamilton and her team?',
    optionsAr: ['لغة التجميع (Assembly)', 'فورتران (Fortran)', 'سي (C)', 'كوبول (COBOL)'],
    optionsEn: ['Assembly', 'Fortran', 'C', 'COBOL'],
    correct: 0,
    xp: 600
  },
  {
    id: 'd22',
    questionAr: 'في التشفير غير المتماثل (RSA)، على أي مشكلة رياضية يصعب حلها يعتمد أمان خوارزمية التشفير بشكل أساسي؟',
    questionEn: 'In RSA asymmetric encryption, on which mathematically intractable problem does the security of the algorithm fundamentally rely?',
    optionsAr: ['حساب اللوغاريتمات المنفصلة', 'تحليل الأعداد الصحيحة الكبيرة إلى عواملها الأولية', 'حل أنظمة المعادلات الخطية', 'تكامل الدوال الأسية'],
    optionsEn: ['Calculating discrete logarithms', 'Factoring large composite integers into prime factors', 'Solving systems of linear equations', 'Integrating exponential functions'],
    correct: 1,
    xp: 650
  },
  {
    id: 'd23',
    questionAr: 'من هو عالم الرياضيات البريطاني الذي يُعتبر الأب الروحي لعلوم الحاسوب النظرية والذكاء الاصطناعي واشتهر بفك تشفير آلة إنجما الألمانية؟',
    questionEn: 'Which British mathematician is considered the father of theoretical computer science and AI, famed for cracking the German Enigma machine?',
    optionsAr: ['تشارلز بابيج', 'جون فون نيومان', 'آلان تورينغ (Alan Turing)', 'كلود شانون'],
    optionsEn: ['Charles Babbage', 'John von Neumann', 'Alan Turing', 'Claude Shannon'],
    correct: 2,
    xp: 500
  },
  {
    id: 'd24',
    questionAr: 'في هياكل البيانات، ما هو التعقيد الزمني (Time Complexity) لعملية البحث عن عنصر في شجرة بحث ثنائية متوازنة (Balanced BST)؟',
    questionEn: 'In data structures, what is the time complexity of searching for an element in a perfectly balanced Binary Search Tree (BST)?',
    optionsAr: ['O(n)', 'O(1)', 'O(n log n)', 'O(log n)'],
    optionsEn: ['O(n)', 'O(1)', 'O(n log n)', 'O(log n)'],
    correct: 3,
    xp: 550
  },
  {
    id: 'd25',
    questionAr: 'أي من خوارزميات التوافق في شبكات البلوكشين (Blockchain) تتطلب من المعدنين حل ألغاز تشفيرية معقدة لاستهلاك الطاقة وإثبات العمل؟',
    questionEn: 'Which blockchain consensus algorithm requires miners to solve complex cryptographic puzzles to expend computational energy?',
    optionsAr: ['إثبات العمل (Proof of Work)', 'إثبات الحصة (Proof of Stake)', 'إثبات السلطة (Proof of Authority)', 'التفويض البيزنطي (PBFT)'],
    optionsEn: ['Proof of Work', 'Proof of Stake', 'Proof of Authority', 'Byzantine Fault Tolerance'],
    correct: 0,
    xp: 450
  },
  {
    id: 'd26',
    questionAr: 'ما اسم أول شبكة حاسوبية تعمل بتبديل الحزم (Packet Switching) والتي تم تطويرها بتمويل من وزارة الدفاع الأمريكية وكانت نواة الإنترنت الحديث؟',
    questionEn: 'What was the name of the first packet-switching network developed under ARPA funding, which served as the foundation of the modern Internet?',
    optionsAr: ['إن إس إف نت (NSFNET)', 'أربانت (ARPANET)', 'إيثرنت (Ethernet)', 'يوزنت (Usenet)'],
    optionsEn: ['NSFNET', 'ARPANET', 'Ethernet', 'Usenet'],
    correct: 1,
    xp: 500
  },
  {
    id: 'd27',
    questionAr: 'ما هو البروتوكول الأساسي المسؤول عن تحويل أسماء النطاقات البشرية (مثل google.com) إلى عناوين IP رقمية يفهمها الحاسوب؟',
    questionEn: 'What fundamental network protocol is responsible for translating human-readable domain names into numerical IP addresses?',
    optionsAr: ['بروتوكول نقل الملفات (FTP)', 'بروتوكول التكوين الديناميكي (DHCP)', 'نظام أسماء النطاقات (DNS)', 'بروتوكول التحكم بالنقل (TCP)'],
    optionsEn: ['FTP (File Transfer Protocol)', 'DHCP', 'DNS (Domain Name System)', 'TCP'],
    correct: 2,
    xp: 400
  },
  {
    id: 'd28',
    questionAr: 'من هو العالم الذي صمم بنية الحاسوب الحديثة التي تفصل بين وحدة المعالجة والذاكرة وتُستخدم فيها نفس الذاكرة لتخزين البرامج والبيانات؟',
    questionEn: 'Who designed the modern computer architecture that separates CPU from memory and uses the same memory for data and instructions?',
    optionsAr: ['غوردون مور', 'دينيس ريتشي', 'كين تومسون', 'جون فون نيومان'],
    optionsEn: ['Gordon Moore', 'Dennis Ritchie', 'Ken Thompson', 'John von Neumann'],
    correct: 3,
    xp: 550
  },
  {
    id: 'd29',
    questionAr: 'في نظرية التعقيد الحسابي، ماذا تمثل الفئة P مقارنة بالفئة NP؟',
    questionEn: 'In computational complexity theory, what does the class P represent compared to NP?',
    optionsAr: ['المسائل التي يمكن حلها في وقت متعدد الحدود (Polynomial time)', 'المسائل التي لا يمكن حلها أبداً', 'المسائل التي تتطلب حواسيب كمية', 'المسائل العشوائية غير المحددة'],
    optionsEn: ['Problems solvable in polynomial time', 'Unsolvable problems', 'Problems requiring quantum computers', 'Random indeterminate problems'],
    correct: 0,
    xp: 650
  },
  {
    id: 'd30',
    questionAr: 'ما هي خوارزمية التجزئة (Hash Function) القياسية التي طورتها وكالة الأمن القومي الأمريكية وتُستخدم في تعدين البيتكوين؟',
    questionEn: 'What standard cryptographic hash function, designed by the NSA, is utilized in the Bitcoin mining proof-of-work algorithm?',
    optionsAr: ['MD5', 'SHA-256', 'CRC32', 'Argon2'],
    optionsEn: ['MD5', 'SHA-256', 'CRC32', 'Argon2'],
    correct: 1,
    xp: 500
  },

  // ─── MONTH 4: MEDICINE & NEUROBIOLOGY ───
  {
    id: 'd31',
    questionAr: 'أي جزء من الدماغ البشري يُعتبر المركز الرئيسي لتنظيم التوازن، التنسيق الحركي، وتصحيح الأخطاء أثناء الحركة؟',
    questionEn: 'Which part of the human brain is the primary center for regulating balance, motor coordination, and error correction during movement?',
    optionsAr: ['الوطاء (Hypothalamus)', 'الجسم الثفني (Corpus Callosum)', 'المخيخ (Cerebellum)', 'الحصين (Hippocampus)'],
    optionsEn: ['Hypothalamus', 'Corpus Callosum', 'Cerebellum', 'Hippocampus'],
    correct: 2,
    xp: 500
  },
  {
    id: 'd32',
    questionAr: 'ما هو الناقل العصبي الرئيسي المسؤول عن مشاعر السعادة والمكافأة والذي يتم إنتاجه بكثرة في المنطقة السقيفية البطنية (VTA)؟',
    questionEn: 'What is the primary neurotransmitter responsible for feelings of reward and pleasure, synthesized heavily in the ventral tegmental area (VTA)?',
    optionsAr: ['السيروتونين (Serotonin)', 'الأسيتيل كولين (Acetylcholine)', 'جابا (GABA)', 'الدوبامين (Dopamine)'],
    optionsEn: ['Serotonin', 'Acetylcholine', 'GABA', 'Dopamine'],
    correct: 3,
    xp: 450
  },
  {
    id: 'd33',
    questionAr: 'ما اسم العضو الصغير في الخلية الحية الذي يُطلق عليه لقب "مصنع الطاقة" لكونه المسؤول عن إنتاج جزيئات ATP؟',
    questionEn: 'What cellular organelle is famously nicknamed the "powerhouse of the cell" due to its role in generating cellular ATP molecules?',
    optionsAr: ['الميتوكوندريا (Mitochondria)', 'الريبوسوم (Ribosome)', 'جهاز غولجي (Golgi apparatus)', 'الليسوسوم (Lysosome)'],
    optionsEn: ['Mitochondria', 'Ribosome', 'Golgi apparatus', 'Lysosome'],
    correct: 0,
    xp: 400
  },
  {
    id: 'd34',
    questionAr: 'أي هرمون يفرزه البنكرياس من خلايا بيتا في جزر لانغرهانس ليعمل على خفض مستوى الجلوكوز في الدم؟',
    questionEn: 'Which hormone is secreted by beta cells in the islets of Langerhans of the pancreas to lower blood glucose levels?',
    optionsAr: ['الجلوكاجون', 'الأنسولين', 'الأدرينالين', 'الكورتيزول'],
    optionsEn: ['Glucagon', 'Insulin', 'Adrenaline', 'Cortisol'],
    correct: 1,
    xp: 400
  },
  {
    id: 'd35',
    questionAr: 'ما هو العصب القحفي العاشر الذي يمتد من جذع الدماغ إلى أعضاء البطن والصدر ويتحكم في وظائف الجهاز العصبي اللاودي (الراحة والهضم)؟',
    questionEn: 'What is the 10th cranial nerve that extends from the brainstem down to the thoracic and abdominal organs, controlling parasympathetic functions?',
    optionsAr: ['العصب ثلاثي التوائم (Trigeminal)', 'العصب الوجهي (Facial)', 'العصب المبهم (Vagus Nerve)', 'العصب البصري (Optic)'],
    optionsEn: ['Trigeminal Nerve', 'Facial Nerve', 'Vagus Nerve', 'Optic Nerve'],
    correct: 2,
    xp: 550
  },
  {
    id: 'd36',
    questionAr: 'ما هي فصيلة الدم التي يُطلق على حاملها لقب "المعطي العام" (Universal Donor) لعدم احتوائها على مستضدات A أو B أو العامل الريزوسي؟',
    questionEn: 'Which blood type is known as the universal donor because its red blood cells lack A, B, and Rh antigens?',
    optionsAr: ['AB موجب (AB+)', 'A موجب (A+)', 'B سالب (B-)', 'O سالب (O-)'],
    optionsEn: ['AB positive (AB+)', 'A positive (A+)', 'B negative (B-)', 'O negative (O-)'],
    correct: 3,
    xp: 450
  },
  {
    id: 'd37',
    questionAr: 'في علم الجينات، ما هو الإنزيم الثوري المكتشف حديثاً والذي يعمل كمقص جيني دقيق ويُستخدم في تقنية كريسبر (CRISPR) للتعديل الوراثي؟',
    questionEn: 'In genetics, what revolutionary enzyme acts as molecular scissors in the CRISPR gene-editing technology?',
    optionsAr: ['Cas9', 'بوليميريز الحمض النووي (DNA Polymerase)', 'الهيليكيز (Helicase)', 'اللايغيز (Ligase)'],
    optionsEn: ['Cas9', 'DNA Polymerase', 'Helicase', 'Ligase'],
    correct: 0,
    xp: 600
  },
  {
    id: 'd38',
    questionAr: 'أي من الفيتامينات التالية يُصنف بأنه قابل للذوبان في الدهون وتؤدي زيادة جرعته إلى تراكمه في الكبد (السمية الفيتامينية)؟',
    questionEn: 'Which of the following vitamins is fat-soluble and can accumulate in the liver causing hypervitaminosis toxicity in excess?',
    optionsAr: ['فيتامين سي (Vitamin C)', 'فيتامين أ (Vitamin A)', 'فيتامين ب١ (Thiamine)', 'حمض الفوليك (Folic Acid)'],
    optionsEn: ['Vitamin C', 'Vitamin A', 'Vitamin B1 (Thiamine)', 'Folic Acid'],
    correct: 1,
    xp: 500
  },
  {
    id: 'd39',
    questionAr: 'ما هو البروتين الرئيسي الموجود في خلايا الدم الحمراء والذي يتحد مع جزيئات الأكسجين لنقلها من الرئتين إلى جميع أنسجة الجسم؟',
    questionEn: 'What is the iron-containing metalloprotein in red blood cells that reversibly binds oxygen molecules to transport them throughout the body?',
    optionsAr: ['الميوغلوبين (Myoglobin)', 'الألبومين (Albumin)', 'الهيموغلوبين (Hemoglobin)', 'الفيبرينوجين (Fibrinogen)'],
    optionsEn: ['Myoglobin', 'Albumin', 'Hemoglobin', 'Fibrinogen'],
    correct: 2,
    xp: 400
  },
  {
    id: 'd40',
    questionAr: 'ما هو المرض العصبي التنكسي الناتج عن موت الخلايا المنتجة للدوبامين في المادة السوداء (Substantia Nigra) في الدماغ؟',
    questionEn: 'What neurodegenerative disorder is characterized by the loss of dopamine-producing neurons in the substantia nigra of the midbrain?',
    optionsAr: ['مرض ألزهايمر', 'التصلب المتعدد (MS)', 'التصلب الجانبي الضموري (ALS)', 'مرض باركنسون (الشلل الرعاش)'],
    optionsEn: ['Alzheimer\'s Disease', 'Multiple Sclerosis (MS)', 'Amyotrophic Lateral Sclerosis (ALS)', 'Parkinson\'s Disease'],
    correct: 3,
    xp: 550
  },

  // ─── MONTH 5: ASTRONOMY & SPACE EXPLORATION ───
  {
    id: 'd41',
    questionAr: 'ما هو اسم التلسكوب الفضائي الذي يعمل في الأشعة تحت الحمراء وتم إطلاقه عام ٢٠٢١ ليحل محل تلسكوب هابل في استكشاف الكون المبكر؟',
    questionEn: 'What is the name of the infrared space telescope launched in 2021 to succeed Hubble in observing the early universe?',
    optionsAr: ['جيمس ويب (James Webb)', 'تشاندرا (Chandra)', 'سبيتزر (Spitzer)', 'كيبلر (Kepler)'],
    optionsEn: ['James Webb Space Telescope', 'Chandra X-ray Observatory', 'Spitzer Space Telescope', 'Kepler Space Telescope'],
    correct: 0,
    xp: 450
  },
  {
    id: 'd42',
    questionAr: 'أي من أقمار كوكب المشتري يُعتقد أنه يحتوي على محيط شاسع من المياه المالحة السائلة تحت قشرته الجليدية السميكة؟',
    questionEn: 'Which Galilean moon of Jupiter is thought to harbor a subsurface ocean of liquid liquid saltwater beneath its thick icy crust?',
    optionsAr: ['آيو (Io)', 'يوروبا (Europa)', 'غانيميد (Ganymede)', 'كاليستو (Callisto)'],
    optionsEn: ['Io', 'Europa', 'Ganymede', 'Callisto'],
    correct: 1,
    xp: 500
  },
  {
    id: 'd43',
    questionAr: 'ما هو أقرب نجم إلى نظامنا الشمسي ويبعد عنا حوالي ٤.٢٤ سنة ضوئية فقط؟',
    questionEn: 'What is the closest known star to our solar system, located approximately 4.24 light-years away?',
    optionsAr: ['سيريوس (الشعرى اليمانية)', 'ألفا سنتوري أ', 'بروكسيما سنتوري (Proxima Centauri)', 'منكب الجوزاء (Betelgeuse)'],
    optionsEn: ['Sirius', 'Alpha Centauri A', 'Proxima Centauri', 'Betelgeuse'],
    correct: 2,
    xp: 450
  },
  {
    id: 'd44',
    questionAr: 'ما اسم المركبة الفضائية التابعة لناسا التي أصبحت أول جسم من صنع الإنسان يغادر الغلاف الشمسي (Heliosphere) ويدخل الفضاء بين النجمي في عام ٢٠١٢؟',
    questionEn: 'What NASA spacecraft became the first human-made object to cross the heliopause and enter interstellar space in 2012?',
    optionsAr: ['بايونير ١٠ (Pioneer 10)', 'نيو هورايزونز (New Horizons)', 'كاسيني (Cassini)', 'فوياجر ١ (Voyager 1)'],
    optionsEn: ['Pioneer 10', 'New Horizons', 'Cassini', 'Voyager 1'],
    correct: 3,
    xp: 550
  },
  {
    id: 'd45',
    questionAr: 'في أي مجرة تقع مجموعتنا الشمسية، والتي تنتمي إلى مجموعة المجرات المحلية (Local Group)؟',
    questionEn: 'In which galaxy is our solar system located, which belongs to the Local Group of galaxies?',
    optionsAr: ['درب التبانة (Milky Way)', 'أندروميدا (المرأة المسلسلة)', 'مثلث (Triangulum)', 'سحابة ماجلان الكبرى'],
    optionsEn: ['Milky Way', 'Andromeda Galaxy', 'Triangulum Galaxy', 'Large Magellanic Cloud'],
    correct: 0,
    xp: 350
  },
  {
    id: 'd46',
    questionAr: 'ما هي الظاهرة الفلكية التي تحدث عندما يمر كوكب عطارد أو الزهرة مباشرة بين الشمس والأرض فيظهر كنقطة سوداء صغيرة تتحرك عبر قرص الشمس؟',
    questionEn: 'What astronomical event occurs when Mercury or Venus passes directly between the Sun and Earth, appearing as a small black dot moving across the solar disk?',
    optionsAr: ['الكسوف الحلقي', 'العبور الفلكي (Astronomical Transit)', 'الخسوف الجزئي', 'الاقتران الأعظم'],
    optionsEn: ['Annular Eclipse', 'Astronomical Transit', 'Partial Eclipse', 'Great Conjunction'],
    correct: 1,
    xp: 500
  },
  {
    id: 'd47',
    questionAr: 'ما هو الكوكب الوحيد في نظامنا الشمسي الذي يدور حول محوره بشكل مائل بزاوية تقارب ٩٨ درجة، مما يجعله يبدو وكأنه يتدحرج على جانبه؟',
    questionEn: 'Which is the only planet in our solar system that rotates on its axis at a nearly 98-degree tilt, making it appear to roll on its side?',
    optionsAr: ['نبتون', 'زحل', 'أورانوس', 'الزهرة'],
    optionsEn: ['Neptune', 'Saturn', 'Uranus', 'Venus'],
    correct: 2,
    xp: 500
  },
  {
    id: 'd48',
    questionAr: 'ما اسم المذنب الشهير الذي يزور الأرض كل ٧٥ إلى ٧٦ عاماً تقريباً وكان آخر ظهور له في عام ١٩٨٦؟',
    questionEn: 'What is the famous periodic comet that visits Earth roughly every 75 to 76 years and last appeared in 1986?',
    optionsAr: ['مذنب هيل-بوب (Hale-Bopp)', 'مذنب هياكوتاكي (Hyakutake)', 'مذنب شوميكر-ليفي ٩', 'مذنب هالي (Halley\'s Comet)'],
    optionsEn: ['Comet Hale-Bopp', 'Comet Hyakutake', 'Comet Shoemaker-Levy 9', 'Halley\'s Comet'],
    correct: 3,
    xp: 400
  },
  {
    id: 'd49',
    questionAr: 'ما هو المصطلح الفلكي الذي يصف الحد الفاصل حول الثقب الأسود والذي لا يمكن لأي شيء، حتى الضوء، الهروب من جاذبيته بعد تجاوزه؟',
    questionEn: 'What astronomical term describes the boundary around a black hole beyond which nothing, not even light, can escape its gravitational pull?',
    optionsAr: ['أفق الحدث (Event Horizon)', 'التفرد (Singularity)', 'قرص التراكم (Accretion Disk)', 'الإرغوسفير (Ergosphere)'],
    optionsEn: ['Event Horizon', 'Singularity', 'Accretion Disk', 'Ergosphere'],
    correct: 0,
    xp: 450
  },
  {
    id: 'd50',
    questionAr: 'ما اسم أكبر بركان معروف في المجموعة الشمسية، والذي يقع على كوكب المريخ ويبلغ ارتفاعه حوالي ثلاثة أضعاف قمة إيفرست؟',
    questionEn: 'What is the largest known volcano in the solar system, located on Mars and standing approximately three times taller than Mount Everest?',
    optionsAr: ['ماونا كيا', 'أوليمبوس مونس (Olympus Mons)', 'بركان إتنا', 'فاليس مارينيريس'],
    optionsEn: ['Mauna Kea', 'Olympus Mons', 'Mount Etna', 'Valles Marineris'],
    correct: 1,
    xp: 450
  },

  // ─── MONTH 6: WORLD LITERATURE & PHILOSOPHY ───
  {
    id: 'd51',
    questionAr: 'من هو الكاتب الروسي الفيلسوف الذي ألف الرواية الخالدة "الجريمة والعقاب" ورواية "الإخوة كارامازوف"؟',
    questionEn: 'Who is the Russian philosopher and author who penned the immortal masterpieces "Crime and Punishment" and "The Brothers Karamazov"?',
    optionsAr: ['ليو تولستوي', 'أنطون تشيخوف', 'فيودور دوستويفسكي', 'ألكسندر بوشكين'],
    optionsEn: ['Leo Tolstoy', 'Anton Chekhov', 'Fyodor Dostoevsky', 'Alexander Pushkin'],
    correct: 2,
    xp: 500
  },
  {
    id: 'd52',
    questionAr: 'ما هي الملحمة الشعرية اليونانية القديمة المنسوبة للشاعر هوميروس والتي تروي أحداث السنة العاشرة من حصار طروادة؟',
    questionEn: 'What ancient Greek epic poem, attributed to Homer, recounts the events during the tenth year of the Trojan War?',
    optionsAr: ['الأوديسة (Odyssey)', 'الإنياذة (Aeneid)', 'ملحمة جلجامش', 'الإلياذة (Iliad)'],
    optionsEn: ['Odyssey', 'Aeneid', 'Epic of Gilgamesh', 'Iliad'],
    correct: 3,
    xp: 450
  },
  {
    id: 'd53',
    questionAr: 'من هو الفيلسوف الألماني الذي اشتهر بكتابه "هكذا تكلم زرادشت" ومفهوم "الإنسان الأعلى" (Übermensch)؟',
    questionEn: 'Which German philosopher is famously known for his work "Thus Spoke Zarathustra" and the concept of the Übermensch?',
    optionsAr: ['فريدريك نيتشه', 'إيمانويل كانط', 'جورج فيلهلم هيغل', 'آرثر شوبنهاور'],
    optionsEn: ['Friedrich Nietzsche', 'Immanuel Kant', 'Georg Wilhelm Hegel', 'Arthur Schopenhauer'],
    correct: 0,
    xp: 550
  },
  {
    id: 'd54',
    questionAr: 'ما هي الرواية الإسبانية التي كتبها ميغيل دي ثيربانتس وتُعتبر أول رواية حديثة في الأدب الغربي وتروي قصة فارس نبيل يحارب طواحين الهواء؟',
    questionEn: 'Which Spanish masterpiece by Miguel de Cervantes is considered the first modern novel, telling the story of a chivalrous knight fighting windmills?',
    optionsAr: ['مائة عام من العزلة', 'دون كيشوت (Don Quixote)', 'ظل الريح', 'الحب في زمن الكوليرا'],
    optionsEn: ['One Hundred Years of Solitude', 'Don Quixote', 'The Shadow of the Wind', 'Love in the Time of Cholera'],
    correct: 1,
    xp: 450
  },
  {
    id: 'd55',
    questionAr: 'من هو الأديب والشاعر الإنجليزي الشهير الذي كتب مسرحيات خالدة مثل "هاملت" و"ماكبث" و"روميو وجولييت"؟',
    questionEn: 'Who is the legendary English playwright and poet who wrote immortal works such as "Hamlet", "Macbeth", and "Romeo and Juliet"?',
    optionsAr: ['تشارلز ديكنز', 'جورج أورويل', 'وليام شكسبير', 'أوسكار وايلد'],
    optionsEn: ['Charles Dickens', 'George Orwell', 'William Shakespeare', 'Oscar Wilde'],
    correct: 2,
    xp: 400
  },
  {
    id: 'd56',
    questionAr: 'في الفلسفة الوجودية، من هو الفيلسوف الفرنسي الذي قال مقولته الشهيرة "الوجود يسبق الماهية" وألّف كتاب "الوجود والعدم"؟',
    questionEn: 'In existential philosophy, who is the French thinker who famously proclaimed "existence precedes essence" in his work "Being and Nothingness"?',
    optionsAr: ['ألبير كامو', 'رينيه ديكارت', 'ميشيل فوكو', 'جان بول سارتر'],
    optionsEn: ['Albert Camus', 'René Descartes', 'Michel Foucault', 'Jean-Paul Sartre'],
    correct: 3,
    xp: 600
  },
  {
    id: 'd57',
    questionAr: 'ما اسم الرواية الديستوبية الشهيرة التي ألفها جورج أورويل عام ١٩٤٩ وتصف مجتمعاً شمولياً يراقبه "الأخ الكبير"؟',
    questionEn: 'What is the title of the famous dystopian novel written by George Orwell in 1949 depicting a totalitarian society ruled by "Big Brother"?',
    optionsAr: ['١٩٨٤', 'مزرعة الحيوان', 'عالم جديد شجاع', 'فهرنهايت ٤٥١'],
    optionsEn: ['1984', 'Animal Farm', 'Brave New World', 'Fahrenheit 451'],
    correct: 0,
    xp: 450
  },
  {
    id: 'd58',
    questionAr: 'من هو الفيلسوف وعالم الرياضيات الفرنسي الذي صاغ المقولة الفلسفية الخالدة "أنا أفكر، إذن أنا موجود" (Cogito, ergo sum)؟',
    questionEn: 'Which French philosopher and mathematician coined the foundational philosophical dictum "I think, therefore I am" (Cogito, ergo sum)?',
    optionsAr: ['بليز باسكال', 'رينيه ديكارت', 'فولتير', 'جان جاك روسو'],
    optionsEn: ['Blaise Pascal', 'René Descartes', 'Voltaire', 'Jean-Jacques Rousseau'],
    correct: 1,
    xp: 450
  },
  {
    id: 'd59',
    questionAr: 'ما هي الرواية الملحمية التي ألفها الكاتب الكولومبي غابرييل غارسيا ماركيز وتُعتبر قمة مدرسة الواقعية السحرية؟',
    questionEn: 'What epic novel by Colombian author Gabriel García Márquez is considered the pinnacle masterpiece of magical realism?',
    optionsAr: ['خريف البطريرك', 'وقائع موت معلن', 'مائة عام من العزلة', 'ليس للكولونيل من يكاتبه'],
    optionsEn: ['The Autumn of the Patriarch', 'Chronicle of a Death Foretold', 'One Hundred Years of Solitude', 'No One Writes to the Colonel'],
    correct: 2,
    xp: 500
  },
  {
    id: 'd60',
    questionAr: 'في الفلسفة السياسية، من هو الفيلسوف الإيطالي الذي ألف كتاب "الأمير" واشتهر بمبدأ "الغاية تبرر الوسيلة"؟',
    questionEn: 'In political philosophy, who is the Italian diplomat who wrote "The Prince" and is associated with the doctrine "the end justifies the means"?',
    optionsAr: ['توماس هوبز', 'جون لوك', 'كارل ماركس', 'نيكولو مكيافيلي'],
    optionsEn: ['Thomas Hobbes', 'John Locke', 'Karl Marx', 'Niccolò Machiavelli'],
    correct: 3,
    xp: 500
  },

  // ─── MONTH 7: MATHEMATICS & GEOMETRY ───
  {
    id: 'd61',
    questionAr: 'ما هي المتطابقة الرياضية الخلابة التي تربط بين أهم خمسة ثوابت في الرياضيات في معادلة واحدة: e^(i*pi) + 1 = 0 ؟',
    questionEn: 'What elegant mathematical identity connects the five most fundamental mathematical constants in one equation: e^(i*pi) + 1 = 0?',
    optionsAr: ['متطابقة أويلر (Euler\'s Identity)', 'مبرهنة فيثاغورس', 'معادلة نافييه-ستوكس', 'فرضية ريمان'],
    optionsEn: ['Euler\'s Identity', 'Pythagorean Theorem', 'Navier-Stokes Equation', 'Riemann Hypothesis'],
    correct: 0,
    xp: 600
  },
  {
    id: 'd62',
    questionAr: 'من هو عالم الرياضيات الإغريقي الذي يُعتبر "أبو الهندسة" وألف كتاب "الأصول" (Elements) الذي ظل المرجع الأساسي لتدريس الرياضيات لألفي عام؟',
    questionEn: 'Which Greek mathematician is hailed as the "father of geometry" and wrote "Elements", the primary geometry textbook for over two millennia?',
    optionsAr: ['فيثاغورس', 'إقليدس (Euclid)', 'أرخميدس', 'طاليس'],
    optionsEn: ['Pythagoras', 'Euclid', 'Archimedes', 'Thales'],
    correct: 1,
    xp: 500
  },
  {
    id: 'd63',
    questionAr: 'ما هي المبرهنة الشهيرة في نظرية الأعداد التي تنص على أنه لا توجد أعداد صحيحة موجبة x, y, z تحقق المعادلة x^n + y^n = z^n عندما يكون n أكبر من 2؟',
    questionEn: 'What famous theorem in number theory states that no three positive integers x, y, z satisfy x^n + y^n = z^n for any integer n greater than 2?',
    optionsAr: ['مبرهنة لاغرانج', 'مبرهنة غودل لعدم الاكتمال', 'مبرهنة فيرما الأخيرة', 'مبرهنة ويلسون'],
    optionsEn: ['Lagrange\'s Theorem', 'Gödel\'s Incompleteness Theorem', 'Fermat\'s Last Theorem', 'Wilson\'s Theorem'],
    correct: 2,
    xp: 650
  },
  {
    id: 'd64',
    questionAr: 'في المتتابعة الشهيرة التي يبدأ كل رقم فيها بجمع الرقمين السابقين له (0, 1, 1, 2, 3, 5, 8 ...)، ما اسم هذه المتتابعة؟',
    questionEn: 'In the sequence where each number is the sum of the two preceding ones (0, 1, 1, 2, 3, 5, 8 ...), what is the name of this sequence?',
    optionsAr: ['متتابعة كوللاتز', 'متتابعة برنولي', 'متتابعة هارمونيك', 'متتابعة فيبوناتشي (Fibonacci)'],
    optionsEn: ['Collatz Sequence', 'Bernoulli Sequence', 'Harmonic Sequence', 'Fibonacci Sequence'],
    correct: 3,
    xp: 450
  },
  {
    id: 'd65',
    questionAr: 'ما هي النسبة الذهبية (Golden Ratio) التقريبية، والتي يُرمز لها بالحرف الإغريقي فاي (Phi) وتظهر بكثرة في الطبيعة والفن والعمارة؟',
    questionEn: 'What is the approximate value of the Golden Ratio (Phi), which frequently appears in geometry, art, architecture, and nature?',
    optionsAr: ['١.٦١٨', '٣.١٤١', '٢.٧١٨', '١.٤١٤'],
    optionsEn: ['1.618', '3.141', '2.718', '1.414'],
    correct: 0,
    xp: 500
  },
  {
    id: 'd66',
    questionAr: 'من هو عالم الرياضيات والمنطق النمساوي الذي أثبت مبرهنات عدم الاكتمال، مؤكداً أنه في أي نظام بديهي متسق توجد عبارات صحيحة لا يمكن إثباتها؟',
    questionEn: 'Which Austrian logician proved the Incompleteness Theorems, demonstrating that any consistent formal system contains true but unprovable statements?',
    optionsAr: ['برتراند راسل', 'كورت غودل (Kurt Gödel)', 'ديفيد هيلبرت', 'جورج كانتور'],
    optionsEn: ['Bertrand Russell', 'Kurt Gödel', 'David Hilbert', 'Georg Cantor'],
    correct: 1,
    xp: 650
  },
  {
    id: 'd67',
    questionAr: 'ما هي المشكلة الرياضية المفتوحة من مسائل الألفية السبع والتي تدور حول توزيع الأعداد الأولية وارتباطها بأصفار دالة زيتا؟',
    questionEn: 'Which open mathematical problem among the seven Millennium Prize Problems deals with the distribution of prime numbers and zeros of the Zeta function?',
    optionsAr: ['حدسية بوانكاريه', 'مسألة P مقابل NP', 'فرضية ريمان (Riemann Hypothesis)', 'حدسية بيرتش وسوينيرتون-داير'],
    optionsEn: ['Poincaré Conjecture', 'P vs NP Problem', 'Riemann Hypothesis', 'Birch and Swinnerton-Dyer Conjecture'],
    correct: 2,
    xp: 700
  },
  {
    id: 'd68',
    questionAr: 'من هو العالم المسلم الخوارزمي الذي يُعتبر مؤسس علم الجبر وألف كتاب "المختصر في حساب الجبر والمقابلة"؟',
    questionEn: 'Who is the famous Muslim mathematician considered the father of algebra for his definitive treatise "Al-Jabr"?',
    optionsAr: ['عمر الخيام', 'ابن الهيثم', 'البتاني', 'محمد بن موسى الخوارزمي'],
    optionsEn: ['Omar Khayyam', 'Ibn al-Haytham', 'Al-Battani', 'Muhammad ibn Musa al-Khwarizmi'],
    correct: 3,
    xp: 450
  },
  {
    id: 'd69',
    questionAr: 'ما هو الشكل الهندسي ثلاثي الأبعاد الذي يمتلك سطحاً واحداً وحافة واحدة فقط ويُصنع بلصق طرفي شريط مع قلب أحدهما؟',
    questionEn: 'What three-dimensional geometric surface has exactly one side and one boundary, constructed by giving a half-twist to a strip of paper and joining the ends?',
    optionsAr: ['شريط موبيوس (Möbius strip)', 'زجاجة كلاين (Klein bottle)', 'كرة هيلبرت', 'مكعب تيسراكت'],
    optionsEn: ['Möbius strip', 'Klein bottle', 'Hilbert sphere', 'Tesseract'],
    correct: 0,
    xp: 550
  },
  {
    id: 'd70',
    questionAr: 'في حساب التفاضل والتكامل، من هما العالمان اللذان يُنسب إليهما اختراع هذا العلم بشكل مستقل في أواخر القرن السابع عشر؟',
    questionEn: 'In calculus, which two renowned scientists independently developed the infinitesimal calculus in the late 17th century?',
    optionsAr: ['إقليدس وفيثاغورس', 'إسحاق نيوتن وغوتفريد لايبنتز', 'بيير دي فيرما وبليز باسكال', 'برنارد ريمان وأوغستان كوشي'],
    optionsEn: ['Euclid and Pythagoras', 'Isaac Newton and Gottfried Leibniz', 'Pierre de Fermat and Blaise Pascal', 'Bernhard Riemann and Augustin Cauchy'],
    correct: 1,
    xp: 500
  },

  // ─── MONTH 8: EARTH SCIENCES & BOTANY ───
  {
    id: 'd71',
    questionAr: 'ما هي الطبقة الأعمق من طبقات الغلاف الجوي للأرض والتي تحدث فيها جميع الظواهر الجوية والطقس وتحتوي على معظم بخار الماء؟',
    questionEn: 'What is the lowest layer of Earth\'s atmosphere, in which virtually all weather phenomena occur and containing most atmospheric water vapor?',
    optionsAr: ['الستراتوسفير (Stratosphere)', 'الميزوسفير (Mesosphere)', 'التروبوسفير (Troposphere)', 'الثيرموسفير (Thermosphere)'],
    optionsEn: ['Stratosphere', 'Mesosphere', 'Troposphere', 'Thermosphere'],
    correct: 2,
    xp: 450
  },
  {
    id: 'd72',
    questionAr: 'ما اسم القارة العظمى (Supercontinent) التي كانت تضم جميع يابسة الأرض قبل حوالي ٣٠٠ مليون سنة وبدأت بالتفكك خلال العصر الجوراسي؟',
    questionEn: 'What supercontinent existed during the late Paleozoic and early Mesozoic eras, assembling virtually all of Earth\'s landmasses before breaking up?',
    optionsAr: ['غندوانا (Gondwana)', 'لوراسيا (Laurasia)', 'رودينيا (Rodinia)', 'بانجيا (Pangea)'],
    optionsEn: ['Gondwana', 'Laurasia', 'Rodinia', 'Pangea'],
    correct: 3,
    xp: 450
  },
  {
    id: 'd73',
    questionAr: 'في عملية البناء الضوئي (Photosynthesis)، ما هي الصبغة الخضراء الموجودة في البلاستيدات الخضراء والتي تمتص ضوء الشمس لتحويل الجلوكوز؟',
    questionEn: 'In photosynthesis, what is the primary green pigment in chloroplasts that absorbs light energy to synthesize glucose molecules?',
    optionsAr: ['الكلوروفيل (Chlorophyll)', 'الكاروتين (Carotene)', 'الزانثوفيل (Xanthophyll)', 'الأنثوسيانين (Anthocyanin)'],
    optionsEn: ['Chlorophyll', 'Carotene', 'Xanthophyll', 'Anthocyanin'],
    correct: 0,
    xp: 400
  },
  {
    id: 'd74',
    questionAr: 'ما هو المقياس اللوغاريتمي الشهير المستخدم لقياس قوة الزلازل بناءً على السعة القصوى للموجات الزلزالية المسجلة بواسطة جهاز السيزموغراف؟',
    questionEn: 'What logarithmic scale is famously used to quantify the magnitude of earthquakes based on the maximum amplitude of seismic waves recorded?',
    optionsAr: ['مقياس ميركالي', 'مقياس ريختر (Richter scale)', 'مقياس بوفورت', 'مقياس كلفن'],
    optionsEn: ['Mercalli scale', 'Richter scale', 'Beaufort scale', 'Kelvin scale'],
    correct: 1,
    xp: 400
  },
  {
    id: 'd75',
    questionAr: 'أي من الأحجار الكريمة الطبيعية يتكون بالكامل من عنصر الكربون المتأصل تحت ضغط وحرارة هائلين في أعماق وشاح الأرض؟',
    questionEn: 'Which natural gemstone is composed entirely of pure carbon allotropes crystallized under extreme pressure and temperature deep within Earth\'s mantle?',
    optionsAr: ['الزمرد (Emerald)', 'الروبي (Ruby)', 'الألماس (Diamond)', 'الياقوت (Sapphire)'],
    optionsEn: ['Emerald', 'Ruby', 'Diamond', 'Sapphire'],
    correct: 2,
    xp: 450
  },
  {
    id: 'd76',
    questionAr: 'ما هو أعمق خندق محيطي معروف على سطح الكرة الأرضية، والذي يقع في غرب المحيط الهادئ ويصل عمقه إلى أكثر من ١١ كيلومتراً؟',
    questionEn: 'What is the deepest oceanic trench on Earth, located in the western Pacific Ocean reaching a maximum known depth of over 11 kilometers?',
    optionsAr: ['خندق بورتوريكو', 'خندق تونغا', 'خندق كوريل', 'خندق ماريانا (Mariana Trench)'],
    optionsEn: ['Puerto Rico Trench', 'Tonga Trench', 'Kuril Trench', 'Mariana Trench'],
    correct: 3,
    xp: 500
  },
  {
    id: 'd77',
    questionAr: 'في علم النبات، ما هي الأوعية الناقلة المسؤولة عن نقل الماء والأملاح المعدنية من الجذور إلى أوراق النبات؟',
    questionEn: 'In botany, what vascular plant tissue is responsible for transporting water and dissolved minerals from the roots upwards to the leaves?',
    optionsAr: ['الخشب (Xylem)', 'اللحاء (Phloem)', 'الكامبيوم (Cambium)', 'البشرة (Epidermis)'],
    optionsEn: ['Xylem', 'Phloem', 'Cambium', 'Epidermis'],
    correct: 0,
    xp: 500
  },
  {
    id: 'd78',
    questionAr: 'ما هي الظاهرة الطبيعية الخلابة التي تظهر كأضواء ملونة متموجة في سماء المناطق القطبية الناتجة عن اصطدام الرياح الشمسية بالمجال المغناطيسي للأرض؟',
    questionEn: 'What spectacular natural phenomenon appears as shimmering colorful light curtains in polar skies caused by solar wind particles interacting with Earth\'s magnetosphere?',
    optionsAr: ['السراب القطبي', 'الشفق القطبي (Aurora Borealis)', 'قوس قزح القمري', 'الشهب المتساقطة'],
    optionsEn: ['Polar Mirage', 'Aurora Borealis / Australis', 'Moonbow', 'Meteor Showers'],
    correct: 1,
    xp: 450
  },
  {
    id: 'd79',
    questionAr: 'ما هو أطول نهر في العالم، والذي يتدفق عبر شمال شرق إفريقيا ويصب في البحر الأبيض المتوسط؟',
    questionEn: 'Which river is widely accepted as the longest in the world, flowing northwards through eastern Africa into the Mediterranean Sea?',
    optionsAr: ['نهر الأمازون (Amazon)', 'نهر المسيسيبي', 'نهر النيل (Nile River)', 'نهر يانغتسي (Yangtze)'],
    optionsEn: ['Amazon River', 'Mississippi River', 'Nile River', 'Yangtze River'],
    correct: 2,
    xp: 400
  },
  {
    id: 'd80',
    questionAr: 'ما هي العملية الجيولوجية الطبيعية التي تؤدي إلى تآكل الصخور والتربة وتفتيتها ونقلها بواسطة الرياح أو المياه أو الجليد؟',
    questionEn: 'What geological process involves the breakdown, wearing away, and transportation of rocks and soil particles by wind, water, or ice?',
    optionsAr: ['التجوية (Weathering)', 'الترسيب (Deposition)', 'التحول (Metamorphism)', 'التعرية (Erosion)'],
    optionsEn: ['Weathering', 'Deposition', 'Metamorphism', 'Erosion'],
    correct: 3,
    xp: 450
  },

  // ─── MONTH 9: CHEMISTRY & MOLECULAR STRUCTURE ───
  {
    id: 'd81',
    questionAr: 'ما هو العنصر الكيميائي الأكثر وفرة في الكون ويعتبر الوقود الأساسي لجميع النجوم عبر الاندماج النووي؟',
    questionEn: 'What is the most abundant chemical element in the universe, serving as the primary nuclear fusion fuel for virtually all stars?',
    optionsAr: ['الهيدروجين (Hydrogen)', 'الهيليوم (Helium)', 'الأكسجين (Oxygen)', 'الكربون (Carbon)'],
    optionsEn: ['Hydrogen', 'Helium', 'Oxygen', 'Carbon'],
    correct: 0,
    xp: 400
  },
  {
    id: 'd82',
    questionAr: 'من هو الكيميائي الروسي الذي وضع الجدول الدوري الحديث للعناصر وتنبأ بدقة بخصائص عناصر لم تكن مكتشفة في عصره؟',
    questionEn: 'Which Russian chemist formulated the Periodic Law and created a far-sighted version of the periodic table of elements, predicting undiscovered properties?',
    optionsAr: ['أنطوان لافوازييه', 'ديميتري مندلييف', 'روبرت بويل', 'ماري كوري'],
    optionsEn: ['Antoine Lavoisier', 'Dmitri Mendeleev', 'Robert Boyle', 'Marie Curie'],
    correct: 1,
    xp: 450
  },
  {
    id: 'd83',
    questionAr: 'ما هي الرابطة الكيميائية القوية التي تتكون عندما تتشارك ذرتان أو أكثر زوجاً أو أكثر من الإلكترونات للوصول إلى حالة الاستقرار؟',
    questionEn: 'What strong chemical bond is formed when two atoms share one or more pairs of valence valence valence valence electrons to achieve chemical stability?',
    optionsAr: ['الرابطة الأيونية (Ionic Bond)', 'الرابطة الهيدروجينية', 'الرابطة التساهمية (Covalent Bond)', 'الرابطة الفلزية'],
    optionsEn: ['Ionic Bond', 'Hydrogen Bond', 'Covalent Bond', 'Metallic Bond'],
    correct: 2,
    xp: 450
  },
  {
    id: 'd84',
    questionAr: 'ما هو الرقم الهيدروجيني (pH) للماء النقي تماماً عند درجة حرارة ٢٥ درجة مئوية والذي يمثل نقطة التعادل التام؟',
    questionEn: 'What is the exact pH value of pure neutral water at 25 degrees Celsius, representing perfect neutrality between acidity and alkalinity?',
    optionsAr: ['٠.٠', '١٤.٠', '٥.٥', '٧.٠'],
    optionsEn: ['0.0', '14.0', '5.5', '7.0'],
    correct: 3,
    xp: 400
  },
  {
    id: 'd85',
    questionAr: 'ما هو عدد أفوجادرو التقريبي، والذي يمثل عدد الجسيمات (ذرات أو جزيئات) الموجودة في مول واحد من أي مادة؟',
    questionEn: 'What is the approximate numerical value of Avogadro\'s constant, representing the number of constituent particles in exactly one mole of substance?',
    optionsAr: ['٦.٠٢٢ × ١٠^٢٣', '٣.١٤١ × ١٠^٨', '١.٦٠٢ × ١٠^-١٩', '٩.٨٠٦ × ١٠^١'],
    optionsEn: ['6.022 × 10^23', '3.141 × 10^8', '1.602 × 10^-19', '9.806 × 10^1'],
    correct: 0,
    xp: 550
  },
  {
    id: 'd86',
    questionAr: 'أي من الغازات النبيلة التالية هو الأخف وزناً ويُستخدم في ملء المناطيد والبالونات لعدم قابليته للاشتعال؟',
    questionEn: 'Which noble gas is second lightest in the periodic table and is non-flammable, making it highly desirable for balloons and blimps?',
    optionsAr: ['النيون (Neon)', 'الهيليوم (Helium)', 'الأرغون (Argon)', 'الكريبثون (Krypton)'],
    optionsEn: ['Neon', 'Helium', 'Argon', 'Krypton'],
    correct: 1,
    xp: 400
  },
  {
    id: 'd87',
    questionAr: 'ما هو الحمض الكيميائي القوي الموجود بشكل طبيعي في المعدة البشرية ويساعد على هضم البروتينات وقتل البكتيريا؟',
    questionEn: 'What strong inorganic acid is secreted naturally within the gastric juices of the human stomach to facilitate digestion and eliminate pathogens?',
    optionsAr: ['حمض الكبريتيك (H2SO4)', 'حمض النيتريك (HNO3)', 'حمض الهيدروكلوريك (HCl)', 'حمض الخليك (Acetic)'],
    optionsEn: ['Sulfuric acid (H2SO4)', 'Nitric acid (HNO3)', 'Hydrochloric acid (HCl)', 'Acetic acid'],
    correct: 2,
    xp: 450
  },
  {
    id: 'd88',
    questionAr: 'ما هي العملية الكيميائية التي تكتسب فيها الذرة أو الأيون إلكتروناً أو أكثر، مما يؤدي إلى انخفاض عدد التأكسد؟',
    questionEn: 'What chemical reaction process involves an atom or molecule gaining electrons, resulting in a decrease in its oxidation state?',
    optionsAr: ['الأكسدة (Oxidation)', 'التحلل المائي (Hydrolysis)', 'البلمرة (Polymerization)', 'الاختزال (Reduction)'],
    optionsEn: ['Oxidation', 'Hydrolysis', 'Polymerization', 'Reduction'],
    correct: 3,
    xp: 500
  },
  {
    id: 'd89',
    questionAr: 'من هي العالمة البولندية-الفرنسية التي فازت بجائزتي نوبل في الفيزياء والكيمياء واكتشفت عنصري الراديوم والبولونيوم المشعين؟',
    questionEn: 'Which pioneering Polish-French scientist won Nobel Prizes in both Physics and Chemistry for discovering radioactive radium and polonium?',
    optionsAr: ['ماري كوري (Marie Curie)', 'روزاليند فرانكلين', 'دوروثي هودجكن', 'ليز مايتنر'],
    optionsEn: ['Marie Curie', 'Rosalind Franklin', 'Dorothy Hodgkin', 'Lise Meitner'],
    correct: 0,
    xp: 450
  },
  {
    id: 'd90',
    questionAr: 'ما هو العنصر الفلزي الوحيد في الجدول الدوري الذي يوجد في الحالة السائلة عند درجة حرارة الغرفة وضغطها القياسي؟',
    questionEn: 'Which metallic element is uniquely liquid at standard room temperature and atmospheric pressure?',
    optionsAr: ['البروم (Bromine)', 'الزئبق (Mercury)', 'الغاليوم (Gallium)', 'السيزيوم (Caesium)'],
    optionsEn: ['Bromine', 'Mercury', 'Gallium', 'Caesium'],
    correct: 1,
    xp: 450
  },

  // ─── MONTH 10: ART HISTORY & ARCHITECTURE ───
  {
    id: 'd91',
    questionAr: 'من هو الفنان والعبقري الإيطالي في عصر النهضة الذي رسم لوحة "الموناليزا" و"العشاء الأخير"؟',
    questionEn: 'Who is the quintessential Italian Renaissance polymath who painted the world-famous "Mona Lisa" and "The Last Supper"?',
    optionsAr: ['مايكل أنجلو', 'رافاييل', 'ليوناردو دا فينشي', 'ساندرو بوتيتشيلي'],
    optionsEn: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Sandro Botticelli'],
    correct: 2,
    xp: 450
  },
  {
    id: 'd92',
    questionAr: 'ما هي الحركة الفنية الحديثة التي أسسها بابلو بيكاسو وجورج براك في أوائل القرن العشرين، والتي تعتمد على تفكيك الأشكال إلى هندسية؟',
    questionEn: 'What avant-garde art movement, pioneered by Pablo Picasso and Georges Braque, involves deconstructing subjects into faceted geometric geometric geometric planes?',
    optionsAr: ['الانطباعية (Impressionism)', 'السريالية (Surrealism)', 'التعبيرية (Expressionism)', 'التكعيبية (Cubism)'],
    optionsEn: ['Impressionism', 'Surrealism', 'Expressionism', 'Cubism'],
    correct: 3,
    xp: 500
  },
  {
    id: 'd93',
    questionAr: 'من هو النحات والرسام الإيطالي الذي نحت تمثال "داود" الخلاب من الرخام ورسم سقف كنيسة سيستينا في الفاتيكان؟',
    questionEn: 'Which Italian master sculptor and painter created the majestic marble statue of "David" and frescoed the ceiling of the Sistine Chapel?',
    optionsAr: ['مايكل أنجلو (Michelangelo)', 'دوناتيلو', 'برنيني', 'تيتيان'],
    optionsEn: ['Michelangelo', 'Donatello', 'Bernini', 'Titian'],
    correct: 0,
    xp: 450
  },
  {
    id: 'd94',
    questionAr: 'ما اسم اللوحة السريالية الخالدة للفنان الإسباني سلفادور دالي التي تُظهر ساعات جيب ذائبة في منظر طبيعي مقفر؟',
    questionEn: 'What is the title of Salvador Dalí\'s iconic surrealist painting depicting melting pocket watches draped over a barren landscape?',
    optionsAr: ['ليلة النجوم', 'إلحاح الذاكرة (The Persistence of Memory)', 'الصرخة', 'غيرنيكا'],
    optionsEn: ['The Starry Night', 'The Persistence of Memory', 'The Scream', 'Guernica'],
    correct: 1,
    xp: 500
  },
  {
    id: 'd95',
    questionAr: 'أي رسام هولندي انطباعي رسم لوحة "ليلة النجوم" (Starry Night) أثناء إقامته في مصحة نفسية في جنوب فرنسا؟',
    questionEn: 'Which Dutch post-impressionist painter masterfully created "The Starry Night" while staying at an asylum in Saint-Rémy-de-Provence?',
    optionsAr: ['رامبرانت', 'يوهانس فيرمير', 'فينسنت فان غوخ', 'كلود مونيه'],
    optionsEn: ['Rembrandt', 'Johannes Vermeer', 'Vincent van Gogh', 'Claude Monet'],
    correct: 2,
    xp: 450
  },
  {
    id: 'd96',
    questionAr: 'ما هو المبنى الإمبراطوري المهيب في الهند الذي بناه الإمبراطور المغولي شاه جهان تخليداً لذكرى زوجته ممتاز محل؟',
    questionEn: 'What breathtaking white marble mausoleum in Agra was commissioned in 1631 by Mughal Emperor Shah Jahan to house the tomb of his favorite wife?',
    optionsAr: ['القلعة الحمراء', 'قطب منار', 'قصر الرياح', 'تاج محل (Taj Mahal)'],
    optionsEn: ['Red Fort', 'Qutb Minar', 'Hawa Mahal', 'Taj Mahal'],
    correct: 3,
    xp: 400
  },
  {
    id: 'd97',
    questionAr: 'من هو المعماري الإسباني العبقري الذي صمم كنيسة ساغرادا فاميليا (Sagrada Família) الشهيرة في برشلونة والتي لا تزال قيد البناء منذ ١٨٨٢؟',
    questionEn: 'Who was the Catalan architectural genius who designed Barcelona\'s unfinished monumental basilica, the Sagrada Família?',
    optionsAr: ['أنطوني غاودي (Antoni Gaudí)', 'سانتياغو كالاترافا', 'فرانك غيهري', 'لو كوربوزييه'],
    optionsEn: ['Antoni Gaudí', 'Santiago Calatrava', 'Frank Gehry', 'Le Corbusier'],
    correct: 0,
    xp: 550
  },
  {
    id: 'd98',
    questionAr: 'ما اسم المدرج الروماني الضخم في روما الذي بُني في عهد سلالة فلافيان وكان يتسع لأكثر من خمسين ألف متفرج لمشاهدة مصارعة الجلادياتور؟',
    questionEn: 'What massive Flavian amphitheater in Rome could hold upwards of 50,000 spectators for gladiatorial battles and dramatic spectacles?',
    optionsAr: ['البانثيون', 'الكولوسيوم (Colosseum)', 'المنتدى الروماني', 'سيركوس ماكسيموس'],
    optionsEn: ['Pantheon', 'Colosseum', 'Roman Forum', 'Circus Maximus'],
    correct: 1,
    xp: 400
  },
  {
    id: 'd99',
    questionAr: 'أي رسام تعبيري نرويجي رسم اللوحة النفسية الشهيرة "الصرخة" (The Scream) التي تجسد القلق الوجودي للإنسان الحديث؟',
    questionEn: 'Which Norwegian expressionist artist painted the haunting masterpiece "The Scream", symbolizing existential angst and psychological terror?',
    optionsAr: ['غوستاف كليمت', 'إيغون شيلي', 'إدفارت مونك (Edvard Munch)', 'فاسيلي كاندينسكي'],
    optionsEn: ['Gustav Klimt', 'Egon Schiele', 'Edvard Munch', 'Wassily Kandinsky'],
    correct: 2,
    xp: 500
  },
  {
    id: 'd100',
    questionAr: 'ما هي الكاتدرائية القوطية الشهيرة في قلب العاصمة الفرنسية باريس التي تعرضت لحريق ضخم أدى إلى انهيار برجها في عام ٢٠١٩؟',
    questionEn: 'What majestic Gothic cathedral situated on the Île de la Cité in Paris suffered a devastating fire in April 2019?',
    optionsAr: ['كاتدرائية شارتر', 'كنيسة الساكري كور', 'كاتدرائية ريمس', 'كاتدرائية نوتردام (Notre-Dame)'],
    optionsEn: ['Chartres Cathedral', 'Sacré-Cœur', 'Reims Cathedral', 'Notre-Dame de Paris'],
    correct: 3,
    xp: 450
  },

  // ─── MONTH 11: LINGUISTICS, MYTHOLOGY & MUSIC ───
  {
    id: 'd101',
    questionAr: 'من هو المؤلف الموسيقي النمساوي العبقري الذي ألف أكثر من ٦٠٠ عمل موسيقي خالد ومات فقيراً في سن الخامسة والثلاثين؟',
    questionEn: 'Who is the prolific Austrian musical prodigy who composed over 600 timeless classical masterworks before his tragic early death at 35?',
    optionsAr: ['فولفغانغ أماديوس موتسارت', 'لودفيغ فان بيتهوفن', 'يوهان سباستيان باخ', 'فريدريك شوبان'],
    optionsEn: ['Wolfgang Amadeus Mozart', 'Ludwig van Beethoven', 'Johann Sebastian Bach', 'Frédéric Chopin'],
    correct: 0,
    xp: 450
  },
  {
    id: 'd102',
    questionAr: 'في الميثولوجيا الإسكندنافية (Norse)، ما هو اسم المطرقة السحرية الخارقة التي يحملها إله الرعد ثور ولا يستطيع رفعها سواه؟',
    questionEn: 'In Norse mythology, what is the name of the magical thunder hammer wielded by Thor, the god of thunder and lightning?',
    optionsAr: ['إكسكاليبر', 'ميولنير (Mjölnir)', 'غونغنير', 'إيجيس'],
    optionsEn: ['Excalibur', 'Mjölnir', 'Gungnir', 'Aegis'],
    correct: 1,
    xp: 450
  },
  {
    id: 'd103',
    questionAr: 'ما هي اللغة القديمة التي كُتبت بها نصوص الفيدا والأوبانيشاد الهندية وتُعتبر اللغة المقدسة في الهندوسية؟',
    questionEn: 'What ancient Indo-Aryan language was used to compose the sacred Hindu texts of the Vedas, Upanishads, and Bhagavad Gita?',
    optionsAr: ['البالية', 'التاميلية', 'السنسكريتية (Sanskrit)', 'الأردية'],
    optionsEn: ['Pali', 'Tamil', 'Sanskrit', 'Urdu'],
    correct: 2,
    xp: 500
  },
  {
    id: 'd104',
    questionAr: 'من هو إله الشمس، الموسيقى، والشعر في الميثولوجيا الإغريقية القديمة، وكان شقيق الإلهة أرتميس التوأم؟',
    questionEn: 'Who was the Olympian god of the sun, light, music, poetry, and prophecy in ancient Greek mythology, twin brother to Artemis?',
    optionsAr: ['زيوس', 'بوسيدون', 'هيرميس', 'أبولو (Apollo)'],
    optionsEn: ['Zeus', 'Poseidon', 'Hermes', 'Apollo'],
    correct: 3,
    xp: 450
  },
  {
    id: 'd105',
    questionAr: 'ما هو حجر البازلت الأسود المكتشف عام ١٧٩٩ والذي كان المفتاح الأساسي لفك رموز اللغة الهيروغليفية المصرية القديمة بواسطة شامبليون؟',
    questionEn: 'What granodiorite stele discovered in 1799 served as the crucial linguistic key enabling Jean-François Champollion to decipher Egyptian hieroglyphs?',
    optionsAr: ['حجر رشيد (Rosetta Stone)', 'مسلة حمورابي', 'نقش بيستون', 'حجر باليرمو'],
    optionsEn: ['Rosetta Stone', 'Code of Hammurabi', 'Behistun Inscription', 'Palermo Stone'],
    correct: 0,
    xp: 450
  },
  {
    id: 'd106',
    questionAr: 'من هو المؤلف الموسيقي الألماني العظيم الذي استمر في تأليف السيمفونيات الخالدة، مثل السيمفونية التاسعة، حتى بعد أن فقد سمعه تماماً؟',
    questionEn: 'Which legendary German composer masterfully conducted and composed monumental symphonies, including his choral Ninth Symphony, despite going completely deaf?',
    optionsAr: ['يوهانس برامز', 'لودفيغ فان بيتهوفن', 'ريتشارد فاغنر', 'فرانز شوبرت'],
    optionsEn: ['Johannes Brahms', 'Ludwig van Beethoven', 'Richard Wagner', 'Franz Schubert'],
    correct: 1,
    xp: 400
  },
  {
    id: 'd107',
    questionAr: 'في الأساطير المصرية القديمة، من هو إله العالم السفلي والحساب والبعث الذي قتله شقيقه ست ومزق جسده قبل أن تجمعه إيزيس؟',
    questionEn: 'In ancient Egyptian mythology, who was the god of the underworld, afterlife, and resurrection, murdered and dismembered by his jealous brother Set?',
    optionsAr: ['حورس', 'أنوبيس', 'أوزوريس (Osiris)', 'رع'],
    optionsEn: ['Horus', 'Anubis', 'Osiris', 'Ra'],
    correct: 2,
    xp: 500
  },
  {
    id: 'd108',
    questionAr: 'ما هي عائلة اللغات التي تنتمي إليها اللغات العربية، العبرية، الأمهرية، والأكادية القديمة؟',
    questionEn: 'To which major language family do Arabic, Hebrew, Amharic, and ancient Akkadian belong?',
    optionsAr: ['اللغات الهندو-أوروبية', 'اللغات الأورالية', 'اللغات التركية', 'اللغات السامية (Semitic)'],
    optionsEn: ['Indo-European languages', 'Uralic languages', 'Turkic languages', 'Semitic languages'],
    correct: 3,
    xp: 450
  },
  {
    id: 'd109',
    questionAr: 'في الميثولوجيا الرومانية، من هما التوأمان الأسطوريان اللذان أرضعتهما ذئبة وأسسا مدينة روما عام ٧٥٣ ق.م؟',
    questionEn: 'In Roman mythology, who were the twin brothers suckled by a she-wolf who went on to found the eternal city of Rome in 753 BC?',
    optionsAr: ['رومولوس وريموس', 'كاستور وبولوكس', 'أخيل وهكتور', 'إينياس وأسكانيوس'],
    optionsEn: ['Romulus and Remus', 'Castor and Pollux', 'Achilles and Hector', 'Aeneas and Ascanius'],
    correct: 0,
    xp: 450
  },
  {
    id: 'd110',
    questionAr: 'ما هي الآلة الموسيقية الوترية النبيلة التي تتكون من ٨٨ مفتاحاً وتم تطويرها في إيطاليا على يد بارتولوميو كريستوفوري في مطلع القرن الثامن عشر؟',
    questionEn: 'What versatile 88-key acoustic keyboard instrument was invented in Italy around 1700 by master instrument maker Bartolomeo Cristofori?',
    optionsAr: ['الهاربسيكورد', 'البيانو (Piano)', 'الأرغن الأنبو بي', 'الكمان (Violin)'],
    optionsEn: ['Harpsichord', 'Piano', 'Pipe Organ', 'Violin'],
    correct: 1,
    xp: 400
  },

  // ─── MONTH 12: DEEP TRIVIA & MODERN INVENTIONS ───
  {
    id: 'd111',
    questionAr: 'ما هي الدولة الأوروبية التي اخترعت تقنية الطباعة بالحروف المعدنية المتحركة على يد يوهانس غوتنبرغ في منتصف القرن الخامس عشر؟',
    questionEn: 'In which European country did Johannes Gutenberg invent the movable-type mechanical printing press around 1440, revolutionizing mass communication?',
    optionsAr: ['إيطاليا', 'فرنسا', 'ألمانيا (Germany)', 'إسبانيا'],
    optionsEn: ['Italy', 'France', 'Germany', 'Spain'],
    correct: 2,
    xp: 450
  },
  {
    id: 'd112',
    questionAr: 'من هو العالم والفيزيائي الصربي-الأمريكي الذي ابتكر نظام التيار الكهربائي المتناوب (AC) واخترع المحرك الحثي ومحولات التردد العالي؟',
    questionEn: 'Which brilliant Serbian-American electrical engineer developed the alternating current (AC) power system and invented the resonant transformer coil?',
    optionsAr: ['توماس إديسون', 'غولييلمو ماركوني', 'ألكسندر غراهام بيل', 'نيكولا تسلا (Nikola Tesla)'],
    optionsEn: ['Thomas Edison', 'Guglielmo Marconi', 'Alexander Graham Bell', 'Nikola Tesla'],
    correct: 3,
    xp: 500
  },
  {
    id: 'd113',
    questionAr: 'ما اسم المضاد الحيوي الأول المكتشف في التاريخ عام ١٩٢٨ بواسطة الطبيب الاسكتلندي ألكسندر فلمنغ من فطر البنسليوم؟',
    questionEn: 'What was the first effective life-saving antibiotic discovered in 1928 by Scottish physician Alexander Fleming from mold cultures?',
    optionsAr: ['البنسلين (Penicillin)', 'الأموكسيسيلين', 'الستريبتومايسين', 'التيتراسايكلين'],
    optionsEn: ['Penicillin', 'Amoxicillin', 'Streptomycin', 'Tetracycline'],
    correct: 0,
    xp: 450
  },
  {
    id: 'd114',
    questionAr: 'في أي ولاية أمريكية تقع مكاتب وادي السيليكون (Silicon Valley) المركزية التي تحتضن كبرى شركات التقنية العالمية مثل أبل وغوغل؟',
    questionEn: 'In which US state is Silicon Valley located, the global hub for technological innovation housing tech behemoths like Apple and Google?',
    optionsAr: ['نيويورك', 'كاليفورنيا (California)', 'تكساس', 'واشنطن'],
    optionsEn: ['New York', 'California', 'Texas', 'Washington'],
    correct: 1,
    xp: 400
  },
  {
    id: 'd115',
    questionAr: 'من هو المخترع الإسكتلندي الذي يُنسب إليه براءة اختراع الهاتف الأول عام ١٨٧٦ وتأسيس شركة AT&T للاتصالات؟',
    questionEn: 'Which Scottish-born inventor is credited with patenting the first practical telephone in 1876 and founding the American Telephone and Telegraph Company?',
    optionsAr: ['أنطونيو ميوتشي', 'صموئيل مورس', 'ألكسندر غراهام بيل', 'هاينريش هيرتز'],
    optionsEn: ['Antonio Meucci', 'Samuel Morse', 'Alexander Graham Bell', 'Heinrich Hertz'],
    correct: 2,
    xp: 450
  },
  {
    id: 'd116',
    questionAr: 'ما هو اللقاح الفيروسي الثوري الذي طوره جوناس سالك عام ١٩٥٣ وقضى فعلياً على وباء شلل الأطفال في معظم أنحاء العالم؟',
    questionEn: 'What revolutionary viral vaccine was successfully developed by Jonas Salk in 1953, effectively eradicating crippling polio epidemics worldwide?',
    optionsAr: ['لقاح الجدري', 'لقاح الحصبة', 'لقاح داء الكلب', 'لقاح شلل الأطفال (Polio Vaccine)'],
    optionsEn: ['Smallpox Vaccine', 'Measles Vaccine', 'Rabies Vaccine', 'Polio Vaccine'],
    correct: 3,
    xp: 500
  },
  {
    id: 'd117',
    questionAr: 'ما هي المادة البلاستيكية الاصطناعية الأولى التي تم تصنيعها بالكامل من مواد كيميائية غير عضوية عام ١٩٠٧ على يد ليو بيكلاند؟',
    questionEn: 'What was the first synthetic plastic made entirely from inorganic synthetic components in 1907 by Belgian chemist Leo Baekeland?',
    optionsAr: ['الباكليت (Bakelite)', 'النايلون (Nylon)', 'البولي إيثيلين', 'السيلوليد'],
    optionsEn: ['Bakelite', 'Nylon', 'Polyethylene', 'Celluloid'],
    correct: 0,
    xp: 600
  },
  {
    id: 'd118',
    questionAr: 'من هما الأخوان الأمريكيان اللذان قاما بأول رحلة طيران ناجحة ومحكومة بطائرة تعمل بمحرك أثقل من الهواء عام ١٩٠٣ في كيتي هوك؟',
    questionEn: 'Who were the two American aviation pioneers who achieved the first sustained, controlled, powered heavier-than-air flight in 1903 at Kitty Hawk?',
    optionsAr: ['الأخوان مونتغولفييه', 'الأخوان رايت (Wright Brothers)', 'الأخوان لوميير', 'الأخوان داسولت'],
    optionsEn: ['Montgolfier Brothers', 'Wright Brothers', 'Lumière Brothers', 'Dassault Brothers'],
    correct: 1,
    xp: 450
  },
  {
    id: 'd119',
    questionAr: 'ما هي التقنية اللاسلكية التي سُميت على اسم الملك الدنماركي في القرن العاشر "هارالد بلوتوث" الذي وحد القبائل الإسكندنافية؟',
    questionEn: 'What wireless data transfer standard is famously named after the 10th-century Danish king who united fragmented Scandinavian tribes?',
    optionsAr: ['الواي فاي (Wi-Fi)', 'الإن إف سي (NFC)', 'البلوتوث (Bluetooth)', 'الجي بي إس (GPS)'],
    optionsEn: ['Wi-Fi', 'NFC', 'Bluetooth', 'GPS'],
    correct: 2,
    xp: 400
  },
  {
    id: 'd120',
    questionAr: 'ما هو الاختراع الفيزيائي الثوري الذي ابتكره جون باردين ووالتر براتين ووليام شوكلي عام ١٩٤٧ ومثل الأساس لجميع الإلكترونيات الحديثة؟',
    questionEn: 'What revolutionary semiconductor device invented in 1947 by John Bardeen, Walter Brattain, and William Shockley serves as the building block of all modern electronics?',
    optionsAr: ['الصمام المفرغ', 'المقاومة الضوئية', 'المكثف السيراميكي', 'الترانزستور (Transistor)'],
    optionsEn: ['Vacuum Tube', 'Photoresistor', 'Ceramic Capacitor', 'Transistor'],
    correct: 3,
    xp: 550
  }
];

const EXTRA_TOPICS = [
  { qAr: "من هو الإمبراطور الروماني الفيلسوف الذي كتب كتاب 'التأملات' أثناء حملاته العسكرية على الحدود الجرمانية؟", qEn: "Which Stoic Roman Emperor penned 'Meditations' while on military campaigns along the Germanic frontier?", oAr: ["ماركوس أوريليوس", "يوليوس قيصر", "نيرون", "تراجان"], oEn: ["Marcus Aurelius", "Julius Caesar", "Nero", "Trajan"] },
  { qAr: "ما هو الكوكب القزم الواقع في حزام كايبر والذي اكتشفه كلايد تومبو عام ١٩٣٠ وكان يُعتبر الكوكب التاسع؟", qEn: "What dwarf planet in the Kuiper belt was discovered by Clyde Tombaugh in 1930 and formerly considered the 9th planet?", oAr: ["بلوتو (Pluto)", "إيريس (Eris)", "سيريس (Ceres)", "ماكيماكي"], oEn: ["Pluto", "Eris", "Ceres", "Makemake"] },
  { qAr: "ما هي المدينة الإيطالية التي انطلقت منها شرارة عصر النهضة الأوروبية وازدهرت تحت حكم عائلة ميديتشي المصرفية؟", qEn: "Which Italian city-state was the birthplace of the Renaissance, flourishing under the patronage of the wealthy Medici family?", oAr: ["فلورنسا (Florence)", "البندقية (Venice)", "روما (Rome)", "ميلانو (Milan)"], oEn: ["Florence", "Venice", "Rome", "Milan"] },
  { qAr: "ما هي المعركة البحرية الشهيرة التي وقعت عام ٣١ ق.م وانتصر فيها أوكتافيان على أسطول مارك أنطوني وكليوباترا؟", qEn: "What decisive naval battle in 31 BC saw Octavian\'s forces crush the combined fleets of Mark Antony and Cleopatra?", oAr: ["معركة أكتيوم (Actium)", "معركة سلاميس", "معركة ليبانتو", "معركة ترافالغار"], oEn: ["Battle of Actium", "Battle of Salamis", "Battle of Lepanto", "Battle of Trafalgar"] },
  { qAr: "من هو العالم المسلم الذي يُعتبر مؤسس علم البصريات الحديث وألف كتاب 'المناظر' وفسر آلية الإبصار بدقة؟", qEn: "Who is the great Muslim polymath hailed as the father of modern optics for his definitive 'Book of Optics'?", oAr: ["ابن الهيثم (Alhazen)", "ابن سينا (Avicenna)", "جابر بن حيان", "الرازي"], oEn: ["Ibn al-Haytham", "Avicenna", "Jabir ibn Hayyan", "Al-Razi"] },
  { qAr: "ما هي النظرية الاقتصادية التي صاغها آدم سميث في كتابه 'ثروة الأمم' عام ١٧٧٦ وتعتمد على مبدأ اليد الخفية والأسواق الحرة؟", qEn: "What foundational economic doctrine, outlined by Adam Smith in 'The Wealth of Nations', relies on the 'invisible hand' of free markets?", oAr: ["الرأسمالية (Capitalism)", "الاشتراكية (Socialism)", "المركنتيلية", "الإقطاعية"], oEn: ["Capitalism", "Socialism", "Mercantilism", "Feudalism"] },
  { qAr: "ما اسم أطول سلسلة جبلية على كوكب الأرض، والتي تمتد على طول الساحل الغربي لقارة أمريكا الجنوبية؟", qEn: "What is the longest continental mountain range in the world, stretching along the entire western coast of South America?", oAr: ["جبال الأنديز (Andes)", "جبال الهيمالايا", "جبال الألب", "جبال روكي"], oEn: ["Andes", "Himalayas", "Alps", "Rocky Mountains"] },
  { qAr: "في أي عام سقطت مدينة القسطنطينية عاصمة الإمبراطورية البيزنطية في يد السلطان العثماني محمد الفاتح؟", qEn: "In what year did the Byzantine capital of Constantinople fall to Ottoman Sultan Mehmed the Conqueror?", oAr: ["١٤٥٣ م", "١٢٥٨ م", "١٠٩٩ م", "١٥١٧ م"], oEn: ["1453 AD", "1258 AD", "1099 AD", "1517 AD"] },
  { qAr: "من هو الرسام الهولندي الباروكي الذي اشتهر بلوحاته المظلمة واستخدامه الدرامي للضوء والظل، ومن أشهر أعماله 'دورية الليل'؟", qEn: "Which Dutch Baroque master is renowned for his dramatic chiaroscuro lighting and profound psychological portraits, such as 'The Night Watch'?", oAr: ["رامبرانت (Rembrandt)", "يوهانس فيرمير", "يان فان إيك", "هيرونيموس بوس"], oEn: ["Rembrandt", "Johannes Vermeer", "Jan van Eyck", "Hieronymus Bosch"] },
  { qAr: "ما هو الغاز الدفيئة الطبيعي الأكثر مساهمة في ظاهرة الاحتباس الحراري وتغير المناخ الناتج عن الأنشطة البشرية الصناعية؟", qEn: "What greenhouse gas is the single greatest anthropogenic contributor to global warming and climate change from fossil fuel combustion?", oAr: ["ثاني أكسيد الكربون (CO2)", "الميثان (CH4)", "أكسيد النيتروز", "مركبات الكربون الكلورية فلورية"], oEn: ["Carbon dioxide (CO2)", "Methane (CH4)", "Nitrous oxide", "Chlorofluorocarbons"] }
];

// Dynamically seed 366 total daily items with varying correct answer placements (0, 1, 2, 3)
for (let i = DAILY_QUESTIONS.length + 1; i <= 366; i++) {
  const seed = EXTRA_TOPICS[i % EXTRA_TOPICS.length];
  const variation = Math.floor(i / EXTRA_TOPICS.length);
  const correctIdx = i % 4;

  const oAr = [...seed.oAr];
  const oEn = [...seed.oEn];

  // Swap index 0 (which is correct in the seed) with correctIdx
  if (correctIdx !== 0) {
    const tempAr = oAr[0]; oAr[0] = oAr[correctIdx]; oAr[correctIdx] = tempAr;
    const tempEn = oEn[0]; oEn[0] = oEn[correctIdx]; oEn[correctIdx] = tempEn;
  }

  DAILY_QUESTIONS.push({
    id: `d${i}`,
    questionAr: seed.qAr.replace('؟', ` (المستوى #${variation + 1})؟`),
    questionEn: seed.qEn.replace('?', ` (Tier #${variation + 1})?`),
    optionsAr: oAr,
    optionsEn: oEn,
    correct: correctIdx,
    xp: 400 + ((i * 25) % 350)
  });
}
