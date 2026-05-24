import type { Env } from '../types/env';
import type { ReadingType, Locale, AnswerCategory } from '../types/contract';
import type { AppConfig } from './configService';
import type { ChatMessage } from './promptService';
import { ApiError } from '../lib/errors';

export interface LlmInput {
  tier: ReadingType;
  messages: ChatMessage[];
  locale: Locale;
  category: AnswerCategory;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface LlmResult {
  text: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Decides whether to use the mock for a given tier. Phase 4: only Kâhin can use
// the real provider. Deep ALWAYS uses the mock this phase, regardless of config.
function shouldMock(env: Env, cfg: AppConfig, tier: ReadingType): boolean {
  if (tier === 'deep') return true;
  const mockFlag = cfg.useMockLLM || env.USE_MOCK_LLM === 'true';
  return mockFlag;
}

// Adapter boundary for text generation. Kâhin (Phase 4) can hit the real OpenAI
// API server-side; Deep stays mock. The API key lives only in env (a Wrangler
// secret) and never leaves the backend.
export async function generateReading(
  env: Env,
  cfg: AppConfig,
  input: LlmInput,
): Promise<LlmResult> {
  if (shouldMock(env, cfg, input.tier)) {
    return mockGenerate(input);
  }
  // Real path (Kâhin, useMockLLM=false). Missing key → controlled error so the
  // route returns UPSTREAM_ERROR WITHOUT spending quota.
  if (!env.OPENAI_API_KEY) {
    throw new ApiError('UPSTREAM_ERROR', { message: 'Reading provider is not configured.' });
  }
  return openAiGenerate(env.OPENAI_API_KEY, input);
}

// --- Real OpenAI call (fetch, no SDK) ---------------------------------------
interface OpenAiChoice {
  message?: { content?: string };
}
interface OpenAiUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}
interface OpenAiResponse {
  choices?: OpenAiChoice[];
  usage?: OpenAiUsage;
}

const REQUEST_TIMEOUT_MS = 20000;

async function callOnce(apiKey: string, input: LlmInput): Promise<OpenAiResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        max_tokens: input.maxTokens,
        temperature: input.temperature,
      }),
    });
    if (!res.ok) {
      // Non-2xx (rate limit, auth, server error) → throw to trigger retry/upstream.
      const detail = await res.text().catch(() => '');
      throw new Error(`OpenAI HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }
    return (await res.json()) as OpenAiResponse;
  } finally {
    clearTimeout(timer);
  }
}

async function openAiGenerate(apiKey: string, input: LlmInput): Promise<LlmResult> {
  let lastErr: unknown;
  // 1 retry (2 attempts total) for transient failures/timeouts.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await callOnce(apiKey, input);
      const raw = data.choices?.[0]?.message?.content ?? '';
      const text = sanitizeOutput(raw);
      if (!text) throw new Error('Empty completion');
      return {
        text,
        model: input.model,
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      };
    } catch (e) {
      lastErr = e;
      // brief backoff before the single retry
      if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
    }
  }
  console.error('OpenAI call failed:', lastErr);
  throw new ApiError('UPSTREAM_ERROR', { message: 'The reading could not be completed.' });
}

// Cleans model output: trims, collapses excessive blank lines, clamps length,
// and strips any leaked technical/meta wording so the mystical persona holds and
// no "AI/model/OpenAI/system prompt" terms ever reach the user.
const LEAK_PATTERNS: RegExp[] = [
  /\bas an ai\b/gi,
  /\bai language model\b/gi,
  /\blanguage model\b/gi,
  /\bopenai\b/gi,
  /\bgpt[-\s]?\d*\b/gi,
  /\bchatbot\b/gi,
  /\bsystem prompt\b/gi,
  /\bi am an ai\b/gi,
  /\byapay zeka\b/gi,
  /\bdil modeli\b/gi,
];

export function sanitizeOutput(raw: string, maxChars = 1200): string {
  let text = raw.trim();
  for (const re of LEAK_PATTERNS) text = text.replace(re, '');
  // Collapse 3+ newlines to a paragraph break.
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  if (text.length > maxChars) {
    // Clamp at the last sentence end before the limit, else hard clamp.
    const slice = text.slice(0, maxChars);
    const lastStop = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('\n'));
    text = (lastStop > maxChars * 0.6 ? slice.slice(0, lastStop + 1) : slice).trim();
  }
  return text;
}

// --- Mock path (unchanged from Phase 3) --------------------------------------
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

// Competition-flavoured mock so sport/championship questions don't get a generic
// reading even when the LLM is mocked. Kept short (Kâhin-length) and result-free.
const MOCK_KAHIN_COMPETITION: Record<Locale, string> = {
  tr: 'Kürenin bu soru için gösterdiği işaret, umut ile baskının aynı anda büyüdüğünü söylüyor. Şampiyonluk sorusu kesin bir cevap değil, son düzlükteki istikrarı gösteren bir işaret ister. Belirleyici olan sadece güç değil; kritik anlarda sakin kalmak, fırsatı kaçırmamak ve telaşı yönetmek. Küre net bir skor ya da garanti sonuç söylemez, ama enerjinin hâlâ canlı olduğunu fısıldar: yol kapanmış değil, fakat son adımlar dikkat ister.',
  en: "The orb's sign for this question speaks of hope and pressure growing at once. A championship question asks not for a verdict, but for steadiness in the final stretch. What decides it is not strength alone, but staying calm in the key moments, not missing the chance, and managing the rush. The orb names no certain score or guaranteed result, yet it whispers that the energy is still alive: the road is not closed, but the last steps ask for care.",
  'es-LA': 'La señal del orbe para esta pregunta habla de esperanza y presión creciendo a la vez. Una pregunta de campeonato no pide un veredicto, sino firmeza en la recta final. Lo decisivo no es solo la fuerza, sino mantener la calma en los momentos clave, no perder la oportunidad y manejar la prisa. El orbe no nombra un marcador seguro ni un resultado garantizado, pero susurra que la energía sigue viva: el camino no está cerrado, pero los últimos pasos piden cuidado.',
  'pt-BR': 'O sinal do orbe para esta pergunta fala de esperança e pressão crescendo ao mesmo tempo. Uma pergunta de campeonato não pede um veredito, mas firmeza na reta final. O que decide não é só a força, mas manter a calma nos momentos-chave, não perder a chance e administrar a pressa. O orbe não nomeia um placar certo nem um resultado garantido, mas sussurra que a energia ainda está viva: o caminho não está fechado, mas os últimos passos pedem cuidado.',
  'hi-IN': 'इस सवाल के लिए गोले का संकेत कहता है कि उम्मीद और दबाव एक साथ बढ़ रहे हैं। चैंपियनशिप का सवाल कोई फैसला नहीं माँगता, बल्कि आख़िरी मोड़ पर स्थिरता माँगता है। निर्णायक सिर्फ ताक़त नहीं, बल्कि अहम पलों में शांत रहना, मौका न चूकना और जल्दबाज़ी संभालना है। गोला कोई पक्का स्कोर या गारंटी नतीजा नहीं बताता, पर फुसफुसाता है कि ऊर्जा अब भी जीवित है: रास्ता बंद नहीं, पर आख़िरी कदम सावधानी माँगते हैं।',
  'id-ID': 'Tanda bola untuk pertanyaan ini berbicara tentang harapan dan tekanan yang tumbuh bersamaan. Pertanyaan kejuaraan tidak meminta vonis, melainkan kestabilan di tikungan terakhir. Yang menentukan bukan kekuatan saja, tapi tetap tenang di saat penting, tidak menyia-nyiakan peluang, dan mengelola ketergesaan. Bola tidak menyebut skor pasti atau hasil yang dijamin, tapi membisikkan bahwa energi masih hidup: jalan belum tertutup, tapi langkah terakhir meminta kehati-hatian.',
  ar: 'إشارة الكرة لهذا السؤال تتحدث عن الأمل والضغط ينموان معًا. سؤال البطولة لا يطلب حكمًا، بل ثباتًا في المنعطف الأخير. الحاسم ليس القوة وحدها، بل البقاء هادئًا في اللحظات المفصلية، وعدم تفويت الفرصة، وإدارة العجلة. الكرة لا تذكر نتيجة مؤكدة ولا فوزًا مضمونًا، لكنها تهمس بأن الطاقة ما زالت حيّة: الطريق لم يُغلق، لكن الخطوات الأخيرة تطلب حذرًا.',
  'de-DE': 'Das Zeichen der Kugel für diese Frage spricht davon, dass Hoffnung und Druck zugleich wachsen. Eine Meisterschaftsfrage verlangt kein Urteil, sondern Beständigkeit auf der Schlussgeraden. Entscheidend ist nicht allein die Kraft, sondern in den Schlüsselmomenten ruhig zu bleiben, die Chance zu nutzen und die Eile zu zügeln. Die Kugel nennt kein sicheres Ergebnis, doch sie flüstert, dass die Energie noch lebt: der Weg ist nicht versperrt, aber die letzten Schritte verlangen Sorgfalt.',
  'fr-FR': "Le signe de la boule pour cette question parle d'espoir et de pression qui grandissent en même temps. Une question de titre ne demande pas un verdict, mais de la constance dans la dernière ligne droite. Ce qui décide n'est pas la seule force, mais rester calme aux moments clés, ne pas manquer l'occasion et maîtriser la hâte. La boule ne nomme aucun score certain ni résultat garanti, mais elle murmure que l'énergie est encore vive : la route n'est pas fermée, mais les derniers pas demandent du soin.",
  'ja-JP': 'この問いに対する玉の兆しは、希望と重圧が同時に高まっていると告げます。優勝の問いは判定でなく、最後の直線での安定を求めます。決めるのは力だけでなく、ここぞの場面で冷静でいること、好機を逃さないこと、焦りを御すること。玉は確かなスコアも保証された結果も口にしません。けれど、エネルギーがまだ生きているとささやきます——道は閉じていない、ただ最後の一歩は慎重さを求めます。',
};

const MOCK_DEEP_COMPETITION: Record<Locale, string> = {
  tr: 'Görünen işaret: kürenin yüzeyinde, bu rekabet sorusunun etrafında güçlü ama dalgalı bir enerji dönüyor. Umut yüksek, fakat henüz hiçbir yöne kesin biçimde dökülmemiş; bu da çoğu zaman sonucun değil, son düzlüğün henüz yazılmadığını söyler.\n\nİçindeki asıl soru: belki de mesele yalnızca kim kazanır değil, bu beklentinin sana yüklediği baskıyı nasıl taşıdığın. Tutkun gerçek, ama onu telaşa çevirmek seni de yorar.\n\nDikkat etmen gereken: kritik anlarda acele eden değil, soğukkanlı kalan öne çıkar. Skoru zihninde defalarca oynamak, anın keyfini ve sağduyunu çalabilir.\n\nOlası yön: işaretler enerjinin hâlâ canlı olduğunu gösteriyor; yol kapanmış değil. Ama küre net bir sonuç ya da garanti zafer söylemez — sadece son adımların dikkat istediğini.\n\nBugün için küçük bir farkındalık adımı: tek bir cümle yaz — "Bu sonuç ne olursa olsun, ben bu süreçte neyi hissetmek istiyorum?" Cevabı zorlama; sadece soruyu içinde taşı.',
  en: "The visible sign: across the orb a strong but wavering energy circles this contest. Hope runs high, yet nothing has poured into one direction — which often means not the result, but the final stretch, is still unwritten.\n\nThe real question beneath: perhaps it is not only who wins, but how you carry the pressure this hope places on you. Your passion is real, but turning it into a rush wears you down too.\n\nWhat to be mindful of: in the decisive moments the composed one rises, not the hurried. Replaying the score in your mind can steal both the joy and the clear sight of the present.\n\nA possible direction: the signs show the energy is still alive; the road is not closed. But the orb names no certain result or guaranteed victory — only that the last steps ask for care.\n\nA small step of awareness for today: write a single sentence — \"Whatever the result, what do I want to feel through this?\" Don't force the answer; just carry the question.",
  'es-LA': 'La señal visible: por el orbe gira una energía fuerte pero oscilante alrededor de esta contienda. La esperanza es alta, pero nada se ha volcado en una dirección — lo que suele decir que no el resultado, sino la recta final, aún no está escrita.\n\nLa verdadera pregunta debajo: quizá no sea solo quién gana, sino cómo cargas la presión que esta esperanza pone en ti. Tu pasión es real, pero convertirla en prisa también te desgasta.\n\nLo que debes cuidar: en los momentos decisivos se alza el sereno, no el apurado. Repetir el marcador en tu mente puede robarte la calma y la claridad del presente.\n\nUn rumbo posible: las señales muestran que la energía sigue viva; el camino no está cerrado. Pero el orbe no nombra un resultado seguro ni una victoria garantizada — solo que los últimos pasos piden cuidado.\n\nUn pequeño paso de conciencia para hoy: escribe una frase — "Sea cual sea el resultado, ¿qué quiero sentir en este proceso?" No fuerces la respuesta; solo lleva la pregunta.',
  'pt-BR': 'O sinal visível: pelo orbe gira uma energia forte, mas oscilante, em torno desta disputa. A esperança é alta, mas nada se inclinou para uma direção — o que costuma dizer que não o resultado, mas a reta final, ainda não foi escrita.\n\nA verdadeira pergunta por baixo: talvez não seja só quem vence, mas como você carrega a pressão que essa esperança coloca em você. Sua paixão é real, mas transformá-la em pressa também te desgasta.\n\nO que cuidar: nos momentos decisivos, ergue-se o sereno, não o apressado. Repetir o placar na mente pode roubar a calma e a clareza do presente.\n\nUm rumo possível: os sinais mostram que a energia ainda está viva; o caminho não está fechado. Mas o orbe não nomeia resultado certo nem vitória garantida — só que os últimos passos pedem cuidado.\n\nUm pequeno passo de consciência para hoje: escreva uma frase — "Seja qual for o resultado, o que quero sentir neste processo?" Não force a resposta; apenas carregue a pergunta.',
  'hi-IN': 'दिखता संकेत: गोले पर इस मुकाबले के चारों ओर एक मज़बूत पर लहराती ऊर्जा घूमती है। उम्मीद ऊँची है, पर कुछ भी किसी दिशा में नहीं बहा — जो अक्सर कहता है कि नतीजा नहीं, बल्कि आख़िरी मोड़ अभी लिखा जाना बाकी है।\n\nभीतर का असली सवाल: शायद बात सिर्फ यह नहीं कि कौन जीतता है, बल्कि यह कि इस उम्मीद का दबाव तुम कैसे उठाते हो। तुम्हारा जुनून सच्चा है, पर उसे जल्दबाज़ी में बदलना तुम्हें भी थकाता है।\n\nध्यान देने योग्य: निर्णायक पलों में शांत उठता है, जल्दबाज़ नहीं। मन में बार-बार स्कोर दोहराना वर्तमान की शांति और स्पष्टता चुरा सकता है।\n\nसंभव दिशा: संकेत दिखाते हैं कि ऊर्जा अब भी जीवित है; रास्ता बंद नहीं। पर गोला कोई पक्का नतीजा या गारंटी जीत नहीं बताता — बस इतना कि आख़िरी कदम सावधानी माँगते हैं।\n\nआज एक छोटा जागरूकता कदम: एक वाक्य लिखो — "नतीजा जो भी हो, मैं इस सफ़र में क्या महसूस करना चाहता हूँ?" जवाब मत थोपो; बस सवाल को साथ रखो।',
  'id-ID': 'Tanda yang tampak: di orb berputar energi yang kuat namun bergelombang di sekitar laga ini. Harapan tinggi, tapi belum ada yang tumpah ke satu arah — yang sering berarti bukan hasilnya, melainkan tikungan terakhir, yang belum tertulis.\n\nPertanyaan sejati di baliknya: mungkin bukan hanya siapa yang menang, tapi bagaimana kau memikul tekanan yang ditaruh harapan ini padamu. Gairahmu nyata, tapi mengubahnya jadi ketergesaan juga melelahkanmu.\n\nYang perlu diperhatikan: di saat menentukan, yang tenang bangkit, bukan yang tergesa. Mengulang skor di benak bisa mencuri ketenangan dan kejernihan masa kini.\n\nArah yang mungkin: tanda menunjukkan energi masih hidup; jalan belum tertutup. Tapi bola tidak menyebut hasil pasti atau kemenangan terjamin — hanya bahwa langkah terakhir meminta kehati-hatian.\n\nLangkah kecil kesadaran untuk hari ini: tulis satu kalimat — "Apa pun hasilnya, apa yang ingin kurasakan dalam proses ini?" Jangan paksa jawabannya; cukup bawa pertanyaannya.',
  ar: 'العلامة الظاهرة: على الكرة تدور طاقة قوية لكنها متموّجة حول هذه المنافسة. الأمل مرتفع، لكن لا شيء انصبّ في اتجاه واحد — وهذا غالبًا يقول إن ليس النتيجة، بل المنعطف الأخير، لم يُكتب بعد.\n\nالسؤال الحقيقي تحته: ربما الأمر ليس فقط من يفوز، بل كيف تحمل الضغط الذي يضعه هذا الأمل عليك. شغفك حقيقي، لكن تحويله إلى عجلة يرهقك أيضًا.\n\nما ينبغي الانتباه إليه: في اللحظات الحاسمة ينهض الهادئ لا المتعجّل. تكرار النتيجة في ذهنك قد يسرق صفاء الحاضر ووضوحه.\n\nاتجاه ممكن: العلامات تُظهر أن الطاقة ما زالت حيّة؛ الطريق لم يُغلق. لكن الكرة لا تذكر نتيجة مؤكدة ولا فوزًا مضمونًا — فقط أن الخطوات الأخيرة تطلب حذرًا.\n\nخطوة صغيرة من الوعي لليوم: اكتب جملة واحدة — "مهما كانت النتيجة، ماذا أريد أن أشعر خلال هذه الرحلة؟" لا تُجبر الجواب؛ احمل السؤال فحسب.',
  'de-DE': 'Das sichtbare Zeichen: über die Kugel zieht eine starke, doch schwankende Energie um diesen Wettkampf. Die Hoffnung ist groß, doch nichts hat sich in eine Richtung ergossen — was oft heißt, nicht das Ergebnis, sondern die Schlussgerade ist noch ungeschrieben.\n\nDie eigentliche Frage darunter: vielleicht geht es nicht nur darum, wer gewinnt, sondern wie du den Druck trägst, den diese Hoffnung auf dich legt. Deine Leidenschaft ist echt, doch sie in Hast zu verwandeln zehrt auch an dir.\n\nWorauf du achten solltest: in den entscheidenden Momenten erhebt sich der Gelassene, nicht der Hastige. Das Ergebnis im Kopf immer wieder durchzuspielen kann dir die Ruhe und Klarheit des Augenblicks rauben.\n\nEine mögliche Richtung: die Zeichen zeigen, die Energie lebt noch; der Weg ist nicht versperrt. Doch die Kugel nennt kein sicheres Ergebnis und keinen garantierten Sieg — nur, dass die letzten Schritte Sorgfalt verlangen.\n\nEin kleiner Schritt der Achtsamkeit für heute: Schreibe einen Satz — "Was immer das Ergebnis ist, was will ich in diesem Prozess fühlen?" Erzwinge die Antwort nicht; trage nur die Frage.',
  'fr-FR': "Le signe visible : sur la boule tourne une énergie forte mais vacillante autour de cette compétition. L'espoir est grand, mais rien ne s'est versé dans une direction — ce qui dit souvent que ce n'est pas le résultat, mais la dernière ligne droite, qui reste à écrire.\n\nLa vraie question dessous : peut-être n'est-ce pas seulement qui gagne, mais comment tu portes la pression que cet espoir met sur toi. Ta passion est réelle, mais la changer en hâte t'épuise aussi.\n\nCe à quoi prendre garde : aux moments décisifs, c'est le posé qui se lève, non le pressé. Rejouer le score dans ta tête peut te voler le calme et la clarté du présent.\n\nUne direction possible : les signes montrent que l'énergie est encore vive ; la route n'est pas fermée. Mais la boule ne nomme aucun résultat certain ni victoire garantie — seulement que les derniers pas demandent du soin.\n\nUn petit pas de conscience pour aujourd'hui : écris une phrase — « Quel que soit le résultat, que veux-je ressentir dans ce parcours ? » Ne force pas la réponse ; porte simplement la question.",
  'ja-JP': '見える兆し：玉の上で、この勝負をめぐって強くも揺らぐエネルギーが回っています。希望は高い。けれどまだ一つの方向へ注ぎ込まれていない——それはしばしば、結果でなく、最後の直線がまだ書かれていないことを告げます。\n\n奥にある本当の問い：おそらく問題は誰が勝つかだけでなく、この希望があなたにかける重圧をどう抱えるか。情熱は本物。だがそれを焦りに変えると、あなた自身も消耗します。\n\n気をつけること：決定的な場面で立つのは、慌てる者でなく落ち着いた者。心の中でスコアを何度も再生すると、今この瞬間の静けさと明晰さを奪われかねません。\n\n起こりうる方向：兆しはエネルギーがまだ生きていると示します。道は閉じていない。けれど玉は確かな結果も保証された勝利も口にしません——ただ、最後の一歩が慎重さを求めると。\n\n今日の小さな気づきの一歩：一文を書いてください——「結果がどうであれ、私はこの過程で何を感じたいのか？」答えを強いず、ただ問いを携えて。',
};

function estimateTokens(messages: ChatMessage[]): number {
  const len = messages.reduce((n, m) => n + m.content.length, 0);
  return Math.ceil(len / 4);
}

function mockGenerate(input: LlmInput): LlmResult {
  // Pick a competition-flavoured mock for sport/contest questions so the mock
  // path isn't generic; otherwise the default tier table.
  let table: Record<Locale, string>;
  if (input.category === 'competition') {
    table = input.tier === 'kahin' ? MOCK_KAHIN_COMPETITION : MOCK_DEEP_COMPETITION;
  } else {
    table = input.tier === 'kahin' ? MOCK_KAHIN : MOCK_DEEP;
  }
  const text = table[input.locale] ?? table.en;
  const promptTokens = estimateTokens(input.messages);
  const completionTokens = Math.ceil(text.length / 4);
  return {
    text,
    model: 'mock',
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}
