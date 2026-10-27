import { Route } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50/60 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-display font-bold text-ink">
              <span className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center text-white">
                <Route size={14} />
              </span>
              ProjectMentor
            </Link>
            <p className="mt-3 text-sm text-slate-500 max-w-xs">
              Find the right project, follow a real roadmap, and publish what you build.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link to="/explore" className="hover:text-indigo-700">Explore projects</Link></li>
              <li><Link to="/dashboard" className="hover:text-indigo-700">My projects</Link></li>
              <li><Link to="/publish" className="hover:text-indigo-700">Publish a project</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink mb-3">Domains</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>AI &amp; Machine Learning</li>
              <li>Web &amp; Mobile</li>
              <li>Cloud &amp; DevOps</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link to="/login" className="hover:text-indigo-700">Log in</Link></li>
              <li><Link to="/signup" className="hover:text-indigo-700">Create account</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 text-xs text-slate-400">
          © {new Date().getFullYear()} ProjectMentor. Built for students, by students.
        </div>
      </div>
    </footer>
  );
}
