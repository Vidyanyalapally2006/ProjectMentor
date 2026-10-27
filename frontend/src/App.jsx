import { Toaster } from "react-hot-toast";
import { Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Explore from "./pages/Explore";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ProjectDetail from "./pages/ProjectDetail";
import Profile from "./pages/Profile";
import Publish from "./pages/Publish";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" toastOptions={{ style: { fontSize: "14px" } }} />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/publish"
            element={
              <ProtectedRoute>
                <Publish />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl font-display font-bold text-slate-200">404</p>
      <p className="mt-2 text-slate-500">That page doesn't exist.</p>
    </div>
  );
}
