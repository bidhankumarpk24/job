import { ChangeEvent, DragEvent, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Clipboard,
  FileText,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ScanSearch,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { analyzeApplication, AnalysisResult, extractFileText } from "@/lib/application-analysis";

const starterJob = `We are looking for a product-minded frontend developer to build thoughtful web experiences. You will work with React, TypeScript, JavaScript, Git, and APIs, collaborate with designers and product managers, and communicate clearly with a growing team. Experience with testing, accessibility, and responsive design is a plus.`;

function SectionLabel({ number, label }: { number: string; label: string }) {
  return (
    <div className="section-label">
      <span>{number}</span>
      <span>{label}</span>
    </div>
  );
}

function ResultCard({ title, icon, children, accent = "sage" }: { title: string; icon: React.ReactNode; children: React.ReactNode; accent?: "sage" | "peach" | "lavender" }) {
  return (
    <section className={`result-card result-card-${accent}`}>
      <div className="result-card-title">
        <span className="result-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ChipList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (!items.length) return <p className="muted-copy">{emptyLabel}</p>;
  return (
    <div className="chip-list">
      {items.map((item) => <span className="chip" key={item}>{item}</span>)}
    </div>
  );
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFile = async (nextFile: File | undefined) => {
    if (!nextFile) return;
    setError("");
    setResult(null);
    const validType = nextFile.type === "application/pdf" || nextFile.name.toLowerCase().endsWith(".pdf") || nextFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || nextFile.name.toLowerCase().endsWith(".docx");
    if (!validType) {
      setError("Please choose a PDF or DOCX CV.");
      return;
    }
    setFile(nextFile);
    setIsParsing(true);
    try {
      const text = await extractFileText(nextFile);
      if (!text.trim()) throw new Error("We could not find readable text in that file. Try an exported text-based PDF or DOCX.");
      setCvText(text);
      toast.success("CV ready to analyze");
    } catch (parseError) {
      setFile(null);
      setCvText("");
      setError(parseError instanceof Error ? parseError.message : "Could not read that CV.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => handleFile(event.target.files?.[0]);
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const analyze = () => {
    if (!cvText.trim() || !jobDescription.trim()) return;
    setIsAnalyzing(true);
    setError("");
    window.setTimeout(() => {
      setResult(analyzeApplication(cvText, jobDescription));
      setIsAnalyzing(false);
      window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }, 420);
  };

  const copyText = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const ready = Boolean(file && cvText.trim() && jobDescription.trim() && !isParsing);

  return (
    <div className="app-shell">
      <header className="topbar container">
        <a className="brand" href="/" aria-label="Applywell home">
          <span className="brand-mark"><Sparkles size={16} strokeWidth={2.5} /></span>
          <span>applywell</span>
        </a>
        <div className="privacy-note"><LockKeyhole size={14} /> Local & private</div>
      </header>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> CV → application</div>
            <h1>Make your next application feel <em>ready.</em></h1>
            <p className="hero-description">Compare your CV to a job description, find the signal, and leave with a polished first draft — all in one quiet workspace.</p>
          </div>
          <div className="hero-aside">
            <div className="aside-kicker">THE ESSENTIALS</div>
            <div className="aside-item"><span>01</span><strong>Upload a CV</strong><small>PDF or DOCX</small></div>
            <div className="aside-item"><span>02</span><strong>Paste the role</strong><small>Job description</small></div>
            <div className="aside-item"><span>03</span><strong>Get your draft</strong><small>Local analysis</small></div>
          </div>
        </section>

        <section className="workspace container" aria-label="Application preparation workspace">
          <div className="workspace-heading">
            <div>
              <p className="eyebrow eyebrow-muted">START HERE</p>
              <h2>Bring the two pieces together.</h2>
            </div>
            <p className="workspace-hint"><LockKeyhole size={15} /> Your files stay in this browser.</p>
          </div>

          <div className="input-grid">
            <div className="input-panel">
              <SectionLabel number="01" label="Your CV" />
              <div
                className={`upload-zone ${isDragging ? "is-dragging" : ""} ${file ? "has-file" : ""}`}
                onClick={() => !isParsing && inputRef.current?.click()}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
              >
                <input className="file-input" ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleInput} aria-label="Upload your CV" />
                {isParsing ? (
                  <div className="upload-state"><LoaderCircle className="spin" size={25} /><strong>Reading your CV…</strong><small>Text is extracted locally</small></div>
                ) : file ? (
                  <div className="upload-state"><span className="file-icon"><FileText size={25} /></span><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(0)} KB · ready to analyze</small><button className="remove-file" type="button" onClick={(event) => { event.stopPropagation(); setFile(null); setCvText(""); setResult(null); if (inputRef.current) inputRef.current.value = ""; }} aria-label="Remove CV"><X size={15} /></button></div>
                ) : (
                  <div className="upload-state"><span className="upload-icon"><UploadCloud size={25} /></span><strong>Drop your CV here</strong><small>or click to browse · PDF or DOCX</small></div>
                )}
              </div>
              <p className="field-footnote"><LockKeyhole size={13} /> No upload or account required</p>
            </div>

            <div className="input-panel">
              <SectionLabel number="02" label="The job description" />
              <textarea className="job-textarea" value={jobDescription} onChange={(event) => { setJobDescription(event.target.value); setResult(null); }} placeholder="Paste the job description here…" aria-label="Job description" />
              <div className="textarea-footer"><span>{jobDescription.length ? `${jobDescription.length.toLocaleString()} characters` : "Include the responsibilities and requirements"}</span><button type="button" className="text-button" onClick={() => { setJobDescription(starterJob); setResult(null); }}>Use a sample <ArrowUpRight size={13} /></button></div>
            </div>
          </div>

          {error && <div className="error-message" role="alert">{error}</div>}
          <div className="analyze-row">
            <div className="ready-copy">{ready ? <><Check size={16} /> Both pieces are ready</> : <><ScanSearch size={16} /> Add a CV and job description to begin</>}</div>
            <button className="primary-button" type="button" onClick={analyze} disabled={!ready || isAnalyzing}>
              {isAnalyzing ? <><LoaderCircle className="spin" size={17} /> Analyzing…</> : <>Analyze Application <ArrowDown size={17} /></>}
            </button>
          </div>
        </section>

        {result && (
          <section className="results container" id="results" aria-live="polite">
            <div className="results-heading">
              <div><p className="eyebrow eyebrow-muted">03 · YOUR READOUT</p><h2>Here’s where your application stands.</h2></div>
              <span className="local-pill"><span /> Based only on your CV + job description</span>
            </div>

            <div className="analysis-grid">
              <ResultCard title="Matching skills" icon={<Check size={17} />} accent="sage">
                <ChipList items={result.matchingSkills} emptyLabel="No direct skill matches found yet." />
              </ResultCard>
              <ResultCard title="Missing or weak" icon={<Lightbulb size={17} />} accent="peach">
                <ChipList items={result.missingSkills} emptyLabel="No obvious skill gaps detected." />
              </ResultCard>
              <ResultCard title="Important keywords" icon={<ScanSearch size={17} />} accent="lavender">
                <ChipList items={result.keywords} emptyLabel="No keywords found." />
              </ResultCard>
            </div>

            <div className="experience-card">
              <div className="experience-heading"><div><p className="eyebrow eyebrow-muted">EVIDENCE FROM YOUR CV</p><h3>Matching experience</h3></div><span className="evidence-count">{result.matchingExperience.length} {result.matchingExperience.length === 1 ? "signal" : "signals"}</span></div>
              <div className="evidence-list">{result.matchingExperience.map((item, index) => <div className="evidence-item" key={`${item}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></div>)}</div>
            </div>

            <div className="writing-grid">
              <ResultCard title="Tailored cover letter" icon={<Mail size={17} />} accent="sage">
                <div className="copy-area"><p>{result.coverLetter}</p><button className="copy-button" type="button" onClick={() => copyText("Cover letter", result.coverLetter)}><Clipboard size={15} /> Copy cover letter</button></div>
              </ResultCard>
              <ResultCard title="Application message" icon={<ArrowUpRight size={17} />} accent="lavender">
                <div className="copy-area"><p>{result.applicationMessage}</p><button className="copy-button" type="button" onClick={() => copyText("Application message", result.applicationMessage)}><Clipboard size={15} /> Copy message</button></div>
              </ResultCard>
            </div>
            <p className="results-disclaimer"><LockKeyhole size={13} /> Drafts use only text found in the uploaded CV and the job description. Always review before sending.</p>
          </section>
        )}
      </main>

      <footer className="footer container"><span>applywell / job application assistant</span><span>Simple by design · free to use</span></footer>
    </div>
  );
}
