import React from "react";
import BlackAppStore from "../assets/images/BlackAppStore.png";
import LightAppStore from "../assets/images/LightAppStore.png";
import BlackGooglePlay from "../assets/images/BlackGooglePlay.png";
import LightGooglePlay from "../assets/images/LightGooglePlay.png";
import "../styles/Footer.css";

const footerLinks = [
  { href: "/CGU", label: "CGU" },
  { href: "/CGV", label: "CGV" },
  { href: "/cookies", label: "Cookies" },
  { href: "/PrivacyPolicy", label: "Politique de confidentialité" },
  { href: "/Legal", label: "Mentions légales" },
  { href: "/about", label: "À propos" },
  { href: "/Contact", label: "Contact" },
];

const Footer = ({ darkMode }) => {
  const appStoreImage = darkMode ? LightAppStore : BlackAppStore;
  const googlePlayImage = darkMode ? LightGooglePlay : BlackGooglePlay;

  return (
    <footer className="Footer">
      <div className="FooterInner">
        <p className="FooterEyebrow">Passez à l'inspection proactive</p>
        <h2 className="FooterTitle">Rejoignez l'aventure maintenant</h2>

        <div className="StoreButton">
          <a
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="StoreButtonLink"
          >
            <img
              src={appStoreImage}
              alt="Télécharger sur l'App Store"
              className="FooterButtonIcons"
            />
          </a>
          <a
            href="https://play.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="StoreButtonLink"
          >
            <img
              src={googlePlayImage}
              alt="Télécharger sur Google Play"
              className="FooterButtonIcons"
            />
          </a>
        </div>

        <nav className="FooterLinks" aria-label="Liens légaux">
          {footerLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <p className="FooterParagraphe">
          &copy; {new Date().getFullYear()} Reaft. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
