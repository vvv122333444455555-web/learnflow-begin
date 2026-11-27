// LearnFlow Kids — Unit 1 "Hello, English!" (Pre-A1). Pure content; no network.
export type Character = "adam" | "sara" | "robo" | "tom";
export type Line = { speaker: Character; text: string };
export type Vocab = { word: string; emoji: string; hint?: string };
export type MCQ = { q: string; say?: string; picture?: string; options: string[]; answer: number; why: string };
export type Pair = { left: string; right: string };

export type Activity =
  | { kind: "flashcards"; title: string; cards: Vocab[] }
  | { kind: "listen-repeat"; title: string; phrases: string[] }
  | { kind: "match"; title: string; pairs: Pair[] }
  | { kind: "mcq"; title: string; items: MCQ[] }
  | { kind: "order"; title: string; lines: Line[] }
  | { kind: "build"; title: string; sentences: string[] }
  | { kind: "fill"; title: string; items: { before: string; after: string; answer: string; options: string[] }[] }
  | { kind: "memory"; title: string; pairs: Pair[] }
  | { kind: "speak"; title: string; phrases: string[] }
  | { kind: "alphabet-chart"; title: string }
  | { kind: "alphabet-train"; title: string; letters: string[] }
  | { kind: "missing-letter"; title: string; items: { seq: string[]; answer: string; options: string[] }[] }
  | { kind: "trace"; title: string; letters: string[] }
  | { kind: "sound-hunt"; title: string; items: { sound: string; options: Vocab[]; answer: number }[] }
  | { kind: "spell"; title: string; words: { word: string; emoji: string }[] }
  | { kind: "card"; title: string; template: "intro" | "friend" };

export type Lesson = {
  n: number;
  title: string;
  scene: "garden" | "classroom" | "library" | "playground";
  objectives: string[];
  vocabulary: string[];
  dialogue: Line[];
  activities: Activity[];
  quiz: MCQ[];
  teacher: { sequence: string[]; criteria: string[]; notes: string[] };
};

export const ALPHABET: Vocab[] = [
  ["A","Apple","🍎"],["B","Ball","⚽"],["C","Cat","🐱"],["D","Dog","🐶"],["E","Elephant","🐘"],["F","Fish","🐟"],
  ["G","Girl","👧"],["H","House","🏠"],["I","Ice cream","🍦"],["J","Juice","🧃"],["K","Kite","🪁"],["L","Lion","🦁"],
  ["M","Monkey","🐵"],["N","Nest","🪺"],["O","Orange","🍊"],["P","Pencil","✏️"],["Q","Queen","👑"],["R","Rabbit","🐰"],
  ["S","Sun","☀️"],["T","Tiger","🐯"],["U","Umbrella","☂️"],["V","Van","🚐"],["W","Water","💧"],["X","Xylophone","🎼"],
  ["Y","Yo-yo","🪀"],["Z","Zebra","🦓"],
].map(([l, w, e]) => ({ word: w!, emoji: e!, hint: l! }));

const greetCards: Vocab[] = [
  { word: "Hello", emoji: "👋", hint: "Any time" },
  { word: "Hi", emoji: "🙋", hint: "With friends" },
  { word: "Good morning", emoji: "🌅", hint: "Before 12 o'clock" },
  { word: "Good afternoon", emoji: "🌤️", hint: "After lunch" },
  { word: "Goodbye", emoji: "🚌", hint: "When you leave" },
];

export const LESSONS: Lesson[] = [
  {
    n: 1, title: "Hello!", scene: "garden",
    objectives: ["Greet people", "Recognise basic greetings", "Ask and answer “How are you?”", "Say goodbye"],
    vocabulary: ["Hello", "Hi", "Good morning", "Good afternoon", "Goodbye", "How are you?", "I'm fine, thank you.", "And you?"],
    dialogue: [
      { speaker: "adam", text: "Good morning, Sara!" },
      { speaker: "sara", text: "Good morning, Adam!" },
      { speaker: "adam", text: "How are you?" },
      { speaker: "sara", text: "I'm fine, thank you. And you?" },
      { speaker: "adam", text: "I'm fine, too!" },
      { speaker: "sara", text: "Goodbye, Adam!" },
      { speaker: "adam", text: "Goodbye, Sara!" },
    ],
    activities: [
      { kind: "flashcards", title: "Greeting flashcards", cards: greetCards },
      { kind: "listen-repeat", title: "Listen and repeat", phrases: ["Hello!", "Hi!", "Good morning!", "Good afternoon!", "Goodbye!", "How are you?", "I'm fine, thank you. And you?"] },
      { kind: "match", title: "Greeting Match", pairs: [
        { left: "🌅 Sun is rising", right: "Good morning" }, { left: "🌤️ After lunch", right: "Good afternoon" },
        { left: "🚌 Going home", right: "Goodbye" }, { left: "🙋 Meeting a friend", right: "Hi" } ] },
      { kind: "mcq", title: "Greeting Adventure — help Adam!", items: [
        { q: "Adam meets his teacher at 8 o'clock. What does he say?", picture: "🏫🌅", options: ["Good morning!", "Goodbye!", "Good afternoon!"], answer: 0, why: "8 o'clock is in the morning." },
        { q: "Adam sees Sara after lunch.", picture: "🍽️🌤️", options: ["Good morning!", "Good afternoon!", "Goodbye!"], answer: 1, why: "After lunch we say Good afternoon." },
        { q: "School is over. Adam leaves.", picture: "🎒🚌", options: ["Hello!", "How are you?", "Goodbye!"], answer: 2, why: "When we leave we say Goodbye." },
        { q: "Sara asks: “How are you?”", picture: "👧❓", options: ["I'm fine, thank you.", "Goodbye.", "Good morning."], answer: 0, why: "We answer How are you? with I'm fine, thank you." },
      ] },
      { kind: "order", title: "Put the dialogue in order", lines: [
        { speaker: "adam", text: "Good morning, Sara!" }, { speaker: "sara", text: "Good morning, Adam!" },
        { speaker: "adam", text: "How are you?" }, { speaker: "sara", text: "I'm fine, thank you. And you?" }, { speaker: "adam", text: "I'm fine, too!" } ] },
      { kind: "speak", title: "Practise saying greetings", phrases: ["Hello!", "Good morning!", "How are you?", "I'm fine, thank you.", "Goodbye!"] },
      { kind: "mcq", title: "Listen and Choose", items: [
        { q: "Listen. Which picture?", say: "Good morning", options: ["🌅", "🌙", "🚌"], answer: 0, why: "Good morning — the sun is rising." },
        { q: "Listen. Which picture?", say: "Goodbye", options: ["👋🚌", "🍎", "🌅"], answer: 0, why: "Goodbye — going home." },
        { q: "Listen. Which picture?", say: "Good afternoon", options: ["🌙", "🌤️", "🌅"], answer: 1, why: "Good afternoon — after lunch." },
      ] },
    ],
    quiz: [
      { q: "Choose the greeting for the morning.", options: ["Good morning", "Goodbye", "Good afternoon"], answer: 0, why: "Morning → Good morning." },
      { q: "“How are you?” — choose the answer.", options: ["I'm fine, thank you.", "My name is Sara.", "Goodbye."], answer: 0, why: "I'm fine, thank you." },
      { q: "You leave school. You say…", options: ["Hello", "Goodbye", "Hi"], answer: 1, why: "Goodbye when we leave." },
    ],
    teacher: {
      sequence: ["Warm-up: wave and say Hello to each child (2 min)", "Present flashcards with the sun/clock cues (5 min)", "Play the dialogue twice; children repeat chorally (5 min)", "Greeting Match and Greeting Adventure in pairs (10 min)", "Order the dialogue; role-play it in pairs (8 min)", "Lesson quiz + worksheet (10 min)"],
      criteria: ["Uses the right greeting for time of day", "Answers How are you? with a full phrase", "Says Goodbye appropriately", "Reads the five greetings aloud"],
      notes: ["Use a paper clock to show morning/afternoon.", "Pronunciation practice is self-practice only; listen to each child yourself."],
    },
  },
  {
    n: 2, title: "What's Your Name?", scene: "classroom",
    objectives: ["Ask someone's name", "Introduce oneself", "Respond politely"],
    vocabulary: ["What's your name?", "My name is…", "I'm…", "Nice to meet you.", "Nice to meet you, too!"],
    dialogue: [
      { speaker: "adam", text: "Hello!" }, { speaker: "sara", text: "Hi!" },
      { speaker: "adam", text: "What's your name?" }, { speaker: "sara", text: "My name is Sara. What's your name?" },
      { speaker: "adam", text: "I'm Adam." }, { speaker: "sara", text: "Nice to meet you, Adam!" },
      { speaker: "adam", text: "Nice to meet you, too!" },
    ],
    activities: [
      { kind: "flashcards", title: "Name cards", cards: [
        { word: "My name is Adam.", emoji: "👦" }, { word: "My name is Sara.", emoji: "👧" },
        { word: "I'm Robo.", emoji: "🤖" }, { word: "Nice to meet you!", emoji: "🤝" } ] },
      { kind: "listen-repeat", title: "Listen to the dialogue", phrases: ["What's your name?", "My name is Sara.", "I'm Adam.", "Nice to meet you!", "Nice to meet you, too!"] },
      { kind: "fill", title: "Complete the missing words", items: [
        { before: "What's your", after: "?", answer: "name", options: ["name", "fine", "morning"] },
        { before: "My name", after: "Sara.", answer: "is", options: ["is", "are", "you"] },
        { before: "Nice to", after: "you!", answer: "meet", options: ["meet", "name", "hello"] },
        { before: "", after: "Adam.", answer: "I'm", options: ["I'm", "You", "Is"] } ] },
      { kind: "match", title: "Meet and Match — questions and answers", pairs: [
        { left: "What's your name?", right: "My name is Sara." }, { left: "Nice to meet you!", right: "Nice to meet you, too!" },
        { left: "How are you?", right: "I'm fine, thank you." }, { left: "Hello!", right: "Hi!" } ] },
      { kind: "order", title: "Arrange the dialogue", lines: [
        { speaker: "adam", text: "What's your name?" }, { speaker: "sara", text: "My name is Sara. What's your name?" },
        { speaker: "adam", text: "I'm Adam." }, { speaker: "sara", text: "Nice to meet you, Adam!" } ] },
      { kind: "build", title: "Build Your Introduction", sentences: ["My name is Sara.", "What's your name?", "Nice to meet you."] },
      { kind: "mcq", title: "Who Am I?", items: [
        { q: "“Hello! I'm a robot. I help you learn.” Who am I?", options: ["Robo 🤖", "Sara 👧", "Adam 👦"], answer: 0, why: "Robo is the robot." },
        { q: "“Hi! My name is Sara. I'm a girl.” Who am I?", options: ["Adam 👦", "Sara 👧", "Tom 🧒"], answer: 1, why: "She says My name is Sara." },
        { q: "“Hello! I'm Adam. I wear blue.” Who am I?", options: ["Adam 👦", "Robo 🤖", "Sara 👧"], answer: 0, why: "Adam wears blue." } ] },
      { kind: "speak", title: "Practise introducing yourself", phrases: ["Hello! What's your name?", "My name is …", "Nice to meet you!"] },
      { kind: "card", title: "My introduction card", template: "intro" },
    ],
    quiz: [
      { q: "Ask a new friend's name:", options: ["What's your name?", "How are you?", "Goodbye!"], answer: 0, why: "What's your name? asks for a name." },
      { q: "My ___ is Adam.", options: ["name", "fine", "friend"], answer: 0, why: "My name is Adam." },
      { q: "“Nice to meet you!” — answer:", options: ["Nice to meet you, too!", "Good morning.", "I'm a boy."], answer: 0, why: "We add too." },
    ],
    teacher: {
      sequence: ["Teacher models: Hello, my name is … (2 min)", "Name cards and listening (6 min)", "Fill the gaps and Meet and Match (10 min)", "Arrange the dialogue, then pairs role-play (8 min)", "Children make their introduction card (10 min)", "Quiz (5 min)"],
      criteria: ["Asks What's your name? correctly", "Introduces self with My name is / I'm", "Responds with Nice to meet you (too)"],
      notes: ["Accept both My name is… and I'm….", "Use a ball toss: the child who catches it introduces themself."],
    },
  },
  {
    n: 3, title: "The Alphabet", scene: "library",
    objectives: ["Recognise the English alphabet", "Identify uppercase and lowercase letters", "Link letters with familiar words and first sounds"],
    vocabulary: ALPHABET.map((a) => `${a.hint} – ${a.word}`),
    dialogue: [
      { speaker: "robo", text: "Letters have a NAME and a SOUND." },
      { speaker: "adam", text: "The letter name is “bee”. The sound is /b/." },
      { speaker: "sara", text: "B is for ball! /b/ /b/ ball!" },
      { speaker: "robo", text: "Today we learn the sounds of A, B, C, D, S and T. Little by little!" },
    ],
    activities: [
      { kind: "alphabet-chart", title: "Interactive alphabet chart" },
      { kind: "memory", title: "Letter Match — uppercase and lowercase", pairs: ["A","B","D","G","M","R"].map((l) => ({ left: l, right: l.toLowerCase() })) },
      { kind: "mcq", title: "Listen and identify the letter", items: [
        { q: "Listen. Which letter?", say: "B", options: ["D", "B", "P"], answer: 1, why: "That was the letter B." },
        { q: "Listen. Which letter?", say: "M", options: ["N", "W", "M"], answer: 2, why: "That was the letter M." },
        { q: "Listen. Which letter?", say: "G", options: ["G", "J", "C"], answer: 0, why: "That was the letter G." } ] },
      { kind: "trace", title: "Trace the letters", letters: ["A", "a", "B", "b", "C", "c"] },
      { kind: "sound-hunt", title: "Letter Sound Hunt", items: [
        { sound: "/s/", options: [{ word: "Sun", emoji: "☀️" }, { word: "Cat", emoji: "🐱" }, { word: "Dog", emoji: "🐶" }], answer: 0 },
        { sound: "/t/", options: [{ word: "Apple", emoji: "🍎" }, { word: "Tiger", emoji: "🐯" }, { word: "Ball", emoji: "⚽" }], answer: 1 },
        { sound: "/d/", options: [{ word: "Fish", emoji: "🐟" }, { word: "Sun", emoji: "☀️" }, { word: "Dog", emoji: "🐶" }], answer: 2 },
        { sound: "/b/", options: [{ word: "Ball", emoji: "⚽" }, { word: "Kite", emoji: "🪁" }, { word: "Lion", emoji: "🦁" }], answer: 0 } ] },
      { kind: "alphabet-train", title: "Alphabet Train", letters: ["A", "B", "C", "D", "E", "F"] },
      { kind: "missing-letter", title: "Missing Letter", items: [
        { seq: ["A", "B", "?", "D"], answer: "C", options: ["C", "E", "G"] },
        { seq: ["K", "?", "M", "N"], answer: "L", options: ["J", "L", "O"] },
        { seq: ["W", "X", "?", "Z"], answer: "Y", options: ["V", "Y", "U"] } ] },
      { kind: "spell", title: "Build simple words", words: [{ word: "CAT", emoji: "🐱" }, { word: "DOG", emoji: "🐶" }, { word: "SUN", emoji: "☀️" }] },
    ],
    quiz: [
      { q: "Which is lowercase “b”?", options: ["B", "b", "d"], answer: 1, why: "b is lowercase, B is uppercase." },
      { q: "Which word starts with /s/?", options: ["Sun ☀️", "Cat 🐱", "Apple 🍎"], answer: 0, why: "Sun starts with /s/." },
      { q: "A, B, C, ___", options: ["E", "D", "F"], answer: 1, why: "D comes after C." },
    ],
    teacher: {
      sequence: ["Sing the alphabet song (3 min)", "Explore the chart: say the letter NAME, then the SOUND (8 min)", "Focus sounds today: /a/ /b/ /k/ /d/ /s/ /t/ (5 min)", "Letter Match + Sound Hunt (10 min)", "Tracing sheet (8 min)", "Alphabet Train, Missing Letter, quiz (10 min)"],
      criteria: ["Recites A–Z in order with support", "Matches upper- and lowercase", "Identifies the first sound of 4 of the 6 focus words"],
      notes: ["Do not expect mastery of all 26 letters in one lesson; revisit across the unit.", "Keep letter names and sounds clearly separate: “bee” vs /b/."],
    },
  },
  {
    n: 4, title: "Meet My Friends", scene: "playground",
    objectives: ["Introduce another person", "Identify boys and girls", "Use simple descriptions"],
    vocabulary: ["This is Adam.", "This is Sara.", "He is a boy.", "She is a girl.", "He is my friend.", "She is my friend."],
    dialogue: [
      { speaker: "adam", text: "Hello, Sara!" }, { speaker: "sara", text: "Hi, Adam!" },
      { speaker: "adam", text: "This is my friend, Tom." }, { speaker: "sara", text: "Hello, Tom!" },
      { speaker: "tom", text: "Hi, Sara!" }, { speaker: "adam", text: "This is my friend, Sara." },
      { speaker: "tom", text: "Nice to meet you, Sara!" }, { speaker: "sara", text: "Nice to meet you, too!" },
    ],
    activities: [
      { kind: "flashcards", title: "Meet the characters", cards: [
        { word: "This is Adam. He is a boy.", emoji: "👦" }, { word: "This is Sara. She is a girl.", emoji: "👧" },
        { word: "This is Tom. He is my friend.", emoji: "🧒" }, { word: "This is Robo. It is a robot.", emoji: "🤖" } ] },
      { kind: "listen-repeat", title: "Listen to introductions", phrases: ["This is Adam.", "He is a boy.", "This is Sara.", "She is a girl.", "She is my friend."] },
      { kind: "match", title: "Friend Match", pairs: [
        { left: "👦 blue T-shirt", right: "Adam" }, { left: "👧 pink dress", right: "Sara" }, { left: "🧒 green cap", right: "Tom" }, { left: "🤖 robot", right: "Robo" } ] },
      { kind: "mcq", title: "He or She?", items: [
        { q: "Sara: ___ is a girl.", picture: "👧", options: ["He", "She"], answer: 1, why: "Sara is a girl → She." },
        { q: "Adam: ___ is a boy.", picture: "👦", options: ["He", "She"], answer: 0, why: "Adam is a boy → He." },
        { q: "Tom: ___ is my friend.", picture: "🧒", options: ["He", "She"], answer: 0, why: "Tom is a boy → He." } ] },
      { kind: "fill", title: "Complete the sentences", items: [
        { before: "", after: "is Sara.", answer: "This", options: ["This", "He", "My"] },
        { before: "She is a", after: ".", answer: "girl", options: ["boy", "girl", "name"] },
        { before: "He is my", after: ".", answer: "friend", options: ["friend", "fine", "girl"] } ] },
      { kind: "mcq", title: "Who Is It?", items: [
        { q: "He is a boy. He wears a green cap.", options: ["Tom", "Sara", "Robo"], answer: 0, why: "Tom wears a green cap." },
        { q: "She is a girl. She is Adam's friend.", options: ["Adam", "Sara", "Tom"], answer: 1, why: "Sara is a girl." } ] },
      { kind: "build", title: "Introduce Your Friends", sentences: ["This is my friend Tom.", "She is a girl.", "He is my friend."] },
      { kind: "speak", title: "Introduce a friend", phrases: ["This is my friend …", "He is a boy.", "She is a girl."] },
      { kind: "card", title: "My friend card", template: "friend" },
    ],
    quiz: [
      { q: "Introduce Sara:", options: ["This is Sara.", "I'm Sara.", "Goodbye, Sara."], answer: 0, why: "This is… introduces another person." },
      { q: "Tom is a boy. ___ is my friend.", options: ["She", "He"], answer: 1, why: "Boy → He." },
      { q: "Sara is a ___.", options: ["girl", "boy"], answer: 0, why: "Sara is a girl." },
    ],
    teacher: {
      sequence: ["Review Lesson 2 introductions (3 min)", "Meet the characters; model This is… (5 min)", "Story listening twice (5 min)", "He/She practice and Friend Match (10 min)", "Build sentences; children introduce a classmate (10 min)", "Friend card + quiz (10 min)"],
      criteria: ["Uses This is… to introduce someone", "Chooses he/she correctly", "Says He/She is my friend"],
      notes: ["Contrast I'm (myself) with This is (another person).", "Robo uses “it” — mention only if children ask."],
    },
  },
];

export type AssessmentItem = MCQ & { skill: string; type: "choice" | "listen" | "write"; accept?: string[] };
export const ASSESSMENT: AssessmentItem[] = [
  { skill: "Vocabulary", type: "choice", q: "Which picture is “Good morning”?", options: ["🌅", "🌙", "🍽️"], answer: 0, why: "The rising sun shows the morning." },
  { skill: "Vocabulary", type: "choice", q: "🍎 starts with…", options: ["A", "B", "E"], answer: 0, why: "A is for Apple." },
  { skill: "Greetings", type: "choice", q: "After lunch you say…", options: ["Good morning", "Good afternoon", "Goodbye"], answer: 1, why: "After lunch → Good afternoon." },
  { skill: "Greetings", type: "choice", q: "“How are you?”", options: ["I'm fine, thank you.", "I'm Adam.", "This is Tom."], answer: 0, why: "We answer with how we feel." },
  { skill: "Introductions", type: "choice", q: "“What's your name?”", options: ["My name is Sara.", "She is a girl.", "Goodbye."], answer: 0, why: "Give your name." },
  { skill: "Introductions", type: "choice", q: "“Nice to meet you!”", options: ["Nice to meet you, too!", "Good morning!", "I'm fine."], answer: 0, why: "Answer with …too!" },
  { skill: "Alphabet", type: "choice", q: "D, E, ___, G", options: ["H", "F", "C"], answer: 1, why: "F comes after E." },
  { skill: "Alphabet", type: "choice", q: "🐯 starts with the sound…", options: ["/t/", "/d/", "/s/"], answer: 0, why: "Tiger starts with /t/." },
  { skill: "Upper & lowercase", type: "choice", q: "Lowercase of “G”:", options: ["q", "g", "j"], answer: 1, why: "G → g." },
  { skill: "Upper & lowercase", type: "choice", q: "Uppercase of “r”:", options: ["R", "P", "B"], answer: 0, why: "r → R." },
  { skill: "Listening", type: "listen", say: "Goodbye", q: "Listen. What did you hear?", options: ["Hello", "Goodbye", "Good morning"], answer: 1, why: "You heard Goodbye." },
  { skill: "Listening", type: "listen", say: "This is my friend, Tom.", q: "Listen. Who is the friend?", options: ["Sara", "Robo", "Tom"], answer: 2, why: "This is my friend, Tom." },
  { skill: "Listening", type: "listen", say: "M", q: "Listen. Which letter?", options: ["N", "M", "W"], answer: 1, why: "The letter M." },
  { skill: "Reading", type: "choice", picture: "👧", q: "Read and choose: “She is a girl.”", options: ["👧", "👦", "🤖"], answer: 0, why: "She → a girl." },
  { skill: "Reading", type: "choice", picture: "🚌", q: "Read: “Goodbye, Adam!” When do we say it?", options: ["When we arrive", "When we leave", "At breakfast"], answer: 1, why: "Goodbye is for leaving." },
  { skill: "Writing", type: "write", q: "Write the missing word: My ___ is Sara.", options: [], answer: 0, accept: ["name"], why: "My name is Sara." },
  { skill: "Writing", type: "write", q: "Write the greeting: Good ___ (🌅)", options: [], answer: 0, accept: ["morning"], why: "Good morning." },
  { skill: "Introducing a friend", type: "choice", q: "Introduce Tom:", options: ["This is my friend, Tom.", "I'm Tom.", "Tom is fine."], answer: 0, why: "This is my friend… introduces Tom." },
  { skill: "Introducing a friend", type: "choice", q: "Sara is my friend. ___ is a girl.", options: ["He", "She"], answer: 1, why: "Girl → She." },
];

export const REWARDS = ["Excellent!", "Well done!", "You're a Little Explorer!", "Keep learning!", "Super star!"];
