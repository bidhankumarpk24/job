import * as pdfjsLib from "pdfjs-dist";
import * as mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export type AnalysisResult = {
  matchingSkills: string[];
  matchingExperience: string[];
  missingSkills: string[];
  keywords: string[];
  coverLetter: string;
  applicationMessage: string;
  candidateName: string;
};

type Skill = { label: string; patterns: string[] };

const SKILLS: Skill[] = [
  { label: "JavaScript", patterns: ["javascript", "js"] },
  { label: "TypeScript", patterns: ["typescript", "ts"] },
  { label: "React", patterns: ["react", "react.js", "reactjs"] },
  { label: "Vue", patterns: ["vue", "vue.js", "vuejs"] },
  { label: "Angular", patterns: ["angular"] },
  { label: "Node.js", patterns: ["node.js", "nodejs", "node js"] },
  { label: "Python", patterns: ["python"] },
  { label: "Java", patterns: ["java"] },
  { label: "C#", patterns: ["c#", "c sharp"] },
  { label: "SQL", patterns: ["sql", "postgresql", "mysql"] },
  { label: "Git", patterns: ["git", "github", "gitlab"] },
  { label: "AWS", patterns: ["aws", "amazon web services"] },
  { label: "Azure", patterns: ["azure"] },
  { label: "Docker", patterns: ["docker"] },
  { label: "Kubernetes", patterns: ["kubernetes", "k8s"] },
  { label: "Figma", patterns: ["figma"] },
  { label: "Excel", patterns: ["excel", "microsoft excel"] },
  { label: "Power BI", patterns: ["power bi", "powerbi"] },
  { label: "Tableau", patterns: ["tableau"] },
  { label: "Project management", patterns: ["project management", "project manager"] },
  { label: "Product management", patterns: ["product management", "product manager"] },
  { label: "Data analysis", patterns: ["data analysis", "data analytics", "data analyst"] },
  { label: "Research", patterns: ["research", "user research"] },
  { label: "Communication", patterns: ["communication", "communicating"] },
  { label: "Leadership", patterns: ["leadership", "leading", "team lead"] },
  { label: "Agile", patterns: ["agile", "scrum", "kanban"] },
  { label: "Marketing", patterns: ["marketing", "digital marketing"] },
  { label: "Sales", patterns: ["sales", "business development"] },
  { label: "Customer service", patterns: ["customer service", "customer support"] },
  { label: "Content writing", patterns: ["content writing", "copywriting", "copywriter"] },
  { label: "SEO", patterns: ["seo", "search engine optimization"] },
  { label: "APIs", patterns: ["api", "apis", "rest api", "restful"] },
  { label: "Testing", patterns: ["testing", "unit test", "integration test", "test automation"] },
  { label: "Accessibility", patterns: ["accessibility", "accessible", "wcag"] },
  { label: "Responsive design", patterns: ["responsive design", "responsive web", "mobile-first"] },
  { label: "HTML", patterns: ["html", "html5"] },
  { label: "CSS", patterns: ["css", "css3", "scss", "sass"] },
];

const STOP_WORDS = new Set(
  `about after again against all also and any are as at be because been before being between both but by can could did do does doing down during each for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself yourselves`.split(
    " ",
  ),
);

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ");
}

function includesPattern(haystack: string, pattern: string) {
  const safe = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${safe}(?=$|\\s|[,.])`, "i").test(haystack);
}

function sentenceList(text: string) {
  return text
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim().replace(/\s+/g, " "))
    .filter((sentence) => sentence.length > 28 && sentence.length < 260);
}

function getRelevantSkills(text: string) {
  const clean = normalized(text);
  return SKILLS.filter((skill) => skill.patterns.some((pattern) => includesPattern(clean, pattern)));
}

function displayName(cvText: string) {
  const firstLines = cvText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);
  const candidate = firstLines.find((line) => {
    const words = line.split(/\s+/);
    return words.length >= 2 && words.length <= 4 && line.length <= 50 && !/[|@:/]/.test(line) && !/resume|curriculum|profile|linkedin|phone/i.test(line);
  });
  return candidate || "Your Name";
}

function extractKeywords(jobDescription: string, limit = 12) {
  const clean = normalized(jobDescription);
  const phraseKeywords = SKILLS.filter((skill) => skill.patterns.some((pattern) => includesPattern(clean, pattern))).map((skill) => skill.label);
  const words = clean
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word) && !/^\d+$/.test(word) && !/^(role|work|team|job|candidate|looking|using|years?)$/.test(word));
  const counts = new Map<string, number>();
  words.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  const frequent = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([word]) => word.replace(/[.,]/g, "").replace(/^./, (char) => char.toUpperCase()));
  const seen = new Set<string>();
  return [...phraseKeywords, ...frequent].filter((keyword) => {
    const key = keyword.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

export async function extractFileText(file: File) {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
    }
    return pages.join("\n");
  }

  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.toLowerCase().endsWith(".docx")) {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }

  throw new Error("Please choose a PDF or DOCX file.");
}

export function analyzeApplication(cvText: string, jobDescription: string): AnalysisResult {
  const cleanCv = normalized(cvText);
  const cleanJob = normalized(jobDescription);
  const cvSkills = getRelevantSkills(cvText);
  const jobSkills = getRelevantSkills(jobDescription);
  const matchingSkills = jobSkills.filter((skill) => skill.patterns.some((pattern) => includesPattern(cleanCv, pattern))).map((skill) => skill.label);
  const missingSkills = jobSkills.filter((skill) => !skill.patterns.some((pattern) => includesPattern(cleanCv, pattern))).map((skill) => skill.label);
  const cvSentences = sentenceList(cvText);
  const matchingExperience = cvSentences
    .filter((sentence) => {
      const lower = normalized(sentence);
      const skillMatch = jobSkills.some((skill) => skill.patterns.some((pattern) => includesPattern(lower, pattern)));
      const experienceSignal = /\b(year|years|led|managed|built|created|developed|delivered|supported|improved|increased|reduced|launched|worked|responsib)/i.test(sentence);
      return skillMatch && experienceSignal;
    })
    .slice(0, 4);

  if (matchingExperience.length === 0 && cvSkills.length > 0) {
    matchingExperience.push(`The CV mentions ${cvSkills.slice(0, 3).map((skill) => skill.label).join(", ")}, but no specific experience statement could be matched to this job description.`);
  }

  const candidateName = displayName(cvText);
  const keywordList = extractKeywords(jobDescription);
  const skillsSentence = matchingSkills.length
    ? `The strongest overlap is in ${matchingSkills.slice(0, 5).join(", ")}${matchingSkills.length > 5 ? ", and related areas" : ""}.`
    : "The CV does not show a clear match for the specific skills highlighted in the job description.";
  const evidenceSentence = matchingExperience.length && !matchingExperience[0].startsWith("The CV mentions")
    ? `Relevant evidence from the CV includes: “${matchingExperience[0]}”`
    : "Review the missing or weak skills below and add concrete evidence only where it is accurate.";

  const coverLetter = `Dear Hiring Manager,\n\nI am writing to apply for the role outlined in the provided job description. ${skillsSentence} ${evidenceSentence}\n\nI would welcome the opportunity to discuss how the experience and skills documented in my CV could contribute to your team. Thank you for your time and consideration.\n\nSincerely,\n${candidateName}`;
  const applicationMessage = `Hello, I’m ${candidateName}. I’m applying for the role outlined in the job description. My CV highlights ${matchingSkills.length ? matchingSkills.slice(0, 4).join(", ") : "relevant experience that I would be glad to discuss"}. Thank you for your consideration.`;

  return {
    matchingSkills,
    matchingExperience,
    missingSkills: missingSkills.length ? missingSkills : ["No obvious skill gaps detected from the built-in skill list."],
    keywords: keywordList,
    coverLetter,
    applicationMessage,
    candidateName,
  };
}
