import { create } from "zustand";

const STORAGE_KEY = "waffle_user";

const loadUser = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { name: "", phone: "" };
    return JSON.parse(data);
  } catch {
    return { name: "", phone: "" };
  }
};

export const useUserStore = create((set) => ({
  name: loadUser().name,
  phone: loadUser().phone,

  setUser: (name, phone) => {
    const user = { name, phone };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set(user);
  },
}));
