import {
  Bookmark, BookmarkCheck, Clock, ExternalLink, Github, Link as LinkIcon,
  PlayCircle, Share2, Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import Chatbot from "../components/Chatbot";
import LoadingSpinner from "../components/LoadingSpinner";
import ProjectCard from "../components/ProjectCard";
import RatingStars from "../components/RatingStars";
import Roadmap from "../components/Roadmap";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../services/api";

const TABS = ["Overview", "Roadmap", "Reviews"];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [userProject, setUserProject] = useState(null); // the current user's saved/in-progress entry
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "", difficulty_experienced: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTab("Overview");
    api
      .get(`/projects/${id}`)
      .then((res) => {
        setProject(res.data);
        return api.get("/projects", { params: { domain: res.data.domain, page_size: 3 } });
      })
      .then((res) => setRelated(res.data.filter((p) => p.id !== id)))
      .finally(() => setLoading(false));

    api.get(`/projects/${id}/reviews`).then((res) => setReviews(res.data));

    if (user) {
      api.get("/user-projects").then((res) => {
        const match = res.data.find((up) => up.project_id === id);
        setUserProject(match || null);
      });
    }
  }, [id, user]);

  async function handleSave() {
    if (!user) return navigate("/login");
    try {
      const res = await api.post("/user-projects", { project_id: id, status: "saved" });
      setUserProject(res.data);
      toast.success("Saved to your projects");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleStart() {
    if (!user) return navigate("/login");
    try {
      if (userProject) {
        const res = await api.put(`/user-projects/${userProject.id}`, { status: "in_progress" });
        setUserProject(res.data);
      } else {
        const res = await api.post("/user-projects", { project_id: id, status: "in_progress" });
        setUserProject(res.data);
      }
      toast.success("Project started — good luck!");
      setTab("Roadmap");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleToggleTask(taskKey) {
    if (!userProject) {
      toast.error("Start the project first to track progress");
      return;
    }
    const completed = userProject.completed_tasks.includes(taskKey)
      ? userProject.completed_tasks.filter((k) => k !== taskKey)
      : [...userProject.completed_tasks, taskKey];

    const totalTasks = (project.roadmap?.weeks || []).reduce((s, w) => s + (w.tasks?.length || 0), 0);
    const progress = totalTasks ? Math.round((completed.length / totalTasks) * 100) : 0;

    try {
      const res = await api.put(`/user-projects/${userProject.id}`, { completed_tasks: completed, progress });
      setUserProject(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!user) return navigate("/login");
    setSubmittingReview(true);
    try {
      const res = await api.post(`/projects/${id}/reviews`, reviewForm);
      setReviews((prev) => [res.data, ...prev]);
      const fresh = await api.get(`/projects/${id}`);
      setProject(fresh.data);
      setReviewForm({ rating: 5, comment: "", difficulty_experienced: "" });
      toast.success("Review posted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading || !project) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wide">
        <span>{project.domain}</span>
        {project.sub_domain && <><span className="text-slate-300">·</span><span>{project.sub_domain}</span></>}
        {project.industry && <><span className="text-slate-300">·</span><span>{project.industry}</span></>}
      </div>
      <h1 className="mt-2 text-3xl sm:text-4xl font-display font-bold text-ink leading-tight">{project.title}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <span className="flex items-center gap-1"><Star size={15} className="fill-amber-400 text-amber-400" /> {project.rating?.toFixed(1) || "New"} ({project.total_ratings})</span>
        <span className="flex items-center gap-1"><Clock size={15} /> {project.duration || "Flexible"}</span>
        <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">{project.difficulty}</span>
        <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">{project.project_type}</span>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button onClick={handleStart} className="flex items-center gap-1.5 btn-primary text-sm py-2.5 px-5">
          <PlayCircle size={16} /> {userProject?.status === "in_progress" ? "Continue project" : "Start project"}
        </button>
        <button onClick={handleSave} className="flex items-center gap-1.5 btn-secondary text-sm py-2.5 px-5">
          {userProject ? <BookmarkCheck size={16} className="text-indigo-600" /> : <Bookmark size={16} />}
          {userProject ? "Saved" : "Save"}
        </button>
        <button onClick={handleShare} className="flex items-center gap-1.5 btn-secondary text-sm py-2.5 px-5">
          <Share2 size={16} /> Share
        </button>
        {project.github_repo && (
          <a href={project.github_repo} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-ink">
            <Github size={16} /> Repo
          </a>
        )}
        {project.demo_link && (
          <a href={project.demo_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-ink">
            <ExternalLink size={16} /> Demo
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-10 border-b border-slate-100 flex gap-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "Overview" && <OverviewTab project={project} />}
        {tab === "Roadmap" && (
          <Roadmap
            project={project}
            completedTasks={userProject?.completed_tasks || []}
            onToggleTask={handleToggleTask}
          />
        )}
        {tab === "Reviews" && (
          <ReviewsTab
            reviews={reviews}
            user={user}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            onSubmit={handleSubmitReview}
            submitting={submittingReview}
          />
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h3 className="text-xl font-display font-semibold text-ink mb-5">Related projects</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      )}

      <Chatbot project={project} />
    </div>
  );
}

function OverviewTab({ project }) {
  return (
    <div className="grid md:grid-cols-3 gap-10">
      <div className="md:col-span-2 space-y-8">
        <Section title="Description">
          <p className="text-slate-600 leading-relaxed">{project.description}</p>
        </Section>

        {project.why_recommended && (
          <Section title="Why this fits you">
            <p className="text-slate-600 leading-relaxed bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
              {project.why_recommended}
            </p>
          </Section>
        )}

        {project.prerequisites?.length > 0 && (
          <Section title="Prerequisites">
            <TagList items={project.prerequisites} />
          </Section>
        )}

        {project.learning_outcomes?.length > 0 && (
          <Section title="Learning outcomes">
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
              {project.learning_outcomes.map((o) => <li key={o}>{o}</li>)}
            </ul>
          </Section>
        )}

        {project.career_benefits?.length > 0 && (
          <Section title="Career benefits">
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
              {project.career_benefits.map((o) => <li key={o}>{o}</li>)}
            </ul>
          </Section>
        )}

        {project.challenges && (
          <Section title="Common challenges & solutions">
            <p className="text-sm text-slate-600"><strong>Challenge:</strong> {project.challenges}</p>
            {project.solutions && <p className="text-sm text-slate-600 mt-2"><strong>Solution:</strong> {project.solutions}</p>}
          </Section>
        )}
      </div>

      <div className="space-y-8">
        <Section title="Tech stack">
          <TagList items={project.tech_stack} variant="tech" />
        </Section>

        {project.skills_required && Object.keys(project.skills_required).length > 0 && (
          <Section title="Skills required">
            <div className="space-y-2">
              {Object.entries(project.skills_required).map(([skill, level]) => (
                <div key={skill} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{skill}</span>
                  <RatingStars value={level} size={13} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {project.dataset_links?.length > 0 && (
          <Section title="Datasets">
            <ul className="space-y-1.5">
              {project.dataset_links.map((link) => (
                <li key={link}>
                  <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 break-all">
                    <LinkIcon size={13} className="shrink-0" /> {link}
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {project.research_papers?.length > 0 && (
          <Section title="Research papers">
            <ul className="space-y-1.5">
              {project.research_papers.map((link) => (
                <li key={link}>
                  <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 break-all">
                    <ExternalLink size={13} className="shrink-0" /> {link}
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

function ReviewsTab({ reviews, user, reviewForm, setReviewForm, onSubmit, submitting }) {
  return (
    <div className="max-w-2xl">
      {user && (
        <form onSubmit={onSubmit} className="mb-8 p-4 border border-slate-100 rounded-2xl">
          <p className="text-sm font-medium text-ink mb-2">Leave a review</p>
          <RatingStars
            interactive
            value={reviewForm.rating}
            onChange={(v) => setReviewForm({ ...reviewForm, rating: v })}
            size={20}
          />
          <textarea
            value={reviewForm.comment}
            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
            rows={3}
            placeholder="How did it go? What would you tell someone starting this project?"
            className="input mt-3 resize-none"
          />
          <select
            value={reviewForm.difficulty_experienced}
            onChange={(e) => setReviewForm({ ...reviewForm, difficulty_experienced: e.target.value })}
            className="input mt-3 w-auto text-sm"
          >
            <option value="">Difficulty experienced (optional)</option>
            <option value="Easier than expected">Easier than expected</option>
            <option value="As expected">As expected</option>
            <option value="Harder than expected">Harder than expected</option>
          </select>
          <button type="submit" disabled={submitting} className="btn-primary text-sm py-2 px-4 mt-3">
            {submitting ? "Posting..." : "Post review"}
          </button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-400">No reviews yet — be the first to share your experience.</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-slate-100 pb-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{r.user_name || "Anonymous"}</p>
                <RatingStars value={r.rating} size={13} />
              </div>
              {r.difficulty_experienced && (
                <p className="text-xs text-slate-400 mt-1">{r.difficulty_experienced}</p>
              )}
              {r.comment && <p className="text-sm text-slate-600 mt-2">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">{title}</h4>
      {children}
    </div>
  );
}

function TagList({ items, variant }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`text-xs px-2.5 py-1 rounded-full border ${
            variant === "tech" ? "bg-indigo-50 border-indigo-100 text-indigo-700" : "bg-slate-50 border-slate-100 text-slate-600"
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
