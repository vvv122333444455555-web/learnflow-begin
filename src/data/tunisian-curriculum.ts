export type MCQItem = { question: string; options: string[]; answer: number; explain?: string };
export type BlankItem = { sentence: string; answer: string; hint?: string };
export type PairItem = { left: string; right: string; emoji?: string };
export type TFItem = { statement: string; answer: boolean };

export type Exercise =
  | { kind: "mcq"; title: string; items: MCQItem[] }
  | { kind: "blanks"; title: string; items: BlankItem[] }
  | { kind: "pairs"; title: string; items: PairItem[] }
  | { kind: "reading"; title: string; passage: string; tf: TFItem[]; blanks: BlankItem[] };

export type Module = {
  id: string;
  title: string;
  titleAr: string;
  emoji: string;
  color: string;
  exercises: Exercise[];
};

export type Grade = { id: "grade5" | "grade6"; label: string; labelAr: string; emoji: string; modules: Module[] };

export const TUNISIAN_CURRICULUM: Grade[] = [
  {
    id: "grade5",
    label: "5th Grade",
    labelAr: "السنة الخامسة ابتدائي",
    emoji: "🎒",
    modules: [
      {
        id: "g5-family",
        title: "Family & Home",
        titleAr: "العائلة والبيت",
        emoji: "🏠",
        color: "from-pink-400 to-rose-500",
        exercises: [
          {
            kind: "pairs",
            title: "Matching Pairs — Family Members",
            items: [
              { left: "Father", right: "الأب — a man with a beard reading the newspaper", emoji: "👨" },
              { left: "Mother", right: "الأم — a kind woman cooking couscous", emoji: "👩" },
              { left: "Brother", right: "الأخ — a boy playing football", emoji: "👦" },
              { left: "Sister", right: "الأخت — a girl doing her homework", emoji: "👧" },
              { left: "Grandfather", right: "الجد — an old man telling stories", emoji: "👴" },
              { left: "Grandmother", right: "الجدة — an old woman baking bread", emoji: "👵" },
            ],
          },
          {
            kind: "mcq",
            title: "Basic Verbs Quiz",
            items: [
              { question: "I ___ in a big house.", options: ["live", "lives", "living", "lived"], answer: 0, explain: "With 'I' we use the base verb: live." },
              { question: "My mother ___ delicious food.", options: ["cook", "cooks", "cooking", "cookes"], answer: 1, explain: "Third person singular adds -s: cooks." },
              { question: "We ___ our grandparents on Sunday.", options: ["visits", "visiting", "visit", "visited"], answer: 2, explain: "With 'we' use base form: visit." },
              { question: "My father ___ to work every morning.", options: ["go", "goes", "going", "went"], answer: 1, explain: "He/She/It → goes." },
              { question: "My sister and I ___ in the same school.", options: ["studies", "study", "studying", "is study"], answer: 1, explain: "Plural subject → study." },
            ],
          },
        ],
      },
      {
        id: "g5-pets",
        title: "Pets & Animals",
        titleAr: "الحيوانات الأليفة",
        emoji: "🐾",
        color: "from-amber-400 to-orange-500",
        exercises: [
          {
            kind: "blanks",
            title: "Fill in the Blanks — Animals",
            items: [
              { sentence: "The cat says ___.", answer: "meow", hint: "🐱" },
              { sentence: "The dog is ___.", answer: "barking", hint: "🐶 -ing" },
              { sentence: "The cow gives us ___.", answer: "milk", hint: "🥛" },
              { sentence: "The bird can ___.", answer: "fly", hint: "🐦" },
              { sentence: "The fish lives in the ___.", answer: "water", hint: "🐟" },
              { sentence: "The rabbit likes to eat ___.", answer: "carrots", hint: "🥕" },
            ],
          },
          {
            kind: "mcq",
            title: "Which Animal?",
            items: [
              { question: "Which animal gives us wool?", options: ["Sheep", "Duck", "Horse", "Cat"], answer: 0 },
              { question: "Which animal lives in the desert?", options: ["Penguin", "Camel", "Whale", "Bear"], answer: 1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "grade6",
    label: "6th Grade",
    labelAr: "السنة السادسة ابتدائي",
    emoji: "📚",
    modules: [
      {
        id: "g6-school",
        title: "Back to School",
        titleAr: "العودة إلى المدرسة",
        emoji: "🏫",
        color: "from-emerald-400 to-teal-500",
        exercises: [
          {
            kind: "reading",
            title: "Ahmed's First Day at School",
            passage:
              "Ahmed is a Tunisian boy. He is eleven years old and he lives in Sfax. Today is his first day at the primary school. He wears a blue uniform and has a new schoolbag full of books and pencils. His mother walks with him to school. At the gate, Ahmed meets his new friend Youssef. The teacher, Mrs. Fatma, is very kind. She has a warm smile. Ahmed is happy because he learns English, Arabic and Mathematics. After school, he goes home and tells his family about his exciting day.",
            tf: [
              { statement: "Ahmed lives in Tunis.", answer: false },
              { statement: "Ahmed's teacher is called Mrs. Fatma.", answer: true },
              { statement: "Ahmed learns English at school.", answer: true },
            ],
            blanks: [
              { sentence: "Ahmed ___ eleven years old.", answer: "is", hint: "to be" },
              { sentence: "He ___ a new schoolbag.", answer: "has", hint: "to have" },
              { sentence: "The teacher ___ a warm smile.", answer: "has", hint: "to have" },
            ],
          },
        ],
      },
      {
        id: "g6-routines",
        title: "Daily Routines",
        titleAr: "الروتين اليومي",
        emoji: "⏰",
        color: "from-sky-400 to-indigo-500",
        exercises: [
          {
            kind: "mcq",
            title: "Daily School Schedule",
            items: [
              { question: "I wake up ___ 6 o'clock in the morning.", options: ["in", "at", "on", "to"], answer: 1, explain: "We say 'at' with clock times." },
              { question: "School starts ___ 8:00 AM.", options: ["at", "in", "on", "since"], answer: 0 },
              { question: "We have a break ___ the morning.", options: ["at", "on", "in", "by"], answer: 2, explain: "'in the morning/afternoon/evening'." },
              { question: "Classes finish ___ Friday afternoon.", options: ["in", "at", "on", "by"], answer: 2, explain: "'on' with days of the week." },
              { question: "What time ___ you have lunch?", options: ["do", "does", "are", "is"], answer: 0 },
              { question: "My brother ___ his homework after school.", options: ["do", "does", "doing", "done"], answer: 1 },
              { question: "I go to bed ___ 9 PM every night.", options: ["on", "in", "at", "by"], answer: 2 },
            ],
          },
        ],
      },
    ],
  },
];
