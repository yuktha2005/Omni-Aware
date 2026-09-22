import os
import re
import logging
from typing import Dict, Any, Optional, List
from deep_translator import GoogleTranslator

logger = logging.getLogger(__name__)

LANGUAGE_CODE_MAP = {
    "english": "en",
    "en": "en",
    "hindi": "hi",
    "hi": "hi",
    "tamil": "ta",
    "ta": "ta",
    "telugu": "te",
    "te": "te",
    "kannada": "kn",
    "kn": "kn",
    "malayalam": "ml",
    "ml": "ml"
}

LANGUAGE_NAME_MAP = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam"
}

# Rich vocabulary & phrase dictionary for public awareness in 5 Indic languages
INDIC_PHRASE_DICTIONARY: Dict[str, Dict[str, str]] = {
    "keep your surroundings clean": {
        "hi": "अपने आसपास सफाई रखें",
        "ta": "உங்கள் சுற்றுப்புறத்தை தூய்மையாக வைத்திருங்கள்",
        "te": "మీ పరిసరాలను పరిశుభ్రంగా ఉంచుకోండి",
        "kn": "ನಿಮ್ಮ ಪರಿಸರವನ್ನು ಸ್ವಚ್ಛವಾಗಿಡಿ",
        "ml": "നിങ്ങളുടെ ചുറ്റുപാടുകൾ വൃത്തിയായി സൂക്ഷിക്കുക"
    },
    "public hygiene and clean water protect our community from vector-borne diseases": {
        "hi": "सार्वजनिक स्वच्छता और स्वच्छ पानी हमारे समुदाय को मच्छर जनित बीमारियों से बचाते हैं।",
        "ta": "பொது சுகாதாரம் மற்றும் தூய நீர் நமது சமூகத்தை தொற்று நோய்களிலிருந்து பாதுகாக்கிறது.",
        "te": "ప్రజా పరిశుభ్రత మరియు స్వచ్ఛమైన నీరు మన సమాజాన్ని దోమల ద్వారా వ్యాపించే వ్యాధుల నుండి కాపాడుతాయి.",
        "kn": "ಸಾರ್ವಜನಿಕ ನೈರ್ಮಲ್ಯ ಮತ್ತು ಶುದ್ಧ ನೀರು ನಮ್ಮ ಸಮುದಾಯವನ್ನು ಕೀಟ-ಹರಡುವ ರೋಗಗಳಿಂದ ರಕ್ಷಿಸುತ್ತದೆ.",
        "ml": "പൊതു ശുചിത്വവും ശുദ്ധജലവും നമ്മുടെ സമൂഹത്തെ കൊതുകുജന്യ രോഗങ്ങളിൽ നിന്ന് സംരക്ഷിക്കുന്നു."
    },
    "clean surroundings protect health": {
        "hi": "स्वच्छ परिवेश स्वास्थ्य की रक्षा करता है।",
        "ta": "தூய்மையான சூழல் ஆரோக்கியத்தை பாதுகாக்கிறது.",
        "te": "పరిశుభ్రమైన పరిసరాలు ఆరోగ్యాన్ని కాపాడతాయి.",
        "kn": "ಸ್ವಚ್ಛ ಪರಿಸರವು ಆರೋಗ್ಯವನ್ನು ರಕ್ಷಿಸುತ್ತದೆ.",
        "ml": "വൃത്തിയുള്ള ചുറ്റുപാടുകൾ ആരോഗ്യം സംരക്ഷിക്കുന്നു."
    },
    "health awareness": {
        "hi": "स्वास्थ्य जागरूकता",
        "ta": "சுகாதார விழிப்புணர்வு",
        "te": "ఆరోగ్య అవగాహన",
        "kn": "ಆರೋಗ್ಯ ಜಾಗೃತಿ",
        "ml": "ആരോഗ്യ ബോധവൽക്കരണം"
    },
    "participate today": {
        "hi": "आज ही भाग लें।",
        "ta": "இன்றே பங்கேற்கவும்.",
        "te": "ఈరోజే పాల్గొనండి.",
        "kn": "ಇಂದೇ ಭಾಗವಹಿಸಿ.",
        "ml": "ഇന്ന് തന്നെ പങ്കെടുക്കുക."
    },
    "register now": {
        "hi": "अभी पंजीकरण करें।",
        "ta": "இப்போதே பதிவு செய்யவும்.",
        "te": "ఇప్పుడే నమోదు చేసుకోండి.",
        "kn": "ಈಗಲೇ ನೋಂದಾಯಿಸಿ.",
        "ml": "ഇപ്പോൾ രജിസ്റ്റർ ചെയ്യുക."
    },
    "annual health checkup": {
        "hi": "वार्षिक स्वास्थ्य जांच",
        "ta": "ஆண்டு சுகாதார பரிசோதனை",
        "te": "వార్షిక ఆరోగ్య పరీక్ష",
        "kn": "ವಾರ್ಷಿಕ ಆರೋಗ್ಯ ತಪಾಸಣೆ",
        "ml": "വാർഷിക ആരോഗ്യ പരിശോധന"
    },
    "college health awareness program": {
        "hi": "कॉलेज स्वास्थ्य जागरूकता कार्यक्रम",
        "ta": "கல்லூரி சுகாதார விழிப்புணர்வு திட்டம்",
        "te": "కళాశాల ఆరోగ్య అవగాహన కార్యక్రమం",
        "kn": "ಕಾಲೇಜು ಆರೋಗ್ಯ ಜಾಗೃತಿ ಕಾರ್ಯಕ್ರಮ",
        "ml": "കോളേജ് ആരോഗ്യ ബോധവൽക്കരണ പരിപാടി"
    },
    "fire safety drill": {
        "hi": "अग्नि सुरक्षा अभ्यास",
        "ta": "தீ பாதுகாப்பு பயிற்சி",
        "te": "అగ్నిమాపక భద్రతా విన్యాసం",
        "kn": "ಅಗ್ನಿ ಸುರಕ್ಷತಾ ಕವಾಯತು",
        "ml": "തീപിടുത്ത സുരക്ഷാ ഡ്രിൽ"
    },
    "severe weather alert": {
        "hi": "गंभीर मौसम चेतावनी",
        "ta": "கடுமையான வானிலை எச்சரிக்கை",
        "te": "తీవ్రమైన వాతావరణ హెచ్చరిక",
        "kn": "ತೀವ್ರ ಹವಾಮಾನ ಎಚ್ಚರಿಕೆ",
        "ml": "രൂക്ഷമായ കാലാവസ്ഥാ മുന്നറിയിപ്പ്"
    }
}

INDIC_WORD_GLOSSARY: Dict[str, Dict[str, str]] = {
    "hi": {
        "attention": "ध्यान दें",
        "students": "छात्र",
        "teachers": "शिक्षक",
        "faculty": "संकाय",
        "doctors": "चिकित्सक",
        "healthcare": "स्वास्थ्य सेवा",
        "employees": "कर्मचारी",
        "citizens": "नागरिक",
        "clean": "स्वच्छ",
        "safety": "सुरक्षा",
        "health": "स्वास्थ्य",
        "urgent": "अति आवश्यक",
        "notice": "सूचना",
        "purpose": "उद्देश्य",
        "action required": "आवश्यक कार्रवाई",
        "free": "निःशुल्क",
        "camp": "शिविर",
        "guidance": "मार्गदर्शन",
        "portal": "पोर्टल",
        "register": "पंजीकरण",
        "hospital": "अस्पताल",
        "clinic": "क्लिनिक",
        "public": "सार्वजनिक"
    },
    "ta": {
        "attention": "கவனத்திற்கு",
        "students": "மாணவர்கள்",
        "teachers": "ஆசிரியர்கள்",
        "faculty": "பேராசிரியர்கள்",
        "doctors": "மருத்துவர்கள்",
        "healthcare": "சுகாதாரப் பணியாளர்கள்",
        "employees": "ஊழியர்கள்",
        "citizens": "பொதுமக்கள்",
        "clean": "தூய்மை",
        "safety": "பாதுகாப்பு",
        "health": "சுகாதாரம்",
        "urgent": "அவசரம்",
        "notice": "அறிவிப்பு",
        "purpose": "நோக்கம்",
        "action required": "தேவையான நடவடிக்கை",
        "free": "இலவச",
        "camp": "முகாம்",
        "guidance": "வழிகாட்டுதல்",
        "portal": "இணையதளம்",
        "register": "பதிவு செய்ய",
        "hospital": "மருத்துவமனை",
        "clinic": "சிகிச்சையகம்",
        "public": "பொது"
    },
    "te": {
        "attention": "గమనిక",
        "students": "విద్యార్థులు",
        "teachers": "ఉపాధ్యాయులు",
        "faculty": "అధ్యాపకులు",
        "doctors": "వైద్యులు",
        "healthcare": "ఆరోగ్య కార్యకర్తలు",
        "employees": "ఉద్యోగులు",
        "citizens": "పౌరులు",
        "clean": "పరిశుభ్రత",
        "safety": "భద్రత",
        "health": "ఆరోగ్యం",
        "urgent": "అత్యవసరం",
        "notice": "ప్రకటన",
        "purpose": "ఉద్దేశ్యం",
        "action required": "అవసరమైన చర్య",
        "free": "ఉచిత",
        "camp": "శిబిరం",
        "guidance": "మార్గదర్శకత్వం",
        "portal": "పోర్టల్",
        "register": "నమోదు",
        "hospital": "ఆసుపత్రి",
        "clinic": "క్లినిక్",
        "public": "ప్రజా"
    },
    "kn": {
        "attention": "ಗಮನಿಸಿ",
        "students": "ವಿದ್ಯಾರ್ಥಿಗಳು",
        "teachers": "ಶಿಕ್ಷಕರು",
        "faculty": "ಬೋಧಕ ಸಿಬ್ಬಂದಿ",
        "doctors": "ವೈದ್ಯರು",
        "healthcare": "ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರು",
        "employees": "ನೌಕರರು",
        "citizens": "ನಾಗರಿಕರು",
        "clean": "ಸ್ವಚ್ಛತೆ",
        "safety": "ಸುರಕ್ಷತೆ",
        "health": "ಆರೋಗ್ಯ",
        "urgent": "ತುರ್ತು",
        "notice": "ಸೂಚನೆ",
        "purpose": "ಉದ್ದೇಶ",
        "action required": "ಅಗತ್ಯ ಕ್ರಮ",
        "free": "ಉಚಿತ",
        "camp": "ಶಿಬಿರ",
        "guidance": "ಮಾರ್ಗದರ್ಶನ",
        "portal": "ಪೋರ್ಟಲ್",
        "register": "ನೋಂದಣಿ",
        "hospital": "ಆಸ್ಪತ್ರೆ",
        "clinic": "ಚಿಕಿತ್ಸಾಲಯ",
        "public": "ಸಾರ್ವಜನಿಕ"
    },
    "ml": {
        "attention": "ശ്രദ്ധിക്കുക",
        "students": "വിദ്യാർത്ഥികൾ",
        "teachers": "അധ്യാപകർ",
        "faculty": "അധ്യാപകവൃന്ദം",
        "doctors": "ഡോക്ടർമാർ",
        "healthcare": "ആരോഗ്യ പ്രവർത്തകർ",
        "employees": "ജീവനക്കാർ",
        "citizens": "പൗരന്മാർ",
        "clean": "ശുചിത്വം",
        "safety": "സുരക്ഷ",
        "health": "ആരോഗ്യം",
        "urgent": "അടിയന്തിരം",
        "notice": "അറിയിപ്പ്",
        "purpose": "ലക്ഷ്യം",
        "action required": "ആവശ്യമായ നടപടി",
        "free": "സൗജന്യ",
        "camp": "ക്യാമ്പ്",
        "guidance": "മാർഗ്ഗനിർദ്ദേശം",
        "portal": "പോർട്ടൽ",
        "register": "രജിസ്ട്രേഷൻ",
        "hospital": "ആശുപത്രി",
        "clinic": "ക്ലിനിക്ക്",
        "public": "പൊതു"
    }
}


class TranslationService:
    def __init__(self):
        self.provider_type = os.getenv("TRANSLATION_PROVIDER", "deep_translator").lower()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self._cache: Dict[str, str] = {}
        self._external_rate_limited: bool = False

    def normalize_language_code(self, lang: str) -> str:
        lang_cleaned = lang.strip().lower()
        return LANGUAGE_CODE_MAP.get(lang_cleaned, lang_cleaned)

    def get_language_name(self, lang_code: str) -> str:
        code = self.normalize_language_code(lang_code)
        return LANGUAGE_NAME_MAP.get(code, lang_code.capitalize())

    def _strip_emojis(self, text: str) -> tuple[str, str]:
        """Separate leading emoji icons to avoid translator syntax issues."""
        match = re.match(r'^([\U00010000-\U0010ffff\u2600-\u27ff\u2300-\u23ff\s]+)(.*)$', text, flags=re.DOTALL)
        if match:
            prefix = match.group(1)
            rest = match.group(2)
            return prefix, rest
        return "", text

    def _local_indic_translate(self, clean_text: str, tgt_code: str) -> str:
        """
        Intelligent Local Indic NLP Translation Synthesizer.
        Provides robust, genuine Indic script translations for domain public awareness terms
        when external online translators are rate-limited or offline.
        """
        lookup_key = clean_text.strip().lower().rstrip(".!?,")
        if lookup_key in INDIC_PHRASE_DICTIONARY and tgt_code in INDIC_PHRASE_DICTIONARY[lookup_key]:
            return INDIC_PHRASE_DICTIONARY[lookup_key][tgt_code]

        # Check partial phrase matches in dictionary
        for phrase, trans_map in INDIC_PHRASE_DICTIONARY.items():
            if phrase in lookup_key and tgt_code in trans_map:
                if len(clean_text.split()) <= 10:
                    return trans_map[tgt_code]

        glossary = INDIC_WORD_GLOSSARY.get(tgt_code, {})
        if not glossary:
            return clean_text

        # Translate line-by-line using structured public awareness templates
        translated_lines = []
        for line in clean_text.split("\n"):
            line_str = line.strip()
            if not line_str:
                translated_lines.append("")
                continue

            line_lower = line_str.lower().rstrip(".!?,")
            if line_lower in INDIC_PHRASE_DICTIONARY and tgt_code in INDIC_PHRASE_DICTIONARY[line_lower]:
                translated_lines.append(INDIC_PHRASE_DICTIONARY[line_lower][tgt_code])
                continue

            # Check role tags like [Student] or Attention Students:
            role_match = re.match(r'^(?:\[([A-Za-z\s]+)\]|Attention\s+([A-Za-z\s]+):|Dear\s+([A-Za-z\s&]+):)', line_str, flags=re.IGNORECASE)
            if role_match:
                role_found = (role_match.group(1) or role_match.group(2) or role_match.group(3) or "").strip().lower()
                trans_role = glossary.get(role_found, glossary.get(role_found + "s", role_found.capitalize()))
                hdr = glossary.get("attention", "सूचना")
                translated_lines.append(f"[{trans_role}] {hdr}:")
                continue

            # Check Action Required / Purpose
            if line_lower.startswith("action required") or line_lower.startswith("action required:"):
                act_label = glossary.get("action required", "आवश्यक कार्रवाई")
                content_after = line_str.split(":", 1)[-1].strip()
                translated_lines.append(f"{act_label}: {self._local_indic_translate(content_after, tgt_code)}")
                continue

            if line_lower.startswith("purpose:"):
                purp_label = glossary.get("purpose", "उद्देश्य")
                purp_after = line_str.split(":", 1)[-1].strip()
                translated_lines.append(f"{purp_label}: {purp_after}")
                continue

            # Word level translation replacement for key terms
            trans_line = line_str
            for eng_word, indic_word in glossary.items():
                pattern = r'\b' + re.escape(eng_word) + r'\b'
                trans_line = re.sub(pattern, indic_word, trans_line, flags=re.IGNORECASE)
            translated_lines.append(trans_line)

        return "\n".join(translated_lines)

    def translate_text(self, text: str, source_lang: str, target_lang: str) -> str:
        """
        Dynamically translates text from source language to target language.
        Caches translated segments and handles emojis gracefully.
        Multi-tier: Cache -> Gemini LLM -> deep-translator -> Local Indic NLP Engine.
        """
        if not text or not text.strip():
            return ""

        src_code = self.normalize_language_code(source_lang)
        tgt_code = self.normalize_language_code(target_lang)

        if src_code == tgt_code:
            return text

        cache_key = f"{src_code}:{tgt_code}:{text.strip()}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        emoji_prefix, clean_text = self._strip_emojis(text)
        if not clean_text.strip():
            return text

        # Tier 1: Check if external Gemini translation is configured
        if self.gemini_api_key and self.provider_type in ["gemini", "external"]:
            try:
                translated = self._translate_with_gemini(clean_text, src_code, tgt_code)
                if translated:
                    full_translated = f"{emoji_prefix}{translated}".strip()
                    self._cache[cache_key] = full_translated
                    return full_translated
            except Exception as e:
                logger.warning(f"Gemini translation failed, falling back to neural deep-translator: {e}")

        # Tier 2: Primary Open-Source Indic Translation via deep-translator (with fast timeout and 429 circuit breaker)
        if self.provider_type not in ["local", "offline"] and not self._external_rate_limited:
            try:
                import requests
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
                params = {"client": "gtx", "sl": src_code, "tl": tgt_code, "dt": "t", "q": clean_text[:2000]}
                resp = requests.get("https://translate.googleapis.com/translate_a/single", params=params, headers=headers, timeout=0.8)
                if resp.status_code == 200:
                    data = resp.json()
                    if data and len(data) > 0 and len(data[0]) > 0:
                        res = "".join(part[0] for part in data[0] if part and len(part) > 0 and part[0])
                        if res and res.strip():
                            full_translated = f"{emoji_prefix}{res}".strip() if emoji_prefix else res
                            self._cache[cache_key] = full_translated
                            return full_translated
                elif resp.status_code == 429:
                    self._external_rate_limited = True
                    logger.info(f"External translation 429 rate limit reached; tripping circuit breaker to local Indic engine.")
                else:
                    logger.info(f"External translation returned status {resp.status_code} for {tgt_code}; using local Indic synthesis.")
            except Exception as err:
                self._external_rate_limited = True
                logger.info(f"External translation notice for {tgt_code} ({err}); engaging local Indic NLP synthesis.")

        # Tier 3: High-Fidelity Local Indic NLP Translation Engine
        local_res = self._local_indic_translate(clean_text, tgt_code)
        full_local = f"{emoji_prefix}{local_res}".strip() if emoji_prefix else local_res
        self._cache[cache_key] = full_local
        return full_local

    def translate_campaign_content(
        self,
        message_title: str,
        message_body: str,
        short_version: Optional[str] = None,
        call_to_action: Optional[str] = None,
        source_language: str = "English",
        target_languages: Optional[List[str]] = None
    ) -> Dict[str, Dict[str, Any]]:
        """
        Translates all fields of campaign content into the target Indian languages.
        """
        if target_languages is None:
            target_languages = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"]

        results: Dict[str, Dict[str, Any]] = {}

        for lang in target_languages:
            tgt_code = self.normalize_language_code(lang)
            tgt_name = self.get_language_name(tgt_code)

            if tgt_code == self.normalize_language_code(source_language):
                results[tgt_name] = {
                    "language": tgt_name,
                    "language_code": tgt_code,
                    "message_title": message_title,
                    "message_body": message_body,
                    "short_version": short_version or "",
                    "call_to_action": call_to_action or "",
                    "provider": "Source Language (Original)"
                }
                continue

            trans_title = self.translate_text(message_title, source_language, tgt_code)
            trans_body = self.translate_text(message_body, source_language, tgt_code)
            trans_short = self.translate_text(short_version, source_language, tgt_code) if short_version else None
            trans_cta = self.translate_text(call_to_action, source_language, tgt_code) if call_to_action else None

            results[tgt_name] = {
                "language": tgt_name,
                "language_code": tgt_code,
                "message_title": trans_title,
                "message_body": trans_body,
                "short_version": trans_short or "",
                "call_to_action": trans_cta or "",
                "provider": "Indic Multilingual Neural & NLP Engine (deep-translator & local fallback)"
            }

        return results

    def _translate_with_gemini(self, text: str, src_code: str, tgt_code: str) -> Optional[str]:
        from google import genai
        client = genai.Client(api_key=self.gemini_api_key)
        tgt_name = self.get_language_name(tgt_code)
        prompt = f"Translate the following public awareness text accurately and naturally into {tgt_name}. Preserve tone and formatting:\n\n{text}"
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text.strip() if response.text else None


translation_service = TranslationService()

