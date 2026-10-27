import { LogOut, Menu, Route, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/explore", label: "Explore" },
  { to: "/dashboard", label: "My Projects" },
  { to: "/publish", label: "Publish" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    setOpen(false);
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg text-ink">
            <span className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white">
              <Route size={18} />
            </span>
            ProjectMentor
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:text-ink hover:bg-slate-50"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-sm font-medium text-ink transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-gradient-brand text-white flex items-center justify-center text-xs font-semibold">
                    {user.full_name?.[0]?.toUpperCase() || "U"}
                  </span>
                  {user.full_name?.split(" ")[0]}
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label="Log out"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-ink">
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-brand rounded-full shadow-soft hover:opacity-90 transition-opacity"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 animate-fade-up">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-slate-100 mt-2">
            {user ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-ink">
                  Profile
                </Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600">
                  Log in
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-indigo-700">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
