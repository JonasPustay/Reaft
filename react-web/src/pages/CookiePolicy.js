import React from 'react';
import "../styles/TextLegalAndAbout.css";

export default function CookiePolicy({ darkMode }) {
  return (
    <div className="TextContainer">
      <h1 className="TitleContainer">Politique relative aux cookies</h1>
      <p>Date d'entrée en vigueur : 05/12/2025</p>

      <div className="TextSection">
        <h2>Qu'est-ce qu'un cookie ?</h2>
        <p>
          Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone) lorsque
          vous visitez un site. Il permet d'enregistrer des informations relatives à votre navigation.
        </p>
      </div>

      <div className="TextSection">
        <h2>Cookies utilisés sur ce site</h2>
        <ul>
          <li>Cookies nécessaires : indispensables au fonctionnement du site (persistants ou de session).</li>
          <li>Cookies de performance / analytics : mesurent la fréquentation et aident à améliorer le site (ex : Google Analytics anonymisé).</li>
          <li>Cookies de fonctionnalité : mémorisent des choix (langue, préférences).</li>
          <li>Cookies marketing : servent à proposer des publicités ciblées (non utilisés sauf consentement).</li>
        </ul>
      </div>

      <div className="TextSection">
        <h2>Consentement</h2>
        <p>
          Les cookies non essentiels ne sont déposés qu'après obtention de votre consentement explicite via la
          bannière cookies. Vous pouvez modifier vos choix à tout moment.
        </p>
      </div>

      <div className="TextSection">
        <h2>Gérer vos préférences</h2>
        <p>
          La plupart des navigateurs vous permettent de refuser ou supprimer les cookies. Vous pouvez également
          gérer les préférences via la bannière cookies du site.
        </p>
        <ul>
          <li>Chrome : Paramètres &gt; Confidentialité et sécurité &gt; Cookies et autres données de site.</li>
          <li>Firefox : Options &gt; Vie privée et sécurité &gt; Cookies et données de site.</li>
          <li>Safari : Préférences &gt; Confidentialité &gt; Bloquer tous les cookies.</li>
        </ul>
      </div>

      <div className="TextSection">
        <h2>Durée de conservation</h2>
        <p>
          La durée de conservation des cookies dépend de leur finalité : les cookies de session sont supprimés
          à la fermeture du navigateur, les cookies persistants ont une durée variable (ex : analytics 13 mois).
        </p>
      </div>

      <div className="TextSection">
        <h2>Contact</h2>
        <p>
          Pour toute question concernant la politique de cookies : <a href="mailto:dpo@reaft.com">dpo@reaft.com</a>
        </p>
      </div>
    </div>
  );
}
