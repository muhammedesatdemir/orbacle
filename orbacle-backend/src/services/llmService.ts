import type { Env } from '../types/env';
import type { ReadingType, Locale } from '../types/contract';
import type { AppConfig } from './configService';
import { ApiError } from '../lib/errors';

export interface LlmInput {
  tier: ReadingType;
  prompt: string;
  locale: Locale;
  maxTokens: number;
}

export interface LlmResult {
  text: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Adapter boundary for text generation. Phase 3 always uses the MOCK path
// (useMockLLM=true) — no OpenAI SDK, no API key, no network. The real provider
// is wired in Phase 4 behind this same interface, so routes don't change.
export async function generateReading(
  env: Env,
  cfg: AppConfig,
  input: LlmInput,
): Promise<LlmResult> {
  const useMock = cfg.useMockLLM || env.USE_MOCK_LLM === 'true' || !env.OPENAI_API_KEY;
  if (useMock) {
    return mockGenerate(input);
  }
  // Phase 4: call the real provider here, using env.OPENAI_API_KEY server-side
  // only. Kept as a guarded throw so an accidental flip can't silently no-op.
  throw new ApiError('UPSTREAM_ERROR', { message: 'Live LLM not enabled in this build.' });
}

// Localized placeholder bodies. Mirrors the mobile Phase 2 mock tone so the
// backend mock is consistent with what users already see. No "AI" wording.
const MOCK_KAHIN: Record<Locale, string> = {
  tr: 'Kürenin sana fısıldadığı işaret, acele bir karardan çok bir duraklamayı anlatıyor olabilir. Sorunun içinde bir beklenti ve biraz da belirsizlik var; ama küre doğrudan bir hüküm vermek yerine önce içindeki sesin durulmasını işaret ediyor. Bugün kendine şunu sor: bu adımı gerçekten istediğin için mi atacaksın, yoksa bir işaret beklediğin için mi?',
  en: 'The sign the orb whispers speaks of a pause rather than a hurried decision. Within your question there is expectation and a little uncertainty; yet instead of a verdict, the orb points first to the quieting of the voice inside you. Ask yourself today: are you taking this step because you truly want to, or because you are waiting for a sign?',
  'es-LA': 'La señal que el orbe susurra habla de una pausa más que de una decisión apresurada. En tu pregunta hay expectativa y algo de incertidumbre; pero en vez de un veredicto, el orbe señala primero el aquietarse de tu voz interior. Pregúntate hoy: ¿das este paso porque de verdad lo deseas, o porque esperas una señal?',
  'pt-BR': 'O sinal que o orbe sussurra fala mais de uma pausa do que de uma decisão apressada. Na sua pergunta há expectativa e um pouco de incerteza; mas, em vez de um veredito, o orbe aponta primeiro para o aquietar da sua voz interior. Pergunte-se hoje: você dá este passo porque realmente quer, ou porque espera um sinal?',
  'hi-IN': 'गोला जो संकेत फुसफुसाता है, वह जल्दबाज़ फैसले से अधिक एक ठहराव की बात कहता है। तुम्हारे सवाल में एक उम्मीद और थोड़ी अनिश्चितता है; पर कोई फैसला सुनाने के बजाय गोला पहले तुम्हारे भीतर की आवाज़ के शांत होने की ओर इशारा करता है। आज खुद से पूछो: यह कदम तुम सचमुच चाहते हो, या किसी संकेत की प्रतीक्षा में?',
  'id-ID': 'Tanda yang dibisikkan orb berbicara tentang jeda, bukan keputusan terburu-buru. Dalam pertanyaanmu ada harapan dan sedikit ketidakpastian; tetapi alih-alih sebuah vonis, orb menunjuk dahulu pada menenangnya suara di dalam dirimu. Tanyakan pada dirimu hari ini: kau mengambil langkah ini karena sungguh menginginkannya, atau karena menunggu sebuah tanda?',
  ar: 'العلامة التي تهمسها الكرة تتحدث عن توقّف أكثر منها قرارًا متسرّعًا. في سؤالك انتظار وشيء من الغموض؛ لكن بدلًا من حكم، تشير الكرة أولًا إلى هدوء الصوت في داخلك. اسأل نفسك اليوم: هل تخطو هذه الخطوة لأنك تريدها حقًا، أم لأنك تنتظر إشارة؟',
  'de-DE': 'Das Zeichen, das der Orb zuflüstert, spricht eher von einem Innehalten als von einer übereilten Entscheidung. In deiner Frage liegt Erwartung und ein wenig Ungewissheit; doch statt eines Urteils weist der Orb zuerst auf das Beruhigen der Stimme in dir. Frage dich heute: Gehst du diesen Schritt, weil du es wirklich willst, oder weil du auf ein Zeichen wartest?',
  'fr-FR': "Le signe que la boule murmure parle d'une pause plus que d'une décision hâtive. Dans ta question il y a de l'attente et un peu d'incertitude ; mais au lieu d'un verdict, la boule indique d'abord l'apaisement de la voix en toi. Demande-toi aujourd'hui : fais-tu ce pas parce que tu le veux vraiment, ou parce que tu attends un signe ?",
  'ja-JP': 'オーブがささやく兆しは、急いだ決断よりも立ち止まりを語っています。あなたの問いの中には期待と少しの不確かさがある。けれど断を下す代わりに、オーブはまずあなたの内なる声が静まることを示します。今日、自分に問うてみて：この一歩は本当に望むからか、それとも合図を待っているからか。',
};

const MOCK_DEEP: Record<Locale, string> = {
  tr: 'Görünen işaret: kürenin yüzeyinde, sorunun etrafında sakin ama kararsız bir akıntı dönüyor. Henüz bir yöne kesin biçimde dökülmemiş; bu da çoğu zaman cevabın değil, anın olgunlaşmadığını söyler.\n\nİçindeki asıl soru: yüzeydeki sorunun altında, belki de güvenle ya da bir kaybın eşiğiyle ilgili bir şey saklı. Kendine sorduğun şey, gerçekte sormaktan çekindiğin şeyin gölgesi olabilir.\n\nDikkat etmen gereken: acele, çoğu zaman senin olmayan bir korkudan beslenir. Bir karara koşmadan önce, o telaşın nereden geldiğine bak.\n\nOlası yön: kapılardan biri zorlamadan aralanıyorsa, belki de yürünmesi gereken yol odur — ama bunu bir emir gibi değil, bir davet gibi düşün.\n\nBugün için küçük bir farkındalık adımı: tek bir cümle yaz — "Ben aslında neyin olmasını istiyorum?" Cevabı hemen bulmaya çalışma; sadece soruyu içinde taşı.',
  en: 'The visible sign: across the orb a calm but undecided current circles your question. It has not yet poured into one direction — which often means not the answer, but the moment, is still ripening.\n\nThe real question beneath: under the surface question, something hidden may have more to do with trust, or with standing at the edge of a loss. What you ask may be the shadow of what you are afraid to ask.\n\nWhat to be mindful of: haste is often fed by a fear that is not yours. Before rushing toward a decision, look at where that urgency comes from.\n\nA possible direction: if one of the doors opens without force, perhaps that is the path — but hold it as an invitation, not a command.\n\nA small step of awareness for today: write a single sentence — "What is it I truly want to happen?" Do not try to find the answer at once; just carry the question within you.',
  'es-LA': 'La señal visible: por el orbe gira una corriente serena pero indecisa alrededor de tu pregunta. Aún no se ha volcado en una dirección — lo que a menudo dice que no la respuesta, sino el momento, todavía madura.\n\nLa verdadera pregunta debajo: bajo la superficie, algo oculto quizá tenga que ver con la confianza, o con el borde de una pérdida. Lo que te preguntas puede ser la sombra de lo que temes preguntar.\n\nLo que debes cuidar: la prisa suele alimentarse de un miedo que no es tuyo. Antes de correr hacia una decisión, mira de dónde viene esa urgencia.\n\nUn rumbo posible: si una puerta se abre sin forzarla, quizá ese sea el camino — pero tómalo como invitación, no como orden.\n\nUn pequeño paso de conciencia para hoy: escribe una sola frase — "¿Qué quiero que ocurra en realidad?" No busques la respuesta de inmediato; solo lleva la pregunta dentro de ti.',
  'pt-BR': 'O sinal visível: pelo orbe gira uma corrente serena, mas indecisa, em torno da sua pergunta. Ainda não se inclinou para uma direção — o que muitas vezes diz que não a resposta, mas o momento, ainda amadurece.\n\nA verdadeira pergunta por baixo: sob a superfície, algo escondido talvez tenha a ver com confiança, ou com a borda de uma perda. O que você pergunta pode ser a sombra do que teme perguntar.\n\nO que cuidar: a pressa costuma se alimentar de um medo que não é seu. Antes de correr para uma decisão, olhe de onde vem essa urgência.\n\nUm rumo possível: se uma porta se abre sem força, talvez seja o caminho — mas tome como um convite, não uma ordem.\n\nUm pequeno passo de consciência para hoje: escreva uma única frase — "O que eu realmente quero que aconteça?" Não tente achar a resposta de imediato; apenas carregue a pergunta dentro de você.',
  'hi-IN': 'दिखता संकेत: गोले पर तुम्हारे सवाल के चारों ओर एक शांत पर अनिश्चित धारा घूमती है। वह अभी किसी दिशा में नहीं बही — जो अक्सर कहता है कि जवाब नहीं, बल्कि समय अब भी पक रहा है।\n\nभीतर का असली सवाल: सतह के नीचे छिपा कुछ शायद भरोसे से, या किसी हानि के कगार से जुड़ा है। जो तुम पूछते हो, वह उस चीज़ की छाया हो सकती है जिसे पूछने से डरते हो।\n\nध्यान देने योग्य: जल्दबाज़ी अक्सर उस डर से पलती है जो तुम्हारा नहीं। किसी फैसले की ओर दौड़ने से पहले देखो कि वह बेचैनी कहाँ से आती है।\n\nसंभव दिशा: यदि कोई द्वार बिना ज़ोर के खुलता है, तो शायद वही रास्ता है — पर इसे आदेश नहीं, निमंत्रण समझो।\n\nआज एक छोटा जागरूकता कदम: बस एक वाक्य लिखो — "मैं असल में क्या होते देखना चाहता हूँ?" जवाब तुरंत मत खोजो; बस सवाल को भीतर लिए चलो।',
  'id-ID': 'Tanda yang tampak: di orb berputar arus yang tenang namun ragu di sekitar pertanyaanmu. Ia belum tumpah ke satu arah — yang sering berarti bukan jawabannya, melainkan saatnya, yang masih matang.\n\nPertanyaan sejati di baliknya: di bawah permukaan, sesuatu yang tersembunyi mungkin berkaitan dengan kepercayaan, atau dengan tepi sebuah kehilangan. Apa yang kau tanyakan bisa jadi bayangan dari apa yang kau takut tanyakan.\n\nYang perlu diperhatikan: ketergesaan sering diberi makan oleh ketakutan yang bukan milikmu. Sebelum berlari menuju keputusan, lihat dari mana mendesaknya itu datang.\n\nArah yang mungkin: bila salah satu pintu terbuka tanpa dipaksa, mungkin itulah jalannya — tapi anggaplah ia undangan, bukan perintah.\n\nLangkah kecil kesadaran untuk hari ini: tulis satu kalimat — "Apa yang sebenarnya aku ingin terjadi?" Jangan coba menemukan jawabannya seketika; cukup bawa pertanyaan itu di dalam dirimu.',
  ar: 'العلامة الظاهرة: على الكرة يدور تيار هادئ لكنه متردّد حول سؤالك. لم ينصبّ بعد في اتجاه واحد — وهذا غالبًا يقول إن ليس الجواب، بل اللحظة، ما زالت تنضج.\n\nالسؤال الحقيقي تحته: تحت السطح، ربما يتعلق شيء خفيّ بالثقة، أو بحافة خسارة. ما تسأله قد يكون ظلًّا لما تخشى أن تسأله.\n\nما ينبغي الانتباه إليه: العجلة كثيرًا ما تتغذّى من خوف ليس لك. قبل أن تركض نحو قرار، انظر من أين يأتي ذلك الإلحاح.\n\nاتجاه ممكن: إن انفتح أحد الأبواب دون إكراه، فلعلّه الطريق — لكن خذه دعوة لا أمرًا.\n\nخطوة صغيرة من الوعي لليوم: اكتب جملة واحدة — "ما الذي أريد حقًا أن يحدث؟" لا تحاول إيجاد الجواب فورًا؛ احمل السؤال في داخلك فحسب.',
  'de-DE': 'Das sichtbare Zeichen: über den Orb zieht eine ruhige, doch unentschiedene Strömung um deine Frage. Sie hat sich noch in keine Richtung ergossen — was oft heißt, nicht die Antwort, sondern der Augenblick reift noch.\n\nDie eigentliche Frage darunter: unter der Oberfläche hat etwas Verborgenes vielleicht mit Vertrauen zu tun, oder mit dem Rand eines Verlusts. Was du fragst, mag der Schatten dessen sein, was du zu fragen fürchtest.\n\nWorauf du achten solltest: Eile nährt sich oft aus einer Furcht, die nicht deine ist. Bevor du zu einer Entscheidung eilst, sieh, woher diese Dringlichkeit kommt.\n\nEine mögliche Richtung: Öffnet sich eine Tür ohne Zwang, ist das vielleicht der Weg — doch nimm es als Einladung, nicht als Befehl.\n\nEin kleiner Schritt der Achtsamkeit für heute: Schreibe einen Satz — "Was will ich eigentlich, dass geschieht?" Versuche nicht, die Antwort sofort zu finden; trage die Frage nur in dir.',
  'fr-FR': "Le signe visible : sur la boule, un courant calme mais indécis tourne autour de ta question. Il ne s'est pas encore versé dans une direction — ce qui dit souvent que ce n'est pas la réponse, mais le moment qui mûrit encore.\n\nLa vraie question dessous : sous la surface, quelque chose de caché tient peut-être à la confiance, ou au bord d'une perte. Ce que tu demandes peut être l'ombre de ce que tu crains de demander.\n\nCe à quoi prendre garde : la hâte se nourrit souvent d'une peur qui n'est pas la tienne. Avant de courir vers une décision, regarde d'où vient cette urgence.\n\nUne direction possible : si une porte s'ouvre sans forcer, c'est peut-être le chemin — mais prends-le comme une invitation, non un ordre.\n\nUn petit pas de conscience pour aujourd'hui : écris une seule phrase — « Qu'est-ce que je veux vraiment voir arriver ? » N'essaie pas de trouver la réponse tout de suite ; porte simplement la question en toi.",
  'ja-JP': '見える兆し：オーブに、あなたの問いをめぐって静かだが定まらぬ流れが回っています。まだ一つの方向へ注ぎ込まれていない——それはしばしば、答えでなく時がまだ熟していないことを告げます。\n\n奥にある本当の問い：表の下に隠れたものは、信頼や、喪失の縁と関わっているかもしれません。あなたが問うことは、問うのを恐れているものの影かもしれません。\n\n気をつけること：焦りは、しばしばあなたのものでない恐れに養われます。決断へ駆け出す前に、その急ぎがどこから来るのかを見てください。\n\n起こりうる方向：もし一つの扉が力をかけずに開くなら、それが道かもしれません——でも命令でなく、招きと受け取ってください。\n\n今日の小さな気づきの一歩：一文を書いてください——「私は本当は何が起こってほしいのか？」すぐに答えを探さず、ただ問いを内に抱えていてください。',
};

// Rough token estimate for mock logging (so readings rows have plausible values
// before the real provider reports usage). ~1 token per 4 chars.
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function mockGenerate(input: LlmInput): LlmResult {
  const table = input.tier === 'kahin' ? MOCK_KAHIN : MOCK_DEEP;
  const text = table[input.locale] ?? table.en;
  const promptTokens = estimateTokens(input.prompt);
  const completionTokens = estimateTokens(text);
  return {
    text,
    model: 'mock',
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}
