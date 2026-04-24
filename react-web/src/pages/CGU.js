import React from "react";
import "../styles/TextLegalAndAbout.css";

export default function CGU() {
  return (
    <div className="TextContainer">
      <h1 className="TitleContainer">Conditions générales d'utilisation (CGU)</h1>
      <p>Date d'entrée en vigueur : 05/12/2025</p>

      <div className="TextSection">
          <h2>Objet</h2>
          <p>
            Les présentes Conditions Générales d'Utilisation ont pour objet de définir les modalités
            d'accès et d'utilisation du site vitrine et des services fournis par la société REAFT.
          </p>
        </div>

        <div className="TextSection">
          <h2>Acceptation</h2>
          <p>
            L'accès au site et son utilisation impliquent l'acceptation sans réserve des présentes CGU.
            L'utilisateur s'engage à les respecter et à les consulter régulièrement.
          </p>
        </div>

        <div className="TextSection">
          <h2>Services proposés</h2>
          <p>
            REAFT propose des services d'aide à la détection et à l'analyse de fissures par intelligence
            artificielle, la génération de diagnostics indicatifs et le suivi historique des analyses.
            Les services présentés sur ce site sont descriptifs et informatifs.
          </p>
        </div>

        <div className="TextSection">
          <h2>Compte utilisateur</h2>
          <p>
            Lorsque le site prévoit la création d'un compte, l'utilisateur s'engage à fournir des informations
            exactes et à jour. REAFT se réserve le droit de suspendre ou supprimer tout compte en cas d'usage
            frauduleux ou de non-respect des présentes CGU.
          </p>
        </div>

        <div className="TextSection">
          <h2>Responsabilités</h2>
          <p>
            Les diagnostics fournis par l'IA sont indicatifs. REAFT n'est pas responsable des décisions prises
            sur la seule base des résultats fournis par le système. L'application constitue un outil d'aide à la
            détection et ne remplace pas l'avis d'un expert structurel.
          </p>
          <p>
            REAFT décline toute responsabilité en cas d'utilisation inappropriée, de perte de données imputable
            à l'utilisateur, ou d'indisponibilité temporaire du service pour des raisons techniques.
          </p>
        </div>

        <div className="TextSection">
          <h2>Propriété intellectuelle</h2>
          <p>
            L'ensemble des contenus présents sur le site (textes, images, logos, graphismes, codes source,
            bases de données) est la propriété exclusive de REAFT ou de ses partenaires et est protégé par le
            droit d'auteur et la propriété intellectuelle. Toute reproduction ou représentation totale ou
            partielle est interdite sans autorisation écrite préalable.
          </p>
        </div>

        <div className="TextSection">
          <h2>Données personnelles</h2>
          <p>
            L'utilisation du site et des services implique la collecte et le traitement de données personnelles.
            La gestion de ces données est décrite dans notre <a href="/privacy">Politique de confidentialité</a>.
            Conformément au RGPD, vous disposez des droits d'accès, de rectification, d'effacement, de
            limitation et d'opposition. Pour exercer vos droits, contactez : <a href="mailto:[email@example.com]">dpo@reaft.com</a>.
          </p>
          <p>
            Les cookies et traceurs sont décrits dans notre <a href="/cookies">Politique cookies</a>. Les cookies non essentiels ne sont déposés qu'après votre consentement.
          </p>
        </div>

        <div className="TextSection">
          <h2>Résiliation</h2>
          <p>
            L'utilisateur peut supprimer son compte et ses données depuis son interface lorsqu'un compte existe.
            REAFT peut résilier ou suspendre l'accès au service en cas de violation des présentes CGU.
          </p>
        </div>

        <div className="TextSection">
          <h2>Loi applicable</h2>
          <p>
            Les présentes CGU sont régies par le droit français. En cas de litige, compétence exclusive est
            attribuée aux tribunaux compétents de Paris, sous réserve d'un autre choix imposé par une règle
            de droit impérative.
          </p>
        </div>

        <div className="TextSection">
          Pour toute question relative aux présentes CGU ou à la protection des données : <a href="mailto:[email@example.com]">dpo@reaft.com</a>
        </div>
    </div>
  );
}
