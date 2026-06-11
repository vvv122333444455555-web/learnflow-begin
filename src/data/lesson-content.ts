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
        title: "Simple Present of the verb \"to be\"",
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
};

export function getLessonContent(courseId: string, lessonNum: number): LessonContent | null {
  return LESSON_CONTENT[courseId]?.[lessonNum] ?? null;
}
