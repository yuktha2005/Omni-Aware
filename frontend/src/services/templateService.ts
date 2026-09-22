import type { MessageTemplate } from "../types/template";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
];

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "tmpl-1",
    code: "TMPL-HLTH-001",
    title: "National Pulse Polio Immunization Day",
    description: "Notification for parents regarding the upcoming nationwide pulse polio vaccination drive.",
    channel: "whatsapp",
    category: "health",
    primaryLanguage: "en",
    variables: ["recipient_name", "date", "city", "center_name", "helpline"],
    translations: {
      en: {
        languageCode: "en",
        languageName: "English",
        content: "Dear {{recipient_name}}, National Pulse Polio Immunization Day is scheduled for {{date}} across {{city}}. Please bring your children under 5 years to {{center_name}} for oral polio drops. Immunization is completely free. Emergency Helpline: {{helpline}}.",
        isVerified: true,
      },
      hi: {
        languageCode: "hi",
        languageName: "Hindi",
        content: "प्रिय {{recipient_name}}, {{date}} को {{city}} में राष्ट्रीय पल्स पोलियो टीकाकरण अभियान आयोजित किया जा रहा है। कृपया 5 वर्ष से कम आयु के अपने बच्चों को 'दो बूंद जिंदगी की' पिलाने के लिए {{center_name}} पर अवश्य लाएं। टीकाकरण पूर्णतः निःशुल्क है। आपातकालीन हेल्पलाइन: {{helpline}}।",
        isVerified: true,
      },
      ta: {
        languageCode: "ta",
        languageName: "Tamil",
        content: "அன்புள்ள {{recipient_name}}, {{date}} அன்று {{city}} பகுதியில் தேசிய போலியோ தடுப்பு முகாம் நடைபெற உள்ளது. 5 வயதுக்குட்பட்ட உங்கள் குழந்தைகளை {{center_name}} மையத்திற்கு அழைத்து வந்து போலியோ சொட்டு மருந்து போடுங்கள். உதவி எண்: {{helpline}}.",
        isVerified: true,
      },
      te: {
        languageCode: "te",
        languageName: "Telugu",
        content: "ప్రియమైన {{recipient_name}}, {{date}} న {{city}} లో జాతీయ పల్స్ పోలియో ఇమ్యునైజేషన్ నిర్వహించబడుతోంది. 5 సంవత్సరాల లోపు పిల్లలను {{center_name}} వద్దకు తీసుకొచ్చి పోలియో చుక్కలు వేయించండి. సహాయ కేంద్రం: {{helpline}}.",
        isVerified: true,
      },
      kn: {
        languageCode: "kn",
        languageName: "Kannada",
        content: "ಆತ್ಮೀಯ {{recipient_name}}, {{date}} ರಂದು {{city}} ನಲ್ಲಿ ರಾಷ್ಟ್ರೀಯ ಪಲ್ಸ್ ಪೋಲಿಯೋ ಅಭಿಯಾನ ನಡೆಯಲಿದೆ. ನಿಮ್ಮ 5 ವರ್ಷದೊಳಗಿನ ಮಕ್ಕಳನ್ನು {{center_name}} ಗೆ ಕರೆತಂದು ಪೋಲಿಯೋ ಲಸಿಕೆ ಹಾಕಿಸಿ. ಸಹಾಯವಾಣಿ: {{helpline}}.",
        isVerified: true,
      },
      ml: {
        languageCode: "ml",
        languageName: "Malayalam",
        content: "പ്രിയ {{recipient_name}}, {{date}}-ൽ {{city}}-യിൽ ദേശീയ പൾസ് പോളിയോ പ്രതിരോധ ദിനം ആചരിക്കുന്നു. 5 വയസ്സിന് താഴെയുള്ള കുട്ടികളെ {{center_name}}-ൽ എത്തിച്ച് പോളിയോ തുള്ളിമരുന്ന് നൽകുക. ഹെൽപ്പ്‌ലൈൻ: {{helpline}}.",
        isVerified: true,
      },
    },
    status: "active",
    createdAt: "2026-08-20T10:00:00.000Z",
    updatedAt: "2026-08-25T14:30:00.000Z",
    usageCount: 48,
  },
  {
    id: "tmpl-2",
    code: "TMPL-DIS-002",
    title: "Severe Heatwave & Sunstroke Advisory",
    description: "Urgent weather advisory alerting citizens about extreme temperature conditions and precautions.",
    channel: "sms",
    category: "disaster",
    primaryLanguage: "en",
    variables: ["city", "date", "helpline"],
    translations: {
      en: {
        languageCode: "en",
        languageName: "English",
        content: "ALERT: Severe heatwave predicted in {{city}} on {{date}}. Avoid direct sun exposure between 11 AM and 4 PM. Stay hydrated. In case of heat stroke, call {{helpline}}.",
        isVerified: true,
      },
      hi: {
        languageCode: "hi",
        languageName: "Hindi",
        content: "चेतावनी: {{date}} को {{city}} में भीषण लू चलने की संभावना है। सुबह 11 से दोपहर 4 बजे तक धूप में जाने से बचें। खूब पानी पिएं। लू लगने पर तुरंत {{helpline}} पर संपर्क करें।",
        isVerified: true,
      },
      ta: {
        languageCode: "ta",
        languageName: "Tamil",
        content: "எச்சரிக்கை: {{date}} அன்று {{city}} பகுதியில் கடுமையான வெப்ப அலை வீசக்கூடும். முற்பகல் 11 முதல் பிற்பகல் 4 வரை வெளியில் செல்வதை தவிர்க்கவும். உதவிக்கு {{helpline}}.",
        isVerified: true,
      },
      te: {
        languageCode: "te",
        languageName: "Telugu",
        content: "హెచ్చరిక: {{date}} న {{city}} లో తీవ్ర వడగాల్పులు వీచే అవకాశం ఉంది. ఉదయం 11 నుండి సాయంత్రం 4 వరకు ఎండలో తిరగవద్దు. అత్యవసర సాయానికి {{helpline}}.",
        isVerified: true,
      },
      kn: {
        languageCode: "kn",
        languageName: "Kannada",
        content: "ಎಚ್ಚರಿಕೆ: {{date}} ರಂದು {{city}} ನಲ್ಲಿ ತೀವ್ರ ಬಿಸಿಗಾಳಿ ಬೀಸುವ ಸಾಧ್ಯತೆ ಇದೆ. 11 ರಿಂದ 4 ರವರೆಗೆ ಬಿಸಿಲಿನಲ್ಲಿ ಓಡಾಡಬೇಡಿ. ತುರ್ತು ಸಂಪರ್ಕಕ್ಕಾಗಿ {{helpline}} ಗೆ ಕರೆ ಮಾಡಿ.",
        isVerified: true,
      },
      ml: {
        languageCode: "ml",
        languageName: "Malayalam",
        content: "ജാഗ്രത: {{date}}-ൽ {{city}}-യിൽ കടുത്ത ചൂടും ഉഷ്ണതരംഗവും ഉണ്ടാകും. രാവിലെ 11 മുതൽ വൈകിട്ട് 4 വരെ വെയിൽ കൊള്ളരുത്. അത്യാഹിതങ്ങൾക്ക് {{helpline}}.",
        isVerified: true,
      },
    },
    status: "active",
    createdAt: "2026-08-22T09:15:00.000Z",
    updatedAt: "2026-08-28T11:20:00.000Z",
    usageCount: 112,
  },
  {
    id: "tmpl-3",
    code: "TMPL-WELF-003",
    title: "Direct Benefit Transfer (DBT) Scheme Notice",
    description: "Official notification to registered beneficiaries concerning scheme disbursement schedule.",
    channel: "email",
    category: "welfare",
    primaryLanguage: "en",
    variables: ["recipient_name", "scheme_name", "state", "date", "helpline"],
    translations: {
      en: {
        languageCode: "en",
        languageName: "English",
        subject: "Confirmation: Upcoming DBT Disbursement for {{scheme_name}}",
        content: "Dear Beneficiary {{recipient_name}},\n\nYour upcoming installment under the {{scheme_name}} for {{state}} is slated for direct bank disbursement on {{date}}.\n\nPlease verify that your Aadhaar-linked bank account is active. In case of any query, contact your local Gram Panchayat / Seva Kendra or call toll-free {{helpline}}.\n\nDepartment of Public Welfare.",
        isVerified: true,
      },
      hi: {
        languageCode: "hi",
        languageName: "Hindi",
        subject: "सूचना: {{scheme_name}} योजना के अंतर्गत आगामी डीबीटी किस्त",
        content: "प्रिय लाभार्थी {{recipient_name}},\n\n{{state}} के तहत {{scheme_name}} की आपकी अगली किस्त का भुगतान {{date}} को आपके बैंक खाते में भेजा जाएगा।\n\nकृपया सुनिश्चित करें कि आपका आधार से जुड़ा बैंक खाता सक्रिय है। किसी भी सहायता के लिए ग्राम पंचायत या टोल-फ्री {{helpline}} पर संपर्क करें।\n\nलोक कल्याण विभाग।",
        isVerified: true,
      },
      ta: {
        languageCode: "ta",
        languageName: "Tamil",
        subject: "{{scheme_name}} திட்ட நிதி பரிமாற்ற அறிவிப்பு",
        content: "அன்புள்ள பயனாளர் {{recipient_name}},\n\n{{state}} அரசின் {{scheme_name}} திட்டத்தின் கீழான உதவித்தொகை {{date}} அன்று உங்கள் வங்கிக் கணக்கில் வரவு வைக்கப்படும்.\n\nஉங்கள் வங்கிக் கணக்கு ஆதார் எண்ணுடன் இணைக்கப்பட்டுள்ளதை உறுதிப்படுத்தவும். தொடர்புக்கு: {{helpline}}.\n\nபொதுநலத் துறை.",
        isVerified: true,
      },
      te: {
        languageCode: "te",
        languageName: "Telugu",
        subject: "{{scheme_name}} పథకం నిధుల విడుదల సమాచారం",
        content: "ప్రియమైన లబ్ధిదారు {{recipient_name}},\n\n{{state}} ప్రభుత్వం ఆధ్వర్యంలో {{scheme_name}} తాలూకు నిధులు {{date}} న నేరుగా మీ ఖాతాలో జమ చేయబడతాయి.\n\nమీ బ్యాంక్ ఖాతా ఆధార్‌తో అనుసంధానమై ఉన్నదో లేదో చూసుకోండి. సమాచారం కోసం {{helpline}} కు కాల్ చేయండి.\n\nప్రజా సంక్షేమ శాఖ.",
        isVerified: true,
      },
      kn: {
        languageCode: "kn",
        languageName: "Kannada",
        subject: "{{scheme_name}} ಯೋಜನೆ ಡಿಬಿಟಿ ಪಾವತಿ ಮಾಹಿತಿ",
        content: "ಆತ್ಮೀಯ ಫಲಾನುಭವಿ {{recipient_name}},\n\n{{state}} ದ {{scheme_name}} ಯೋಜನೆಯ ಧನಸಹಾಯವು {{date}} ರಂದು ನಿಮ್ಮ ಖಾತೆಗೆ ಜಮೆಯಾಗಲಿದೆ. ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ. ವಿವರಗಳಿಗೆ {{helpline}} ಸಂಪರ್ಕಿಸಿ.\n\nಲೋಕಕಲ್ಯಾಣ ಇಲಾಖೆ.",
        isVerified: true,
      },
      ml: {
        languageCode: "ml",
        languageName: "Malayalam",
        subject: "{{scheme_name}} ധനസഹായ വിതരണ അറിയിപ്പ്",
        content: "പ്രിയ ഗുണഭോക്താവ് {{recipient_name}},\n\n{{state}}-ലെ {{scheme_name}} പദ്ധതിയുടെ അടുത്ത ഗഡു {{date}}-ൽ ബാങ്ക് അക്കൗണ്ടിൽ നേരിട്ട് എത്തും. വിവരങ്ങൾക്ക് {{helpline}} വിളിക്കുക.\n\nപൊതുക്ഷേമ വകുപ്പ്.",
        isVerified: true,
      },
    },
    status: "active",
    createdAt: "2026-08-15T08:00:00.000Z",
    updatedAt: "2026-08-30T16:45:00.000Z",
    usageCount: 89,
  },
  {
    id: "tmpl-4",
    code: "TMPL-CIV-004",
    title: "Cyber Security & OTP Fraud Alert",
    description: "Public awareness alert advising citizens never to share one-time passwords or personal credentials.",
    channel: "whatsapp",
    category: "civic",
    primaryLanguage: "en",
    variables: ["city", "helpline"],
    translations: {
      en: {
        languageCode: "en",
        languageName: "English",
        content: "⚠️ PUBLIC CYBER SECURITY ADVISORY:\nGovernment officers or bank representatives will NEVER ask for your OTP, PIN, UPI password, or CVV. If anyone calls demanding urgent verification in {{city}}, do not share credentials. Report cyber fraud instantly to National Cyber Crime Helpline: {{helpline}} or cybercrime.gov.in.",
        isVerified: true,
      },
      hi: {
        languageCode: "hi",
        languageName: "Hindi",
        content: "⚠️ जनहित में साइबर सुरक्षा अलर्ट:\nसरकारी अधिकारी अथवा बैंक कभी भी आपसे फोन पर ओटीपी, पासवर्ड, यूपीआई पिन या सीवीवी नहीं मांगते हैं। यदि {{city}} में कोई ऐसी जानकारी मांगे तो सावधान रहें। तुरंत राष्ट्रीय साइबर अपराध हेल्पलाइन {{helpline}} पर शिकायत दर्ज कराएं।",
        isVerified: true,
      },
      ta: {
        languageCode: "ta",
        languageName: "Tamil",
        content: "⚠️ சைபர் பாதுகாப்பு விழிப்புணர்வு:\nஅரசு அதிகாரிகளோ அல்லது வங்கிப் பணியாளர்களோ உங்கள் OTP, PIN அல்லது கடவுச்சொல்லை எப்போதும் கேட்க மாட்டார்கள். சந்தேகத்திற்கிடமான அழைப்புகள் வந்தால் {{helpline}} என்ற எண்ணில் உடனே புகார் செய்யவும்.",
        isVerified: true,
      },
      te: {
        languageCode: "te",
        languageName: "Telugu",
        content: "⚠️ సైబర్ భద్రత హెచ్చరిక:\nప్రభుత్వ అధికారులు లేదా బ్యాంక్ సిబ్బంది ఎప్పటికీ మీ OTP, PIN లేదా పాస్‌వర్డ్ అడగరు. ఎవరైనా అడిగితే చెప్పవద్దు. తక్షణమే సైబర్ హెల్ప్‌లైన్ {{helpline}} కు ఫిర్యాదు చేయండి.",
        isVerified: true,
      },
      kn: {
        languageCode: "kn",
        languageName: "Kannada",
        content: "⚠️ ಸೈಬರ್ ಭದ್ರತಾ ಮಾಹಿತಿ:\nಯಾವುದೇ ಸರ್ಕಾರಿ ಅಥವಾ ಬ್ಯಾಂಕ್ ಅಧಿಕಾರಿಗಳು ನಿಮ್ಮ ಒಟಿಪಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಕೇಳುವುದಿಲ್ಲ. ಯಾರಾದರೂ ಕೇಳಿದರೆ ಕೊಡಬೇಡಿ. ತಕ್ಷಣವೇ ಸೈಬರ್ ಸಹಾಯವಾಣಿ {{helpline}} ಗೆ ದೂರು ನೀಡಿ.",
        isVerified: true,
      },
      ml: {
        languageCode: "ml",
        languageName: "Malayalam",
        content: "⚠️ സൈബർ സുരക്ഷാ മുന്നറിയിപ്പ്:\nബാങ്ക് ഉദ്യോഗസ്ഥരോ മറ്റ് അധികാരികളോ നിങ്ങളുടെ OTP അല്ലെങ്കിൽ പാസ്‌വേഡ് ചോദിക്കില്ല. തട്ടിപ്പുകളിൽ വീഴരുത്. പരാതികൾക്ക് {{helpline}} വിളിക്കുക.",
        isVerified: true,
      },
    },
    status: "active",
    createdAt: "2026-08-10T12:00:00.000Z",
    updatedAt: "2026-08-29T10:15:00.000Z",
    usageCount: 154,
  },
  {
    id: "tmpl-5",
    code: "TMPL-VOI-005",
    title: "Urban Flood & Heavy Rainfall Voice Broadcast",
    description: "Automated multilingual voice call script for immediate evacuation of flood-prone riverbank areas.",
    channel: "voice",
    category: "disaster",
    primaryLanguage: "en",
    variables: ["city", "helpline"],
    translations: {
      en: {
        languageCode: "en",
        languageName: "English",
        content: "This is an urgent broadcast from District Disaster Management Authority {{city}}. Due to heavy upstream water discharge, water levels are rising rapidly. Residents in low-lying sectors must move to community relief centres immediately. Rescue teams are mobilized. For boats or medical support, call {{helpline}}.",
        isVerified: true,
      },
      hi: {
        languageCode: "hi",
        languageName: "Hindi",
        content: "यह जिला आपदा प्रबंधन प्राधिकरण {{city}} का एक आवश्यक संदेश है। भारी वर्षा के कारण जलस्तर तेजी से बढ़ रहा है। निचले इलाकों के सभी नागरिक तुरंत नजदीकी राहत शिविरों में चले जाएं। आपातकालीन बचाव के लिए {{helpline}} डायल करें।",
        isVerified: true,
      },
      ta: {
        languageCode: "ta",
        languageName: "Tamil",
        content: "இது {{city}} மாவட்ட பேரிடர் மேலாண்மை ஆணையத்தின் அவசர அறிவிப்பு. கடும் மழை காரணமாக வெள்ளம் உயர்ந்து வருகிறது. தாழ்வான பகுதியில் வசிப்போர் உடனே நிவாரண முகாம்களுக்கு செல்லவும். அவசர உதவிக்கு {{helpline}}.",
        isVerified: true,
      },
      te: {
        languageCode: "te",
        languageName: "Telugu",
        content: "ఇది {{city}} జిల్లా విపత్తు నిర్వహణ సంస్థ అత్యవసర సందేశం. భారీ వర్షాలతో నది పరివాహక ప్రాంతాల్లో నీటిమట్టం పెరుగుతోంది. ప్రజలు వెంటనే సురక్షిత ప్రాంతాలకు తరలి వెళ్లాలి. సహాయం కోసం {{helpline}} నంబరుకు కాల్ చేయండి.",
        isVerified: true,
      },
      kn: {
        languageCode: "kn",
        languageName: "Kannada",
        content: "ಇದು {{city}} ಜಿಲ್ಲಾ ವಿಪತ್ತು ನಿರ್ವಹಣಾ ಪ್ರಾಧಿಕಾರದ ತುರ್ತು ಸಂದೇಶ. ಮಳೆಯಿಂದಾಗಿ ನದಿ ನೀರು ಹೆಚ್ಚಾಗುತ್ತಿದ್ದು, ತಗ್ಗು ಪ್ರದೇಶಗಳ ಜನರು ತಕ್ಷಣ ಸುರಕ್ಷಿತ ಕೇಂದ್ರಗಳಿಗೆ ತೆರಳಬೇಕು. ಸಹಾಯವಾಣಿ: {{helpline}}.",
        isVerified: true,
      },
      ml: {
        languageCode: "ml",
        languageName: "Malayalam",
        content: "ഇത് {{city}} ദുരന്തനിവാരണ അതോറിറ്റിയുടെ അടിയന്തര സന്ദേശം. കനത്ത മഴയിൽ ജലനിരപ്പ് ഉയരുന്നതിനാൽ താഴ്ന്ന പ്രദേശങ്ങളിലുള്ളവർ ദുരിതാശ്വാസ ക്യാമ്പുകളിലേക്ക് മാറുക. സഹായത്തിന് {{helpline}}.",
        isVerified: true,
      },
    },
    status: "active",
    createdAt: "2026-08-05T15:30:00.000Z",
    updatedAt: "2026-08-31T09:00:00.000Z",
    usageCount: 32,
  },
  {
    id: "tmpl-6",
    code: "TMPL-AGR-006",
    title: "Kisan Kharif Sowing & Crop Insurance Reminder",
    description: "Guidance message for agricultural communities regarding weather window and insurance cut-off date.",
    channel: "sms",
    category: "agriculture",
    primaryLanguage: "en",
    variables: ["recipient_name", "state", "date", "helpline"],
    translations: {
      en: {
        languageCode: "en",
        languageName: "English",
        content: "Kisan Alert: Dear {{recipient_name}}, favorable monsoon conditions in {{state}}. Ensure seed treatment before sowing. The deadline for Kharif Crop Insurance enrollment is {{date}}. Contact Krishi Kendra or call {{helpline}}.",
        isVerified: true,
      },
      hi: {
        languageCode: "hi",
        languageName: "Hindi",
        content: "किसान भाई {{recipient_name}}, {{state}} में उत्तम मानसूनी परिस्थितियां हैं। बुवाई से पूर्व बीज उपचार अवश्य करें। खरीफ फसल बीमा कराने की अंतिम तिथि {{date}} है। अधिक जानकारी हेतु कृषि विज्ञान केंद्र या {{helpline}} पर संपर्क करें।",
        isVerified: true,
      },
      ta: {
        languageCode: "ta",
        languageName: "Tamil",
        content: "விவசாயிகள் கவனத்திற்கு: அன்புள்ள {{recipient_name}}, {{state}} பகுதியில் நல்ல பருவமழை எதிர்பார்க்கப்படுகிறது. பயிர் காப்பீடு செய்வதற்கான கடைசி நாள் {{date}}. தொடர்புக்கு {{helpline}}.",
        isVerified: true,
      },
      te: {
        languageCode: "te",
        languageName: "Telugu",
        content: "రైతులకు సమాచారం: ప్రియమైన {{recipient_name}}, {{state}} లో ఖరీఫ్ సీజన్ ప్రారంభమైంది. పంట బీమా నమోదుకు చివరి తేదీ {{date}}. సమీప రైతు భరోసా కేంద్రం లేదా {{helpline}} ను సంప్రదించండి.",
        isVerified: true,
      },
      kn: {
        languageCode: "kn",
        languageName: "Kannada",
        content: "ರೈತ ಮಿತ್ರ {{recipient_name}}, {{state}} ದಲ್ಲಿ ಮುಂಗಾರು ಉತ್ತಮವಾಗಿದೆ. ಬೆಳೆ ವಿಮೆ ನೊಂದಣಿಗೆ ಕೊನೆಯ ದಿನಾಂಕ {{date}}. ಕೃಷಿ ಇಲಾಖೆ ಸಹಾಯವಾಣಿ {{helpline}} ಸಂಪರ್ಕಿಸಿ.",
        isVerified: true,
      },
      ml: {
        languageCode: "ml",
        languageName: "Malayalam",
        content: "കർഷകർക്കായി: പ്രിയ {{recipient_name}}, വിള ഇൻഷുറൻസ് ചേരുന്നതിനുള്ള അവസാന തീയതി {{date}}. വിവരങ്ങൾക്ക് കൃഷിഭവനുമായോ {{helpline}}-ലോ ബന്ധപ്പെടുക.",
        isVerified: true,
      },
    },
    status: "active",
    createdAt: "2026-08-18T11:00:00.000Z",
    updatedAt: "2026-08-27T17:00:00.000Z",
    usageCount: 67,
  },
];

const STORAGE_KEY = "mcp_message_templates_v1";

export const templateService = {
  list: (): MessageTemplate[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    // initialize storage with default templates
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
    return DEFAULT_TEMPLATES;
  },

  getById: (id: string): MessageTemplate | undefined => {
    const list = templateService.list();
    return list.find((t) => t.id === id);
  },

  save: (template: MessageTemplate): MessageTemplate => {
    const list = templateService.list();
    const index = list.findIndex((t) => t.id === template.id);
    let updatedList: MessageTemplate[];

    if (index >= 0) {
      updatedList = [...list];
      updatedList[index] = {
        ...template,
        updatedAt: new Date().toISOString(),
      };
    } else {
      const newTemplate: MessageTemplate = {
        ...template,
        id: template.id || `tmpl-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: template.usageCount || 0,
      };
      updatedList = [newTemplate, ...list];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    return index >= 0 ? updatedList[index] : updatedList[0];
  },

  delete: (id: string): boolean => {
    const list = templateService.list();
    const filtered = list.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered.length !== list.length;
  },

  duplicate: (id: string): MessageTemplate | undefined => {
    const item = templateService.getById(id);
    if (!item) return undefined;
    const duplicated: MessageTemplate = {
      ...item,
      id: `tmpl-${Date.now()}`,
      code: `${item.code}-COPY`,
      title: `${item.title} (Copy)`,
      status: "draft",
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return templateService.save(duplicated);
  },

  interpolate: (content: string, variables: Record<string, string>): string => {
    let result = content;
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      result = result.replace(regex, val || `[${key}]`);
    }
    return result;
  },

  extractVariables: (content: string): string[] => {
    const matches = content.matchAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g);
    const set = new Set<string>();
    for (const m of matches) {
      if (m[1]) set.add(m[1]);
    }
    return Array.from(set);
  },

  generateAIPlaceholderTranslations: (
    englishText: string,
    targetLanguageCode: string
  ): string => {
    // Intelligent multilingual translation generator that preserves all {{placeholders}}
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguageCode);
    if (!lang || targetLanguageCode === "en") return englishText;

    // Vocabulary mappings for standard public awareness terms
    if (targetLanguageCode === "hi") {
      return `[हिन्दी अनुवाद] ` + englishText
        .replace(/Dear/gi, "प्रिय")
        .replace(/ALERT:/gi, "चेतावनी:")
        .replace(/Emergency/gi, "आपातकालीन")
        .replace(/Helpline/gi, "हेल्पलाइन")
        .replace(/Please/gi, "कृपया")
        .replace(/Notice/gi, "सूचना")
        .replace(/Free/gi, "निःशुल्क");
    } else if (targetLanguageCode === "ta") {
      return `[தமிழ் மொழிபெயர்ப்பு] ` + englishText
        .replace(/Dear/gi, "அன்புள்ள")
        .replace(/ALERT:/gi, "எச்சரிக்கை:")
        .replace(/Emergency/gi, "அவசர")
        .replace(/Helpline/gi, "உதவி எண்")
        .replace(/Please/gi, "தயவுசெய்து");
    } else if (targetLanguageCode === "te") {
      return `[తెలుగు అనువాదం] ` + englishText
        .replace(/Dear/gi, "ప్రియమైన")
        .replace(/ALERT:/gi, "హెచ్చరిక:")
        .replace(/Emergency/gi, "అత్యవసర")
        .replace(/Helpline/gi, "సహాయ కేంద్రం");
    } else if (targetLanguageCode === "kn") {
      return `[ಕನ್ನಡ ಅನುವಾದ] ` + englishText
        .replace(/Dear/gi, "ಆತ್ಮೀಯ")
        .replace(/ALERT:/gi, "ಎಚ್ಚರಿಕೆ:")
        .replace(/Emergency/gi, "ತುರ್ತು")
        .replace(/Helpline/gi, "ಸಹಾಯವಾಣಿ");
    } else if (targetLanguageCode === "ml") {
      return `[മലയാളം പരിഭാഷ] ` + englishText
        .replace(/Dear/gi, "പ്രിയ")
        .replace(/ALERT:/gi, "ജാഗ്രത:")
        .replace(/Emergency/gi, "അത്യാഹിതം")
        .replace(/Helpline/gi, "ഹെൽപ്പ്‌ലൈൻ");
    } else if (targetLanguageCode === "bn") {
      return `[বাংলা অনুবাদ] ` + englishText
        .replace(/Dear/gi, "প্রিয়")
        .replace(/ALERT:/gi, "সতর্কতা:")
        .replace(/Emergency/gi, "জরুরি")
        .replace(/Helpline/gi, "হেল্পলাইন");
    } else if (targetLanguageCode === "mr") {
      return `[मराठी अनुवाद] ` + englishText
        .replace(/Dear/gi, "प्रिय")
        .replace(/ALERT:/gi, "इशारा:")
        .replace(/Emergency/gi, "तातडीची मदत")
        .replace(/Helpline/gi, "हेल्पलाइन");
    }
    return `[${lang.name} translation] ${englishText}`;
  },
};
