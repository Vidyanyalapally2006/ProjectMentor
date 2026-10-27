import { Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";

const difficultyColor = {
  Beginner: "bg-teal-50 text-teal-700",
  Intermediate: "bg-indigo-50 text-indigo-700",
  Advanced: "bg-purple-50 text-purple-700",
};

export default function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group flex flex-col h-full bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-soft transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          {project.domain}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColor[project.difficulty] || "bg-slate-50 text-slate-600"}`}>
          {project.difficulty}
        </span>
      </div>

      <h3 className="font-display font-semibold text-lg text-ink leading-snug group-hover:text-indigo-700 transition-colors">
        {project.title}
      </h3>

      <p className="mt-2 text-sm text-slate-500 line-clamp-2 flex-1">{project.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(project.tech_stack || []).slice(0, 3).map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Clock size={13} /> {project.duration || "Flexible"}
        </span>
        <span className="flex items-center gap-1">
          <Star size={13} className="fill-amber-400 text-amber-400" />
          {project.rating?.toFixed ? project.rating.toFixed(1) : project.rating || "New"}
          {project.total_ratings ? <span className="text-slate-400">({project.total_ratings})</span> : null}
        </span>
      </div>
    </Link>
  );
}
