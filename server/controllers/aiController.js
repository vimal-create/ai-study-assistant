function extractQuestion(prompt) {
  const match = prompt.match(/Question:\s*([\s\S]*)$/i);
  return (match?.[1] || prompt).trim();
}

function topicFromQuestion(question) {
  return question
    .replace(/^(explain|define|what is|write about|describe|give notes on)\s+/i, "")
    .replace(/\s+(in exam-ready points|in simple words|briefly)$/i, "")
    .trim()
    .replace(/[?.!]+$/, "");
}

function isFollowUp(question) {
  return /^(give\s+more\s+matter|more|explain\s+more|tell\s+more|continue|expand|elaborate|add\s+more)$/i.test(
    question.trim()
  );
}

function lastStudentTopic(history = []) {
  const previous = [...history]
    .reverse()
    .find((message) => message.role === "student" && !isFollowUp(message.content || ""));

  return previous ? topicFromQuestion(previous.content) : "";
}

const recentTopics = new Map();

function topicKey(subject) {
  return subject || "General";
}

const topicAnswers = {
  "avl tree": [
    "An AVL Tree is a self-balancing Binary Search Tree.",
    "",
    "Definition:",
    "In an AVL Tree, for every node, the height difference between the left and right subtree is at most 1. This difference is called the balance factor.",
    "",
    "Balance Factor:",
    "Balance Factor = height(left subtree) - height(right subtree)",
    "Allowed values are -1, 0, and +1.",
    "",
    "Why it is used:",
    "A normal Binary Search Tree can become skewed, making search slow. AVL Trees keep the tree balanced, so search, insertion, and deletion remain efficient.",
    "",
    "Rotations:",
    "1. LL Rotation: fixed using right rotation.",
    "2. RR Rotation: fixed using left rotation.",
    "3. LR Rotation: fixed using left rotation, then right rotation.",
    "4. RL Rotation: fixed using right rotation, then left rotation.",
    "",
    "Time Complexity:",
    "Search: O(log n)",
    "Insertion: O(log n)",
    "Deletion: O(log n)",
    "",
    "Exam point:",
    "AVL Tree is stricter than Red-Black Tree, so searching is faster, but insertion and deletion may need more rotations.",
  ],
  "binary search": [
    "Binary Search is a searching algorithm used on sorted data.",
    "",
    "Main idea:",
    "It repeatedly compares the target with the middle element and eliminates half of the search space.",
    "",
    "Steps:",
    "1. Find the middle element.",
    "2. If middle is the target, return the position.",
    "3. If target is smaller, search the left half.",
    "4. If target is larger, search the right half.",
    "",
    "Time Complexity: O(log n)",
    "Space Complexity: O(1) for iterative version.",
  ],
  "dbms": [
    "DBMS stands for Database Management System.",
    "",
    "Definition:",
    "A DBMS is software used to store, manage, retrieve, and organize data efficiently.",
    "",
    "Examples:",
    "MySQL, MongoDB, Oracle, PostgreSQL.",
    "",
    "Advantages:",
    "1. Reduces data redundancy.",
    "2. Improves data security.",
    "3. Supports data sharing.",
    "4. Maintains consistency and integrity.",
  ],
};

function expandedTopicAnswer(topic) {
  if (topic.toLowerCase().includes("avl tree")) {
    return [
      ...topicAnswers["avl tree"],
      "",
      "Extra Matter for Long Answer:",
      "",
      "Properties:",
      "1. It follows all rules of a Binary Search Tree.",
      "2. The left child contains smaller values and the right child contains larger values.",
      "3. The height of the tree is always kept nearly balanced.",
      "4. Rebalancing is done after insertion and deletion.",
      "",
      "Insertion in AVL Tree:",
      "1. Insert the new node like a normal Binary Search Tree.",
      "2. Move upward from the inserted node and update heights.",
      "3. Calculate the balance factor of each ancestor.",
      "4. If balance factor becomes less than -1 or greater than +1, apply rotation.",
      "",
      "Deletion in AVL Tree:",
      "1. Delete the node like in a normal Binary Search Tree.",
      "2. Update heights while moving back upward.",
      "3. Check balance factor.",
      "4. Apply suitable rotation if the tree becomes unbalanced.",
      "",
      "Advantages:",
      "1. Faster searching compared to an unbalanced BST.",
      "2. Guarantees O(log n) height.",
      "3. Useful when search operations are more frequent.",
      "",
      "Disadvantages:",
      "1. Rotations make insertion and deletion slightly costly.",
      "2. Implementation is more complex than a normal BST.",
      "",
      "Small example:",
      "If values 30, 20, and 10 are inserted, the tree becomes left-left unbalanced. A right rotation is applied on 30, making 20 the root.",
    ].join("\n");
  }

  return [
    localStudyAnswer(`Question: Explain ${topic}`),
    "",
    "Extra Matter:",
    "Add a neat diagram if possible, explain the working step by step, mention advantages and disadvantages, and include one example. This makes the answer suitable for a 5-mark or 10-mark exam question.",
  ].join("\n");
}

function localStudyAnswer(prompt, history = [], fallbackTopic = "") {
  const question = extractQuestion(prompt);
  const topic = isFollowUp(question)
    ? lastStudentTopic(history) || fallbackTopic || topicFromQuestion(question)
    : topicFromQuestion(question);
  const key = Object.keys(topicAnswers).find((item) => topic.toLowerCase().includes(item));

  if (isFollowUp(question) && topic) {
    return expandedTopicAnswer(topic);
  }

  if (key) {
    return topicAnswers[key].join("\n");
  }

  return [
    "Exam-ready explanation:",
    "",
    `Topic: ${topic || "Selected topic"}`,
    "",
    "Definition:",
    `${topic || "This concept"} is an important topic. Write the answer by first giving a clear definition, then explaining the working or purpose.`,
    "",
    "Key points:",
    "1. Mention what the concept means.",
    "2. Explain why it is used.",
    "3. Add important properties, steps, or formulas.",
    "4. Give one small example.",
    "5. End with advantages, limitations, or time complexity if relevant.",
    "",
    "Exam tip:",
    "Use headings, short points, and one diagram or example wherever possible.",
  ].join("\n");
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 25)
    .slice(0, 8);
}

function localSummary(text, subject) {
  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    return localStudyAnswer(`Question: Explain important ${subject} concepts`);
  }

  return [
    `${subject} Revision Summary`,
    "",
    ...sentences.slice(0, 6).map((sentence, index) => `${index + 1}. ${sentence}`),
    "",
    "Last-minute revision:",
    "Focus on definitions, diagrams, formulas, steps, advantages, disadvantages, and examples.",
  ].join("\n");
}

function localFlashcards(text, subject) {
  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    return [
      { question: `What is ${subject}?`, answer: `Write a definition, purpose, and example related to ${subject}.` },
      { question: "How should an exam answer be structured?", answer: "Definition, key points, example or diagram, and conclusion." },
      { question: "What should be revised before an exam?", answer: "Important formulas, definitions, steps, and common mistakes." },
    ];
  }

  return sentences.slice(0, 6).map((sentence, index) => ({
    question: `Flashcard ${index + 1}: What is the key idea?`,
    answer: sentence,
  }));
}

function localQuiz(text, subject) {
  const cards = localFlashcards(text, subject).slice(0, 5);
  return cards.map((card, index) => ({
    question: `Which statement is correct for ${subject} topic ${index + 1}?`,
    options: [
      card.answer,
      "It is unrelated to the topic.",
      "It is only used for formatting text.",
      "It always has constant time complexity.",
    ],
    answer: card.answer,
  }));
}

async function callOpenAI(systemPrompt, userPrompt) {
  if (!process.env.OPENAI_API_KEY) {
    return localStudyAnswer(userPrompt);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.35,
    }),
  });

  if (!response.ok) {
    throw new Error("AI provider request failed.");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function askQuestion(req, res) {
  const { question, context = "", subject = "General", history = [] } = req.body;
  const key = topicKey(subject);
  const currentTopic = topicFromQuestion(question);
  const previousTopic = recentTopics.get(key) || "";

  if (!process.env.OPENAI_API_KEY) {
    const answer = localStudyAnswer(
      `Subject: ${subject}\nNotes context:\n${context.slice(0, 5000)}\n\nQuestion: ${question}`,
      history,
      previousTopic
    );

    if (!isFollowUp(question) && currentTopic) {
      recentTopics.set(key, currentTopic);
    }

    return res.json({ answer });
  }

  const historyText = history
    .map((message) => `${message.role === "student" ? "Student" : "Assistant"}: ${message.content}`)
    .join("\n");

  const answer = await callOpenAI(
    "You are an AI study assistant. Explain concepts in simple, exam-ready language.",
    `Subject: ${subject}\nNotes context:\n${context.slice(0, 5000)}\n\nRecent chat:\n${historyText}\n\nQuestion: ${question}`
  );
  res.json({ answer });
}

export async function createSummary(req, res) {
  const { text = "", subject = "General" } = req.body;
  if (!process.env.OPENAI_API_KEY) {
    return res.json({ summary: localSummary(text, subject) });
  }

  const summary = await callOpenAI(
    "Create crisp revision notes with headings and bullet points.",
    `Subject: ${subject}\nSummarize this for exam revision:\n${text.slice(0, 6000)}`
  );
  res.json({ summary });
}

export async function createFlashcards(req, res) {
  const { text = "", subject = "General" } = req.body;
  if (!process.env.OPENAI_API_KEY) {
    return res.json({ flashcards: localFlashcards(text, subject) });
  }

  const content = await callOpenAI(
    "Return only valid JSON array. Each item must have question and answer.",
    `Generate 8 flashcards for ${subject} from:\n${text.slice(0, 6000)}`
  );
  res.json({ flashcards: JSON.parse(content) });
}

export async function createQuiz(req, res) {
  const { text = "", subject = "General" } = req.body;
  if (!process.env.OPENAI_API_KEY) {
    return res.json({ quiz: localQuiz(text, subject) });
  }

  const content = await callOpenAI(
    "Return only valid JSON array. Each item must have question, options, and answer.",
    `Generate 5 MCQs for ${subject} from:\n${text.slice(0, 6000)}`
  );
  res.json({ quiz: JSON.parse(content) });
}
