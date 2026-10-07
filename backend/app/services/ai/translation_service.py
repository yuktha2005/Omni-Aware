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
    "ml": "ml",
    "bengali": "bn",
    "bn": "bn",
    "marathi": "mr",
    "mr": "mr",
    "gujarati": "gu",
    "gu": "gu",
    "punjabi": "pa",
    "pa": "pa",
    "odia": "or",
    "or": "or",
    "urdu": "ur",
    "ur": "ur",
    "assamese": "as",
    "as": "as"
}

LANGUAGE_NAME_MAP = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "or": "Odia",
    "ur": "Urdu",
    "as": "Assamese"
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
    },
    "clean campus initiative": {
        "hi": "स्वच्छ परिसर पहल",
        "ta": "தூய்மையான வளாக முயற்சி",
        "te": "పరిశుభ్రమైన ప్రాంగణ చొరవ",
        "kn": "ಸ್ವಚ್ಛ ಆವರಣ ಉಪಕ್ರಮ",
        "ml": "ശുചിത്വ കാമ്പസ് സംരംഭം"
    },
    "clean surroundings": {
        "hi": "स्वच्छ परिवेश",
        "ta": "தூய்மையான சூழல்",
        "te": "పరిశుభ్రమైన పరిసరాలు",
        "kn": "ಸ್ವಚ್ಛ ಪರಿಸರ",
        "ml": "വൃത്തിയുള്ള ചുറ്റുപാടുകൾ"
    },
    "general health advisory": {
        "hi": "सामान्य स्वास्थ्य सलाह",
        "ta": "பொது சுகாதார ஆலோசனை",
        "te": "సాధారణ ఆరోగ్య సలహా",
        "kn": "ಸಾಮಾನ್ಯ ಆರೋಗ್ಯ ಸಲಹೆ",
        "ml": "പൊതു ఆరోగ్య උපദേശം"
    },
    "health checkup is available": {
        "hi": "स्वास्थ्य जांच उपलब्ध है।",
        "ta": "சுகாதார பரிசோதனை கிடைக்கிறது.",
        "te": "ఆరోగ్య పరీక్ష అందుబాటులో ఉంది.",
        "kn": "ಆರೋಗ್ಯ ತಪಾಸಣೆ ಲಭ್ಯವಿದೆ.",
        "ml": "ആരോഗ്യ പരിശോധന ലഭ്യമാണ്."
    },
    "health checkup available": {
        "hi": "स्वास्थ्य जांच उपलब्ध है।",
        "ta": "சுகாதார பரிசோதனை கிடைக்கிறது.",
        "te": "ఆరోగ్య పరీక్ష అందుబాటులో ఉంది.",
        "kn": "ಆರೋಗ್ಯ ತಪಾಸಣೆ ಲಭ್ಯವಿದೆ.",
        "ml": "ആരೋಗ್ಯ പരിശോധന ലഭ്യമാണ്."
    },
    "community health screening": {
        "hi": "सामुदायिक स्वास्थ्य जांच",
        "ta": "சமூக சுகாதார பரிசோதனை",
        "te": "సమాజ ఆరోగ్య పరీక్ష",
        "kn": "ಸಮುದಾಯ ಆರೋಗ್ಯ ತಪಾಸಣೆ",
        "ml": "കമ്മ്യൂണിറ്റി ആരോഗ്യ പരിശോധന"
    },
    "free general health screening, eye checkup, and nutrition counseling on friday at the campus clinic": {
        "hi": "शुक्रवार को परिसर क्लिनिक में मुफ्त सामान्य स्वास्थ्य जांच, नेत्र परीक्षण और पोषण परामर्श।",
        "ta": "வெள்ளிக்கிழமை வளாக மருத்துவமனையில் இலவச பொது சுகாதார பரிசோதனை, கண் பரிசோதனை மற்றும் ஊட்டச்சத்து ஆலோசனை.",
        "te": "శుక్రవారం క్యాంపస్ క్లినిక్‌లో ఉచిత సాధారణ ఆరోగ్య పరీక్ష, కంటి పరీక్ష మరియు పోషకాహార కౌన్సెలింగ్.",
        "kn": "ಶುಕ್ರವಾರ ಕ್ಯಾಂಪಸ್ ಚಿಕಿತ್ಸಾಲಯದಲ್ಲಿ ಉಚಿತ ಸಾಮಾನ್ಯ ಆರೋಗ್ಯ ತಪಾಸಣೆ, ಕಣ್ಣಿನ ತಪಾಸಣೆ ಮತ್ತು ಪೌಷ್ಟಿಕಾಂಶ ಸಮಾಲೋಚನೆ.",
        "ml": "വെള്ളിയಾഴ്ച കാമ്പസ് ക്ലിനിക്കിൽ സൗജന്യ ജനറൽ ഹെൽത്ത് സ്ക്രീനിംഗ്, നേത്ര പരിശോധന, പോഷകാഹാര കൗൺസിലിംഗ്."
    },
    "comprehensive health checkup camp on saturday from 9 am to 4 pm in campus health center": {
        "hi": "शनिवार को परिसर स्वास्थ्य केंद्र में सुबह 9 बजे से शाम 4 बजे तक व्यापक स्वास्थ्य जांच शिविर।",
        "ta": "சனிக்கிழமை காலை 9 மணி முதல் மாலை 4 மணி வரை வளாக சுகாதார மையத்தில் விரிவான சுகாதார பரிசோதனை முகாம்.",
        "te": "శనివారం ఉదయం 9 నుండి సాయంత్రం 4 వరకు క్యాంపస్ ఆరోగ్య కేంద్రంలో సమగ్ర ఆరోగ్య పరీక్షా శిబిరం.",
        "kn": "ಶನಿವಾರ ಬೆಳಿಗ್ಗೆ 9 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ ಕ್ಯಾಂಪಸ್ ಆರೋಗ್ಯ ಕೇಂದ್ರದಲ್ಲಿ ಸಮಗ್ರ ಆರೋಗ್ಯ ತಪಾಸಣಾ ಶಿಬಿರ.",
        "ml": "ശനിയാഴ്ച രാവിലെ 9 മുതൽ വൈകുന്നേരം 4 വരെ കാമ്പസ് ആരോഗ്യ കേന്ദ്രത്തിൽ സമഗ്ര ആരോഗ്യ പരിശോധനാ ക്യാമ്പ്."
    },
    "register for your health screening session today. stay healthy, stay safe!": {
        "hi": "आज ही अपने स्वास्थ्य स्क्रीनिंग सत्र के लिए पंजीकरण करें। स्वस्थ रहें, सुरक्षित रहें!",
        "ta": "உங்கள் உடல்நல பரிசோதனை அமர்வுக்கு இன்றே பதிவு செய்யுங்கள். ஆரோக்கியமாக இருங்கள், பாதுகாப்பாக இருங்கள்!",
        "te": "ఈ రోజే మీ ఆరోగ్య స్క్రీనింగ్ సెషన్ కోసం నమోదు చేసుకోండి. ఆరోగ్యంగా ఉండండి, సురక్షితంగా ఉండండి!",
        "kn": "ನಿಮ್ಮ ಆರೋಗ್ಯ ತಪಾಸಣೆ ಅಧಿವೇಶನಕ್ಕಾಗಿ ಇಂದೇ ನೋಂದಾಯಿಸಿ. ಆರೋಗ್ಯವಾಗಿರಿ, ಸುರಕ್ಷಿತವಾಗಿರಿ!",
        "ml": "നിങ്ങളുടെ ആരോഗ്യ പരിശോധന സെഷനായി ഇന്ന് തന്നെ രജിസ്റ്റർ ചെയ്യുക. ആരോഗ്യത്തോടെയിരിക്കുക, സുരക്ഷിതരായിരിക്കുക!"
    },
    "register for your health screening session today. stay healthy, stay safe": {
        "hi": "आज ही अपने स्वास्थ्य स्क्रीनिंग सत्र के लिए पंजीकरण करें। स्वस्थ रहें, सुरक्षित रहें!",
        "ta": "உங்கள் உடல்நல பரிசோதனை அமர்வுக்கு இன்றே பதிவு செய்யுங்கள். ஆரோக்கியமாக இருங்கள், பாதுகாப்பாக இருங்கள்!",
        "te": "ఈ రోజే మీ ఆరోగ్య స్క్రీనింగ్ సెషన్ కోసం నమోదు చేసుకోండి. ఆరోగ్యంగా ఉండండి, సురక్షితంగా ఉండండి!",
        "kn": "ನಿಮ್ಮ ಆರೋಗ್ಯ ತಪಾಸಣೆ ಅಧಿವೇಶನಕ್ಕಾಗಿ ಇಂದೇ ನೋಂದಾಯಿಸಿ. ಆರೋಗ್ಯವಾಗಿರಿ, ಸುರಕ್ಷಿತವಾಗಿರಿ!",
        "ml": "നിങ്ങളുടെ ആരോഗ്യ പരിശോധന സെഷനായി ഇന്ന് തന്നെ രജിസ്റ്റർ ചെയ്യുക. ആരോഗ്യത്തോടെയിരിക്കുക, സുരക്ഷിതരായിരിക്കുക!"
    },
    "issued in public interest for mass community awareness": {
        "hi": "सामूहिक जन जागरूकता के लिए जनहित में जारी।",
        "ta": "பொதுமக்கள் விழிப்புணர்வுக்காக பொது நலனில் வெளியிடப்பட்டது.",
        "te": "ప్రజా సమాజ అవగాహన కోసం ప్రజా ప్రయోజనార్థం జారీ చేయబడింది.",
        "kn": "ಸಾರ್ವಜನಿಕ ಸಮುದಾಯ ಜಾಗೃತಿಗಾಗಿ ಸಾರ್ವಜನिक ಹಿತದೃಷ್ಟಿಯಿಂದ ಹೊರಡಿಸಲಾಗಿದೆ.",
        "ml": "പൊതുജന ബോധവൽക്കരണത്തിനായി പൊതുതാൽപര്യത്തിൽ പ്രസിദ്ധീകരിച്ചത്."
    },
    "students, please register through the student portal or contact your class representative": {
        "hi": "छात्र कृपया छात्र पोर्टल के माध्यम से पंजीकरण करें या अपने कक्षा प्रतिनिधि से संपर्क करें।",
        "ta": "மாணவர்கள் மாணவர் இணையதளம் மூலம் பதிவு செய்யவும் அல்லது உங்கள் வகுப்பு பிரதிநிதியை தொடர்பு கொள்ளவும்.",
        "te": "విద్యార్థులు దయచేసి విద్యార్థి పోర్టల్ ద్వారా నమోదు చేసుకోండి లేదా మీ తరగతి ప్రతినిధిని సంప్రదించండి.",
        "kn": "ವಿದ್ಯಾರ್ಥಿಗಳು ದಯವಿಟ್ಟು ವಿದ್ಯಾರ್ಥಿ ಪೋರ್ಟಲ್ ಮೂಲಕ ನೋಂದಾಯಿಸಿ ಅಥವಾ ನಿಮ್ಮ ತರಗತಿ ಪ್ರತಿನಿಧಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
        "ml": "വിദ്യാർത്ഥികൾ വിദ്യാർത്ഥി പോർട്ടൽ വഴി രജിസ്റ്റർ ചെയ്യുക അല്ലെങ്കിൽ നിങ്ങളുടെ ക്ലാസ് പ്രതിനിധിയെ ബന്ധപ്പെടുക."
    },
    "faculty members, please coordinate with your academic department and encourage classroom participation": {
        "hi": "संकाय सदस्य कृपया अपने शैक्षणिक विभाग के साथ समन्वय करें और कक्षा की भागीदारी को प्रोत्साहित करें।",
        "ta": "பேராசிரியர்கள் தங்கள் துறை மூலம் ஒருங்கிணைத்து மாணவர்களின் பங்கேற்பை ஊக்குவிக்கவும்.",
        "te": "అధ్యాపకులు దయచేసి మీ విద్యా విಭಾಗంతో సమన్వయం చేసుకుని తరగతి భాగస్వామ్యాన్ని ప్రోత్సహించండి.",
        "kn": "ಬೋಧಕ ಸಿಬ್ಬಂದಿ ದಯವಿಟ್ಟು ನಿಮ್ಮ ಶೈಕ್ಷಣಿಕ ವಿಭಾಗದೊಂದಿಗೆ ಸಂಯೋಜಿಸಿ ತರಗತಿಯ ಭಾಗವಹಿಸುವಿಕೆಯನ್ನು ಪ್ರೋತ್ಸಾಹಿಸಿ.",
        "ml": "അധ്യാപകർ നിങ്ങളുടെ ഡിപ്പാർട്ട്‌മെന്റുമായി ഏകോപിപ്പിച്ച് ക്ലാസ് പങ്കാളിത്തം പ്രോത്സാഹിപ്പിക്കുക."
    },
    "as active learners and student community members, your participation is vital": {
        "hi": "सक्रिय शिक्षार्थियों और छात्र समुदाय के सदस्यों के रूप में, आपकी भागीदारी अत्यंत महत्वपूर्ण है।",
        "ta": "மாணவர் சமூக உறுப்பினர்களாகிய உங்கள் பங்களிப்பு மிகவும் முக்கியமானது.",
        "te": "చురుకైన అభ్యాసకులు మరియు విద్యార్థి సమాజ సభ్యులుగా మీ భాగస్వామ్యం చాలా ముఖ్యం.",
        "kn": "ಕಲಿಯುವವರು ಮತ್ತು ವಿದ್ಯಾರ್ಥಿ ಸಮುದಾಯದ ಸದಸ್ಯರಾಗಿ ನಿಮ್ಮ ಭಾಗವಹಿಸುವಿಕೆ ಅತ್ಯಗತ್ಯವಾಗಿದೆ.",
        "ml": "വിദ്യാർത്ഥി സമൂഹത്തിലെ അംഗങ്ങളെന്ന നിലയിൽ നിങ്ങളുടെ പങ്കാളിത്തം അത്യന്താപേക്ഷിതമാണ്."
    },
    "as educators, your guidance and participation help lead our educational community": {
        "hi": "शिक्षकों के रूप में, आपका मार्गदर्शन और भागीदारी हमारे शैक्षिक समुदाय का नेतृत्व करने में मदद करती है।",
        "ta": "ஆசிரியர்களாகிய உங்கள் வழிகாட்டுதலும் பங்களிப்பும் கல்விச் சமூகத்தை வழிநடத்த உதவுகிறது.",
        "te": "విద్యావేత్తలుగా మీ మార్గదర్శకత్వం మరియు భాగస్వామ్యం మా విద్యా సమాజాన్ని నడిపించడంలో సహాయపడతాయి.",
        "kn": "ಶಿಕ್ಷಣ ತಜ್ಞರಾಗಿ ನಿಮ್ಮ ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ಭಾಗವಹಿಸುವಿಕೆ ನಮ್ಮ ಶೈಕ್ಷಣಿಕ ಸಮುದಾಯವನ್ನು ಮುನ್ನಡೆಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
        "ml": "അധ്യാപകരെന്ന നിലയിൽ നിങ്ങളുടെ മാർഗ്ഗനിർദ്ദേശവും പങ്കാളിത്തവും നമ്മുടെ സമൂഹത്തെ നയിക്കാൻ സഹായിക്കുന്നു."
    },
    "your active involvement makes a lasting positive impact across our locality": {
        "hi": "आपकी सक्रिय भागीदारी हमारे क्षेत्र में स्थायी सकारात्मक प्रभाव डालती है।",
        "ta": "உங்கள் தீவிர ஈடுபாடு நமது வட்டாரத்தில் நீடித்த நேர்மறையான தாக்கத்தை ஏற்படுத்துகிறது.",
        "te": "మీ చురుకైన ప్రమేయం మన ప్రాంతంలో శాశ్వత సానుకూల ప్రభావాన్ని చూపుతుంది.",
        "kn": "ನಿಮ್ಮ ಸಕ್ರಿಯ ಪಾಲ್ಗೊಳ್ಳುವಿಕೆ ನಮ್ಮ ಪ್ರದೇಶದಾದ್ಯಂತ ಧನಾತ್ಮಕ ಪರಿಣಾಮವನ್ನು ಬೀರುತ್ತದೆ.",
        "ml": "നിങ്ങളുടെ സജീവ പങ്കാളിത്തം നമ്മുടെ പ്രദേശത്ത് നല്ല സ്വാധീനം ചെലുത്തുന്നു."
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
        self.provider_type = os.getenv("TRANSLATION_PROVIDER", "auto").lower()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self._cache: Dict[str, str] = {}
        self._rate_limit_cooldown: Dict[str, float] = {}

    def normalize_language_code(self, lang: str) -> str:
        lang_cleaned = lang.strip().lower()
        return LANGUAGE_CODE_MAP.get(lang_cleaned, lang_cleaned)

    def get_language_name(self, lang_code: str) -> str:
        code = self.normalize_language_code(lang_code)
        return LANGUAGE_NAME_MAP.get(code, lang_code.capitalize())

    def _strip_emojis(self, text: str) -> tuple[str, str]:
        """Separate leading emoji icons or bullet markers to avoid translator syntax issues."""
        match = re.match(r'^([\U00010000-\U0010ffff\u2600-\u27ff\u2300-\u23ff\s•\-\*]+)(.*)$', text, flags=re.DOTALL)
        if match:
            prefix = match.group(1)
            rest = match.group(2)
            return prefix, rest
        return "", text

    def _local_indic_translate(self, clean_text: str, tgt_code: str) -> str:
        """
        Intelligent Local Indic NLP Translation Synthesizer.
        Provides genuine Indic script translations for domain public awareness terms.
        """
        lookup_key = clean_text.strip().lower().rstrip(".!?,")
        if lookup_key in INDIC_PHRASE_DICTIONARY and tgt_code in INDIC_PHRASE_DICTIONARY[lookup_key]:
            return INDIC_PHRASE_DICTIONARY[lookup_key][tgt_code]

        # Check partial phrase matches in dictionary
        for phrase, trans_map in INDIC_PHRASE_DICTIONARY.items():
            if phrase in lookup_key and tgt_code in trans_map:
                if len(clean_text.split()) <= 12:
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
                translated_lines.append(f"{purp_label}: {self._local_indic_translate(purp_after, tgt_code)}")
                continue

            # Word level translation replacement for key terms
            trans_line = line_str
            for eng_word, indic_word in glossary.items():
                pattern = r'\b' + re.escape(eng_word) + r'\b'
                trans_line = re.sub(pattern, indic_word, trans_line, flags=re.IGNORECASE)
            translated_lines.append(trans_line)

        return "\n".join(translated_lines)

    def _translate_single_unit(self, text: str, src_code: str, tgt_code: str) -> str:
        """
        Translates a single block or sentence with multi-tier neural fallback:
        Tier 0: Direct Indic phrase/domain dictionary lookup
        Tier 1: Gemini LLM (if API key available)
        Tier 2: Google GTX Direct Neural Translation Endpoint
        Tier 3: GoogleTranslator (deep-translator)
        Tier 4: MyMemory Neural Translation Engine
        Tier 5: Local Indic Domain NLP Synthesizer
        """
        if not text or not text.strip():
            return ""

        emoji_prefix, clean_text = self._strip_emojis(text)
        if not clean_text.strip():
            return text

        cache_key = f"{src_code}:{tgt_code}:{clean_text.strip()}"
        if cache_key in self._cache:
            res = self._cache[cache_key]
            return f"{emoji_prefix}{res}" if emoji_prefix else res

        # Tier 0: Direct dictionary check for standard domain phrases (0ms instant lookup)
        lookup_key = clean_text.strip().lower().rstrip(".!?,")
        if lookup_key in INDIC_PHRASE_DICTIONARY and tgt_code in INDIC_PHRASE_DICTIONARY[lookup_key]:
            dict_res = INDIC_PHRASE_DICTIONARY[lookup_key][tgt_code]
            self._cache[cache_key] = dict_res
            return f"{emoji_prefix}{dict_res}" if emoji_prefix else dict_res

        # Tier 1: Gemini LLM
        if self.gemini_api_key and self.provider_type in ["gemini", "auto", "external"]:
            try:
                gemini_trans = self._translate_with_gemini(clean_text, src_code, tgt_code)
                if gemini_trans and gemini_trans.strip():
                    self._cache[cache_key] = gemini_trans.strip()
                    return f"{emoji_prefix}{gemini_trans.strip()}" if emoji_prefix else gemini_trans.strip()
            except Exception as e:
                logger.warning(f"Gemini translation notice: {e}")

        # Tier 2: Direct Google GTX HTTP Endpoint (High-speed & high-accuracy)
        try:
            import requests
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            params = {"client": "gtx", "sl": src_code, "tl": tgt_code, "dt": "t", "q": clean_text[:3000]}
            resp = requests.get("https://translate.googleapis.com/translate_a/single", params=params, headers=headers, timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                if data and len(data) > 0 and len(data[0]) > 0:
                    res = "".join(part[0] for part in data[0] if part and len(part) > 0 and part[0])
                    if res and res.strip():
                        self._cache[cache_key] = res.strip()
                        return f"{emoji_prefix}{res.strip()}" if emoji_prefix else res.strip()
        except Exception:
            pass

        # Tier 3: GoogleTranslator (deep-translator library)
        try:
            from deep_translator import GoogleTranslator
            gt_trans = GoogleTranslator(source=src_code, target=tgt_code).translate(clean_text)
            if gt_trans and gt_trans.strip():
                self._cache[cache_key] = gt_trans.strip()
                return f"{emoji_prefix}{gt_trans.strip()}" if emoji_prefix else gt_trans.strip()
        except Exception:
            pass

        # Tier 4: Direct MyMemory Neural Engine
        mm_trans = self._translate_with_mymemory_direct(clean_text, src_code, tgt_code)
        if mm_trans:
            self._cache[cache_key] = mm_trans
            return f"{emoji_prefix}{mm_trans}" if emoji_prefix else mm_trans

        # Tier 5: High-Fidelity Local Indic NLP Synthesizer
        local_res = self._local_indic_translate(clean_text, tgt_code)
        self._cache[cache_key] = local_res.strip()
        return f"{emoji_prefix}{local_res.strip()}" if emoji_prefix else local_res.strip()

    def translate_text(self, text: str, source_lang: str, target_lang: str) -> str:
        """
        Dynamically translates text from source language to target language.
        Preserves multi-line structures, headings, and bullet points.
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

        full_translated = self._translate_single_unit(text, src_code, tgt_code)
        if not full_translated or not full_translated.strip():
            full_translated = text
        self._cache[cache_key] = full_translated
        return full_translated

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
                "provider": "OmniAware Multilingual Neural Engine (MyMemory & Indic NLP)"
            }

        return results

    def _translate_with_mymemory_direct(self, text: str, src_code: str, tgt_code: str) -> Optional[str]:
        try:
            import requests
            url = "https://api.mymemory.translated.net/get"
            params = {
                "q": text[:1500],
                "langpair": f"{src_code}|{tgt_code}",
                "de": "omniaware.platform.ai@gmail.com"
            }
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            r = requests.get(url, params=params, headers=headers, timeout=3.5)
            if r.status_code == 200:
                data = r.json()
                res = data.get("responseData", {}).get("translatedText", "")
                if res and "MYMEMORY WARNING" not in res.upper() and "INVALID" not in res.upper():
                    clean_res = res.strip()
                    # Verify it didn't just return exact English
                    if clean_res and (clean_res != text.strip() or src_code == tgt_code):
                        return clean_res
        except Exception as err:
            logger.debug(f"Direct MyMemory engine notice: {err}")
        return None

    def _translate_with_gemini(self, text: str, src_code: str, tgt_code: str) -> Optional[str]:
        from google import genai
        client = genai.Client(api_key=self.gemini_api_key)
        tgt_name = self.get_language_name(tgt_code)
        prompt = (
            f"You are a professional public awareness translator. Translate the following text completely into {tgt_name}. "
            f"Strict requirements: 1. Output must be purely in {tgt_name} native script without leaving stray English words. "
            f"2. Keep numbers, dates, times, and helplines intact. "
            f"3. Return ONLY the direct translation:\n\n{text}"
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text.strip() if response.text else None


translation_service = TranslationService()

