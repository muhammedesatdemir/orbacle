import type { Locale } from '../types/contract';

export type SafetyClass =
  | 'self_harm'
  | 'violence'
  | 'illegal'
  | 'medical'
  | 'financial'
  | 'legal';

export interface SafetyResult {
  blocked: boolean;
  // The class that triggered the block (logged as readings.safety_flag).
  flag?: SafetyClass;
}

// Phase 3 keyword pre-filter. Intentionally small and high-signal; the goal is
// to catch the most serious cases before any reading is produced, not to be a
// full classifier. Multilingual coverage focuses on self-harm/suicide first.
// Matched as lowercase substrings (CJK/Arabic have no case — substring is fine).
const KEYWORDS: Record<SafetyClass, string[]> = {
  self_harm: [
    // en
    'suicide', 'kill myself', 'end my life', 'want to die', 'self harm', 'self-harm', 'cut myself',
    // tr
    'intihar', 'kendimi öldür', 'yaşamak istemiyorum', 'canıma kıy', 'kendime zarar',
    // es
    'suicidio', 'matarme', 'quitarme la vida', 'no quiero vivir',
    // pt
    'suicídio', 'me matar', 'tirar minha vida', 'não quero viver',
    // de
    'selbstmord', 'mich umbringen', 'nicht mehr leben',
    // fr
    'suicide', 'me tuer', 'envie de mourir',
    // id
    'bunuh diri', 'mengakhiri hidup',
    // hi
    'आत्महत्या', 'खुद को मार',
    // ar
    'انتحار', 'أقتل نفسي', 'أنهي حياتي',
    // ja
    '自殺', '死にたい', '自傷',
  ],
  violence: [
    'kill him', 'kill her', 'kill them', 'hurt someone', 'attack', 'şiddet', 'öldür', 'saldır',
    'matar a', 'matá-lo', 'töten', 'tuer quelqu', 'membunuh', 'हत्या', 'قتل', '殺す',
  ],
  illegal: [
    'how to steal', 'make a bomb', 'buy drugs', 'launder money', 'uyuşturucu', 'bomba yap', 'çal ',
    'roubar', 'robar', 'drogen kaufen', 'fabriquer une bombe', 'mencuri', 'चोरी', 'مخدرات', '麻薬',
  ],
  medical: [
    'stop my medication', 'overdose', 'should i take pills', 'ilacımı bırak', 'doz aşımı',
    'dejar mi medicación', 'parar meu remédio', 'medikamente absetzen', 'arrêter mon traitement',
    'berhenti minum obat', 'दवा बंद', 'أوقف دوائي', '薬をやめ',
  ],
  financial: [
    'all my savings', 'all my money', 'take a huge loan', 'tüm paramı', 'tüm birikimimi',
    'todos mis ahorros', 'todo meu dinheiro', 'mein ganzes geld', 'tout mon argent',
    'semua tabungan', 'सारी बचत', 'كل مدخراتي', '全財産',
  ],
  legal: [
    'sue', 'lawsuit', 'press charges', 'dava aç', 'şikayet et', 'demandar', 'processar',
    'klage', 'porter plainte', 'menuntut', 'मुकदमा', 'رفع دعوى', '訴訟',
  ],
};

// Pre-filter the user's question + whisper. Returns blocked + the triggering
// class. Order matters: self_harm is checked first so it always wins.
const ORDER: SafetyClass[] = ['self_harm', 'violence', 'illegal', 'medical', 'financial', 'legal'];

export function prefilter(question: string, whisper = ''): SafetyResult {
  const text = `${question} ${whisper}`.toLowerCase();
  for (const cls of ORDER) {
    for (const kw of KEYWORDS[cls]) {
      if (text.includes(kw)) return { blocked: true, flag: cls };
    }
  }
  return { blocked: false };
}

// Safe, non-technical redirect message shown when a reading is blocked. No
// "AI/model" wording; gently points to real human support.
const SAFE_MESSAGES: Record<Locale, string> = {
  tr: 'Bu konu ciddi ve önemli görünüyor. Küre burada yol gösteremez; lütfen güvendiğin birine ya da bir uzmana danış.',
  en: 'This feels serious and important. The orb cannot guide you here — please reach out to someone you trust or a professional.',
  'es-LA': 'Esto se siente serio e importante. El orbe no puede guiarte aquí; por favor habla con alguien de confianza o un profesional.',
  'pt-BR': 'Isto parece sério e importante. O orbe não pode te guiar aqui; por favor procure alguém de confiança ou um profissional.',
  'hi-IN': 'यह गंभीर और महत्वपूर्ण लगता है। गोला यहाँ राह नहीं दिखा सकता; कृपया किसी भरोसेमंद व्यक्ति या विशेषज्ञ से बात करें।',
  'id-ID': 'Ini terasa serius dan penting. Bola tidak bisa menuntunmu di sini; tolong hubungi orang yang kamu percaya atau seorang profesional.',
  ar: 'يبدو هذا الأمر جادًا ومهمًا. لا يمكن للكرة أن ترشدك هنا؛ من فضلك تحدث إلى شخص تثق به أو إلى مختص.',
  'de-DE': 'Das wirkt ernst und wichtig. Der Orb kann dich hier nicht führen — bitte wende dich an jemanden, dem du vertraust, oder an eine Fachperson.',
  'fr-FR': 'Cela semble sérieux et important. La boule ne peut pas te guider ici — parle à une personne de confiance ou à un professionnel.',
  'ja-JP': 'これは深刻で大切なことのようです。玉はここでは導けません。信頼できる人や専門家に相談してください。',
};

export function safeMessageFor(locale: Locale): string {
  return SAFE_MESSAGES[locale] ?? SAFE_MESSAGES.en;
}
