import React from 'react';
import '../styles/TextLegalAndAbout.css';

export default function PrivacyPolicy() {
  return (
    <div className="TextContainer">
      <h1 className="TitleContainer">Politique de confidentialité</h1>
      <p className="effective-date">Date d'entrée en vigueur : 05/12/2025</p>

      <div className="TextSection">
        <h2>Introduction</h2>
        <p>
          La présente politique de confidentialité décrit la manière dont <strong>REAFT</strong>
          collecte, utilise et protège les données personnelles des utilisateurs de ce site, conformément au
          Règlement Général sur la Protection des Données (RGPD).
        </p>
      </div>

      <div className="TextSection">
        <h2>Responsable de traitement</h2>
        <p>
          Responsable : <strong>REAFT</strong><br />
          Contact : <strong><a href="mailto:dpo@reaft.com">dpo@reaft.com</a></strong><br />
          Adresse : <strong>71 rue Robespierre
            93100 Montreuil</strong>
        </p>
      </div>

      <div className="TextSection">
        <h2>Données collectées</h2>
        <ul>
          <li>Données fournies volontairement via les formulaires : nom, prénom, e‑mail, téléphone, message.</li>
          <li>Données techniques de connexion : adresse IP, type de navigateur, pages visitées, durées de visite (logs).</li>
          <li>Cookies et traceurs : voir la page dédiée aux cookies pour plus de détails.</li>
        </ul>
      </div>

      <div className="TextSection">
        <h2>Finalités et bases légales</h2>
        <ul>
          <li>Répondre aux demandes via le formulaire : exécution d'une demande / contrat.</li>
          <li>Envoi d'informations commerciales : consentement préalable explicite.</li>
          <li>Amélioration du site : intérêt légitime pour les statistiques et la sécurité.</li>
        </ul>
      </div>

      <div className="TextSection">
        <h2>Limitation de responsabilité</h2>
        <p>
          Les analyses, diagnostics et avis fournis par des systèmes d'intelligence artificielle sur ce site
          sont fournis à titre indicatif et ne constituent pas un avis d'expert. Toute décision ou intervention
          substantielle fondée sur ces éléments doit être confirmée par un professionnel qualifié. REAFT décline
          toute responsabilité des conséquences résultant de décisions prises exclusivement sur la base des
          résultats fournis par l'IA sans consultation préalable d'un expert compétent.
        </p>
      </div>

      <div className="TextSection">
        <h2>Durée de conservation</h2>
        <p>
          Les données sont conservées pour une durée proportionnée aux finalités décrites : par défaut 3 ans pour
          les contacts commerciaux, logs anonymisés conservés 13 mois pour analytics, sauf obligation légale
          contraire.
        </p>
      </div>

      <div className="TextSection">
        <h2>Destinataires</h2>
        <p>
          Les données sont accessibles uniquement au personnel habilité et peuvent être transférées à des
          sous-traitants : hébergeur, prestataires d'e‑mailing, analytics. Des garanties contractuelles sont en
          place.
        </p>
      </div>

      <div className="TextSection">
        <h2>Transferts hors UE</h2>
        <p>
          Si des transferts de données hors Union européenne sont effectués, ils reposent sur des garanties
          appropriées (clauses contractuelles types, décision d'adéquation, etc.).
        </p>
      </div>

      <div className="TextSection">
        <h2>Vos droits</h2>
        <ul>
          <li>Droit d'accès, de rectification et d'effacement.</li>
          <li>Droit à la limitation et d'opposition.</li>
          <li>Droit à la portabilité des données.</li>
          <li>Retrait du consentement à tout moment pour les traitements fondés sur celui-ci.</li>
        </ul>
        <p>
          Pour exercer vos droits, contactez-nous à <strong><a href="mailto:dpo@reaft.com">dpo@reaft.com</a></strong>
          ou par courrier à <strong>71 rue Robespierre
            93100 Montreuil</strong> en joignant une copie d’une pièce d’identité.
        </p>
      </div>

      <div className="TextSection">
        <h2>Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos
          données. Malgré cela, aucun système n'est invulnérable et nous attirons votre attention sur les risques
          inhérents aux communications sur Internet.
        </p>
      </div>

      <div className="TextSection">
        <h2>Contact CNIL</h2>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de la
          CNIL (https://www.cnil.fr).
        </p>
      </div>
    </div>
  );
}
