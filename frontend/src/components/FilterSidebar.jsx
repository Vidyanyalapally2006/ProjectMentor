const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const TYPES = ["Mini", "Major", "Research", "Industry", "Hackathon"];

export default function FilterSidebar({ facets, filters, onChange, onClear }) {
  function set(key, value) {
    onChange({ ...filters, [key]: filters[key] === value ? "" : value });
  }

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-ink">Filters</h3>
        <button onClick={onClear} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
          Clear all
        </button>
      </div>

      <FilterGroup title="Project type">
        {TYPES.map((t) => (
          <Chip key={t} active={filters.project_type === t} onClick={() => set("project_type", t)}>
            {t}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup title="Domain">
        {(facets?.domains || []).map((d) => (
          <Chip key={d} active={filters.domain === d} onClick={() => set("domain", d)}>
            {d}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup title="Industry">
        {(facets?.industries || []).map((i) => (
          <Chip key={i} active={filters.industry === i} onClick={() => set("industry", i)}>
            {i}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup title="Difficulty">
        {DIFFICULTIES.map((d) => (
          <Chip key={d} active={filters.difficulty === d} onClick={() => set("difficulty", d)}>
            {d}
          </Chip>
        ))}
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-indigo-600 border-indigo-600 text-white"
          : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
      }`}
    >
      {children}
    </button>
  );
}
