import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import {
  GlobeIcon,
  WizardIcon,
  SearchIcon,
} from "../../components/ui/Icons";

interface ContentAsset {
  id: string;
  title: string;
  category: "Disaster Preparedness" | "Public Health" | "Agriculture" | "Civic Governance" | "Citizen Rights";
  format: "WhatsApp Rich Card" | "SMS DLT Template" | "Voice IVR Audio PSA" | "Official Circular";
  languages: string[];
  lastUpdated: string;
  complianceId: string;
  description: string;
  translations: {
    hindi: string;
    marathi: string;
    tamil: string;
    english: string;
  };
  audioDuration?: string;
  broadcastsCount: number;
}

const ASSETS: ContentAsset[] = [
  {
    id: "AST-2026-001",
    title: "Monsoon Cyclonic Weather Emergency Bulletin",
    category: "Disaster Preparedness",
    format: "WhatsApp Rich Card",
    languages: ["English", "Hindi", "Marathi", "Gujarati", "Bengali"],
    lastUpdated: "2026-09-24",
    complianceId: "DLT-REG-48912",
    description: "Urgent coastal storm safety protocol and municipal shelter emergency helpline broadcast.",
    translations: {
      english: "Severe cyclone approaching coastal districts. Move inland and call 1077 for emergency evacuation assistance.",
      hindi: "तटीय जिलों में गंभीर चक्रवात की चेतावनी। सुरक्षित आश्रय की ओर जाएं और आपातकालीन सहायता के लिए 1077 पर कॉल करें।",
      marathi: "किनारपट्टी जिल्ह्यांमध्ये गंभीर चक्रीवादळाचा इशारा. सुरक्षित स्थळी जा आणि आपत्कालीन मदतीसाठी 1077 वर संपर्क करा.",
      tamil: "கடலோர மாவட்டங்களுக்கு தீவிர புயல் எச்சரிக்கை. அவசர உதவிக்கு 1077 என்ற எண்ணை அழைக்கவும்.",
    },
    audioDuration: "0:28",
    broadcastsCount: 142000,
  },
  {
    id: "AST-2026-002",
    title: "National Pulse Polio Immunization Day Protocol",
    category: "Public Health",
    format: "Voice IVR Audio PSA",
    languages: ["English", "Hindi", "Tamil", "Telugu", "Kannada"],
    lastUpdated: "2026-09-20",
    complianceId: "DLT-REG-39814",
    description: "National polio vaccination drive schedule for children aged 0–5 years with Anganwadi booth directory.",
    translations: {
      english: "National Polio Day this Sunday. Visit your local government health center for two drops of oral polio vaccine.",
      hindi: "इस रविवार राष्ट्रीय पोलियो दिवस है। अपने नजदीकी प्राथमिक स्वास्थ्य केंद्र पर बच्चों को दो बूंद जिंदगी की अवश्य दिलवाएं।",
      marathi: "या रविवारी राष्ट्रीय पोलिओ दिवस. ५ वर्षांखालील सर्व बालकांना पोलिओ डोस नक्की द्या.",
      tamil: "இந்த ஞாயிற்றுக்கிழமை தேசிய போலியோ சொட்டு மருந்து தினம். உங்கள் குழந்தைகளுக்கு 2 சொட்டு மருந்து வழங்குங்கள்.",
    },
    audioDuration: "0:22",
    broadcastsCount: 489000,
  },
  {
    id: "AST-2026-003",
    title: "Kharif Crop Insurance Subsidy Window (PMFBY)",
    category: "Agriculture",
    format: "SMS DLT Template",
    languages: ["English", "Hindi", "Punjabi", "Marathi"],
    lastUpdated: "2026-09-18",
    complianceId: "DLT-REG-29103",
    description: "Seasonal agricultural insurance registration reminder with subsidized farmer premium rates.",
    translations: {
      english: "Secure your Kharif crops against seasonal losses. Subsidized insurance window closes on the 15th. Apply at local CSC.",
      hindi: "खरीफ फसलों का बीमा कराएं और मौसम के नुकसान से सुरक्षा पाएं। अंतिम तिथि 15 तारीख है। निकटतम CSC केंद्र जाएं।",
      marathi: "खरीप पिकांचा विमा उतरवा आणि अनपेक्षित नुकसानापासून सुरक्षित राहा. अर्ज करण्यासाठी नजीकच्या CSC केंद्राला भेट द्या.",
      tamil: "காரீப் பயிர் காப்பீட்டுத் திட்டம் பயன்பெற கடைசி நாள் 15. உங்கள் அருகிலுள்ள CSC மையத்தை அணுகவும்.",
    },
    broadcastsCount: 290000,
  },
  {
    id: "AST-2026-004",
    title: "National Voter ID Aadhaar Seeding Advisory",
    category: "Civic Governance",
    format: "Official Circular",
    languages: ["English", "Hindi", "Telugu", "Malayalam"],
    lastUpdated: "2026-09-15",
    complianceId: "DLT-REG-71284",
    description: "Election commission voluntary voter card linking instructions via online portal and mobile app.",
    translations: {
      english: "Verify your entry in the electoral roll. Update your constituency record on the national voter service portal.",
      hindi: "मतदाता सूची में अपना नाम सत्यापित करें और राष्ट्रीय मतदाता सेवा पोर्टल पर आवश्यक विवरण अपडेट करें।",
      marathi: "मतदार यादीतील आपले नाव तपासा आणि राष्ट्रीय मतदार पोर्टलवर माहिती अद्ययावत करा.",
      tamil: "வாக்காளர் பட்டியலில் உங்கள் பெயரை சரிபார்த்து விவரங்களைப் புதுப்பிக்கவும்.",
    },
    broadcastsCount: 88500,
  },
  {
    id: "AST-2026-005",
    title: "Heatwave & Dehydration Civic Precautions",
    category: "Public Health",
    format: "WhatsApp Rich Card",
    languages: ["English", "Hindi", "Telugu", "Bengali"],
    lastUpdated: "2026-09-12",
    complianceId: "DLT-REG-55209",
    description: "Peak summer temperature warnings, hydration guidelines, and symptoms of severe heat exhaustion.",
    translations: {
      english: "Extreme heat advisory active between 12 PM and 3 PM. Carry water, stay shaded, and seek medical help for dizziness.",
      hindi: "दोपहर 12 से 3 बजे के बीच अत्यधिक धूप से बचें। पर्याप्त पानी पिएं और चक्कर आने पर तुरंत नजदीकी स्वास्थ्य केंद्र जाएं।",
      marathi: "दुपारी १२ ते ३ दरम्यान कडक उन्हात बाहेर पडणे टाळा. भरपूर पाणी प्या आणि काळजी घ्या.",
      tamil: "மதியம் 12 முதல் 3 மணி வரை வெயிலில் செல்வதைத் தவிர்க்கவும். போதுமான தண்ணீர் அருந்தவும்.",
    },
    audioDuration: "0:19",
    broadcastsCount: 165000,
  },
  {
    id: "AST-2026-006",
    title: "Digital Banking Fraud & OTP Security Awareness",
    category: "Citizen Rights",
    format: "SMS DLT Template",
    languages: ["English", "Hindi", "Tamil", "Gujarati"],
    lastUpdated: "2026-09-08",
    complianceId: "DLT-REG-66190",
    description: "RBI & Cyber Crime prevention advisory warning against sharing OTPs or remote access software.",
    translations: {
      english: "Bank officials never ask for OTP or CVV. Never share banking credentials over phone calls or SMS. Report fraud at 1930.",
      hindi: "बैंक कभी भी OTP या CVV नहीं मांगता। फोन पर किसी से गोपनीय जानकारी साझा न करें। साइबर फ्रॉड की शिकायत 1930 पर करें।",
      marathi: "बँक अधिकारी कधीही OTP मागत नाहीत. फसवणूक झाल्यास १९३० वर त्वरित संपर्क करा.",
      tamil: "வங்கி அதிகாரிகள் ஒருபோதும் OTP கேட்க மாட்டார்கள். சந்தேகத்திற்கிடமான அழைப்புகளுக்கு 1930 எண்ணை அழைக்கவும்.",
    },
    broadcastsCount: 520000,
  },
];

const CATEGORIES = [
  "All Categories",
  "Disaster Preparedness",
  "Public Health",
  "Agriculture",
  "Civic Governance",
  "Citizen Rights",
];

const FORMATS = [
  "All Formats",
  "WhatsApp Rich Card",
  "SMS DLT Template",
  "Voice IVR Audio PSA",
  "Official Circular",
];

const ContentLibraryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedFormat, setSelectedFormat] = useState("All Formats");
  const [activeAssetModal, setActiveAssetModal] = useState<ContentAsset | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const filteredAssets = ASSETS.filter((asset) => {
    const matchSearch =
      asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.complianceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory =
      selectedCategory === "All Categories" || asset.category === selectedCategory;
    const matchFormat =
      selectedFormat === "All Formats" || asset.format === selectedFormat;
    return matchSearch && matchCategory && matchFormat;
  });

  const toggleAudio = (id: string) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
              Verified Asset Repository
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">Ministry & DLT Approved Content</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Public Awareness Content Library
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Pre-approved multilingual messages, verified regional voice scripts, and DLT compliant SMS templates ready for instant dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => navigate("/campaigns/wizard")}
            icon={<WizardIcon className="w-4 h-4 text-white" />}
          >
            + Compose in AI Wizard
          </Button>
        </div>
      </div>

      {/* Operational Highlights Ticker */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-subtle">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Registered Assets
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-slate-900">
            148
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">100% DLT Cleared</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-subtle">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Linguistic Dialects
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-blue-600">
            22
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Scheduled Indian Languages</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-subtle">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Citizen Reach
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-slate-900">
            1.68M
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dispatches via Library Copies</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-subtle">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Verified Domains
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-indigo-600">
            6
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Disaster, Health, Agriculture, etc.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Search Content Catalog
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by topic, advisory keywords, or DLT registration code..."
                className="field-input mt-0 pl-9"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Filter by Domain
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="field-input mt-0"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Filter by Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="field-input mt-0"
            >
              {FORMATS.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Content Asset Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="group flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft hover:border-slate-300"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  {asset.category}
                </span>
                <span className="font-mono text-[10px] text-slate-600">
                  {asset.complianceId}
                </span>
              </div>

              <h3 className="mt-3 font-display text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {asset.title}
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {asset.description}
              </p>

              {/* Supported Languages */}
              <div className="mt-4 flex flex-wrap items-center gap-1">
                <GlobeIcon className="w-3.5 h-3.5 text-slate-400 mr-1" />
                {asset.languages.slice(0, 3).map((lang) => (
                  <span
                    key={lang}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                  >
                    {lang}
                  </span>
                ))}
                {asset.languages.length > 3 && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                    +{asset.languages.length - 3} more
                  </span>
                )}
              </div>

              {/* Vernacular Preview Snippet */}
              <div className="mt-3.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs text-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-600">
                  <span className="font-bold">Hindi Verified Copy:</span>
                  <span className="text-emerald-700 font-semibold">100% Match</span>
                </div>
                <p className="line-clamp-2 italic text-[11px] text-slate-600">
                  "{asset.translations.hindi}"
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveAssetModal(asset)}
              >
                Inspect All Copies
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/campaigns/wizard")}
              >
                Use in Wizard →
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Inspecting Translations & Playing Audio */}
      {activeAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="rounded bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                  {activeAssetModal.category}
                </span>
                <h3 className="font-display text-lg font-bold text-slate-900 mt-2">
                  {activeAssetModal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  DLT Registration: <code className="font-mono text-slate-800">{activeAssetModal.complianceId}</code> · Format: {activeAssetModal.format}
                </p>
              </div>
              <button
                onClick={() => setActiveAssetModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Audio Stream Simulation if audio exists */}
            {activeAssetModal.audioDuration && (
              <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleAudio(activeAssetModal.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-colors"
                  >
                    {playingAudioId === activeAssetModal.id ? "⏸" : "▶"}
                  </button>
                  <div>
                    <p className="text-xs font-bold text-white">Synthesized Regional Audio Broadcast</p>
                    <p className="text-[10px] text-slate-400">Duration: {activeAssetModal.audioDuration} · Studio Quality 24kHz</p>
                  </div>
                </div>

                {/* Animated sound waves when playing */}
                <div className="flex items-center gap-1 h-6">
                  <div className={`w-1 bg-blue-400 rounded-full ${playingAudioId === activeAssetModal.id ? "animate-voice-1" : "h-2"}`} />
                  <div className={`w-1 bg-emerald-400 rounded-full ${playingAudioId === activeAssetModal.id ? "animate-voice-2" : "h-4"}`} />
                  <div className={`w-1 bg-blue-500 rounded-full ${playingAudioId === activeAssetModal.id ? "animate-voice-3" : "h-3"}`} />
                  <div className={`w-1 bg-cyan-400 rounded-full ${playingAudioId === activeAssetModal.id ? "animate-voice-4" : "h-5"}`} />
                  <div className={`w-1 bg-indigo-400 rounded-full ${playingAudioId === activeAssetModal.id ? "animate-voice-5" : "h-2"}`} />
                </div>
              </div>
            )}

            {/* All Translated Copies */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Official Multi-Linguistic Content Variants:
              </h4>

              <div className="rounded-lg border border-slate-200 p-3 text-xs bg-slate-50/50 space-y-1">
                <span className="font-bold text-blue-700">English (Standard Master):</span>
                <p className="text-slate-800 leading-relaxed">{activeAssetModal.translations.english}</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 text-xs bg-slate-50/50 space-y-1">
                <span className="font-bold text-emerald-700">Hindi (हिंदी):</span>
                <p className="text-slate-800 leading-relaxed font-sans">{activeAssetModal.translations.hindi}</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 text-xs bg-slate-50/50 space-y-1">
                <span className="font-bold text-indigo-700">Marathi (मराठी):</span>
                <p className="text-slate-800 leading-relaxed font-sans">{activeAssetModal.translations.marathi}</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 text-xs bg-slate-50/50 space-y-1">
                <span className="font-bold text-amber-700">Tamil (தமிழ்):</span>
                <p className="text-slate-800 leading-relaxed font-sans">{activeAssetModal.translations.tamil}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="secondary" onClick={() => setActiveAssetModal(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setActiveAssetModal(null);
                  navigate("/campaigns/wizard");
                }}
              >
                Import into Campaign Wizard →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentLibraryPage;
