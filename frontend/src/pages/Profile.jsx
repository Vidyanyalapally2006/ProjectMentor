import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import RatingStars from "../components/RatingStars";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../services/api";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate"];

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || "", college: user?.college || "", year: user?.year || YEARS[0] });
  const [skills, setSkills] = useState(user?.skills || []);
  const [newSkill, setNewSkill] = useState({ skill_name: "", proficiency: 3 });
  const [stats, setStats] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    api.get("/users/profile/stats").then((res) => setStats(res.data));
    api.get("/skills").then((res) => setSkills(res.data));
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put("/users/profile", form);
      refreshUser({ ...res.data, skills });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAddSkill(e) {
    e.preventDefault();
    if (!newSkill.skill_name.trim()) return;
    try {
      const res = await api.post("/skills", newSkill);
      setSkills((prev) => [...prev, res.data]);
      setNewSkill({ skill_name: "", proficiency: 3 });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleUpdateSkill(skillId, proficiency) {
    try {
      const res = await api.put(`/skills/${skillId}`, { proficiency });
      setSkills((prev) => prev.map((s) => (s.id === skillId ? res.data : s)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDeleteSkill(skillId) {
    try {
      await api.delete(`/skills/${skillId}`);
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await api.post("/auth/change-password", passwordForm);
      toast.success("Password updated");
      setPasswordForm({ old_password: "", new_password: "" });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-4">
        <span className="w-16 h-16 rounded-full bg-gradient-brand text-white flex items-center justify-center text-xl font-display font-semibold">
          {user?.full_name?.[0]?.toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">{user?.full_name}</h1>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
      </div>

      {stats && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Saved" value={stats.total_saved} />
          <StatCard label="In progress" value={stats.in_progress} />
          <StatCard label="Completed" value={stats.total_completed} />
          <StatCard label="Published" value={stats.total_published} />
        </div>
      )}

      {/* Personal info */}
      <section className="mt-10">
        <h2 className="text-lg font-display font-semibold text-ink mb-4">Personal info</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <Field label="Full name">
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="College">
              <input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} className="input" />
            </Field>
            <Field label="Year">
              <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="input">
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary text-sm py-2 px-5">
            {savingProfile ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>

      {/* Skills */}
      <section className="mt-10">
        <h2 className="text-lg font-display font-semibold text-ink mb-4">Skills</h2>
        <div className="space-y-2 max-w-md">
          {skills.map((s) => (
            <div key={s.id} className="flex items-center justify-between border border-slate-100 rounded-xl px-3.5 py-2.5">
              <span className="text-sm text-ink">{s.skill_name}</span>
              <div className="flex items-center gap-3">
                <RatingStars interactive value={s.proficiency} size={15} onChange={(v) => handleUpdateSkill(s.id, v)} />
                <button onClick={() => handleDeleteSkill(s.id)} className="text-slate-300 hover:text-red-500" aria-label="Remove skill">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddSkill} className="mt-4 flex items-center gap-2 max-w-md">
          <input
            value={newSkill.skill_name}
            onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
            placeholder="Add a skill, e.g. React"
            className="input flex-1"
          />
          <select
            value={newSkill.proficiency}
            onChange={(e) => setNewSkill({ ...newSkill, proficiency: Number(e.target.value) })}
            className="input w-20"
          >
            {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <button type="submit" className="w-11 h-11 shrink-0 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-300 hover:text-indigo-700">
            <Plus size={16} />
          </button>
        </form>
      </section>

      {/* Settings */}
      <section className="mt-10 mb-10">
        <h2 className="text-lg font-display font-semibold text-ink mb-4">Settings</h2>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <Field label="Current password">
            <input type="password" value={passwordForm.old_password} onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })} className="input" required />
          </Field>
          <Field label="New password">
            <input type="password" minLength={6} value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className="input" required />
          </Field>
          <button type="submit" disabled={changingPassword} className="btn-secondary text-sm py-2 px-5">
            {changingPassword ? "Updating..." : "Change password"}
          </button>
        </form>

        <button onClick={logout} className="mt-6 text-sm font-medium text-red-600 hover:text-red-800">
          Log out
        </button>
      </section>
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

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
