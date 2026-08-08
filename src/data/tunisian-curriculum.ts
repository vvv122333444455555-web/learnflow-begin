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

export type Grade = {
  id: "grade5" | "grade6" | "grade7" | "grade8" | "grade9" | "sec1" | "sec2" | "sec3" | "bac";
  label: string; labelAr: string; emoji: string; modules: Module[];
};

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
{
  "id": "grade7",
  "label": "7th Grade",
  "labelAr": "السنة السابعة أساسي",
  "emoji": "📘",
  "modules": [
    {
      "id": "g7-routine",
      "title": "Daily Life",
      "titleAr": "الحياة اليومية",
      "emoji": "⏰",
      "color": "from-sky-400 to-blue-500",
      "exercises": [
        {
          "kind": "mcq",
          "title": "Present Simple Review",
          "items": [
            {
              "question": "She usually ___ up at 7 AM.",
              "options": [
                "wake",
                "wakes",
                "waking",
                "woke"
              ],
              "answer": 1
            },
            {
              "question": "They ___ to school by bus.",
              "options": [
                "go",
                "goes",
                "going",
                "went"
              ],
              "answer": 0
            },
            {
              "question": "My father ___ TV in the evening.",
              "options": [
                "watch",
                "watches",
                "watching",
                "watched"
              ],
              "answer": 1
            },
            {
              "question": "We ___ our homework every day.",
              "options": [
                "does",
                "doing",
                "do",
                "did"
              ],
              "answer": 2
            }
          ]
        },
        {
          "kind": "blanks",
          "title": "Prepositions of Time",
          "items": [
            {
              "sentence": "I have breakfast ___ 7 o'clock.",
              "answer": "at"
            },
            {
              "sentence": "We play football ___ the weekend.",
              "answer": "on"
            },
            {
              "sentence": "School starts ___ September.",
              "answer": "in"
            }
          ]
        }
      ]
    },
    {
      "id": "g7-directions",
      "title": "Directions & Places",
      "titleAr": "الاتجاهات والأماكن",
      "emoji": "🗺️",
      "color": "from-emerald-400 to-teal-500",
      "exercises": [
        {
          "kind": "pairs",
          "title": "Places in Town",
          "items": [
            {
              "left": "Hospital",
              "right": "المستشفى — a place where doctors treat sick people",
              "emoji": "🏥"
            },
            {
              "left": "Library",
              "right": "المكتبة — a place full of books",
              "emoji": "📚"
            },
            {
              "left": "Market",
              "right": "السوق — a place to buy fruits and vegetables",
              "emoji": "🥕"
            },
            {
              "left": "Post Office",
              "right": "مكتب البريد — a place to send letters",
              "emoji": "📮"
            }
          ]
        },
        {
          "kind": "mcq",
          "title": "Giving Directions",
          "items": [
            {
              "question": "Go ___ and turn left.",
              "options": [
                "straight",
                "straightly",
                "direct",
                "up"
              ],
              "answer": 0
            },
            {
              "question": "The bank is ___ the supermarket.",
              "options": [
                "next",
                "next to",
                "in",
                "on"
              ],
              "answer": 1
            }
          ]
        }
      ]
    }
  ]
},
{
  "id": "grade8",
  "label": "8th Grade",
  "labelAr": "السنة الثامنة أساسي",
  "emoji": "📗",
  "modules": [
    {
      "id": "g8-hobbies",
      "title": "Free Time & Hobbies",
      "titleAr": "أوقات الفراغ والهوايات",
      "emoji": "🎨",
      "color": "from-pink-400 to-fuchsia-500",
      "exercises": [
        {
          "kind": "mcq",
          "title": "Talking About Hobbies",
          "items": [
            {
              "question": "I enjoy ___ football with my friends.",
              "options": [
                "play",
                "playing",
                "played",
                "plays"
              ],
              "answer": 1
            },
            {
              "question": "She is interested ___ painting.",
              "options": [
                "on",
                "in",
                "at",
                "for"
              ],
              "answer": 1
            },
            {
              "question": "My brother ___ collecting stamps since he was young.",
              "options": [
                "like",
                "likes",
                "liking",
                "liked"
              ],
              "answer": 1
            }
          ]
        },
        {
          "kind": "blanks",
          "title": "Free Time Vocabulary",
          "items": [
            {
              "sentence": "On Sundays, I like to go ___.",
              "answer": "swimming"
            },
            {
              "sentence": "My favorite ___ is reading comic books.",
              "answer": "hobby"
            }
          ]
        }
      ]
    },
    {
      "id": "g8-health",
      "title": "Health & Body",
      "titleAr": "الصحة والجسم",
      "emoji": "🩺",
      "color": "from-red-400 to-rose-500",
      "exercises": [
        {
          "kind": "reading",
          "title": "A Visit to the Doctor",
          "passage": "Yesterday, Mariem felt sick. She had a headache and a fever. Her mother took her to see the doctor. The doctor checked her temperature and listened to her heart. He said Mariem had a cold and needed to rest. He gave her some medicine and told her to drink a lot of water. Mariem stayed home for two days and felt better soon.",
          "tf": [
            {
              "statement": "Mariem felt sick yesterday.",
              "answer": true
            },
            {
              "statement": "The doctor said she needed surgery.",
              "answer": false
            }
          ],
          "blanks": [
            {
              "sentence": "Mariem ___ a headache and a fever.",
              "answer": "had"
            },
            {
              "sentence": "The doctor ___ her some medicine.",
              "answer": "gave"
            }
          ]
        }
      ]
    }
  ]
},
{
  "id": "grade9",
  "label": "9th Grade",
  "labelAr": "السنة التاسعة أساسي",
  "emoji": "📙",
  "modules": [
    {
      "id": "g9-tech",
      "title": "Technology",
      "titleAr": "التكنولوجيا",
      "emoji": "💻",
      "color": "from-indigo-400 to-violet-500",
      "exercises": [
        {
          "kind": "mcq",
          "title": "Comparatives & Superlatives",
          "items": [
            {
              "question": "A smartphone is ___ than a landline phone.",
              "options": [
                "useful",
                "more useful",
                "usefuler",
                "most useful"
              ],
              "answer": 1
            },
            {
              "question": "This is the ___ computer in the shop.",
              "options": [
                "fast",
                "faster",
                "fastest",
                "more fast"
              ],
              "answer": 2
            },
            {
              "question": "The internet has made communication ___ easier.",
              "options": [
                "much",
                "many",
                "more",
                "most"
              ],
              "answer": 0
            }
          ]
        },
        {
          "kind": "blanks",
          "title": "Tech Vocabulary",
          "items": [
            {
              "sentence": "I need to ___ my phone; the battery is low.",
              "answer": "charge"
            },
            {
              "sentence": "Please ___ the file before you open it.",
              "answer": "download"
            }
          ]
        }
      ]
    },
    {
      "id": "g9-environment",
      "title": "Environment",
      "titleAr": "البيئة",
      "emoji": "🌍",
      "color": "from-green-400 to-emerald-600",
      "exercises": [
        {
          "kind": "pairs",
          "title": "Environmental Vocabulary",
          "items": [
            {
              "left": "Pollution",
              "right": "التلوث — harmful substances in the air or water",
              "emoji": "🏭"
            },
            {
              "left": "Recycle",
              "right": "إعادة التدوير — to use waste material again",
              "emoji": "♻️"
            },
            {
              "left": "Renewable energy",
              "right": "الطاقة المتجددة — energy from natural sources like the sun",
              "emoji": "☀️"
            }
          ]
        },
        {
          "kind": "mcq",
          "title": "Exam-Style Practice (9ème National Exam)",
          "items": [
            {
              "question": "We should ___ water to protect the environment.",
              "options": [
                "waste",
                "save",
                "pollute",
                "burn"
              ],
              "answer": 1
            },
            {
              "question": "Plastic bags are harmful ___ the environment.",
              "options": [
                "for",
                "to",
                "with",
                "at"
              ],
              "answer": 1
            }
          ]
        }
      ]
    }
  ]
},
{
  "id": "sec1",
  "label": "1st Year Secondary",
  "labelAr": "الأولى ثانوي",
  "emoji": "🎓",
  "modules": [
    {
      "id": "s1-media",
      "title": "Media & Communication",
      "titleAr": "الإعلام والتواصل",
      "emoji": "📰",
      "color": "from-amber-400 to-orange-500",
      "exercises": [
        {
          "kind": "mcq",
          "title": "Modal Verbs",
          "items": [
            {
              "question": "You ___ wear a seatbelt in the car.",
              "options": [
                "must",
                "can",
                "could",
                "might"
              ],
              "answer": 0
            },
            {
              "question": "___ I use your phone, please?",
              "options": [
                "Must",
                "May",
                "Should",
                "Would"
              ],
              "answer": 1
            },
            {
              "question": "Students ___ not use their phones during exams.",
              "options": [
                "must",
                "should",
                "can",
                "will"
              ],
              "answer": 0
            }
          ]
        },
        {
          "kind": "blanks",
          "title": "Media Vocabulary",
          "items": [
            {
              "sentence": "Many young people get their news from social ___.",
              "answer": "media"
            },
            {
              "sentence": "A journalist writes ___ for newspapers.",
              "answer": "articles"
            }
          ]
        }
      ]
    },
    {
      "id": "s1-tourism",
      "title": "Tunisian Culture & Tourism",
      "titleAr": "الثقافة والسياحة التونسية",
      "emoji": "🕌",
      "color": "from-cyan-400 to-sky-600",
      "exercises": [
        {
          "kind": "reading",
          "title": "Discovering Tunisia",
          "passage": "Tunisia is a beautiful country in North Africa, famous for its Mediterranean coastline, ancient ruins, and rich culture. Every year, thousands of tourists visit the city of Carthage to see the Roman ruins. The Sahara desert in the south attracts adventurers who want to ride camels and watch the sunset over the dunes. Tunisian cuisine, especially couscous and brik, is loved by visitors from around the world.",
          "tf": [
            {
              "statement": "Carthage has famous Roman ruins.",
              "answer": true
            },
            {
              "statement": "Tunisia has no desert.",
              "answer": false
            }
          ],
          "blanks": [
            {
              "sentence": "Tourists ___ camels in the Sahara.",
              "answer": "ride"
            },
            {
              "sentence": "Couscous ___ a traditional Tunisian dish.",
              "answer": "is"
            }
          ]
        }
      ]
    }
  ]
},
{
  "id": "sec2",
  "label": "2nd Year Secondary",
  "labelAr": "الثانية ثانوي",
  "emoji": "🎓",
  "modules": [
    {
      "id": "s2-work",
      "title": "Work & Careers",
      "titleAr": "العمل والمهن",
      "emoji": "💼",
      "color": "from-slate-400 to-slate-600",
      "exercises": [
        {
          "kind": "mcq",
          "title": "The Passive Voice",
          "items": [
            {
              "question": "This report ___ by the manager yesterday.",
              "options": [
                "wrote",
                "was written",
                "is writing",
                "writes"
              ],
              "answer": 1
            },
            {
              "question": "The new bridge ___ next year.",
              "options": [
                "will build",
                "will be built",
                "builds",
                "is build"
              ],
              "answer": 1
            },
            {
              "question": "Many houses ___ destroyed in the storm.",
              "options": [
                "was",
                "were",
                "are",
                "is"
              ],
              "answer": 1
            }
          ]
        },
        {
          "kind": "blanks",
          "title": "Career Vocabulary",
          "items": [
            {
              "sentence": "She has a job ___ at the local hospital.",
              "answer": "interview"
            },
            {
              "sentence": "A good ___ is important on your CV.",
              "answer": "qualification"
            }
          ]
        }
      ]
    },
    {
      "id": "s2-science",
      "title": "Science & Discovery",
      "titleAr": "العلوم والاكتشافات",
      "emoji": "🔬",
      "color": "from-purple-400 to-indigo-600",
      "exercises": [
        {
          "kind": "mcq",
          "title": "Reported Speech",
          "items": [
            {
              "question": "He said he ___ tired.",
              "options": [
                "is",
                "was",
                "be",
                "were"
              ],
              "answer": 1
            },
            {
              "question": "She told me she ___ finish the experiment.",
              "options": [
                "will",
                "would",
                "shall",
                "can"
              ],
              "answer": 1
            }
          ]
        },
        {
          "kind": "pairs",
          "title": "Science Vocabulary",
          "items": [
            {
              "left": "Hypothesis",
              "right": "فرضية — an idea to be tested",
              "emoji": "🧪"
            },
            {
              "left": "Discovery",
              "right": "اكتشاف — finding something new",
              "emoji": "🔭"
            },
            {
              "left": "Experiment",
              "right": "تجربة — a scientific test",
              "emoji": "⚗️"
            }
          ]
        }
      ]
    }
  ]
},
{
  "id": "sec3",
  "label": "3rd Year Secondary",
  "labelAr": "الثالثة ثانوي",
  "emoji": "🎓",
  "modules": [
    {
      "id": "s3-globalization",
      "title": "Globalization",
      "titleAr": "العولمة",
      "emoji": "🌐",
      "color": "from-blue-400 to-cyan-600",
      "exercises": [
        {
          "kind": "mcq",
          "title": "Advanced Conditionals",
          "items": [
            {
              "question": "If countries ___ together, the world would be more peaceful.",
              "options": [
                "work",
                "worked",
                "will work",
                "working"
              ],
              "answer": 1
            },
            {
              "question": "If she ___ harder, she would have passed the exam.",
              "options": [
                "studied",
                "had studied",
                "studies",
                "would study"
              ],
              "answer": 1
            }
          ]
        },
        {
          "kind": "blanks",
          "title": "Globalization Vocabulary",
          "items": [
            {
              "sentence": "International ___ has increased due to globalization.",
              "answer": "trade"
            },
            {
              "sentence": "Many companies now operate ___ a global scale.",
              "answer": "on"
            }
          ]
        }
      ]
    },
    {
      "id": "s3-social",
      "title": "Social Issues",
      "titleAr": "القضايا الاجتماعية",
      "emoji": "🤝",
      "color": "from-teal-400 to-emerald-600",
      "exercises": [
        {
          "kind": "reading",
          "title": "Youth Unemployment",
          "passage": "Youth unemployment remains a serious challenge in many countries, including Tunisia. Many young graduates struggle to find jobs that match their qualifications. Some governments have launched programs to help young people gain work experience and develop new skills. Experts believe that entrepreneurship and vocational training can play a key role in reducing unemployment among youth.",
          "tf": [
            {
              "statement": "Youth unemployment is not a problem anywhere.",
              "answer": false
            },
            {
              "statement": "Vocational training can help reduce unemployment.",
              "answer": true
            }
          ],
          "blanks": [
            {
              "sentence": "Many graduates ___ to find suitable jobs.",
              "answer": "struggle"
            },
            {
              "sentence": "Entrepreneurship can help ___ unemployment.",
              "answer": "reduce"
            }
          ]
        }
      ]
    }
  ]
},
{
  "id": "bac",
  "label": "Baccalauréat",
  "labelAr": "الباكالوريا (جميع الشعب)",
  "emoji": "🏆",
  "modules": [
    {
      "id": "bac-comprehension",
      "title": "Reading Comprehension",
      "titleAr": "فهم المنطوق والمكتوب",
      "emoji": "📖",
      "color": "from-red-500 to-orange-600",
      "exercises": [
        {
          "kind": "reading",
          "title": "Bac Exam-Style Passage",
          "passage": "Renewable energy is becoming increasingly important around the world as countries try to reduce their dependence on fossil fuels. Solar and wind power are now cheaper than ever, making them attractive options for both developed and developing nations. Tunisia has significant potential for solar energy production due to its sunny climate. Investing in renewable energy could create thousands of new jobs while helping to protect the environment for future generations.",
          "tf": [
            {
              "statement": "Renewable energy is becoming less popular.",
              "answer": false
            },
            {
              "statement": "Tunisia has potential for solar energy.",
              "answer": true
            },
            {
              "statement": "Investing in renewable energy could create jobs.",
              "answer": true
            }
          ],
          "blanks": [
            {
              "sentence": "Solar and wind power are now ___ than before.",
              "answer": "cheaper"
            },
            {
              "sentence": "Renewable energy could help protect the ___ for future generations.",
              "answer": "environment"
            }
          ]
        }
      ]
    },
    {
      "id": "bac-language",
      "title": "Language in Use",
      "titleAr": "الاستعمال اللغوي",
      "emoji": "✍️",
      "color": "from-fuchsia-500 to-pink-600",
      "exercises": [
        {
          "kind": "mcq",
          "title": "Grammar & Vocabulary Review",
          "items": [
            {
              "question": "By the time she arrived, the meeting ___ already started.",
              "options": [
                "has",
                "had",
                "was",
                "is"
              ],
              "answer": 1,
              "explain": "Past perfect for an action completed before another past action."
            },
            {
              "question": "Despite ___ hard, he failed the exam.",
              "options": [
                "study",
                "studying",
                "studied",
                "to study"
              ],
              "answer": 1
            },
            {
              "question": "The report needs to be finished ___ Friday.",
              "options": [
                "until",
                "by",
                "since",
                "for"
              ],
              "answer": 1
            },
            {
              "question": "Hardly ___ the exam started when the fire alarm rang.",
              "options": [
                "had",
                "has",
                "did",
                "was"
              ],
              "answer": 0,
              "explain": "Inversion after 'hardly...when' — advanced Bac-level structure."
            }
          ]
        },
        {
          "kind": "blanks",
          "title": "Guided Writing Vocabulary",
          "items": [
            {
              "sentence": "In conclusion, it is clear ___ renewable energy is the future.",
              "answer": "that"
            },
            {
              "sentence": "On the ___ hand, some argue that the transition will be costly.",
              "answer": "other"
            }
          ]
        }
      ]
    }
  ]
}
];
