// Simple i18n dictionary and helpers
(function(){
  const i18n = {
    en: {
      start: "Start",

    },
    fr: {
      start: "Commencer",

    },
    de: {
      start: "starten",

    },
    es: {
      start: "Iniciar",

    },
    pl: {
      start: "Start",

    },
    no: {
      start: "Start",

    },
    pt: {
      start: "Iniciar",

    }
  };

  let userLang = (navigator.language || 'en').slice(0,2);
  if(!i18n[userLang]) userLang = 'en';

  function t(key){
    return i18n[userLang][key] || i18n.en[key] || key;
  }

  // Expose both __i18n and a global T() alias expected by main.js
  window.__i18n = { dict: i18n, lang: userLang, t };
  if(!window.T) {
    window.T = t; // backward compatibility / convenience
  }
})();
