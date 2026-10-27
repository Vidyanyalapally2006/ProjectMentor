import { LayoutGrid, List, Search, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DiscoveryWizard from "../components/DiscoveryWizard";
import FilterSidebar from "../components/FilterSidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import ProjectCard from "../components/ProjectCard";
import api from "../services/api";

const PAGE_SIZE = 9;

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [facets, setFacets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("rating");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState({
    domain: searchParams.get("domain") || "",
    sub_domain: "",
    industry: "",
    difficulty: "",
    project_type: "",
  });

  const [wizardOpen, setWizardOpen] = useState(false);
  const [recommended, setRecommended] = useState(null); // { results, criteria } | null

  useEffect(() => {
    api.get("/projects/meta/facets").then((res) => setFacets(res.data));
  }, []);

  useEffect(() => {
    if (searchParams.get("discover") === "1") {
      const raw = sessionStorage.getItem("pm_recommendations");
      if (raw) {
        setRecommended(JSON.parse(raw));
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (recommended) return; // showing personalized results instead of the normal list
    setLoading(true);
    const params = { page, page_size: PAGE_SIZE, sort };
    if (query) params.q = query;
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    api
      .get("/projects", { params })
      .then((res) => setProjects(res.data))
      .finally(() => setLoading(false));
  }, [filters, page, sort, query, recommended]);

  function clearRecommended() {
    setRecommended(null);
    sessionStorage.removeItem("pm_recommendations");
    setSearchParams({});
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">Explore projects</h1>
          <p className="text-sm text-slate-500 mt-1">Filter by domain, industry, difficulty, and more.</p>
        </div>
        <button onClick={() => setWizardOpen(true)} className="flex items-center gap-1.5 btn-secondary text-sm py-2 px-4 self-start">
          <Sparkles size={15} /> Get matched
        </button>
      </div>

      {recommended ? (
        <div className="mb-8">
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 mb-6">
            <p className="text-sm text-indigo-800">
              Showing personalized picks for <strong>{recommended.criteria.domain}</strong>
              {recommended.criteria.industry ? ` · ${recommended.criteria.industry}` : ""}
            </p>
            <button onClick={clearRecommended} className="flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900">
              <X size={14} /> Clear
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommended.results.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <FilterSidebar
            facets={facets}
            filters={filters}
            onChange={(f) => {
              setFilters(f);
              setPage(1);
            }}
            onClear={() => {
              setFilters({ domain: "", sub_domain: "", industry: "", difficulty: "", project_type: "" });
              setPage(1);
            }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="flex-1 text-sm outline-none bg-transparent"
                />
              </form>

              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="input w-auto text-sm">
                <option value="rating">Top rated</option>
                <option value="newest">Newest</option>
                <option value="title">A–Z</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-50 rounded-full p-1">
                <button
                  onClick={() => setView("grid")}
                  className={`p-1.5 rounded-full ${view === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-slate-400"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-1.5 rounded-full ${view === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-400"}`}
                  aria-label="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner className="py-20" />
            ) : projects.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-sm">
                No projects match those filters yet. Try widening your search.
              </div>
            ) : (
              <div className={view === "grid" ? "grid sm:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-3"}>
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary py-1.5 px-4 text-sm disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500 px-2">Page {page}</span>
              <button
                disabled={projects.length < PAGE_SIZE}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary py-1.5 px-4 text-sm disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {wizardOpen && (
        <DiscoveryWizard
          onClose={() => setWizardOpen(false)}
          onResults={(results, criteria) => {
            setRecommended({ results, criteria });
            sessionStorage.setItem("pm_recommendations", JSON.stringify({ results, criteria }));
            setWizardOpen(false);
          }}
        />
      )}
    </div>
  );
}
