import { useState } from "react";

const STORAGE_KEY = "adminKey";

export function useAdminKey() {
  const [adminKey, setKey] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ""
  );

  const setAdminKey = (k: string) => {
    localStorage.setItem(STORAGE_KEY, k);
    setKey(k);
  };

  const clearAdminKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKey("");
  };

  return { adminKey, setAdminKey, clearAdminKey };
}
