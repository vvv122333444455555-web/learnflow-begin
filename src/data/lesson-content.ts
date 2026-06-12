// Rich lesson content keyed by course id + lesson number.
// Add more lessons by extending this object.

export type FlashCard = { word: string; meaning: string; emoji: string };
export type DialogueLine = { speaker: string; text: string };
export type MiniQuiz = {
  prompt: string;
  sentence: string; // sentence with ___ placeholder
  options: string[];
  answer: number;
  explanation: string;
};

export type LessonContent = {
  audience: "kids" | "adults";
  title: string;
  subtitle?: string;
  intro: string;
  vocabulary?: FlashCard[];
  grammar: { title: string; explanation: string; examples: string[] };
  dialogue?: { title: string; lines: DialogueLine[] };
  quiz: MiniQuiz;
};

// English A1 -> Kids "Welcome to My School!"
// English A2 -> Adults "Professional Greetings & Introductions"
const ENGLISH_A1 = "6464db55-6011-4384-acb1-deeac22968a7";
const ENGLISH_A2 = "9244ee10-1877-46a9-adef-60a5f27f67e8";

// German A1 -> Kids "Hallo, wie geht's?"
// German A2 -> Adults "Vorstellung und Beruf"
const GERMAN_A1 = "37b076bf-7211-4d15-bff6-b4cf6394be07";
const GERMAN_A2 = "66b52f5e-b1ae-4fb5-8345-092097512180";

// Italian A1 -> Kids "I Colori della Scuola"
// Italian A2 -> Adults "Primi Contatti"
const ITALIAN_A1 = "883d297c-e42b-47c2-8865-a3a157861f66";
const ITALIAN_A2 = "281450c9-051b-431e-a6f9-6d3cb4cb25c0";

export const LESSON_CONTENT: Record<string, Record<number, LessonContent>> = {
  [ENGLISH_A1]: {
    1: {
      audience: "kids",
      title: "Lesson 1: Welcome to My School!",
      subtitle: "الدرس الأول: أهلاً بك في مدرستي!",
      intro:
        "في هذا الدرس الممتع سنتعرّف على الكلمات التي نراها كل يوم في المدرسة، ونتعلّم كيف نقول جملاً بسيطة بفعل to be.",
      vocabulary: [
        { word: "Classroom", meaning: "قاعة الصف", emoji: "🏫" },
        { word: "Teacher", meaning: "المعلّم", emoji: "👩‍🏫" },
        { word: "Whiteboard", meaning: "السبورة البيضاء", emoji: "📋" },
        { word: "Schoolbag", meaning: "الحقيبة المدرسية", emoji: "🎒" },
      ],
      grammar: {
        title: 'Simple Present of the verb "to be"',
        explanation:
          "نستخدم الفعل to be لوصف من نحن، أو أين نحن، أو كيف نشعر. تتغيّر صيغته حسب الفاعل.",
        examples: ["I am a student. — أنا تلميذ.", "You are my friend. — أنت صديقي.", "He / She / It is happy. — هو/هي سعيد(ة)."],
      },
      quiz: {
        prompt: "أكمل الجملة بالصيغة الصحيحة من فعل to be",
        sentence: "My teacher ___ very helpful.",
        options: ["am", "is", "are"],
        answer: 1,
        explanation: "نستخدم is مع المفرد الغائب (he / she / it) مثل: my teacher.",
      },
    },
  },
  [ENGLISH_A2]: {
    1: {
      audience: "adults",
      title: "Unit 1: Professional Greetings & Introductions",
      subtitle: "الوحدة الأولى: التحية والتعريف بالنفس في بيئة العمل",
      intro:
        "تعلّم كيف تقدّم نفسك بثقة في بيئة عمل احترافية، وتتحدث عن المشاريع التي تعمل عليها حاليًا باستخدام Present Continuous.",
      dialogue: {
        title: "Dialogue — At the office",
        lines: [
          { speaker: "Amine", text: "Good morning! I don't think we've met. I'm Amine, the new backend developer." },
          { speaker: "Emily", text: "Hi Amine, welcome aboard! I'm Emily, I lead the product team here." },
          { speaker: "Amine", text: "Nice to meet you, Emily. What are you working on these days?" },
          { speaker: "Emily", text: "I'm currently launching our mobile app, and our team is preparing a new release for next month." },
          { speaker: "Amine", text: "Sounds exciting. I'd love to contribute — I'm developing the new authentication service." },
        ],
      },
      grammar: {
        title: "Present Continuous for current projects",
        explanation:
          "نستخدم Present Continuous (am/is/are + verb-ing) للحديث عمّا يحدث الآن أو عن مشاريع نعمل عليها في هذه الفترة.",
        examples: [
          "I am developing a new platform.",
          "She is leading the marketing campaign this quarter.",
          "We are preparing a presentation for the client.",
        ],
      },
      quiz: {
        prompt: "Choose the correct Present Continuous form",
        sentence: "Right now, Emily ___ a demo for the client.",
        options: ["prepare", "prepares", "is preparing", "prepared"],
        answer: 2,
        explanation: "الفاعل Emily مفرد، ونتحدث عن حدث يقع الآن (Right now) → is + preparing.",
      },
    },
  },
  [GERMAN_A1]: {
    1: {
      audience: "kids",
      title: "Lektion 1: Hallo, wie geht's?",
      subtitle: "الدرس الأول: مرحباً، كيف حالك؟",
      intro:
        "في هذا الدرس الممتع سنتعرّف على مفردات المدرسة باللغة الألمانية، ونتعلّم كيف نقدّم أنفسنا باستخدام الفعل sein.",
      vocabulary: [
        { word: "Die Schule", meaning: "المدرسة", emoji: "🏫" },
        { word: "Der Ball", meaning: "الكرة", emoji: "⚽" },
        { word: "Das Buch", meaning: "الكتاب", emoji: "📖" },
      ],
      grammar: {
        title: "Das Verb \"sein\" (to be)",
        explanation:
          "الفعل sein هو فعل \"يكون\" بالألمانية. يتغيّر حسب الضمير: ich bin (أنا)، du bist (أنت)، er/sie/es ist (هو/هي).",
        examples: [
          "Ich bin Max. — أنا ماكس.",
          "Du bist mein Freund. — أنت صديقي.",
          "Es ist ein Buch. — إنه كتاب.",
        ],
      },
      quiz: {
        prompt: 'أكمل الجملة: "Ergänze: Ich _______ Max."',
        sentence: "Ich ___ Max.",
        options: ["ist", "bin", "bist"],
        answer: 1,
        explanation: "مع الضمير ich (أنا) نستخدم bin: Ich bin Max.",
      },
    },
  },
  [GERMAN_A2]: {
    1: {
      audience: "adults",
      title: "Einheit 1: Vorstellung und Beruf",
      subtitle: "الوحدة الأولى: التعريف بالنفس والمهنة",
      intro:
        "تعلّم كيف تقدّم نفسك وتتحدث عن مهنتك في بيئة عمل ألمانية، مع استخدام الألقاب الرسمية Herr وFrau.",
      dialogue: {
        title: "Dialog — Im Büro",
        lines: [
          { speaker: "Herr Meyer", text: "Guten Tag! Ich heiße Thomas Meyer. Ich bin der neue Projektmanager." },
          { speaker: "Frau Schmidt", text: "Herr Meyer, herzlich willkommen! Ich bin Frau Schmidt, die Abteilungsleiterin." },
          { speaker: "Herr Meyer", text: "Freut mich, Frau Schmidt. Was arbeiten Sie gerade an?" },
          { speaker: "Frau Schmidt", text: "Wir entwickeln gerade eine neue Plattform für internationale Kunden." },
          { speaker: "Herr Meyer", text: "Das klingt spannend. Ich freue mich auf die Zusammenarbeit." },
        ],
      },
      grammar: {
        title: "Formelle Anrede: Herr / Frau",
        explanation:
          "في البيئة الرسمية الألمانية نستخدم Herr مع الرجل وFrau مع المرأة، ثم لقب العائلة. الضمير Sie (بكتابة كبيرة) يُستخدم للاحترام.",
        examples: [
          "Herr Meyer, wie ist Ihr Name?",
          "Frau Schmidt, wo arbeiten Sie?",
          "Können Sie mir helfen, bitte?",
        ],
      },
      quiz: {
        prompt: "اختر الصيغة الصحيحة للأسلوب الرسمي",
        sentence: "Wie ist ___ Name?",
        options: ["dein", "Ihr", "meine"],
        answer: 1,
        explanation: "في الأسلوب الرسمي نستخدم Ihr (مع كتابة كبيرة) للاحترام: Wie ist Ihr Name؟",
      },
    },
  },
  [ITALIAN_A1]: {
    1: {
      audience: "kids",
      title: "Lezione 1: I Colori della Scuola",
      subtitle: "الدرس الأول: ألوان المدرسة",
      intro:
        "في هذا الدرس الممتع سنتعرّف على ألوان المدرسة باللغة الإيطالية ونتعلّم كيف نصف الأشياء من حولنا.",
      vocabulary: [
        { word: "Rosso", meaning: "أحمر", emoji: "🔴" },
        { word: "Blu", meaning: "أزرق", emoji: "🔵" },
        { word: "Verde", meaning: "أخضر", emoji: "🟢" },
      ],
      grammar: {
        title: "Aggettivi di colore (صفات اللون)",
        explanation:
          "صفات اللون في الإيطالية تتغيّر حسب نوع الاسم (مذكّر/مؤنث/مفرد/جمع). مع المفرد المذكّر نستخدم الصيغة الأساسية.",
        examples: [
          "Il cielo è blu. — السماء زرقاء.",
          "La mela è rossa. — التفاحة حمراء.",
          "L'erba è verde. — العشب أخضر.",
        ],
      },
      quiz: {
        prompt: "اختر اللون الصحيح لإكمال الجملة",
        sentence: "Il cielo è ___.",
        options: ["blu", "rosso", "verde"],
        answer: 0,
        explanation: "السماء (il cielo) لونها أزرق → blu.",
      },
    },
  },
  [ITALIAN_A2]: {
    1: {
      audience: "adults",
      title: "Unità 1: Primi Contatti",
      subtitle: "الوحدة الأولى: الاتصالات الأولى والترحيب",
      intro:
        "تعلّم عبارات التواصل الأساسية للمسافرين والراغبين في الدراسة بإيطاليا، مع التمييز بين التحية الرسمية وغير الرسمية.",
      dialogue: {
        title: "Dialogo — All'università",
        lines: [
          { speaker: "Marco", text: "Buongiorno! Sono Marco Rossi, studente di ingegneria. Piacere di conoscerla." },
          { speaker: "Sofia", text: "Il piacere è mio, Marco. Io sono Sofia Bianchi, la coordinatrice del corso." },
          { speaker: "Marco", text: "Da dove viene, professoressa?" },
          { speaker: "Sofia", text: "Sono di Firenze, ma lavoro qui a Roma da cinque anni. E lei?" },
          { speaker: "Marco", text: "Vengo da Tunisi, e sono molto contento di studiare qui in Italia." },
        ],
      },
      grammar: {
        title: "Saluti formali e informali (التحية الرسمية وغير الرسمية)",
        explanation:
          "في الإيطالية نستخدم Buongiorno صباحًا/نهارًا، Buonasera مساءً (رسمي)، Ciao (غير رسمي). Arrivederci تعني \" إلى اللقاء\".",
        examples: [
          "Buongiorno, professore! — صباح الخير يا أستاذ!",
          "Ciao, come stai? — مرحباً، كيف حالك؟",
          "Arrivederci a domani! — إلى اللقاء غداً!",
        ],
      },
      quiz: {
        prompt: "اختر التحية الرسمية المناسبة للمساء",
        sentence: "Per salutare formalmente la sera si dice: ___.",
        options: ["Ciao", "Buonasera", "Arrivederci"],
        answer: 1,
        explanation: "Buonasera هي التحية الرسمية للمساء، بينما Ciao غير رسمي وArrivederci تعني وداعاً.",
      },
    },
  },
};

export function getLessonContent(courseId: string, lessonNum: number): LessonContent | null {
  return LESSON_CONTENT[courseId]?.[lessonNum] ?? null;
}
