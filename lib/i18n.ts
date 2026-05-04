// ============================================================
// i18n.ts — Al-Arif Translation System
// Drop in: lib/i18n.ts
// Usage: import { useT, translations } from '@/lib/i18n'
// ============================================================

export type Lang = 'AR' | 'EN'

export const translations = {
  AR: {
    // NAV
    nav_login:        'دخول',
    nav_register:     'ابدأ الآن 🚀',
    nav_join:         'انضم لجلسة',

    // HERO
    hero_badge:       'منصة ترفيهية من الجيل القادم',
    hero_line1:       'العب.',
    hero_line2:       'تحدَّ.',
    hero_line3:       'انتصر.',
    hero_sub:         'منصة تفاعلية تجمع بين المعرفة والتحدي والمتعة.',
    hero_cta_main:    'ابدأ اللعب الآن 🚀',
    hero_cta_join:    'انضم لجلسة',
    hero_tagline:     'هنا تصنع الأساطير..',
    hero_tagline_bold:'صراع الجبابرة',
    hero_tagline_end: 'يشتعل بذكاء العرب',
    hero_live:        'تحديات حية لا تتوقف..',

    // FEATURES
    features_sub:     'لماذا العُريف',
    features_title:   'بيتٌ يجمعنا، و',
    features_title2:  'معرفةٌ تتحدانا',
    feat1_title:      'تحديثات مستمرة',
    feat1_desc:       'نضيف محتوى وتحديات جديدة باستمرار.',
    feat2_title:      'قاعدة معرفة ضخمة',
    feat2_desc:       'أكثر من 1000 سؤال في مختلف المجالات.',
    feat3_title:      'تجربة تنافسية',
    feat3_desc:       'تحدَّ أصدقاءك وأقاربك ونافس على الأفضل.',
    feat4_title:      'مكافآت وجوائز',
    feat4_desc:       'اربح النقاط وتبادلها بمكافآت حصرية.',
    coming_soon:      'قريباً',

    // VIDEO
    video_title:      'شاهد كيف تبدأ',
    video_sub:        'اكتشف أسرار العُريف في دقيقة واحدة وكيف تصبح بطلاً في اللعبة',

    // COMMENTS
    comments_title:   'آراء المجتمع',
    comments_sub:     'صوت اللاعبين حاضر دائمًا—تفاعل حيّ لحظة بلحظة',
    comments_ph:      'شاركنا تجربتك...',
    comments_send:    'إرسال',

    // ROADMAP
    roadmap_sub:      'الرؤية الاستراتيجية',
    roadmap_title:    'جوهر التطوير:',
    roadmap_title2:   'مسيرة العُريف',
    roadmap_done:     'تم الإنجاز بنجاح',

    // CTA
    cta_title:        'جاهز للتحدي؟',
    cta_sub:          'انضم الآن وابدأ رحلتك نحو القمة!',
    cta_main:         '🚀 ابدأ اللعب الآن',
    cta_join:         '🎮 انضم لجلسة',

    // QUIZ
    quiz_scanning:    'جاري تحليل عبقريتك... 🔍',
    quiz_correct:     'ذكاء استثنائي! ✨',
    quiz_wrong:       'المعرفة هي القوة الحقيقية! 🧠',
    quiz_redirect:    'جاري نقلك إلى ساحة المنافسة...',
    quiz_done_title:  'المعركة تبدأ من الأعلى!',
    quiz_done_sub:    'سجل دخولك أو انضم برمز اللعبة الآن',

    // FOOTER
    footer_social:    'التواصل',
    footer_index:     'الفهرس',
    footer_legal:     'قانوني',

    // SOCIALS
    social_facebook:  'فيسبوك',
    social_youtube:   'يوتيوب',
    social_instagram: 'إنستغرام',
    social_twitter:   'إكس (تويتر)',
    social_title:     'تواصل معنا',
    social_sub:       'تابع آخر الأخبار والتحديات على منصاتنا',
    social_close:     'إغلاق',

    // PLANET ORBITALS
    orb_knowledge:    'المعرفة',
    orb_challenge:    'التحدي',
    orb_achievement:  'الإنجاز',
    orb_play:         'اللعب',

    // ACCOUNTS
    accounts_title:   'حساباتك النشطة',
    accounts_ready:   'جاهز للتحدي',
    accounts_add:     'إضافة حساب جديد +',

    // LANG
    lang_ar:          'العربية',
    lang_en:          'English',

    // DASHBOARD
    dash_welcome:         'مرحباً',
    dash_onboarding:      'أنت الآن في قلب العُريف. حيث تُولد الأساطير وتُكتب قصص النصر. جهّز نفسك للمعركة.',
    dash_onboarding_btn:  'أنا جاهز — لنبدأ! 🚀',
    dash_ready:           'ساحة المعركة بانتظارك. اختر وضع اللعب وابدأ.',
    dash_search_ph:       'ابحث عن لعبة أو تحدٍّ...',
    dash_level:           'المستوى',
    dash_streak:          'سلسلة انتصارات',
    dash_coins:           'العملات',
    dash_local_title:     'لعب محلي',
    dash_local_desc:      'العب مع أصدقائك ومن حولك في نفس المكان. حماس حقيقي، منافسة مباشرة.',
    dash_remote_title:    'لعب عن بُعد',
    dash_remote_desc:     'تحدَّ منافسين من جميع أنحاء الوطن العربي عبر الإنترنت.',

    // SIDEBAR
    side_home:            'الرئيسية',
    side_profile:         'ملفي الشخصي',
    side_friends:         'الأصدقاء',
    side_achievements:    'الإنجازات',
    side_daily:           'التحدي اليومي',
    side_store:           'المتجر',
    side_settings:        'الإعدادات',
    side_soon:            'قريباً',
    side_collapse:        'طيّ القائمة',
    side_expand:          'توسيع القائمة',
    side_logout:          'تسجيل الخروج',

    // GAME SETUP
    setup_search_ph:      'ابحث عن موضوع أو فئة...',
    setup_sort_admin:     'افتراضي',
    setup_sort_alpha:     'أبجدي',
    setup_sort_popular:   'الأكثر',
    setup_sort_new:       'الأحدث',
    setup_launch:         'إطلاق اللعبة',
    setup_step_final:     'الخطوة الأخيرة — سمّ جلستك',
    setup_session_ph:     'اسم الجلسة...',
    setup_add_team:       'إضافة فريق',
    setup_max_error:      'الحد الأقصى ٦ فئات فقط',
    setup_title:          'إعداد اللعبة',
    setup_subtitle:       'اختر المواضيع والفئات لبدء التحدي',
    setup_next_step:      'الخطوة التالية',
    setup_cats:           'فئات',
    setup_topic_label:    'الموضوع الحالي',
    setup_topic_desc:     'استكشف الفئات المتاحة تحت هذا الموضوع وقم باختيار ما يناسب تحديك.',
    setup_step_cats:      'اختر الفئات (بحد أقصى ٦)',
    setup_unselect_all:   'إلغاء الكل',
    setup_select_all:     'تحديد الكل',
    setup_explore:        'استكشاف',
    setup_error_cat:      'يرجى اختيار فئة واحدة على الأقل',
    setup_success:        'تم إعداد الجلسة بنجاح!',
    setup_selected:       'مختارة',

    // GAME PREP LOADING
    game_prep_q:          'جاري تحميل الأسئلة...',
    game_prep_mascot:     'أبو العُريف يستعد...',
    game_prep_hard:       'الأسئلة الصعبة على الطريق!',
    game_prep_wait:       'لحظات وتبدأ المعركة...',
    game_prep_arena:      'ساحة المعركة جاهزة!',
    game_prep_know:       'هل أنت جاهز؟',
    game_loading:         'جاري التحميل...',
    game_footer:          'أبو العُريف',
    game_error_title:     'خطأ في تحميل الجلسة',
    game_error_sub:       'لم نتمكن من العثور على الجلسة المطلوبة. تأكد من صحة الرابط.',
    game_retry:           'إعادة المحاولة',
    game_back_dash:       'العودة للوحة الإدارة',
  },

  EN: {
    // NAV
    nav_login:        'Login',
    nav_register:     'Start Now 🚀',
    nav_join:         'Join a Game',

    // HERO
    hero_badge:       'Next-Generation Entertainment Platform',
    hero_line1:       'Play.',
    hero_line2:       'Challenge.',
    hero_line3:       'Win.',
    hero_sub:         'An interactive platform that combines knowledge, challenge, and fun.',
    hero_cta_main:    'Start Playing Now 🚀',
    hero_cta_join:    'Join a Session',
    hero_tagline:     'Legends are made here..',
    hero_tagline_bold:'Battle of Giants',
    hero_tagline_end: 'powered by Arab brilliance',
    hero_live:        'Live challenges never stop..',

    // FEATURES
    features_sub:     'Why Al-Arif',
    features_title:   'A home that unites us, and',
    features_title2:  'knowledge that challenges us',
    feat1_title:      'Constant Updates',
    feat1_desc:       'We continuously add new content and challenges.',
    feat2_title:      'Vast Knowledge Base',
    feat2_desc:       'Over 1000 questions across various fields.',
    feat3_title:      'Competitive Experience',
    feat3_desc:       'Challenge your friends and compete for the best.',
    feat4_title:      'Rewards & Prizes',
    feat4_desc:       'Earn points and exchange them for exclusive rewards.',
    coming_soon:      'Soon',

    // VIDEO
    video_title:      'See How It Starts',
    video_sub:        'Discover the secrets of Al-Arif in one minute and how to become a champion',

    // COMMENTS
    comments_title:   'Community Voices',
    comments_sub:     'Player voices always present — live interaction every moment',
    comments_ph:      'Share your experience...',
    comments_send:    'Send',

    // ROADMAP
    roadmap_sub:      'Strategic Vision',
    roadmap_title:    'The Core of Development:',
    roadmap_title2:   'Al-Arif Journey',
    roadmap_done:     'Completed Successfully',

    // CTA
    cta_title:        'Ready for the Challenge?',
    cta_sub:          'Join now and start your journey to the top!',
    cta_main:         '🚀 Start Playing Now',
    cta_join:         '🎮 Join a Session',

    // QUIZ
    quiz_scanning:    'Analyzing your genius... 🔍',
    quiz_correct:     'Exceptional intelligence! ✨',
    quiz_wrong:       'Knowledge is real power! 🧠',
    quiz_redirect:    'Taking you to the arena...',
    quiz_done_title:  'The battle starts at the top!',
    quiz_done_sub:    'Log in or join with a game code now',

    // FOOTER
    footer_social:    'Social',
    footer_index:     'Index',
    footer_legal:     'Legal',

    // SOCIALS
    social_facebook:  'Facebook',
    social_youtube:   'YouTube',
    social_instagram: 'Instagram',
    social_twitter:   'X (Twitter)',
    social_title:     'Contact Us',
    social_sub:       'Follow the latest news and challenges on our platforms',
    social_close:     'Close',

    // PLANET ORBITALS
    orb_knowledge:    'Knowledge',
    orb_challenge:    'Challenge',
    orb_achievement:  'Achievement',
    orb_play:         'Play',

    // ACCOUNTS
    accounts_title:   'Your Active Accounts',
    accounts_ready:   'Ready to compete',
    accounts_add:     'Add new account +',

    // LANG
    lang_ar:          'العربية',
    lang_en:          'English',

    // DASHBOARD
    dash_welcome:         'Welcome',
    dash_onboarding:      'You are now at the heart of Al-Arif. Where legends are born and victory stories are written. Prepare yourself for battle.',
    dash_onboarding_btn:  'I\'m Ready — Let\'s Go! 🚀',
    dash_ready:           'The arena awaits. Choose your game mode and start.',
    dash_search_ph:       'Search for a game or challenge...',
    dash_level:           'Level',
    dash_streak:          'Win Streak',
    dash_coins:           'Coins',
    dash_local_title:     'Local Play',
    dash_local_desc:      'Play with friends and people around you in the same place. Real excitement, direct competition.',
    dash_remote_title:    'Remote Play',
    dash_remote_desc:     'Challenge opponents from all over the Arab world online.',

    // SIDEBAR
    side_home:            'Home',
    side_profile:         'My Profile',
    side_friends:         'Friends',
    side_achievements:    'Achievements',
    side_daily:           'Daily Challenge',
    side_store:           'Store',
    side_settings:        'Settings',
    side_soon:            'Coming Soon',
    side_collapse:        'Collapse',
    side_expand:          'Expand',
    side_logout:          'Logout',

    // GAME SETUP
    setup_search_ph:      'Search topics or categories...',
    setup_sort_admin:     'Default',
    setup_sort_alpha:     'A-Z',
    setup_sort_popular:   'Popular',
    setup_sort_new:       'Newest',
    setup_launch:         'Launch Game',
    setup_step_final:     'Final Step — Name Your Session',
    setup_session_ph:     'Session name...',
    setup_add_team:       'Add Team',
    setup_max_error:      'Maximum 6 categories only',
    setup_title:          'Game Setup',
    setup_subtitle:       'Choose topics and categories to start the challenge',
    setup_next_step:      'Next Step',
    setup_cats:           'categories',
    setup_topic_label:    'Current Topic',
    setup_topic_desc:     'Explore available categories under this topic and choose what fits your challenge.',
    setup_step_cats:      'Choose Categories (Max 6)',
    setup_unselect_all:   'Deselect All',
    setup_select_all:     'Select All',
    setup_explore:        'Explore',
    setup_error_cat:      'Please select at least one category',
    setup_success:        'Session setup successfully!',
    setup_selected:       'Selected',

    // GAME PREP LOADING
    game_prep_q:          'Loading questions...',
    game_prep_mascot:     'Abu Al-Areef is getting ready...',
    game_prep_hard:       'Hard questions incoming!',
    game_prep_wait:       'The battle begins in moments...',
    game_prep_arena:      'The arena is ready!',
    game_prep_know:       'Are you ready?',
    game_loading:         'Loading...',
    game_footer:          'Abu Al-Areef',
    game_error_title:     'Error Loading Session',
    game_error_sub:       'We could not find the requested session. Please check the link.',
    game_retry:           'Retry',
    game_back_dash:       'Back to Dashboard',
  }
} as const

export type TranslationKey = keyof typeof translations['AR']

// Hook — reads lang from Zustand store
// Usage: const t = useT()  →  t('hero_line1')
export function createTranslator(lang: Lang) {
  return function t(key: TranslationKey): string {
    return translations[lang][key] ?? translations['AR'][key] ?? key
  }
}
