import React from 'react';
import "../styles/TextLegalAndAbout.css";

export default function CGV({ darkMode }) {
    return (
        <div className="TextContainer">
            <h1>Conditions Générales de Vente</h1>

            <div className="TextSection">
                <h2>Objet</h2>
                <p>
                    Les présentes conditions générales de vente régissent les relations commerciales 
                    entre notre entreprise et ses clients.
                </p>
            </div>

            <div className="TextSection">
                <h2>Produits et Services</h2>
                <p>
                    Nos produits et services sont décrits avec la plus grande précision possible. 
                    Toutefois, nous ne saurions être responsables des erreurs ou omissions.
                </p>
            </div>

            <div className="TextSection">
                <h2>Tarifs</h2>
                <p>
                    Les tarifs appliqués sont ceux en vigueur au jour de la commande. 
                    Les prix sont exprimés en euros TTC.
                </p>
            </div>

            <div className="TextSection">
                <h2>Commandes</h2>
                <p>
                    Toute commande implique l'acceptation sans réserve de nos conditions générales de vente.
                </p>
            </div>

            <div className="TextSection">
                <h2>Livraison</h2>
                <p>
                    La livraison s'effectue à l'adresse indiquée par le client. Les délais annoncés 
                    sont donnés à titre indicatif.
                </p>
            </div>

            <div className="TextSection">
                <h2>Droit de rétractation</h2>
                <p>
                    Le client dispose d'un délai de 14 jours pour exercer son droit de rétractation 
                    conformément à la législation en vigueur.
                </p>
            </div>

            <div className="TextSection">
                <h2>Responsabilité</h2>
                <p>
                    Notre responsabilité est limitée au montant total de la commande.
                </p>
            </div>

            <div className="TextSection">
                <h2>Données personnelles</h2>
                <p>
                    Les données personnelles sont traitées conformément à notre politique de confidentialité.
                </p>
            </div>
        </div>
    );
}