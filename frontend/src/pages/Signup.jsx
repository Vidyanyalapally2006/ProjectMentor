import { Route } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate"];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    college: "",
    year: YEARS[2],
  });
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form);
      toast.success("Account created — welcome to ProjectMentor!");
      navigate("/explore?discover=1");
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
          <h1 className="mt-6 text-2xl font-display font-semibold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Get personalized project recommendations in minutes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name">
            <input required value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="input" placeholder="Ada Lovelace" />
          </Field>
          <Field label="Email">
            <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className="input" placeholder="you@college.edu" />
          </Field>
          <Field label="Password">
            <input type="password" required minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} className="input" placeholder="At least 6 characters" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="College">
              <input value={form.college} onChange={(e) => update("college", e.target.value)} className="input" placeholder="Your college" />
            </Field>
            <Field label="Year">
              <select value={form.year} onChange={(e) => update("year", e.target.value)} className="input">
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </Field>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-800">
            Log in
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
