import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { loginUser } from "../services/authService";


export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData = await loginUser(email, password);
      login(userData);
      navigate("/home");
    } catch (err) {
      setError("Credenciales inválidas");
    }
  };

 return (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="p-10 max-w-lg w-full bg-white rounded-lg shadow-lg flex flex-col items-center border border-gray-200">
      <h1 className="text-black text-5xl font-bold mb-10 tracking-wider">Workly</h1>
      <p className="text-gray-700 text-xl mb-8">Regístrate o inicia sesión</p>

    
      <form onSubmit={handleLogin} className="w-3/4 flex flex-col items-center">
        <input
          type="email"
          placeholder="Correo electrónico"
          className="w-full mb-4 p-3 rounded-md bg-gray-100 text-black placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full mb-6 p-3 rounded-md bg-gray-100 text-black placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-md shadow-md text-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Iniciar Sesión
        </button>
      </form>

      <div className="mt-8 text-gray-700 text-sm">
        ¿No tienes una cuenta?{" "}
        <button
          onClick={() => navigate("/register")}
          className="underline font-semibold text-blue-600 hover:text-blue-800"
        >
          Regístrarse
        </button>
      </div>
    </div>
  </div>
);

}