import { jsPDF } from "jspdf";
import { CheckCircle2, Circle, Download } from "lucide-react";
import { useMemo } from "react";
import toast from "react-hot-toast";

export default function Roadmap({ project, completedTasks = [], onToggleTask, readOnly = false }) {
  const weeks = project?.roadmap?.weeks || [];

  const totalTasks = useMemo(
    () => weeks.reduce((sum, w) => sum + (w.tasks?.length || 0), 0),
    [weeks]
  );
  const doneCount = completedTasks.length;
  const pct = totalTasks ? Math.round((doneCount / totalTasks) * 100) : 0;

  function taskKey(weekNum, idx) {
    return `${weekNum}-${idx}`;
  }

  function handleDownloadPdf() {
    const doc = new jsPDF({ unit: "pt" });
    const margin = 48;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(project.title, margin, y);
    y += 22;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`${project.domain} · ${project.difficulty} · ${project.duration || ""}`, margin, y);
    y += 24;
    doc.setTextColor(20);

    weeks.forEach((week) => {
      if (y > 740) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(week.title, margin, y);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      (week.tasks || []).forEach((task) => {
        if (y > 760) {
          doc.addPage();
          y = margin;
        }
        const lines = doc.splitTextToSize(`• ${task}`, 480);
        doc.text(lines, margin + 12, y);
        y += lines.length * 13;
      });

      if (week.deliverable) {
        if (y > 760) {
          doc.addPage();
          y = margin;
        }
        doc.setFont("helvetica", "italic");
        doc.setTextColor(80);
        const dLines = doc.splitTextToSize(`Deliverable: ${week.deliverable}`, 480);
        doc.text(dLines, margin + 12, y);
        y += dLines.length * 13 + 4;
        doc.setTextColor(20);
        doc.setFont("helvetica", "normal");
      }
      y += 10;
    });

    doc.save(`${project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-roadmap.pdf`);
    toast.success("Roadmap PDF downloaded");
  }

  if (!weeks.length) {
    return <p className="text-sm text-slate-500">No roadmap has been added for this project yet.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-medium text-ink">{readOnly ? "Roadmap overview" : "Your progress"}</span>
            <span className="text-slate-500">{pct}%{!readOnly && ` · ${doneCount}/${totalTasks} tasks`}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-brand rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
        >
          <Download size={15} /> Download PDF
        </button>
      </div>

      <ol className="relative border-l-2 border-dashed border-indigo-100 ml-3 space-y-8">
        {weeks.map((week) => (
          <li key={week.week} className="ml-6">
            <span className="absolute -left-[9px] mt-1 w-4 h-4 rounded-full bg-gradient-brand ring-4 ring-white" />
            <h4 className="font-display font-semibold text-ink">{week.title}</h4>
            <ul className="mt-2 space-y-2">
              {(week.tasks || []).map((task, idx) => {
                const key = taskKey(week.week, idx);
                const done = completedTasks.includes(key);
                return (
                  <li key={key}>
                    <button
                      disabled={readOnly}
                      onClick={() => onToggleTask && onToggleTask(key)}
                      className={`flex items-start gap-2 text-sm text-left w-full group ${readOnly ? "cursor-default" : ""}`}
                    >
                      {done ? (
                        <CheckCircle2 size={17} className="text-teal-500 shrink-0 mt-0.5" />
                      ) : (
                        <Circle size={17} className="text-slate-300 shrink-0 mt-0.5 group-hover:text-indigo-400" />
                      )}
                      <span className={done ? "text-slate-400 line-through" : "text-slate-700"}>{task}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {week.resources?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {week.resources.map((r) => (
                  <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                    {r}
                  </span>
                ))}
              </div>
            ) : null}
            {week.deliverable && (
              <p className="mt-2 text-xs text-purple-700 bg-purple-50 inline-block px-2.5 py-1 rounded-full">
                Deliverable: {week.deliverable}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
