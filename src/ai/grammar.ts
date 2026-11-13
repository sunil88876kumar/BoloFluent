export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  hindi: string;
  changed: boolean;
  source: "rules" | "model";
}
const rules: {
  pattern: RegExp;
  replacement: string;
  explanation: string;
  hindi: string;
}[] = [
  {
    pattern: /\bI is\b/gi,
    replacement: "I am",
    explanation: "Use “am” with “I” in the present tense.",
    hindi: "वर्तमान काल में “I” के साथ “am” का प्रयोग करें।",
  },
  {
    pattern: /\bI has\b/gi,
    replacement: "I have",
    explanation: "Use “have” with “I”.",
    hindi: "“I” के साथ “have” का प्रयोग करें।",
  },
  {
    pattern: /\b(He|She|It) don['’]t\b/gi,
    replacement: "$1 doesn’t",
    explanation: "Use “doesn’t” with he, she, and it.",
    hindi: "He, she और it के साथ “doesn’t” का प्रयोग करें।",
  },
  {
    pattern: /\b(He|She|It) have\b/gi,
    replacement: "$1 has",
    explanation: "Use “has” with he, she, and it.",
    hindi: "He, she और it के साथ “has” का प्रयोग करें।",
  },
  {
    pattern: /\b(He|She) go to\b/gi,
    replacement: "$1 goes to",
    explanation: "Add -es to “go” with he or she in the simple present.",
    hindi: "सामान्य वर्तमान काल में he या she के साथ “goes” लिखें।",
  },
  {
    pattern: /\bI am agree\b/gi,
    replacement: "I agree",
    explanation: "“Agree” is a verb. Say “I agree”, without “am”.",
    hindi: "“Agree” एक क्रिया है। “I agree” कहें, “am” न जोड़ें।",
  },
  {
    pattern: /\bI didn['’]t went\b/gi,
    replacement: "I didn’t go",
    explanation: "Use the base verb “go” after “didn’t”.",
    hindi: "“Didn’t” के बाद क्रिया का मूल रूप “go” प्रयोग करें।",
  },
  {
    pattern: /\bmore better\b/gi,
    replacement: "better",
    explanation: "“Better” already means “more good”; do not add “more”.",
    hindi: "“Better” में तुलना का अर्थ पहले से है; “more” न जोड़ें।",
  },
];
export function correctWithRules(input: string): Correction {
  let corrected = input.trim();
  const explanations: string[] = [],
    hindi: string[] = [];
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(corrected)) {
      rule.pattern.lastIndex = 0;
      corrected = corrected.replace(rule.pattern, rule.replacement);
      explanations.push(rule.explanation);
      hindi.push(rule.hindi);
    }
  }
  return {
    original: input.trim(),
    corrected,
    changed: explanations.length > 0,
    source: "rules",
    explanation:
      explanations.join(" ") ||
      "No matching issue found in the basic grammar checks. This is not a complete grammar assessment.",
    hindi:
      hindi.join(" ") ||
      "बुनियादी जाँच में कोई संबंधित गलती नहीं मिली। यह पूरी व्याकरण जाँच नहीं है।",
  };
}
