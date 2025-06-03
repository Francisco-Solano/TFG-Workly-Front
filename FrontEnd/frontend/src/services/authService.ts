// src/services/authService.ts
const API_URL = "http://localhost:8080/auth";

export const loginUser = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    throw new Error("Login fallido");
  }

  const data = await res.json();

  // Ya tienes el id en data.id, no necesitas llamada extra
  return {
    id: data.id,
    email: data.email,
    token: data.token,
    authorities: data.authorities
  };
};

