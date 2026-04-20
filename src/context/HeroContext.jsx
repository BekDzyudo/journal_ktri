import { createContext, useContext } from "react";

export const HeroContext = createContext({
  onHero: false,
  setOnHero: () => {},
});
export const useHero = () => useContext(HeroContext);