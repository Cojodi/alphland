import { useDarkMode } from "../../hooks/useDarkMode";
import DesktopMenu from "./DesktopMenu/DesktopMenu";
import MobileMenu from "./MobileMenu/MobileMenu";

const Header = () => {
  const { currentTheme, setTheme } = useDarkMode();

  return (
    <header className="relative z-50">
      <DesktopMenu currentTheme={currentTheme} setTheme={setTheme} />
      <MobileMenu currentTheme={currentTheme} setTheme={setTheme} />
    </header>
  );
};

export default Header;
