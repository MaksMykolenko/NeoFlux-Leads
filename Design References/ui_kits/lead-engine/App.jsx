/* global React, LeadList, LeadDetail */
const { createElement: h, useState } = React;

function App() {
  const [allLeads, setAllLeads] = useState(() => [
    ...window.SEED.leads.map((l) => ({ ...l, _mode: "local" })),
    ...(window.SEED.beatClients || []).map((l) => ({ ...l, _mode: "beats" }))
  ]);
  const [mode, setMode]   = useState("local");
  const [route, setRoute] = useState({ name: "list" });

  const leads = allLeads.filter((l) => l._mode === mode);
  const setLeads = (updater) => setAllLeads((all) => {
    const next = typeof updater === "function"
      ? updater(all.filter((l) => l._mode === mode))
      : updater;
    const others = all.filter((l) => l._mode !== mode);
    return [...next.map((l) => ({ ...l, _mode: l._mode || mode })), ...others];
  });

  function updateLead(id, patch) {
    setAllLeads((ls) => ls.map((l) => l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l));
  }

  function handleSearch(query, _city) {
    // Pretend the scrape returned 3 freshly-discovered leads.
    const fresh = [
      { companyName: `Стоматологія "Усмішка"`, city: _city, category: query },
      { companyName: `Dental Studio "32"`,     city: _city, category: query },
      { companyName: `Стоматологія "Імплант"`, city: _city, category: query }
    ];
    const now = new Date().toISOString();
    const newLeads = fresh.map((f, i) => ({
      id: `n${Date.now()}-${i}`,
      companyName: f.companyName,
      category: f.category,
      city: f.city,
      website: null,
      email: null,
      phone: "+380 67 000 00 00",
      source: "Google Maps",
      status: "New",
      createdAt: now,
      updatedAt: now,
      audit: null,
      messages: []
    }));
    setLeads((ls) => [...newLeads, ...ls]);
    return fresh.length;
  }

  function handleAudit(id) {
    updateLead(id, {
      audit: {
        performanceScore: 41 + Math.floor(Math.random() * 40),
        hasSSL: Math.random() > 0.3,
        mobileFriendly: Math.random() > 0.5,
        issues: [
          "Час завантаження > 3 секунди.",
          "Відсутня <h1> на головній сторінці."
        ]
      }
    });
  }

  function handleStatus(id, next) {
    updateLead(id, { status: next });
  }

  function handleSaveMessage(id, { subject, body }) {
    setLeads((ls) => ls.map((l) => l.id === id ? {
      ...l,
      status: "Contacted",
      messages: [{
        id: `m-${Date.now()}`,
        subject,
        body,
        sentAt: new Date().toISOString(),
        replyStatus: "No Reply"
      }, ...l.messages]
    } : l));
  }

  function handleBeatSent(payload) {
    // Add (or upsert by handle) a lead in "Contacted" status with the message saved.
    const now = new Date().toISOString();
    setAllLeads((ls) => {
      const idx = ls.findIndex((l) => l._mode === "beats" && l.companyName === payload.handle);
      const msg = {
        id: `m-${Date.now()}`,
        subject: payload.subject,
        body: payload.body,
        sentAt: now,
        replyStatus: "No Reply",
        demoName: payload.demoName
      };
      if (idx >= 0) {
        const next = [...ls];
        next[idx] = {
          ...next[idx],
          status: "Contacted",
          updatedAt: now,
          messages: [msg, ...next[idx].messages]
        };
        return next;
      }
      return [{
        id: `bn-${Date.now()}`,
        companyName: payload.handle,
        realName: payload.realName,
        category: payload.genre,
        city: null,
        website: null,
        email: payload.email,
        phone: null,
        source: payload.platform,
        status: "Contacted",
        createdAt: now,
        updatedAt: now,
        audit: null,
        messages: [msg],
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
      onBack: () => setRoute({ name: "list" }),
      onStatusChange: (s) => handleStatus(lead.id, s),
      onRunAudit: () => handleAudit(lead.id),
      onSaveMessage: (m) => handleSaveMessage(lead.id, m)
    });
  }

  return h(LeadList, {
    leads: leads.slice(0, 12),
    mode,
    onModeChange: setMode,
    onOpen: (id) => setRoute({ name: "detail", id }),
    onAudit: handleAudit,
    onSearch: handleSearch,
    onBeatSearch: handleBeatSent
  });
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(h(App));
