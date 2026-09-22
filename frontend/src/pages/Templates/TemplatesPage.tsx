import { useState, useMemo, useEffect } from "react";
import type {
  MessageTemplate,
  ChannelType,
  TemplateCategory,
} from "../../types/template";
import {
  templateService,
  SUPPORTED_LANGUAGES,
  DEFAULT_TEMPLATES,
} from "../../services/templateService";
import TemplateSimulatorModal from "./TemplateSimulatorModal";
import TemplateEditorModal from "./TemplateEditorModal";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

const CHANNEL_META: Record<
  ChannelType,
  { label: string; icon: string; badgeClass: string; bgClass: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    icon: "📱",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    bgClass: "from-emerald-500/10 to-teal-500/5",
  },
  sms: {
    label: "SMS",
    icon: "💬",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
    bgClass: "from-sky-500/10 to-blue-500/5",
  },
  email: {
    label: "Email",
    icon: "✉️",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    bgClass: "from-purple-500/10 to-indigo-500/5",
  },
  voice: {
    label: "Voice IVR",
    icon: "🎙️",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    bgClass: "from-amber-500/10 to-orange-500/5",
  },
};

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  health: "Public Health",
  disaster: "Disaster Alert",
  civic: "Civic Advisory",
  welfare: "Welfare (DBT)",
  agriculture: "Agriculture",
  education: "Education",
};

const TemplatesPage = () => {
  const { toast, showToast } = useToast();

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "draft" | "archived">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals state
  const [simulatingTemplate, setSimulatingTemplate] = useState<MessageTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const list = templateService.list();
    setTemplates(list);
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (tmpl: MessageTemplate) => {
    setEditingTemplate(tmpl);
    setIsEditorOpen(true);
  };

  const handleDuplicate = (id: string) => {
    const duplicated = templateService.duplicate(id);
    if (duplicated) {
      loadTemplates();
      showToast("success", `Duplicated template as "${duplicated.title}"`);
    }
  };

  const handleDelete = (tmpl: MessageTemplate) => {
    if (window.confirm(`Are you sure you want to delete template "${tmpl.title}"?`)) {
      templateService.delete(tmpl.id);
      loadTemplates();
      showToast("info", `Template "${tmpl.title}" deleted.`);
    }
  };

  const handleSaveTemplate = (tmpl: MessageTemplate) => {
    templateService.save(tmpl);
    loadTemplates();
    showToast("success", `Template "${tmpl.title}" saved successfully!`);
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all templates back to system factory defaults?")) {
      localStorage.setItem("mcp_message_templates_v1", JSON.stringify(DEFAULT_TEMPLATES));
      loadTemplates();
      showToast("success", "Restored standard awareness templates.");
    }
  };

  // Filter logic
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      // Channel filter
      if (selectedChannel !== "all" && t.channel !== selectedChannel) return false;
      // Category filter
      if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
      // Status filter
      if (selectedStatus !== "all" && t.status !== selectedStatus) return false;
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = t.title.toLowerCase().includes(q);
        const inCode = t.code.toLowerCase().includes(q);
        const inContent = Object.values(t.translations).some((tr) =>
          tr.content.toLowerCase().includes(q)
        );
        if (!inTitle && !inCode && !inContent) return false;
      }
      return true;
    });
  }, [templates, selectedChannel, selectedCategory, selectedStatus, searchQuery]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = templates.length;
    const activeCount = templates.filter((t) => t.status === "active").length;
    const channels = new Set(templates.map((t) => t.channel)).size;
    const totalUsage = templates.reduce((acc, t) => acc + (t.usageCount || 0), 0);
    return { total, activeCount, channels, totalUsage };
  }, [templates]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Toast Notifications */}
      <ToastManager toast={toast} />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-sky-800">
              Content Studio
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              8+ Languages
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Multilingual Message Templates
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Design, standardize, and preview broadcast communication templates across SMS, WhatsApp, Email, and Voice IVR with dynamic recipient variables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-xs hover:bg-slate-50 transition"
            title="Reload default public awareness templates"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-sky-700 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Template
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Templates
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            {stats.activeCount} active for broadcast
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Channels
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">4 / 4</p>
          <p className="mt-1 text-[11px] text-slate-500">
            SMS, WhatsApp, Email, Voice
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Multilingual Matrix
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">8</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Regional Indian Languages
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Campaign Runs
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalUsage}</p>
          <p className="mt-1 text-[11px] text-sky-600 font-medium">
            Total dispatched dispatches
          </p>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4">
        {/* Top filter row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by title, code, or keyword..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Secondary Controls & View Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | "all")}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as "all" | "active" | "draft" | "archived")}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "grid"
                    ? "bg-white text-sky-700 shadow-xs font-bold"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Grid View"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "table"
                    ? "bg-white text-sky-700 shadow-xs font-bold"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Table View"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Channel Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <button
            onClick={() => setSelectedChannel("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              selectedChannel === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Channels ({templates.length})
          </button>
          {(["whatsapp", "sms", "email", "voice"] as ChannelType[]).map((ch) => {
            const count = templates.filter((t) => t.channel === ch).length;
            const meta = CHANNEL_META[ch];
            const isSelected = selectedChannel === ch;
            return (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Cards (Grid View) */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((tmpl) => {
            const chMeta = CHANNEL_META[tmpl.channel];
            const baseContent = tmpl.translations["en"]?.content || Object.values(tmpl.translations)[0]?.content || "";
            const translationKeys = Object.keys(tmpl.translations);

            return (
              <div
                key={tmpl.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  {/* Card Header: Channel & Code */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${chMeta.badgeClass}`}
                    >
                      <span>{chMeta.icon}</span>
                      <span>{chMeta.label}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {tmpl.code}
                      </span>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          tmpl.status === "active"
                            ? "bg-emerald-500"
                            : tmpl.status === "draft"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                        }`}
                        title={`Status: ${tmpl.status}`}
                      />
                    </div>
                  </div>

                  {/* Title & Category */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition line-clamp-1">
                    {tmpl.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    {CATEGORY_LABELS[tmpl.category] || tmpl.category}
                  </p>

                  {/* Message Preview Box */}
                  <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed font-sans">
                      {baseContent}
                    </p>
                  </div>

                  {/* Variables Used */}
                  {tmpl.variables && tmpl.variables.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                        Vars:
                      </span>
                      {tmpl.variables.slice(0, 4).map((v) => (
                        <span
                          key={v}
                          className="rounded-md bg-sky-50 px-1.5 py-0.5 font-mono text-[10px] text-sky-700 border border-sky-200/60"
                        >
                          &#123;&#123;{v}&#125;&#125;
                        </span>
                      ))}
                      {tmpl.variables.length > 4 && (
                        <span className="text-[10px] text-slate-400">
                          +{tmpl.variables.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Language Badges Row */}
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Translations ({translationKeys.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isAvailable = Boolean(tmpl.translations[lang.code]);
                        return (
                          <span
                            key={lang.code}
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              isAvailable
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 text-slate-400 opacity-40"
                            }`}
                            title={`${lang.name} (${lang.nativeName})`}
                          >
                            {lang.code}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] text-slate-400">
                    Used in <strong className="text-slate-700">{tmpl.usageCount}</strong> runs
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSimulatingTemplate(tmpl)}
                      className="inline-flex items-center gap-1 rounded-xl bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition"
                      title="Open interactive multi-device simulator"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Simulate
                    </button>

                    <button
                      onClick={() => handleEdit(tmpl)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                      title="Edit template"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => handleDuplicate(tmpl.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                      title="Duplicate template"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                    </button>

                    <button
                      onClick={() => handleDelete(tmpl)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      title="Delete template"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Template Table View */}
      {viewMode === "table" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5">Template Title</th>
                  <th className="px-4 py-3.5">Channel</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Languages</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTemplates.map((tmpl) => {
                  const chMeta = CHANNEL_META[tmpl.channel];
                  const langs = Object.keys(tmpl.translations);
                  return (
                    <tr key={tmpl.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {tmpl.code}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{tmpl.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{tmpl.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${chMeta.badgeClass}`}>
                          <span>{chMeta.icon}</span>
                          <span>{chMeta.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {CATEGORY_LABELS[tmpl.category]}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {langs.map((l) => (
                            <span key={l} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                              {l}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          tmpl.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          {tmpl.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSimulatingTemplate(tmpl)}
                            className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700 hover:bg-sky-100"
                          >
                            Simulate
                          </button>
                          <button
                            onClick={() => handleEdit(tmpl)}
                            className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDuplicate(tmpl.id)}
                            className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => handleDelete(tmpl)}
                            className="rounded-lg p-1 text-slate-400 hover:text-red-600"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 text-2xl">
            📑
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">No matching templates found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords, clearing channel filters, or create a brand new message template.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedChannel("all");
                setSelectedCategory("all");
                setSelectedStatus("all");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              Clear All Filters
            </button>
            <button
              onClick={handleCreateNew}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-sky-700 transition"
            >
              + Create Template
            </button>
          </div>
        </div>
      )}

      {/* Simulator Modal */}
      <TemplateSimulatorModal
        template={simulatingTemplate}
        isOpen={Boolean(simulatingTemplate)}
        onClose={() => setSimulatingTemplate(null)}
      />

      {/* Editor Modal */}
      <TemplateEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        initialTemplate={editingTemplate}
      />
    </div>
  );
};

export default TemplatesPage;
