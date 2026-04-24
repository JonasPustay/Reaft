import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../components/Home";
import About from "../pages/About";
import Contact from "../pages/Contact";
import Legal from "../pages/Legal";
import CGU from "../pages/CGU";
import CGV from "../pages/CGV";
import CookiePolicy from "../pages/CookiePolicy";
import PrivacyPolicy from "../pages/PrivacyPolicy";

const AppRoutes = ({ darkMode }) => {
  return (
    <Routes>
      <Route path="/" element={<Home darkMode={darkMode} />} />
      <Route path="/about" element={<About darkMode={darkMode} />} />
      <Route path="/Contact" element={<Contact darkMode={darkMode} />} />
      <Route path="/Legal" element={<Legal darkMode={darkMode} />} />
      <Route path="/CGU" element={<CGU darkMode={darkMode} />} />
      <Route path="/CGV" element={<CGV darkMode={darkMode} />} />
      <Route path="/cookies" element={<CookiePolicy darkMode={darkMode} />} />
      <Route
        path="/PrivacyPolicy"
        element={<PrivacyPolicy darkMode={darkMode} />}
      />
    </Routes>
  );
};

export default AppRoutes;
