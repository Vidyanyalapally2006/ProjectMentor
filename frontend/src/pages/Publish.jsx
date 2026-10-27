import { Plus, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ProjectCard from "../components/ProjectCard";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../services/api";

const DOMAINS = ["AI", "ML", "Deep Learning", "Data Science", "Web Dev", "Mobile", "Cybersecurity", "Cloud", "DevOps", "Blockchain", "IoT", "AR/VR", "Game Dev", "NLP", "Computer Vision"];
const TYPES = ["Mini", "Major", "Research", "Industry", "Hackathon"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

const EMPTY_FORM = {
  title: "",
  description: "",
  domain: DOMAINS[0],
  sub_domain: "",
  industry: "",
  project_type: TYPES[0],
  difficulty: DIFFICULTIES[0],
  duration: "",
  tech_stack: [],
  github_repo: "",
  demo_link: "",
  dataset_links: [],
  research_papers: [],
  prerequisites: [],
  learning_outcomes: [],
  career_benefits: [],
  challenges: "",
  solutions: "",
};

export default function Publish() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handlePublish() {
    setSubmitting(true);
    try {
      const res = await api.post("/projects/publish", form);
      toast.success("Project published!");
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (preview) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button onClick={() => setPreview(false)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-6">
          ← Back to editing
        </button>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Preview</p>
        <div className="max-w-sm">
          <ProjectCard
            project={{
              ...form,
              id: "preview",
              rating: 0,
              total_ratings: 0,
            }}
          />
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button onClick={handlePublish} disabled={submitting} className="btn-primary text-sm py-2.5 px-6">
            {submitting ? "Publishing..." : "Confirm & publish"}
          </button>
          <p className="text-xs text-slate-400">You'll be credited as {user?.full_name}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-display font-semibold text-ink">Publish a project</h1>
      <p className="text-sm text-slate-500 mt-1">Share what you built so other students can follow in your footsteps.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPreview(true);
        }}
        className="mt-8 space-y-5"
      >
        <Field label="Title">
          <input required value={form.title} onChange={(e) => update("title", e.target.value)} className="input" placeholder="e.g. Real-time Traffic Sign Recognition" />
        </Field>

        <Field label="Description">
          <textarea required rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className="input resize-none" placeholder="What does it do, and what makes it interesting?" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Domain">
            <select value={form.domain} onChange={(e) => update("domain", e.target.value)} className="input">
              {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Sub-domain">
            <input value={form.sub_domain} onChange={(e) => update("sub_domain", e.target.value)} className="input" placeholder="e.g. CNNs" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Industry">
            <input value={form.industry} onChange={(e) => update("industry", e.target.value)} className="input" placeholder="e.g. Healthcare" />
          </Field>
          <Field label="Project type">
            <select value={form.project_type} onChange={(e) => update("project_type", e.target.value)} className="input">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Difficulty">
            <select value={form.difficulty} onChange={(e) => update("difficulty", e.target.value)} className="input">
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Duration">
            <input value={form.duration} onChange={(e) => update("duration", e.target.value)} className="input" placeholder="e.g. 2-3 months" />
          </Field>
        </div>

        <Field label="Tech stack">
          <TagInput values={form.tech_stack} onChange={(v) => update("tech_stack", v)} placeholder="Add a technology and press Enter" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="GitHub repo">
            <input value={form.github_repo} onChange={(e) => update("github_repo", e.target.value)} className="input" placeholder="https://github.com/..." />
          </Field>
          <Field label="Demo link">
            <input value={form.demo_link} onChange={(e) => update("demo_link", e.target.value)} className="input" placeholder="https://..." />
          </Field>
        </div>

        <Field label="Dataset links">
          <TagInput values={form.dataset_links} onChange={(v) => update("dataset_links", v)} placeholder="Paste a link and press Enter" />
        </Field>

        <Field label="Research papers">
          <TagInput values={form.research_papers} onChange={(v) => update("research_papers", v)} placeholder="Paste a link and press Enter" />
        </Field>

        <Field label="Prerequisites">
          <TagInput values={form.prerequisites} onChange={(v) => update("prerequisites", v)} placeholder="e.g. Basic Python" />
        </Field>

        <Field label="Learning outcomes">
          <TagInput values={form.learning_outcomes} onChange={(v) => update("learning_outcomes", v)} placeholder="e.g. Model deployment" />
        </Field>

        <Field label="Career benefits">
          <TagInput values={form.career_benefits} onChange={(v) => update("career_benefits", v)} placeholder="e.g. Strong ML portfolio piece" />
        </Field>

        <Field label="Challenges faced">
          <textarea rows={2} value={form.challenges} onChange={(e) => update("challenges", e.target.value)} className="input resize-none" />
        </Field>

        <Field label="How you solved them">
          <textarea rows={2} value={form.solutions} onChange={(e) => update("solutions", e.target.value)} className="input resize-none" />
        </Field>

        <button type="submit" className="btn-primary w-full py-3">
          Preview before publishing
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function TagInput({ values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const v = draft.trim();
    if (v && !values.includes(v)) {
      onChange([...values, v]);
    }
    setDraft("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          className="input flex-1"
          placeholder={placeholder}
        />
        <button type="button" onClick={addTag} className="w-11 h-11 shrink-0 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-300 hover:text-indigo-700">
          <Plus size={16} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map((v) => (
            <span key={v} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
