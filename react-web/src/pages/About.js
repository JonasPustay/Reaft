import "../styles/TextLegalAndAbout.css";

export default function About() {
  return (
    <div className="TextContainer">
      <h1 className="TitleContainer">À propos de Reaft</h1>
      <p className="TextSubtitle">
        L’intelligence artificielle au service de la fiabilité et de la durabilité des bâtiments.
      </p>

      <div className="TextSection">
        <h2>Notre mission</h2>
        <p>
          Chez <strong>Reaft</strong>, nous avons une ambition claire : rendre la maintenance préventive
          accessible, rapide et intelligente. Grâce à notre technologie d’analyse visuelle basée sur
          l’IA, nous détectons automatiquement les <strong>fissures</strong>, <strong>moisissures</strong>
          et <strong>malfaçons</strong> pour éviter des réparations coûteuses.
        </p>
        <p>
          Nous aidons les particuliers, architectes et professionnels à mieux comprendre
          l’état de leurs bâtiments et à agir avant qu’il ne soit trop tard.
        </p>
      </div>

      <div className="TextSection">
        <h2>Notre technologie</h2>
        <p>
          L’application <strong>Reaft</strong> repose sur une intelligence artificielle d’analyse d’image
          de dernière génération, capable de repérer les anomalies invisibles à l’œil nu.
        </p>
        <ul className="TextList">
          <li>🔍 Détection automatique des défauts et dégradations</li>
          <li>📊 Rapports de diagnostic instantanés</li>
          <li>🔔 Alertes intelligentes en cas de risque</li>
          <li>🧠 Modèle d’IA continuellement amélioré</li>
        </ul>
      </div>

      <div className="TextSection">
        <h2>Nos engagements</h2>
        <p>
          Reaft s’engage pour un habitat plus sûr et plus durable.
          Nous plaçons la <strong>confidentialité</strong> et la <strong>responsabilité environnementale</strong>
          au cœur de notre démarche.
        </p>
        <p>
          Toutes vos données d’analyse restent <strong>locales et privées</strong>,
          et notre technologie contribue à réduire les gaspillages liés à une mauvaise maintenance.
        </p>
      </div>

      <div className="TextSection">
        <h2>L'équipe</h2>
        <p>
          Notre équipe réunit des ingénieurs en intelligence artificielle, des architectes
          et des spécialistes du bâtiment, unis par la volonté de simplifier et fiabiliser
          l’inspection immobilière.
        </p>
      </div>

      <div className="TextSection">
        <h2>Nous contacter</h2>
        <p>
          Une question ou une idée de collaboration ?  
          Contactez-nous via la <a href="/Contact" className="AboutLink">page contact</a>.
        </p>
      </div>
    </div>
  );
}
