import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DiscoveryWizard from "../components/DiscoveryWizard";
import LoadingSpinner from "../components/LoadingSpinner";
import ProjectCard from "../components/ProjectCard";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const DOMAIN_LABELS = ["AI", "Web Dev", "Cybersecurity", "Cloud", "NLP", "Computer Vision", "Blockchain", "IoT"];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    api
      .get("/projects", { params: { page: 1, page_size: 6, sort: "rating" } })
      .then((res) => setFeatured(res.data))
      .finally(() => setLoading(false));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/explore?q=${encodeURIComponent(query)}`);
  }

  function handleStart() {
    if (!user) {
      navigate("/signup");
      return;
    }
    setWizardOpen(true);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 path-line opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
            <Sparkles size={13} /> Personalized project roadmaps for students
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-display font-bold text-ink leading-[1.05]">
            Find the project that
            <span className="bg-gradient-brand bg-clip-text text-transparent"> actually moves your career.</span>
          </h1>
          <p className="mt-5 text-lg text-slate-500 max-w-2xl mx-auto">
            Tell us your domain, skills, and goals. Get a matched project with a week-by-week
            roadmap, real datasets, and a mentor chatbot along the way.
          </p>

          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto flex items-center gap-2 bg-white border border-slate-200 rounded-full p-1.5 shadow-soft">
            <Search size={18} className="ml-3 text-slate-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, e.g. 'chatbot' or 'fraud detection'"
              className="flex-1 outline-none text-sm px-1 bg-transparent"
            />
            <button type="submit" className="btn-primary py-2 px-5 text-sm shrink-0">
              Search
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button onClick={handleStart} className="flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-900">
              Or get matched in 2 minutes <ArrowRight size={15} />
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {DOMAIN_LABELS.map((d) => (
              <Link
                key={d}
                to={`/explore?domain=${encodeURIComponent(d)}`}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
              >
                {d}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <Stat label="Curated projects" value="60+" />
          <Stat label="Domains covered" value="15" />
          <Stat label="Industries" value="8" />
          <Stat label="Roadmap weeks avg." value="8" />
        </div>
      </section>

      {/* Featured projects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-display font-semibold text-ink">Top-rated projects</h2>
            <p className="text-sm text-slate-500 mt-1">Highly rated by students who've already built them.</p>
          </div>
          <Link to="/explore" className="hidden sm:flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800">
            View all <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="bg-ink">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <blockquote key={t.name} className="text-white/90">
              <p className="text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4 text-xs text-white/50 font-medium">
                {t.name} · {t.role}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {wizardOpen && (
        <DiscoveryWizard
          onClose={() => setWizardOpen(false)}
          onResults={(results, criteria) => {
            sessionStorage.setItem("pm_recommendations", JSON.stringify({ results, criteria }));
            setWizardOpen(false);
            navigate("/explore?discover=1");
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-3xl font-display font-bold bg-gradient-brand bg-clip-text text-transparent">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

const TESTIMONIALS = [
  { name: "Priya S.", role: "3rd Year, CS", quote: "The roadmap made an intimidating deep learning project feel like a checklist. I actually finished it." },
  { name: "Marcus O.", role: "Final Year, IT", quote: "I published my capstone here and two juniors have already started their own version of it." },
  { name: "Ana R.", role: "2nd Year, Data Science", quote: "The recommendation quiz genuinely understood what I was ready for — not just what sounded cool." },
];
