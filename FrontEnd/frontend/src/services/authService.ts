import { API_URL } from "../config/api";

const AUTH_URL = `${API_URL}/auth`;


export const loginUser = async (email: string, password: string) => {
 const res = await fetch(`${AUTH_URL}/login`, {
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


  return {
    id: data.id,
    email: data.email,
    token: data.token,
    authorities: data.authorities
  };
};

