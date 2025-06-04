

import { Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Projects from './pages/Projects';

const ProjectWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/home");
  };

  return <Projects projectId={Number(id)} onBack={handleBack} />;
};

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<Home />} />
      <Route path="/projects" element={<Home />} />
      <Route path="/proyecto/:id" element={<ProjectWrapper />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
