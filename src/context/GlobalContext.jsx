import { createContext, useEffect, useState } from "react";

export const GlobalContext = createContext();

const themeFromLocalStorage = () => {
  return localStorage.getItem("theme") || "light";
};

export const GlobalContextProvider = ({children}) => {

      const [theme, setTheme] = useState(themeFromLocalStorage());
      function changeTheme() {
        const newTheme = theme == "night" ? "light" : "night";
        setTheme(newTheme);
      }
      useEffect(() => {
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
      }, [theme]);

    return(
        <GlobalContext.Provider value={{theme, changeTheme}}>
            {children}
        </GlobalContext.Provider>
    )
}