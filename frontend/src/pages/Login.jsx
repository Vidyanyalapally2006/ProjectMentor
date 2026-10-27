import { Route } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate(location.state?.from?.pathname || "/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-lg text-ink">
            <span className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center text-white">
              <Route size={18} />
            </span>
            ProjectMentor
          </Link>
          <h1 className="mt-6 text-2xl font-display font-semibold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to continue your projects.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="you@college.edu"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              placeholder="••••••••"
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full font-semibold text-white bg-gradient-brand shadow-soft hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{" "}
          <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-800">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
