// ============================================================
// i18n.ts — Al-Arif Translation System
// Drop in: lib/i18n.ts
// Usage: import { useT, translations } from '@/lib/i18n'
// ============================================================

import { useFeedbackStore } from '@/store/feedbackStore'
import { useMemo } from 'react'

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

    // ROADMAP NODES
    roadmap_node1_label: 'المتجر العالمي',
    roadmap_node1_desc:  'أدوات تجميلية وحزم حصرية',
    roadmap_node2_label: 'البطولات الكبرى',
    roadmap_node2_desc:  'جوائز نقدية وتصنيف عالمي',
    roadmap_node3_label: 'نظام القبائل',
    roadmap_node3_desc:  'كوّن فريقك وسيطر على اللوحة',
    roadmap_node4_label: 'تطبيق الهاتف',
    roadmap_node4_desc:  'العُريف في جيبك أينما كنت',

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
    side_logout:          'تسجيل الخروج',
    side_billing:         'الاشتراك والخطة',
    side_soon:            'قريباً',
    side_collapse:        'طيّ القائمة',
    side_expand:          'توسيع القائمة',

    // GAME SETUP
    setup_search_ph:      'ابحث عن موضوع أو فئة...',
    setup_sort_admin:     'افتراضي',
    setup_sort_alpha:     'أبجدي',
    setup_sort_popular:   'الأكثر',
    setup_sort_new:       'الأحدث',
    setup_add_team:       'إضافة فريق',
    setup_max_error:      'الحد الأقصى ٦ فئات فقط',

    // DASHBOARD EXTRA
    dash_recent_sessions: 'الجلسات الأخيرة',
    dash_last_4:          'آخر ٤',
    dash_no_sessions:     'لا توجد جلسات بعد',
    dash_start_first:     'ابدأ لعبتك الأولى أعلاه',
    dash_session_label:   'جلسة',
    dash_welcome_toast:   'مرحباً بك في العُريف! 🎉',
    dash_logout_toast:    'تم تسجيل الخروج',
    logout_success:       'تم تسجيل الخروج بنجاح',

    // PROFILE
    prof_identity:        'الهوية الرقمية',
    prof_dna:             'تحليل الأداء الرقمي',
    prof_vault:           'خزينة الأوسمة',
    prof_audit:           'سجل المواجهات',
    prof_mastery:         'إتقان المواضيع',
    prof_clutch:          'معدل الحسم',
    prof_rivals:          'المنافسون اللدودون',
    prof_rank:            'الترتيب العالمي',
    prof_exp:             'نقاط الخبرة',
    prof_accuracy:        'دقة الإجابات',
    prof_streak:          'أطول سلسلة',
    prof_players:         'إجمالي اللاعبين',
    prof_playtime:        'ساعات اللعب',
    prof_back:            'العودة للمنصة',
    prof_founder:         'عضو مؤسس',
    prof_expert:          'خبير معلومات',
    prof_victory:         'انتصار',
    prof_report:          'عرض التقرير',
    prof_no_sessions:     'لا توجد جلسات مسجلة بعد',

    // GAME SETUP
    setup_title:          'تجهيز اللعبة',
    setup_teams:          'الفرق',
    setup_topics:         'المواضيع',
    setup_punishments:    'العقوبات',
    setup_punishments_sub: 'أضف لمسة من التحدي',
    setup_launch:         'انطلاق',
    setup_back:           'رجوع',
    setup_edit:           'تعديل',
    setup_categories:     'فئة',
    setup_preparing:      'جاري تجهيز الأسئلة…',
    setup_wait:           'يرجى الانتظار قليلاً',
    setup_punish_enabled: 'عقوبة مفعّلة',
    setup_punish_disabled: 'معطّلة',
    setup_level_easy:     'سهل',
    setup_level_medium:   'متوسط',
    setup_level_hard:     'صعب',
    setup_mode_wheel:     'عجلة الحظ',
    setup_mode_voted:     'تصويت الخصوم',
    setup_mode_escalating: 'تصاعدي',
    setup_mode_mixed:     'كل الأوضاع',
    setup_mode_wheel_desc: 'دوران عشوائي من القائمة',
    setup_mode_voted_desc: 'الفريق المنافس يختار العقوبة',
    setup_mode_escalating_desc: 'تشتد العقوبة مع كل دور',
    setup_mode_mixed_desc: 'مزيج من الأوضاع السابقة',

    // SETUP EXTRA
    setup_subtitle:       'اختر موضوعاتك وابدأ',
    setup_step_final:     'الخطوة الأخيرة — سمّ جلستك',
    setup_session_ph:     'اسم الجلسة...',
    setup_next_step:      'الخطوة التالية',
    setup_error_cat:      'اختر فئة واحدة على الأقل',
    setup_cats:           'فئات',
    setup_step_cats:      'الفئات',
    setup_select_all:     'تحديد الكل',
    setup_unselect_all:   'إلغاء الجميع',

    // AUTH
    auth_gender:          'الجنس',
    auth_male:            'ذكر',
    auth_female:          'أنثى',
    auth_birthdate:       'تاريخ الميلاد',
    auth_phone:           'رقم الهاتف',
    auth_back:            'رجوع',
    auth_next:            'تالي',
    auth_submit:          'تسجيل',
    auth_username:        'اسم المستخدم',
    auth_email:           'البريد الإلكتروني',
    auth_password:        'كلمة المرور',
    auth_login_title:     'أهلاً بعودتك',
    auth_login_sub:       'سجّل دخولك واستمر رحلتك',
    auth_forgot:          'نسيت كلمة المرور؟',
    auth_login_btn:       'دخول',
    auth_no_account:      'ليس لديك حساب؟',
    auth_register_btn:    'سجّل الآن',
    auth_or_divider:      'أو تابع بـ',
    auth_google:          'الدخول بـ Google',
    auth_have_account:    'لديك حساب بالفعل؟',
    auth_login_link:      'سجّل دخولك',
    auth_reset_title:     'استعادة كلمة المرور',
    auth_reset_sub:       'سنرسل لك رابط الاستعادة على بريدك الإلكتروني',
    auth_reset_btn:       'إرسال رابط الاستعادة',
    auth_reset_sent:      'تم الإرسال! تحقق من بريدك',
    auth_back_login:      'العودة لتسجيل الدخول',
    legal_terms_title:    'الشروط والأحكام',
    legal_privacy_title:  'سياسة الخصوصية',
    legal_last_updated:   'آخر تحديث:',
    legal_back:           'العودة للرئيسية',

    // PRICING
    pricing_title:        'اختر خطتك المثالية',
    pricing_sub:          'ابدأ مجاناً اليوم واستمتع بجلسات تريفيا لا تُنسى مع أصدقائك',
    pricing_back:         'العودة للرئيسية',
    pricing_popular:      'الأكثر شعبية ✨',
    pricing_queries:      'هل لديك استفسارات خاصة؟',
    pricing_contact:      'تواصل معنا الآن',
    pricing_terms:        'تطبق الشروط والأحكام',
    pricing_forever:      'للأبد',
    pricing_monthly:      'شهرياً',
    pricing_free_name:    'مجاني',
    pricing_free_desc:    'ابدأ رحلتك وجرّب المنصة',
    pricing_free_cta:     'ابدأ مجاناً',
    pricing_pro_name:     'برو',
    pricing_pro_desc:     'للمضيفين الجادين والمجموعات النشطة',
    pricing_pro_cta:      'اشترك الآن',
    pricing_team_name:    'فريق',
    pricing_team_desc:    'للشركات والمدارس والفعاليات الكبيرة',
    pricing_team_cta:     'تواصل معنا',

    // FEATURES LIST
    feat_free_1:          'جلسة واحدة مجانية',
    feat_free_2:          'وضع اللعب المحلي',
    feat_free_3:          '٦٠+ سؤال متاح',
    feat_free_4:          'حتى فريقين',
    feat_pro_1:           'جلسات غير محدودة',
    feat_pro_2:           'وضع اللعب المحلي والبعيد',
    feat_pro_3:           '٦٠+ سؤال + إضافة أسئلتك',
    feat_pro_4:           'حتى ٤ فرق',
    feat_pro_5:           'إزالة الإعلانات',
    feat_pro_6:           'تخصيص الثيم واللوغو',
    feat_pro_7:           'دعم أولوي',
    feat_team_1:          'كل مزايا برو',
    feat_team_2:          'حتى ١٠ فرق في الجلسة',
    feat_team_3:          'لوحة إدارة مخصصة',
    feat_team_4:          'تقارير وإحصاءات متقدمة',
    feat_team_5:          'إضافة شعار الشركة',
    feat_team_6:          'API للتكامل مع أنظمتك',
    feat_team_7:          'دعم على مدار الساعة',

    // GAME SESSION
    game_loading:         'جاري التحميل',
    game_footer:          'جميع الحقوق محفوظة',
    game_error_title:     'عذراً، حدث خطأ ما',
    game_error_sub:       'لم نتمكن من تحميل الجلسة. يرجى التحقق من اتصالك أو المحاولة لاحقاً.',
    game_retry:           'إعادة المحاولة',
    game_back_dash:       'العودة للوحة التحكم',
    game_prep_q:          'جاري تحضير الأسئلة الملحمية…',
    game_prep_mascot:     'تجهيز مرافقك الذكي…',
    game_prep_hard:       'تشفير أصعب التحديات…',
    game_prep_wait:       'ثوانٍ قليلة وتفتح الساحة…',
    game_prep_arena:      'تهيئة ساحة المعركة…',
    game_prep_know:       'هل أنت مستعد لإثبات معرفتك؟',
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

    // ROADMAP NODES
    roadmap_node1_label: 'Global Store',
    roadmap_node1_desc:  'Cosmetic items and exclusive bundles',
    roadmap_node2_label: 'Major Tournaments',
    roadmap_node2_desc:  'Cash prizes and global ranking',
    roadmap_node3_label: 'Clans System',
    roadmap_node3_desc:  'Form your team and dominate the board',
    roadmap_node4_label: 'Mobile App',
    roadmap_node4_desc:  'Al-Arif in your pocket wherever you are',

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
    side_logout:          'Logout',
    side_billing:         'Billing & Plan',
    side_soon:            'Soon',
    side_collapse:        'Collapse',
    side_expand:          'Expand',

    // GAME SETUP
    setup_search_ph:      'Search topics or categories...',
    setup_sort_admin:     'Default',
    setup_sort_alpha:     'A-Z',
    setup_sort_popular:   'Popular',
    setup_sort_new:       'Newest',
    setup_add_team:       'Add Team',
    setup_max_error:      'Maximum 6 categories only',

    // DASHBOARD EXTRA
    dash_recent_sessions: 'Recent Sessions',
    dash_last_4:          'Last 4',
    dash_no_sessions:     'No sessions yet',
    dash_start_first:     'Start your first game above',
    dash_session_label:   'Session',
    dash_welcome_toast:   'Welcome to Al-Arif! 🎉',
    dash_logout_toast:    'Logged out',
    logout_success:       'Logged out successfully',

    // PROFILE
    prof_identity:        'Digital Identity',
    prof_dna:             'Performance DNA',
    prof_vault:           'The Trophy Vault',
    prof_audit:           'Match History Audit',
    prof_mastery:         'Subject Mastery',
    prof_clutch:          'Clutch Factor',
    prof_rivals:          'Top Rivals',
    prof_rank:            'Global Rank',
    prof_exp:             'Exp Points',
    prof_accuracy:        'Accuracy',
    prof_streak:          'Best Streak',
    prof_players:         'Total Players',
    prof_playtime:        'Play Time',
    prof_back:            'Back to Hub',
    prof_founder:         'Founder Member',
    prof_expert:          'Knowledge Expert',
    prof_victory:         'Victory',
    prof_report:          'View Report',
    prof_no_sessions:     'No sessions recorded yet',

    // GAME SETUP
    setup_title:          'Game Setup',
    setup_teams:          'Teams',
    setup_topics:         'Topics',
    setup_punishments:    'Punishments',
    setup_punishments_sub: 'Add a touch of challenge',
    setup_launch:         'Launch',
    setup_back:           'Back',
    setup_edit:           'Edit',
    setup_categories:     'Categories',
    setup_preparing:      'Preparing Questions…',
    setup_wait:           'Please wait a moment',
    setup_punish_enabled: 'punishments enabled',
    setup_punish_disabled: 'Disabled',
    setup_level_easy:     'Easy',
    setup_level_medium:   'Medium',
    setup_level_hard:     'Hard',
    setup_mode_wheel:     'Luck Wheel',
    setup_mode_voted:     'Opponent Vote',
    setup_mode_escalating: 'Escalating',
    setup_mode_mixed:     'Mixed Mode',
    setup_mode_wheel_desc: 'Random spin from the list',
    setup_mode_voted_desc: 'Opposing team chooses punishment',
    setup_mode_escalating_desc: 'Punishment intensifies each round',
    setup_mode_mixed_desc: 'A mix of the previous modes',

    // SETUP EXTRA
    setup_subtitle:       'Choose your topics and start',
    setup_step_final:     'Final Step — Name Your Session',
    setup_session_ph:     'Session name...',
    setup_next_step:      'Next Step',
    setup_error_cat:      'Select at least one category',
    setup_cats:           'categories',
    setup_step_cats:      'Categories',
    setup_select_all:     'Select All',
    setup_unselect_all:   'Unselect All',

    // AUTH
    auth_gender:          'Gender',
    auth_male:            'Male',
    auth_female:          'Female',
    auth_birthdate:       'Date of Birth',
    auth_phone:           'Phone Number',
    auth_back:            'Back',
    auth_next:            'Next',
    auth_submit:          'Submit',
    auth_username:        'Username',
    auth_email:           'Email',
    auth_password:        'Password',
    auth_login_title:     'Welcome Back',
    auth_login_sub:       'Sign in to continue your journey',
    auth_forgot:          'Forgot password?',
    auth_login_btn:       'Sign In',
    auth_no_account:      "Don't have an account?",
    auth_register_btn:    'Register Now',
    auth_or_divider:      'Or continue with',
    auth_google:          'Sign in with Google',
    auth_have_account:    'Already have an account?',
    auth_login_link:      'Sign in',
    auth_reset_title:     'Reset Password',
    auth_reset_sub:       "We'll send a reset link to your email",
    auth_reset_btn:       'Send Reset Link',
    auth_reset_sent:      'Sent! Check your inbox',
    auth_back_login:      'Back to Sign In',
    legal_terms_title:    'Terms of Service',
    legal_privacy_title:  'Privacy Policy',
    legal_last_updated:   'Last updated:',
    legal_back:           'Back to Home',


    // PRICING
    pricing_title:        'Choose Your Perfect Plan',
    pricing_sub:          'Start for free today and enjoy unforgettable trivia sessions with friends',
    pricing_back:         'Back to Home',
    pricing_popular:      'Most Popular ✨',
    pricing_queries:      'Have specific questions?',
    pricing_contact:      'Contact us now',
    pricing_terms:        'Terms and conditions apply',
    pricing_forever:      'Forever',
    pricing_monthly:      'Monthly',
    pricing_free_name:    'Free',
    pricing_free_desc:    'Start your journey and try the platform',
    pricing_free_cta:     'Start for Free',
    pricing_pro_name:     'Pro',
    pricing_pro_desc:     'For serious hosts and active groups',
    pricing_pro_cta:      'Subscribe Now',
    pricing_team_name:    'Team',
    pricing_team_desc:    'For companies, schools, and large events',
    pricing_team_cta:     'Contact Us',

    // FEATURES LIST
    feat_free_1:          '1 free session',
    feat_free_2:          'Local play mode',
    feat_free_3:          '60+ questions available',
    feat_free_4:          'Up to 2 teams',
    feat_pro_1:           'Unlimited sessions',
    feat_pro_2:           'Local & Remote play',
    feat_pro_3:           '60+ questions + Add yours',
    feat_pro_4:           'Up to 4 teams',
    feat_pro_5:           'Ad-free experience',
    feat_pro_6:           'Custom theme & logo',
    feat_pro_7:           'Priority support',
    feat_team_1:          'All Pro features',
    feat_team_2:          'Up to 10 teams per session',
    feat_team_3:          'Custom admin panel',
    feat_team_4:          'Advanced reports & stats',
    feat_team_5:          'Add company logo',
    feat_team_6:          'API integration',
    feat_team_7:          '24/7 support',

    // GAME SESSION
    game_loading:         'Loading',
    game_footer:          'All rights reserved',
    game_error_title:     'Oops, something went wrong',
    game_error_sub:       'We couldn\'t load the session. Please check your connection or try again.',
    game_retry:           'Retry',
    game_back_dash:       'Back to Dashboard',
    game_prep_q:          'Preparing epic questions…',
    game_prep_mascot:     'Setting up your smart mascot…',
    game_prep_hard:       'Encrypting the toughest challenges…',
    game_prep_wait:       'Arena opening in a few seconds…',
    game_prep_arena:      'Initializing the battlefield…',
    game_prep_know:       'Are you ready to prove your knowledge?',
  }
} as const

export type TranslationKey = keyof typeof translations['AR']

export function createTranslator(lang: Lang) {
  return function t(key: TranslationKey): string {
    return translations[lang][key] ?? translations['AR'][key] ?? key
  }
}

/**
 * useTranslator — reactive hook version of createTranslator.
 * Automatically re-renders when lang changes in the store.
 *
 * Usage:
 *   const t = useTranslator()
 *   return <p>{t('hero_line1')}</p>
 */
export function useTranslator() {
  const lang = useFeedbackStore(state => state.lang)
  return useMemo(() => createTranslator(lang), [lang])
}
