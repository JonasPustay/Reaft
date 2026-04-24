import { useState } from "react";
import BlackAppStore from "../assets/images/BlackAppStore.png";
import LightAppStore from "../assets/images/LightAppStore.png";
import BlackGooglePlay from "../assets/images/BlackGooglePlay.png";
import LightGooglePlay from "../assets/images/LightGooglePlay.png";

import "../styles/Home.css";

export default function Home({ darkMode = false }) {
  const [faqOpen, setFaqOpen] = useState(0);
  const appStoreImage = darkMode ? LightAppStore : BlackAppStore;
  const googlePlayImage = darkMode ? LightGooglePlay : BlackGooglePlay;

  const modules = [
    {
      icon: "🔍",
      title: "Inspection IA",
      description:
        "Analyse automatiquement vos bâtiments pour détecter fissures, moisissures et malfaçons.",
    },
    {
      icon: "📊",
      title: "Rapports détaillés",
      description:
        "Générez des synthèses visuelles prêtes à partager avec artisans, syndics ou assureurs.",
    },
    {
      icon: "🧭",
      title: "Tableau de bord",
      description:
        "Centralisez toutes vos inspections dans une timeline claire, lisible et actionnable.",
    },
    {
      icon: "🚨",
      title: "Alertes intelligentes",
      description:
        "Recevez des notifications ciblées dès qu'une zone devient critique ou instable.",
    },
    {
      icon: "📤",
      title: "Import / Export",
      description:
        "Importez vos plans et exportez vos constats en PDF pour un suivi fluide.",
    },
    {
      icon: "🔒",
      title: "Confidentialité locale",
      description:
        "Vos données restent sur l'appareil. Aucun partage automatique, aucun compromis.",
    },
  ];

  const faqs = [
    {
      q: "Qu'est-ce que Reaft ?",
      a: "Reaft est votre allié pour détecter les défauts et prévenir les malfaçons. L'IA analyse vos photos, identifie les anomalies et vous aide à prioriser les actions.",
    },
    {
      q: "Faut-il payer pour utiliser l'application ?",
      a: "L'application est gratuite avec des options premium pour les usages avancés.",
    },
    {
      q: "Faut-il créer un compte ?",
      a: "Non. Vous pouvez commencer immédiatement sans inscription.",
    },
    {
      q: "Est-elle disponible sur Android et iOS ?",
      a: (
        <span>
          Oui, sur{" "}
          <a
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="AboutLink"
          >
            iOS
          </a>{" "}
          et{" "}
          <a
            href="https://play.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="AboutLink"
          >
            Android
          </a>
          .
        </span>
      ),
    },
    {
      q: "Collectez-vous des données personnelles ?",
      a: "Non. Vos données d'analyse sont stockées localement sur votre appareil.",
    },
    {
      q: "J'ai une autre question",
      a: (
        <span>
          Contactez-nous via la page{" "}
          <a href="/Contact" className="AboutLink">
            contact
          </a>
          .
        </span>
      ),
    },
  ];

  const heroStats = [
    {
      value: "30s",
      label: "pour obtenir un premier diagnostic",
    },
    {
      value: "80%",
      label: "des dégâts évitables avec une inspection précoce",
    },
    {
      value: "100% local",
      label: "vos données restent sur votre téléphone, jamais sur nos serveurs",
    },
  ];

  const reviews = [
    {
      author: "Jean M., Paris",
      text: "Grâce à Reaft, j'ai identifié des zones de moisissure invisibles à l'œil nu.",
    },
    {
      author: "Sophie L., Lyon",
      text: "Le rapport m'a permis d'argumenter avec le constructeur de façon factuelle.",
    },
    {
      author: "Marc T., Montréal",
      text: "Enfin une application simple pour suivre la qualité de plusieurs bâtiments.",
    },
  ];

  const impactFacts = [
    {
      value: "1 m²",
      text: "de moisissure non traitée peut se propager en moins de 3 mois.",
    },
    {
      value: "70%",
      text: "des litiges de construction concernent des malfaçons détectées trop tard.",
    },
    {
      value: "60%",
      text: "d'économies possibles sur les réparations grâce à une détection précoce.",
    },
    {
      value: "24/7",
      text: "de vision continue sur l'état de votre parc immobilier.",
    },
  ];

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-topbar">
            <p className="hero-kicker">Inspection prédictive par IA</p>
            <div className="hero-store" aria-label="Disponible sur iOS et Android">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hero-store-link"
              >
                <img
                  src={appStoreImage}
                  alt="Télécharger sur l'App Store"
                  className="hero-store-badge"
                />
              </a>
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hero-store-link"
              >
                <img
                  src={googlePlayImage}
                  alt="Télécharger sur Google Play"
                  className="hero-store-badge"
                />
              </a>
            </div>
          </div>
          <h1 className="hero-title">
            Détectez les anomalies de bâtiment avant qu'elles ne deviennent
            coûteuses.
          </h1>
          <p className="hero-description">
            Reaft transforme une simple photo en diagnostic actionnable. Vous
            anticipez les risques, priorisez les interventions et suivez chaque
            zone critique dans un seul outil.
          </p>

          <div className="hero-actions">
            <a href="#modules" className="hero-btn hero-btn-primary">
              Voir les fonctionnalités
            </a>
            <a href="/Contact" className="hero-btn hero-btn-secondary">
              Demander une démo
            </a>
          </div>

          <div className="hero-stats">
            {heroStats.map((stat) => (
              <article key={stat.value} className="hero-stat">
                <p className="hero-stat-value">{stat.value}</p>
                <p className="hero-stat-label">{stat.label}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <p className="status-pill">Diagnostic instantané</p>
          <div className="mockup-shell">
            <img
              className="hero-phone-screen hero-phone-screen-left"
              src="/screenshots/batiments.png"
              alt="Capture de l'application Reaft avec analyse des bâtiments"
            />
            <img
              className="hero-phone-screen hero-phone-screen-right"
              src="/screenshots/map.png"
              alt="Capture de l'application Reaft avec carte des inspections"
            />
          </div>
          <p className="trust-pill">Mode local: confidentialité préservée</p>
        </div>
      </section>

      <section id="modules" className="landing-section">
        <p className="section-eyebrow">Fonctionnalités d'analyse</p>
        <h2 className="section-title">
          Une suite d'outils pour inspecter vite et bien
        </h2>
        <p className="section-subtitle">
          Passez de l'observation au plan d'action en quelques secondes.
        </p>

        <div className="features-grid">
          {modules.map((module) => (
            <FeatureCard
              key={module.title}
              icon={module.icon}
              title={module.title}
              description={module.description}
            />
          ))}
        </div>
      </section>

      <section id="reviews" className="landing-section">
        <p className="section-eyebrow">Témoignages</p>
        <h2 className="section-title">Ils ont déjà adopté Reaft</h2>
        <div className="reviews-grid">
          {reviews.map((review) => (
            <ReviewCard
              key={review.author}
              author={review.author}
              text={review.text}
            />
          ))}
        </div>
      </section>

      <section className="science-section">
        <div className="science-header">
          <p className="science-badge">Impact mesurable</p>
          <h2 className="section-title science-title">
            Pourquoi inspecter tôt change tout
          </h2>
        </div>
        <div className="science-content">
          {impactFacts.map((fact) => (
            <article key={fact.value} className="impact-card">
              <p className="impact-value">{fact.value}</p>
              <p className="impact-text">{fact.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="landing-section faq-section">
        <p className="section-eyebrow">Questions fréquentes</p>
        <h2 className="section-title">FAQ</h2>

        <div className="faq-container">
          {faqs.map((item, i) => {
            const isOpen = faqOpen === i;
            return (
              <article key={item.q} className={`faq-item ${isOpen ? "open" : ""}`}>
                <button
                  className="faq-trigger"
                  type="button"
                  onClick={() => setFaqOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <span className="faq-symbol">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <p className="faq-answer">{item.a}</p>}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <article className="feature-card">
      <p className="feature-icon">{icon}</p>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </article>
  );
}

function ReviewCard({ author, text }) {
  return (
    <article className="review-card">
      <p className="review-text">"{text}"</p>
      <p className="review-author">{author}</p>
      <p className="review-rating" aria-label="5 étoiles">
        ★★★★★
      </p>
    </article>
  );
}
