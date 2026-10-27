import { Bookmark, CheckCircle2, PlayCircle, Rocket, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import api, { getErrorMessage } from "../services/api";

const TABS = [
  { key: "saved", label: "Saved", icon: Bookmark },
  { key: "in_progress", label: "In Progress", icon: PlayCircle },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
  { key: "published", label: "Published", icon: Rocket },
];

export default function Dashboard() {
  const [tab, setTab] = useState("saved");
  const [userProjects, setUserProjects] = useState([]);
  const [published, setPublished] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/user-projects"),
      api.get("/projects/published"),
      api.get("/users/profile/stats"),
    ])
      .then(([up, pub, st]) => {
        setUserProjects(up.data);
        setPublished(pub.data);
        setStats(st.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(userProjectId) {
    try {
      await api.delete(`/user-projects/${userProjectId}`);
      setUserProjects((prev) => prev.filter((up) => up.id !== userProjectId));
      toast.success("Removed from your projects");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const filtered = tab === "published" ? [] : userProjects.filter((up) => up.status === tab);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-display font-semibold text-ink">My projects</h1>
      <p className="text-sm text-slate-500 mt-1">Track what you've saved, started, finished, and shipped.</p>

      {stats && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Saved" value={stats.total_saved} />
          <StatCard label="In progress" value={stats.in_progress} />
          <StatCard label="Completed" value={stats.total_completed} />
          <StatCard label="Published" value={stats.total_published} />
        </div>
      )}

      <div className="mt-8 flex gap-1 bg-slate-50 rounded-full p-1 w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? "bg-white shadow-sm text-indigo-700" : "text-slate-500"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : tab === "published" ? (
          published.length === 0 ? (
            <EmptyState text="You haven't published anything yet." cta="Publish a project" to="/publish" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {published.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="border border-slate-100 rounded-2xl p-4 hover:border-indigo-200 transition-colors">
                  <p className="font-display font-semibold text-ink">{p.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{p.domain} · {p.difficulty}</p>
                </Link>
              ))}
            </div>
          )
        ) : filtered.length === 0 ? (
          <EmptyState text={`Nothing in "${TABS.find((t) => t.key === tab).label}" yet.`} cta="Explore projects" to="/explore" />
        ) : (
          <div className="space-y-3">
            {filtered.map((up) => (
              <div key={up.id} className="flex items-center gap-4 border border-slate-100 rounded-2xl p-4 hover:border-indigo-200 transition-colors">
                <Link to={`/projects/${up.project_id}`} className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-ink truncate">{up.project.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{up.project.domain} · {up.project.difficulty}</p>
                  {up.status === "in_progress" && (
                    <div className="mt-2 max-w-xs">
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-gradient-brand rounded-full" style={{ width: `${up.progress}%` }} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{up.progress}% complete</p>
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => handleRemove(up.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                  aria-label="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="border border-slate-100 rounded-2xl p-4">
      <p className="text-2xl font-display font-bold text-ink">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function EmptyState({ text, cta, to }) {
  return (
    <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
      <p className="text-sm text-slate-400">{text}</p>
      <Link to={to} className="inline-block mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800">
        {cta} →
      </Link>
    </div>
  );
}
