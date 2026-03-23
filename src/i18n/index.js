import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import ta from './ta.json';
import hi from './hi.json';
import fr from './fr.json';
import es from './es.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
      hi: { translation: hi },
      fr: { translation: fr },
      es: { translation: es }
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;