import React, { useState, useEffect } from 'react';
import '../styles/CookieBanner.css';
import CookieBanner from '../components/CookieBanner';

const STORAGE_KEY = 'site_cookie_preferences';

const defaultPrefs = {
  necessary: true,
  analytics: false,
  marketing: false,
  accepted: false,
};

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPrefs(parsed);
        setVisible(!parsed.accepted);
      } else {
        setVisible(true);
      }
    } catch (e) {
      setVisible(true);
    }
  }, []);

  const savePrefs = (newPrefs) => {
    const toSave = { ...newPrefs, accepted: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setPrefs(toSave);
    setVisible(false);
  };

  const acceptAll = () => savePrefs({ necessary: true, analytics: true, marketing: true });
  const rejectAll = () => savePrefs({ necessary: true, analytics: false, marketing: false });

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-content">
        <p>
          Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez accepter tous les cookies,
          refuser les cookies non essentiels ou personnaliser vos préférences.
        </p>
        <div className="cookie-actions">
          <button className="btn" onClick={acceptAll}>Tout accepter</button>
          <button className="btn btn--outline" onClick={rejectAll}>Refuser</button>
          <button className="btn btn--link" onClick={() => setShowSettings(!showSettings)}>Paramètres</button>
        </div>

        {showSettings && (
          <div className="cookie-settings">
            <div className="setting-row">
              <label>
                <input type="checkbox" checked={prefs.necessary} disabled />
                <span>Cookies nécessaires</span>
              </label>
              <p className="muted">Indispensables au fonctionnement du site.</p>
            </div>

            <div className="setting-row">
              <label>
                <input type="checkbox" checked={prefs.analytics} onChange={(e) => setPrefs(s => ({ ...s, analytics: e.target.checked }))} />
                <span>Cookies analytics</span>
              </label>
              <p className="muted">Mesurent la fréquentation et aident à améliorer le site.</p>
            </div>

            <div className="setting-row">
              <label>
                <input type="checkbox" checked={prefs.marketing} onChange={(e) => setPrefs(s => ({ ...s, marketing: e.target.checked }))} />
                <span>Cookies marketing</span>
              </label>
              <p className="muted">Permettent de proposer des publicités ciblées.</p>
            </div>

            <div className="settings-actions">
              <button className="btn" onClick={() => savePrefs(prefs)}>Enregistrer</button>
              <button className="btn btn--link" onClick={() => setShowSettings(false)}>Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
