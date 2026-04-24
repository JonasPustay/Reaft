import "../styles/Contact.css";

export default function Contact() {
  return (
    <div className="ContactPage">
      <section className="ContactCard">
        <p className="ContactEyebrow">CONTACT</p>
        <h1 className="ContactTitle">Une question sur Reaft ?</h1>
        <p className="ContactText">
          Pour toute demande, envoyez-nous un mail. Nous vous repondrons
          rapidement.
        </p>
        <a className="ContactEmailLink" href="mailto:mtt200102@gmail.com">
          mtt200102@gmail.com
        </a>
      </section>
    </div>
  );
}
