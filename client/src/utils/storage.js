const TOKEN_KEY = "token";
const THEME_KEY = "theme";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.error("Error reading token from storage:", err);
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error("Error saving token to storage:", err);
  }
};

export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error("Error removing token from storage:", err);
  }
};

const VALID_THEMES = new Set(["light", "dark", "system"]);

export const getTheme = () => {
  try {
    const theme = localStorage.getItem(THEME_KEY);
    if (theme && VALID_THEMES.has(theme)) {
      return theme;
    }
    return "system";
  } catch (err) {
    console.error("Error reading theme from storage:", err);
    return "system";
  }
};

export const setTheme = (theme) => {
  try {
    const value = VALID_THEMES.has(theme) ? theme : "system";
    localStorage.setItem(THEME_KEY, value);
  } catch (err) {
    console.error("Error saving theme to storage:", err);
  }
};

export default {
  getToken,
  setToken,
  removeToken,
  getTheme,
  setTheme,
};
