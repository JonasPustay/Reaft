import React from "react";
import "../styles/TextLegalAndAbout.css";

export default function Legal() {
  return (
    <div className="TextContainer">
      <h1>Mentions légales</h1>
     

      <div className="TextSection">
        <h2>Éditeur du site</h2>
        <p>
          Nom de l'entreprise : <strong>REAFT</strong>
          <br />
          SIRET / RCS : <strong>81245796300028</strong>
          <br />
          Siège social : <strong>71 rue Robespierre
            93100 Montreuil</strong>
        </p>
      </div>

      <div className="TextSection">
        <h2>Directeur de la publication</h2>
        <p>Joel Munanga </p>
      </div>

      <div className="TextSection">
        <h2>Hébergeur</h2>
        <p>
          Hébergeur : <strong>Cloudflare Pages </strong>
          <br />
          Adresse : <strong>101 Townsend St, San Francisco, CA 94107, USA</strong>
          <br />
          Téléphone : <strong>+1 (415) 123-4567</strong>
        </p>
      </div>

      <div className="TextSection">
        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble des éléments présents sur ce site (textes, images, logos, icônes, fichiers, bases de
          données, mise en forme, code) est protégé par le droit de la propriété intellectuelle et appartient
          à <strong>REAFT</strong> ou est utilisé avec autorisation. Toute reproduction totale ou
          partielle est interdite sans autorisation écrite.
        </p>
      </div>

      <div className="TextSection">
        <h2>Responsabilité</h2>
        <p>
          Les informations diffusées sur ce site sont fournies à titre indicatif.{" "}
          <strong>REAFT</strong>
           décline toute responsabilité en cas d'erreurs ou d'omissions. Nous mettons en œuvre des moyens
          raisonnables pour assurer l'exactitude et la mise à jour des informations.
        </p>
      </div>

      <div className="TextSection">
        <h2>Contacts</h2>
        <p>
          Pour toute question relative au site ou à la protection des données personnelles :
          <br />
          Email :{" "}
          <strong>
            <a href="mailto:dpo@reaft.com">dpo@reaft.com</a>
          </strong>
          <br />
          Adresse postale : <strong>71 rue Robespierre
            93100 Montreuil</strong>
        </p>
      </div>

      <div className="TextSection">
        <h2>Modifications des mentions</h2>
        <p>
          Nous nous réservons le droit de modifier les présentes mentions légales à tout moment. Les modifications
          prendront effet dès leur publication sur le site.
        </p>
      </div>
    </div>
  );
}
