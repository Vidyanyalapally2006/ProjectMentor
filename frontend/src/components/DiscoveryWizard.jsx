import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../services/api";

const DOMAINS = [
  "AI", "ML", "Deep Learning", "Data Science", "Web Dev", "Mobile", "Cybersecurity",
  "Cloud", "DevOps", "Blockchain", "IoT", "AR/VR", "Game Dev", "NLP", "Computer Vision",
];

const SUBDOMAINS = {
  AI: ["Search & Planning", "Reinforcement Learning", "Expert Systems"],
  ML: ["Classification", "Regression", "Clustering"],
  "Deep Learning": ["CNNs", "RNNs", "Transformers", "GANs"],
  "Data Science": ["EDA", "Time Series", "Statistical Modeling"],
  "Web Dev": ["Frontend", "Backend", "Full Stack"],
  Mobile: ["Android", "iOS", "Cross-platform"],
  Cybersecurity: ["Network Security", "Cryptography", "Pen Testing"],
  Cloud: ["Serverless", "Containers", "Cloud-native"],
  DevOps: ["CI/CD", "Infrastructure as Code", "Monitoring"],
  Blockchain: ["Smart Contracts", "DeFi", "NFTs"],
  IoT: ["Embedded Systems", "Sensor Networks", "Edge Computing"],
  "AR/VR": ["Augmented Reality", "Virtual Reality", "Mixed Reality"],
  "Game Dev": ["2D Games", "3D Games", "Game AI"],
  NLP: ["Sentiment Analysis", "Text Generation", "Machine Translation"],
  "Computer Vision": ["Object Detection", "Image Segmentation", "CNNs"],
};

const INDUSTRIES = ["Healthcare", "E-commerce", "Education", "Finance", "Transportation", "Agriculture", "Entertainment", "Government"];
const TYPES = ["Mini", "Major", "Research", "Industry", "Hackathon"];
const TIMELINES = ["2-4 weeks", "1-2 months", "2-3 months", "4-6 months"];
const SKILL_OPTIONS = ["Python", "JavaScript", "React", "ML", "DL", "NLP", "Cloud", "SQL", "Java", "C++"];

const STEPS = ["Domain", "Sub-domain", "Industry", "Type", "Skills", "Constraints", "Goals"];

export default function DiscoveryWizard({ onClose, onResults }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    domain: "",
    sub_domain: "",
    industry: "",
    project_type: "",
    skills: {},
    timeline: "",
    career_goals: "",
  });

  function canProceed() {
    switch (step) {
      case 0: return !!form.domain;
      case 1: return !!form.sub_domain;
      case 2: return !!form.industry;
      case 3: return !!form.project_type;
      default: return true;
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await api.post("/projects/recommendations?limit=9", form);
      onResults(res.data, form);
      toast.success("Here are your personalized picks!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function setSkill(name, level) {
    setForm((f) => ({ ...f, skills: { ...f.skills, [name]: level } }));
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-up">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              <Sparkles size={13} /> Step {step + 1} of {STEPS.length}
            </p>
            <h3 className="font-display font-semibold text-lg text-ink mt-0.5">{STEPS[step]}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-brand transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="px-6 py-6 min-h-[260px] max-h-[50vh] overflow-y-auto">
          {step === 0 && (
            <ChipGrid options={DOMAINS} selected={form.domain} onSelect={(v) => setForm({ ...form, domain: v, sub_domain: "" })} />
          )}
          {step === 1 && (
            <ChipGrid
              options={SUBDOMAINS[form.domain] || []}
              selected={form.sub_domain}
              onSelect={(v) => setForm({ ...form, sub_domain: v })}
            />
          )}
          {step === 2 && (
            <ChipGrid options={INDUSTRIES} selected={form.industry} onSelect={(v) => setForm({ ...form, industry: v })} />
          )}
          {step === 3 && (
            <ChipGrid options={TYPES} selected={form.project_type} onSelect={(v) => setForm({ ...form, project_type: v })} />
          )}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-2">Rate your comfort level (1 = new, 5 = expert).</p>
              {SKILL_OPTIONS.map((s) => (
                <div key={s} className="flex items-center justify-between">
                  <span className="text-sm text-ink">{s}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSkill(s, lvl)}
                        className={`w-7 h-7 rounded-full text-xs font-medium border transition-colors ${
                          form.skills[s] === lvl
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-200 text-slate-500 hover:border-indigo-300"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {step === 5 && (
            <div>
              <p className="text-sm text-slate-500 mb-2">How much time can you commit?</p>
              <ChipGrid options={TIMELINES} selected={form.timeline} onSelect={(v) => setForm({ ...form, timeline: v })} />
            </div>
          )}
          {step === 6 && (
            <div>
              <p className="text-sm text-slate-500 mb-2">What's the goal? (internship, higher studies, a specific role...)</p>
              <textarea
                value={form.career_goals}
                onChange={(e) => setForm({ ...form, career_goals: e.target.value })}
                rows={5}
                className="input resize-none"
                placeholder="e.g. Land a machine learning internship in healthcare"
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm font-medium text-slate-500 disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canProceed()}
              className="flex items-center gap-1 btn-primary py-2 px-4 text-sm disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary py-2 px-5 text-sm">
              {loading ? "Finding projects..." : "Get recommendations"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChipGrid({ options, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onSelect(o)}
          className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
            selected === o
              ? "bg-indigo-600 border-indigo-600 text-white"
              : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
