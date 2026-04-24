import React from "react";
import Logo from "../assets/images/Logo.png";
import "../styles/NavBar.css";

const NavBar = () => {
  return (
    <header className="NavShell">
      <nav className="NavContainer">
        <a className="NavBrand" href="/" aria-label="Accueil Reaft">
          <img className="LogoIcon" src={Logo} alt="" aria-hidden="true" />
          <span className="BrandName">Reaft</span>
        </a>

        <div className="NavLinks">
          <a href="/#modules">Fonctionnalités</a>
          <a href="/#reviews">Témoignages</a>
          <a href="/#faq">FAQ</a>
          <a className="NavCta" href="/Contact">
            Contact
          </a>
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
