import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";



export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");


 const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  if (password !== password2) {
    setError("Las contraseñas no coinciden");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {

      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
        password2,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      setError(errorData.message || "Error al registrar usuario");
      return;
    }

    // Registro exitoso
    navigate("/login");

  } catch (err) {
    console.error(err);
    setError("Error de conexión con el servidor");
  }
};


  return (
    
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="p-10 max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-black text-5xl font-bold mb-6 text-center">Workly</h2>
        <h2 className="text-gray-700 text-xl mb-8 text-center">Registrar Usuario</h2>
        <form onSubmit={handleRegister} className="flex flex-col">
          <input
            type="text"
            placeholder="Usuario"
            className="w-full mb-4 p-3 rounded-md bg-gray-100 text-black placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            placeholder="Correo"
            className="w-full mb-4 p-3 rounded-md bg-gray-100 text-black placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full mb-4 p-3 rounded-md bg-gray-100 text-black placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirmar Contraseña"
            className="w-full mb-4 p-3 rounded-md bg-gray-100 text-black placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md shadow-md text-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Registrarse
          </button>
        </form>

        <div className="mt-6 text-gray-700 text-center text-sm">
          ¿Ya tienes una cuenta?{" "}
          <button
            onClick={() => navigate("/login")}
            className="underline font-semibold text-blue-600 hover:text-blue-800"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}