import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import {
  UsersIcon,
  AudienceIcon,
  WizardIcon,
  RadioIcon,
  AnalyticsIcon,
  ShieldCheckIcon,
  GlobeIcon,
  CheckCircleIcon,
} from "../../components/ui/Icons";

interface StageInfo {
  id: number;
  name: string;
  tagline: string;
  icon: typeof UsersIcon;
  color: string;
  protocols: string[];
  latency: string;
  throughput: string;
  description: string;
  technicalSpecs: string[];
  samplePayload: Record<string, any>;
}

const STAGES: StageInfo[] = [
  {
    id: 1,
    name: "1. Data Ingestion & Registry",
    tagline: "High-volume citizen dataset onboarding",
    icon: UsersIcon,
    color: "from-blue-600 to-indigo-700",
    protocols: ["CSV/Excel Parser", "REST Webhooks", "DLT Registry Sync"],
    latency: "< 240ms / 50k records",
    throughput: "50,000 records / batch",
    description:
      "Ingests raw citizen data, verifies national mobile numbers, cleans contact duplicates, and synchronizes TRAI DLT consent records in an encrypted PostgreSQL data store.",
    technicalSpecs: [
      "E.164 International & National Indian (+91) phone normalizer",
      "Automatic deduplication on Aadhaar/DLT/Phone hashes",
      "Explicit citizen consent management (GDPR & DPDP Act 2023 compliant)",
      "Indexed multi-tenant schema with sub-second querying",
    ],
    samplePayload: {
      recipient_id: 84920,
      full_name: "Rameshwar Patel",
      phone: "+91 98765 43210",
      state: "Maharashtra",
      district: "Nashik",
      primary_language: "Marathi (मराठी)",
      dlt_consent: "VERIFIED_ACTIVE",
    },
  },
  {
    id: 2,
    name: "2. Audience Segmentation Engine",
    tagline: "Precision targeting & geo-clustering",
    icon: AudienceIcon,
    color: "from-indigo-600 to-violet-700",
    protocols: ["Dynamic Query DSL", "Geo-Fencing", "Demographic Clustering"],
    latency: "< 85ms execution",
    throughput: "Up to 5M citizens evaluated",
    description:
      "Segments recipients by geographic location, native linguistic preference, age bracket, and socio-economic role to ensure mass communications reach exactly the relevant community.",
    technicalSpecs: [
      "Multi-criteria combinatorial query engine (AND / OR / NOT filters)",
      "Linguistic grouping across 22 Scheduled Indian Languages",
      "Real-time audience size calculation & saturation check",
      "Historical engagement score filtering to prevent message fatigue",
    ],
    samplePayload: {
      segment_name: "Nashik Rural Farmers - Kharif Advisory",
      matched_count: 142850,
      primary_dialect: "Marathi",
      target_channel_preference: ["whatsapp", "sms", "voice_ivr"],
      target_age_cohort: "25-60",
    },
  },
  {
    id: 3,
    name: "3. Gemini AI Multilingual Studio",
    tagline: "Culturally contextualized content generation",
    icon: WizardIcon,
    color: "from-blue-500 to-cyan-600",
    protocols: ["Google Gemini Flash", "Zero-Shot Localization", "Tone Normalizer"],
    latency: "1.2s per 6 languages",
    throughput: "22 Regional Languages in parallel",
    description:
      "Transforms a simple high-level advisory brief into culturally nuanced, idiomatic messages across regional dialects with automated length constraints per channel (SMS 160-char vs WhatsApp rich cards).",
    technicalSpecs: [
      "Gemini Multimodal & Multilingual Language Engine",
      "Domain-specific guardrails (Emergency, Health, Agriculture, Civic)",
      "Automatic generation of audio scripts for Voice IVR synthesis",
      "Context preservation with zero mechanical mistranslation",
    ],
    samplePayload: {
      original_prompt: "Heavy rainfall alert for Nashik. Move livestock to elevated shelters.",
      marathi_variant: "नाशिक जिल्ह्यासाठी अतिवृष्टीचा इशारा. कृपया जनावरांना सुरक्षित ठिकाणी हलवा.",
      hindi_variant: "नासिक जिले के लिए भारी बारिश की चेतावनी। मवेशियों को सुरक्षित स्थान पर ले जाएं.",
      sms_gsm_length: 128,
      readability_score: "Grade 5 (High Accessibility)",
    },
  },
  {
    id: 4,
    name: "4. Multi-Gateway Broadcast Dispatch",
    tagline: "Concurrent high-throughput transmission",
    icon: RadioIcon,
    color: "from-emerald-600 to-teal-700",
    protocols: ["SMPP v3.4 (SMS)", "Meta Cloud API (WhatsApp)", "SIP Asterisk (IVR)", "Gov-SMTP"],
    latency: "Average 45ms per dispatch",
    throughput: "12,500 messages / second",
    description:
      "Simultaneously dispatches messages across telecom SMS gateways, WhatsApp Business Cloud, SIP Voice PBX, and Email relays with intelligent failover if a channel experiences downtime.",
    technicalSpecs: [
      "Automated Fallback: WhatsApp unread after 10m -> SMS -> Voice Call",
      "TRAI Telemarketer Header ID (e.g. MH-GOVINFO) compliance",
      "Load balancing across 3 redundant tier-1 telecom aggregators",
      "Async queue worker architecture with backpressure handling",
    ],
    samplePayload: {
      dispatch_id: "DSP-2026-98124",
      channels_active: ["whatsapp", "sms", "voice_ivr"],
      delivery_queue: "active_processing",
      primary_gateway_status: "CONNECTED_99.98%",
      estimated_delivery_time: "48 seconds",
    },
  },
  {
    id: 5,
    name: "5. Real-Time Telemetry & Feedback",
    tagline: "Closed-loop response & sentiment intelligence",
    icon: AnalyticsIcon,
    color: "from-amber-600 to-rose-700",
    protocols: ["Webhook Telemetry", "Sentiment NLP", "Two-Way Citizen Chat"],
    latency: "Real-time stream (< 100ms)",
    throughput: "Instant delivery ack stream",
    description:
      "Captures instant delivery receipts, open rates, citizen survey responses, and helpline triggers, providing emergency authorities with real-time public reach metrics.",
    technicalSpecs: [
      "Real-time DLR (Delivery Report) ingestion via webhooks",
      "Inbound WhatsApp / SMS keyword parsing (e.g., 'HELP', 'SAFE')",
      "Automated citizen sentiment aggregation by district",
      "Exportable compliance audit trails for public accountability",
    ],
    samplePayload: {
      total_dispatched: 142850,
      delivered_count: 142410,
      delivery_rate: "99.69%",
      acknowledged_safe: 68920,
      emergency_assistance_requested: 14,
    },
  },
];

const DISPATCH_PRESETS = [
  {
    id: "cyclone",
    title: "Monsoon Cyclone Emergency Warning",
    region: "Coastal Maharashtra & Gujarat",
    targetCount: "420,000 citizens",
    brief: "Severe cyclonic storm approaching coastline with wind speeds up to 90 km/h. Fishermen advised not to venture into sea. Emergency helpline 1077 active.",
    languages: ["Marathi", "Gujarati", "Hindi", "English"],
    previews: {
      whatsapp: {
        header: "🚨 Disaster Management Authority Warning",
        body: "Severe cyclonic warning issued for coastal areas today. High tidal waves and winds up to 90 km/h expected.\n\n⚠️ Safety Advisories:\n• Avoid coastal areas\n• Fishermen must stay anchored\n• Emergency helpline: 1077",
        time: "14:32",
        buttons: ["I Am Safe ✅", "Call Helpline 📞"],
      },
      sms: {
        sender: "MH-DISASTER",
        text: "ALERT: Cyclone warning for coastal districts. Stay indoors, avoid coastal areas. Call 1077 for emergency assistance. - State Disaster Authority",
        time: "14:32",
      },
      ivr: {
        caller: "Emergency Advisory 1077",
        audioScript: "आपत्कालीन इशारा: किनारपट्टी भागात चक्रीवादळाचा इशारा देण्यात आला आहे. कृपया घराबाहेर पडू नका. मदतीसाठी 1077 वर संपर्क साधा.",
        duration: "0:24",
      },
      email: {
        subject: "URGENT ADVISORY: Cyclonic Storm Precautions & Evacuation Zones",
        greeting: "Respected Citizen,",
        summary: "The Regional Meteorological Department has elevated coastal warning status to Level Orange. All municipal shelters are open with 24x7 medical support.",
      },
    },
  },
  {
    id: "health",
    title: "National Polio Immunization Drive",
    region: "All Districts - Urban & Rural",
    targetCount: "1,250,000 families",
    brief: "National Pulse Polio Immunization Day this Sunday. All children under 5 years must be given two drops at government health booths.",
    languages: ["Hindi", "Bengali", "Tamil", "Telugu", "English"],
    previews: {
      whatsapp: {
        header: "👶 National Health Mission Advisory",
        body: "Sunday is National Pulse Polio Day!\n\nProtect your child from polio with two drops of life.\n\n📅 Date: This Sunday, 8 AM - 5 PM\n📍 Location: All Anganwadi & Govt Health Centers\n🎯 Eligibility: Children 0 to 5 years old.",
        time: "09:15",
        buttons: ["Find Nearest Booth 📍", "Set Reminder ⏰"],
      },
      sms: {
        sender: "GOV-HEALTH",
        text: "Pulse Polio Day this Sunday! Bring children under 5 to nearest booth for 2 drops of polio vaccine. Free of cost. - Ministry of Health",
        time: "09:15",
      },
      ivr: {
        caller: "National Health Mission (104)",
        audioScript: "नमस्ते, इस रविवार को राष्ट्रीय पल्स पोलियो दिवस है। अपने 5 वर्ष तक के सभी बच्चों को पोलियो की खुराक अवश्य दिलवाएं।",
        duration: "0:18",
      },
      email: {
        subject: "National Pulse Polio Program: Schedule and Booth Locator",
        greeting: "Dear Parent / Guardian,",
        summary: "Ensure full immunity for your family. Over 45,000 public health booths will be operating continuously this weekend with trained pediatric personnel.",
      },
    },
  },
  {
    id: "subsidy",
    title: "Farmer Subsidy & Crop Insurance Advisory",
    region: "Punjab, Haryana, MP & Karnataka",
    targetCount: "850,000 registered farmers",
    brief: "Kharif crop insurance window open. Last date to register is 15th of next month. Get 90% premium subsidy at your local CSC center.",
    languages: ["Punjabi", "Kannada", "Hindi", "English"],
    previews: {
      whatsapp: {
        header: "🌾 PM Crop Insurance Scheme (PMFBY)",
        body: "Attention Farmers: Kharif crop insurance registration is now live!\n\n💰 Benefit: Up to 90% government subsidized premium.\n🗓️ Deadline: 15th of next month.\n📋 Documents needed: Land record (Khatauni), Aadhaar & Bank Passbook.",
        time: "11:05",
        buttons: ["Apply Online 🌐", "Locate CSC Center 📍"],
      },
      sms: {
        sender: "AGRI-INDIA",
        text: "Kharif Crop Insurance window open! Secure your crops against unseasonal weather before 15th. Visit local CSC or pmfby.gov.in",
        time: "11:05",
      },
      ivr: {
        caller: "Kisan Call Center (1551)",
        audioScript: "ਕਿਸਾਨ ਭਰਾਵੋ, ਸਾਉਣੀ ਦੀਆਂ ਫ਼ਸਲਾਂ ਦੇ ਬੀਮੇ ਲਈ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਸ਼ੁਰੂ ਹੋ ਚੁੱਕੀ ਹੈ। ਆਪਣੀ ਫ਼ਸਲ ਦਾ ਬੀਮਾ ਜ਼ਰੂਰ ਕਰਵਾਓ।",
        duration: "0:22",
      },
      email: {
        subject: "Direct Benefit Transfer Notification: Agricultural Relief Fund",
        greeting: "Dear Farmer Partner,",
        summary: "The Ministry of Agriculture has credited seasonal premium subsidies directly to verified citizen bank accounts. Review your entitlement details below.",
      },
    },
  },
];

const SystemFlowPage = () => {
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [activeScenario, setActiveScenario] = useState(DISPATCH_PRESETS[0]);
  const [activeDeviceTab, setActiveDeviceTab] = useState<"whatsapp" | "sms" | "ivr" | "email">("whatsapp");
  const [simulating, setSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  const currentStage = STAGES.find((s) => s.id === selectedStage) || STAGES[0];

  const runSimulation = () => {
    setSimulating(true);
    setSimulationStep(1);

    const steps = [
      { step: 1, delay: 600 },
      { step: 2, delay: 1300 },
      { step: 3, delay: 2100 },
      { step: 4, delay: 3000 },
      { step: 5, delay: 3900 },
    ];

    steps.forEach(({ step, delay }) => {
      setTimeout(() => {
        setSimulationStep(step);
        if (step === 5) {
          setSimulating(false);
        }
      }, delay);
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Pitch & Showcase Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-[#090d16] via-[#0f172a] to-[#151f38] p-6 sm:p-8 text-white shadow-classic">
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                Enterprise Architecture & System Flow
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-300">GovGrade Mass Outreach Platform</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              End-to-End Multilingual Broadcast Flow
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Explore how OmniAware AI transforms raw citizen databases and public announcements into
              culturally localized broadcasts across 4 simultaneous telecom gateways with zero message latency.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => runSimulation()}
              disabled={simulating}
              className="bg-slate-900/80 border-slate-700 text-white hover:bg-slate-800 hover:text-white"
            >
              {simulating ? "Executing Pipeline..." : "⚡ Verify Architecture Execution"}
            </Button>
            <Link to="/campaigns/wizard">
              <Button variant="primary">
                + Launch Production Campaign
              </Button>
            </Link>
          </div>
        </div>

        {/* Executive Highlights Ticker */}
        <div className="mt-8 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-6 sm:grid-cols-4 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <RadioIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">12,500 msgs/sec</p>
              <p className="text-[10px] text-slate-400">Peak Transmission Capacity</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <GlobeIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">22 Languages</p>
              <p className="text-[10px] text-slate-400">Contextual AI Dialect Support</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">TRAI DLT Verified</p>
              <p className="text-[10px] text-slate-400">Anti-Spam & Regulatory Compliant</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CheckCircleIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">99.8% Gateway SLA</p>
              <p className="text-[10px] text-slate-400">Multi-Channel Failover Mesh</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Stage Animated Pipeline Flow Visualizer */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-card">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">
              Interactive 5-Stage Architecture Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              Click any stage below to inspect protocols, throughput benchmarks, and live payloads.
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full self-start sm:self-auto">
            Stage {selectedStage} Selected
          </span>
        </div>

        {/* Stages Track */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 relative">
          {STAGES.map((s) => {
            const Icon = s.icon;
            const isSelected = selectedStage === s.id;
            const isCurrentSim = simulating && simulationStep === s.id;

            return (
              <button
                key={s.id}
                onClick={() => setSelectedStage(s.id)}
                className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/40 shadow-soft ring-2 ring-blue-500/20"
                    : isCurrentSim
                    ? "border-amber-400 bg-amber-50/50 shadow-glow ring-2 ring-amber-400/40"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} text-white shadow-sm`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      0{s.id}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-sm font-bold text-slate-900">
                    {s.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {s.tagline}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                  <span className="font-semibold text-slate-600">{s.latency}</span>
                  <span className={`font-bold ${isSelected ? "text-blue-600" : "text-slate-400"}`}>
                    Inspect →
                  </span>
                </div>

                {/* Animated active beacon */}
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Stage Deep Dive Specification Box */}
        <div className="mt-6 rounded-xl border border-slate-200/90 bg-slate-50/70 p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Operational Deep Dive
                </span>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {currentStage.name}
                </h3>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {currentStage.description}
              </p>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Key Technical Features & Protocols:
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {currentStage.technicalSpecs.map((spec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/80">
                {currentStage.protocols.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 shadow-subtle"
                  >
                    ⚡ {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Sample JSON Payload / Telemetry Packet */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="flex items-center justify-between rounded-t-lg bg-[#0f172a] px-4 py-2 text-xs text-slate-300">
                <span className="font-mono font-bold text-blue-400">Telemetry Payload Packet</span>
                <span className="text-[10px] text-slate-400">JSON Schema v2.4</span>
              </div>
              <pre className="flex-1 overflow-x-auto rounded-b-lg border border-slate-800 bg-[#090d16] p-4 font-mono text-[11px] leading-relaxed text-emerald-400 shadow-inner">
                {JSON.stringify(currentStage.samplePayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Gateway Recipient Device Emulator */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
                Multi-Channel Preview
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">Cross-Platform Delivery Verification</span>
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight mt-1">
              Multi-Channel Recipient Device Terminal
            </h2>
            <p className="text-xs text-slate-500">
              Select an operational advisory template to inspect message formatting and rendering across SMS, WhatsApp, Voice IVR, and Email.
            </p>
          </div>

          {/* Scenario Selector Buttons */}
          <div className="flex flex-wrap gap-2">
            {DISPATCH_PRESETS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setActiveScenario(sc)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeScenario.id === sc.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {sc.id === "cyclone" ? "🌪️ Cyclone Advisory" : sc.id === "health" ? "💉 Pulse Polio" : "🌾 Crop Subsidy"}
              </button>
            ))}
          </div>
        </div>

        {/* Device Switcher & Phone Mockup Grid */}
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Left: Scenario Metadata & Channel Picker (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Active Scenario Parameters
              </span>
              <h3 className="font-display text-base font-bold text-slate-900">
                {activeScenario.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeScenario.brief}
              </p>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Target Volume:</span>
                <span className="font-bold text-slate-800">{activeScenario.targetCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Target Region:</span>
                <span className="font-semibold text-slate-800">{activeScenario.region}</span>
              </div>
            </div>

            {/* Channel Tabs */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Select Citizen Delivery Channel to Preview:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "whatsapp", label: "WhatsApp Business", icon: "💬" },
                  { id: "sms", label: "Mobile SMS (DLT)", icon: "📱" },
                  { id: "ivr", label: "Voice IVR Call", icon: "📞" },
                  { id: "email", label: "Gov-Email Digest", icon: "✉️" },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveDeviceTab(ch.id as any)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all ${
                      activeDeviceTab === ch.id
                        ? "border-blue-600 bg-blue-50 text-blue-800 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{ch.icon}</span>
                    <span>{ch.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Broadcast Trigger CTA */}
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={runSimulation}
                disabled={simulating}
                className="w-full justify-center"
              >
                {simulating ? "Transmitting via Gateways..." : "⚡ Transmit Multilingual Broadcast"}
              </Button>
            </div>
          </div>

          {/* Right: Realistic Device Mockup Screen (7 cols) */}
          <div className="lg:col-span-7 flex justify-center">
            {/* WHATSAPP VIEW */}
            {activeDeviceTab === "whatsapp" && (
              <div className="w-full max-w-sm rounded-[32px] border-4 border-slate-800 bg-[#0b141a] p-3 shadow-2xl">
                {/* Phone Speaker & Notch */}
                <div className="mx-auto mb-2 h-4 w-28 rounded-full bg-slate-800" />

                {/* WhatsApp App Header */}
                <div className="flex items-center justify-between rounded-t-xl bg-[#1f2c34] px-4 py-3 text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 font-bold text-white text-xs">
                      GOV
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white">Govt Advisory Hub</span>
                        <svg className="h-3.5 w-3.5 text-emerald-400 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </div>
                      <p className="text-[10px] text-emerald-400">Official Business Account</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">⋮</span>
                </div>

                {/* WhatsApp Chat Canvas */}
                <div className="h-80 overflow-y-auto bg-[#0b141a] p-3 space-y-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
                  {/* Date badge */}
                  <div className="text-center">
                    <span className="rounded-md bg-[#182229] px-2 py-0.5 text-[10px] text-slate-400">
                      TODAY
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div className="rounded-xl rounded-tl-none bg-[#1f2c34] p-3.5 text-xs text-white shadow-md space-y-2">
                    <p className="font-bold text-emerald-400">
                      {activeScenario.previews.whatsapp.header}
                    </p>
                    <p className="whitespace-pre-line text-slate-200 leading-relaxed text-[11px]">
                      {activeScenario.previews.whatsapp.body}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
                      <span>{activeScenario.previews.whatsapp.time}</span>
                      <span className="text-sky-400">✓✓</span>
                    </div>
                  </div>

                  {/* Action Buttons inside WhatsApp */}
                  <div className="space-y-1.5">
                    {activeScenario.previews.whatsapp.buttons.map((btn, i) => (
                      <button
                        key={i}
                        className="w-full rounded-lg bg-[#202c33] py-2 text-center text-xs font-semibold text-emerald-400 hover:bg-[#2a3942] transition-colors border border-slate-700/60"
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SMS VIEW */}
            {activeDeviceTab === "sms" && (
              <div className="w-full max-w-sm rounded-[32px] border-4 border-slate-800 bg-slate-900 p-3 shadow-2xl text-slate-100">
                <div className="mx-auto mb-2 h-4 w-28 rounded-full bg-slate-800" />
                <div className="border-b border-slate-800 px-4 py-3 text-center">
                  <p className="text-xs font-bold text-white">{activeScenario.previews.sms.sender}</p>
                  <p className="text-[10px] text-slate-400">TRAI DLT Verified Header</p>
                </div>

                <div className="h-80 bg-slate-950 p-4 space-y-4">
                  <div className="text-center text-[10px] text-slate-500">
                    Today {activeScenario.previews.sms.time}
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-blue-600 p-3.5 text-xs text-white shadow-md leading-relaxed">
                    {activeScenario.previews.sms.text}
                  </div>
                </div>
              </div>
            )}

            {/* VOICE IVR CALL VIEW */}
            {activeDeviceTab === "ivr" && (
              <div className="w-full max-w-sm rounded-[32px] border-4 border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4 shadow-2xl text-white">
                <div className="mx-auto mb-3 h-4 w-28 rounded-full bg-slate-800" />
                <div className="py-6 text-center space-y-1">
                  <span className="inline-block rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    CALL IN PROGRESS · 00:14
                  </span>
                  <h4 className="font-display text-lg font-bold text-white">
                    {activeScenario.previews.ivr.caller}
                  </h4>
                  <p className="text-xs text-slate-400">Emergency Audio Broadcast Stream</p>
                </div>

                {/* Animated Audio Waveform */}
                <div className="my-6 flex items-center justify-center gap-1.5 h-12">
                  <div className="w-1.5 bg-blue-400 rounded-full animate-voice-1" />
                  <div className="w-1.5 bg-emerald-400 rounded-full animate-voice-2" />
                  <div className="w-1.5 bg-blue-500 rounded-full animate-voice-3" />
                  <div className="w-1.5 bg-cyan-400 rounded-full animate-voice-4" />
                  <div className="w-1.5 bg-indigo-400 rounded-full animate-voice-5" />
                  <div className="w-1.5 bg-blue-400 rounded-full animate-voice-2" />
                  <div className="w-1.5 bg-emerald-400 rounded-full animate-voice-1" />
                </div>

                {/* Regional Speech Transcript */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-300 leading-relaxed text-center">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                    Live Regional Speech Synthesis
                  </p>
                  "{activeScenario.previews.ivr.audioScript}"
                </div>

                <div className="mt-8 flex justify-center">
                  <button className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40">
                    📞
                  </button>
                </div>
              </div>
            )}

            {/* EMAIL VIEW */}
            {activeDeviceTab === "email" && (
              <div className="w-full max-w-sm rounded-[24px] border border-slate-300 bg-white p-4 shadow-xl text-slate-800">
                <div className="border-b border-slate-100 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Official Public Circular
                  </p>
                  <h4 className="font-bold text-slate-900 text-xs mt-1">
                    {activeScenario.previews.email.subject}
                  </h4>
                </div>
                <div className="py-4 space-y-2 text-xs leading-relaxed text-slate-600">
                  <p className="font-semibold text-slate-800">{activeScenario.previews.email.greeting}</p>
                  <p>{activeScenario.previews.email.summary}</p>
                  <div className="mt-4 rounded-lg bg-blue-50 p-2.5 text-blue-800 font-medium text-[11px]">
                    ℹ️ For urgent assistance or updates, visit the centralized state disaster response portal.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selling Point & ROI Proposition Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-card">
          <div className="text-2xl font-bold text-blue-600 font-display">92%</div>
          <h4 className="mt-1 text-sm font-bold text-slate-900">Latency Reduction</h4>
          <p className="mt-1 text-xs text-slate-500">
            Emergency advisory propagation reduced from 48 hours to under 60 seconds nationwide.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-card">
          <div className="text-2xl font-bold text-emerald-600 font-display">22 / 22</div>
          <h4 className="mt-1 text-sm font-bold text-slate-900">Scheduled Languages</h4>
          <p className="mt-1 text-xs text-slate-500">
            No citizen left uninformed regardless of vernacular tongue or literacy barrier.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-card">
          <div className="text-2xl font-bold text-indigo-600 font-display">78% Cost</div>
          <h4 className="mt-1 text-sm font-bold text-slate-900">Delivery Savings</h4>
          <p className="mt-1 text-xs text-slate-500">
            Cost-optimized routing via high-engagement WhatsApp first, with automatic telecom fallback.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-card">
          <div className="text-2xl font-bold text-amber-600 font-display">100% Audit</div>
          <h4 className="mt-1 text-sm font-bold text-slate-900">Regulatory Trust</h4>
          <p className="mt-1 text-xs text-slate-500">
            End-to-end cryptographic proof of delivery reports conforming to DPDP Act 2023.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemFlowPage;
