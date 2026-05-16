/* global React, LeadList, LeadDetail */
const { createElement: h, useState, useEffect } = React;

const PLANS = {
  STARTER: { id: "STARTER", name: "Starter", leadsPerMonth: 50 },
  PRO:     { id: "PRO",     name: "Pro",     leadsPerMonth: 500 },
  AGENCY:  { id: "AGENCY",  name: "Agency",  leadsPerMonth: Infinity }
};

function App() {
  const [allLeads, setAllLeads] = useState(() => {
    const beats = (window.SEED.beatClients || []).map((l) => ({ ...l, _mode: "beats" }));
    const universal = (window.SEED.universalLeads || []).map((l) => ({ ...l, _mode: "universal" }));
    return [
      ...window.SEED.leads.map((l) => ({ ...l, _mode: "local" })),
      ...beats,
      ...universal
    ];
  });
  const [mode, setMode]   = useState("local");
  const [view, setView]   = useState("table");
  const [route, setRoute] = useState({ name: "list" });
  const [theme, setTheme] = useState(() => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });
  const [locale, setLocale] = useState("uk");

  const user = { displayName: "Макс Миколенко", email: "maks@neoflux.dev" };
  const plan = PLANS.PRO;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => t === "dark" ? "light" : "dark");
  }

  const leads = allLeads.filter((l) => l._mode === mode);

  function updateLead(id, patch) {
    setAllLeads((ls) => ls.map((l) => l.id === id
      ? { ...l, ...patch, updatedAt: new Date().toISOString() }
      : l
    ));
  }

  function handleSearch(query, city) {
    const now = new Date().toISOString();
    const fresh = [
      { id: `n${Date.now()}-1`, companyName: `Стоматологія "Усмішка"`, city, category: query },
      { id: `n${Date.now()}-2`, companyName: `Dental Studio "32"`,     city, category: query },
      { id: `n${Date.now()}-3`, companyName: `Стоматологія "Імплант"`, city, category: query }
    ].map((b) => ({
      ...b,
      website: null, email: null, phone: "+380 67 000 00 00",
      source: "Web search (AI)", status: "New",
      createdAt: now, updatedAt: now, audit: null, messages: [],
      _mode: "local"
    }));
    setAllLeads((ls) => [...fresh, ...ls]);
    return fresh.length;
  }

  function handleUniversalSearch(prompt) {
    const now = new Date().toISOString();
    const fresh = [
      { id: `u${Date.now()}-1`, companyName: "Podcast «Маркетинг у голові»", notes: prompt.slice(0, 80) },
      { id: `u${Date.now()}-2`, companyName: "Tedx Cherkasy",                notes: prompt.slice(0, 80) }
    ].map((b) => ({
      ...b,
      category: null, city: null,
      website: null, email: null, phone: null,
      source: "Universal AI", status: "New",
      createdAt: now, updatedAt: now, audit: null, messages: [],
      _mode: "universal"
    }));
    setAllLeads((ls) => [...fresh, ...ls]);
    return fresh.length;
  }

  function handleAudit(id) {
    updateLead(id, {
      audit: {
        performanceScore: 41 + Math.floor(Math.random() * 40),
        hasSSL: Math.random() > 0.3,
        mobileFriendly: Math.random() > 0.5,
        issues: ["Час завантаження > 3 секунди.", "Відсутня <h1> на головній сторінці."]
      }
    });
  }

  function handleStatus(id, next) {
    updateLead(id, { status: next });
  }

  function handleSaveMessage(id, { subject, body }) {
    setAllLeads((ls) => ls.map((l) => l.id === id ? {
      ...l,
      status: "Contacted",
      messages: [{
        id: `m-${Date.now()}`,
        subject, body,
        sentAt: new Date().toISOString(),
        replyStatus: "No Reply"
      }, ...l.messages]
    } : l));
  }

  function handleBeatSent(payload) {
    const now = new Date().toISOString();
    setAllLeads((ls) => {
      const idx = ls.findIndex((l) => l._mode === "beats" && l.companyName === payload.handle);
      const msg = {
        id: `m-${Date.now()}`,
        subject: payload.subject, body: payload.body,
        sentAt: now, replyStatus: "No Reply",
        demoName: payload.demoName
      };
      if (idx >= 0) {
        const next = [...ls];
        next[idx] = { ...next[idx], status: "Contacted", updatedAt: now, messages: [msg, ...next[idx].messages] };
        return next;
      }
      return [{
        id: `bn-${Date.now()}`,
        companyName: payload.handle,
        realName: payload.realName,
        category: payload.genre,
        city: null, website: null,
        email: payload.email, phone: null,
        source: payload.platform, status: "Contacted",
        createdAt: now, updatedAt: now,
        audit: null, messages: [msg],
        audience: { platform: payload.platform, followers: payload.followers, monthlyListeners: 0, lastUploadDays: 0 },
        lookingForType: true,
        genre: [payload.genre],
        _mode: "beats"
      }, ...ls];
    });
  }

  if (route.name === "detail") {
    const lead = allLeads.find((l) => l.id === route.id);
    if (!lead) {
      setTimeout(() => setRoute({ name: "list" }), 0);
      return null;
    }
    return h(LeadDetail, {
      lead,
      user, plan,
      theme, onThemeToggle: toggleTheme,
      locale, onLocaleChange: setLocale,
      onBack: () => setRoute({ name: "list" }),
      onStatusChange: (s) => handleStatus(lead.id, s),
      onRunAudit: () => handleAudit(lead.id),
      onSaveMessage: (m) => handleSaveMessage(lead.id, m)
    });
  }

  return h(LeadList, {
    leads: leads.slice(0, 12),
    allLeads,
    mode, view,
    onModeChange: setMode,
    onViewChange: setView,
    onOpen: (id) => setRoute({ name: "detail", id }),
    onAudit: handleAudit,
    onSearch: handleSearch,
    onUniversalSearch: handleUniversalSearch,
    onBeatSent: handleBeatSent,
    onChangeStatus: handleStatus,
    user, plan,
    theme, onThemeToggle: toggleTheme,
    locale, onLocaleChange: setLocale
  });
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(h(App));
