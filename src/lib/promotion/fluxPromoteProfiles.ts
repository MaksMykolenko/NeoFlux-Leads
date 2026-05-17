export type FluxPromoteCompanyId = "neoflux-software" | "neoflux-games";

export type FluxPromoteProjectId =
  | "flux-leads"
  | "unitymcp"
  | "flux-id"
  | "fluxy-social"
  | "neoflux-software"
  | "custom-software-project"
  | "flux-marketplace"
  | "neoflux-games"
  | "flux-bionics"
  | "minecraft-related-projects"
  | "roblox-game-projects"
  | "custom-game-project";

export type FluxPromoteLanguage = "English" | "Ukrainian" | "Polish";

export interface CompanyProfile {
  id: FluxPromoteCompanyId;
  name: string;
  description: string;
  brandPositioning: string;
  targetAudiences: string[];
  projects: ProjectProfile[];
}

export interface ProjectProfile {
  id: FluxPromoteProjectId;
  companyId: FluxPromoteCompanyId;
  name: string;
  shortDescription: string;
  valueProposition: string;
  targetAudiences: string[];
  keywords: string[];
  suggestedPlatforms: string[];
  goals: string[];
  outreachAngles: string[];
  messageTypes: string[];
  defaultLanguages: FluxPromoteLanguage[];
  exampleMessages: string[];
  negativeTargets: string[];
  safetyNotes: string[];
}

const SHARED_SOFTWARE_SAFETY = [
  "Use targeted outreach only; do not mass-message unrelated people.",
  "Do not invent traction, revenue, users, customers, partnerships, or metrics.",
  "Manual review is required before any message is sent.",
];

const SHARED_GAMES_SAFETY = [
  "Respect community rules before posting or messaging.",
  "Do not promise unreleased features, revenue, or seller volume.",
  "Manual review is required before any message is sent.",
];

const softwareProjects: ProjectProfile[] = [
  {
    id: "flux-leads",
    companyId: "neoflux-software",
    name: "Flux Leads",
    shortDescription:
      "AI lead generation and audit-led outreach tool for web agencies, freelancers and SEO specialists.",
    valueProposition:
      "Find local businesses with weak websites, audit them, generate personalized cold emails and track leads in CRM.",
    targetAudiences: [
      "freelance web developers",
      "web design agencies",
      "SEO specialists",
      "WordPress developers",
      "Webflow developers",
      "Framer developers",
      "landing page creators",
      "local marketing agencies",
    ],
    keywords: [
      "web design agency",
      "freelance web designer",
      "WordPress freelancer",
      "SEO specialist",
      "Webflow developer",
      "Framer developer",
      "find web design clients",
      "lead generation for web agencies",
    ],
    suggestedPlatforms: ["General web", "LinkedIn", "X/Twitter", "Reddit/forums"],
    goals: [
      "get beta users",
      "get feedback",
      "find paying users",
      "find partners",
      "find affiliates",
    ],
    outreachAngles: [
      "help them find clients",
      "show weak websites in their city",
      "give free beta access",
      "help find first 20 leads",
    ],
    messageTypes: ["short email", "short DM", "beta tester invitation", "follow-up"],
    defaultLanguages: ["English", "Polish", "Ukrainian"],
    exampleMessages: [
      "Hey! I’m building Flux Leads — a tool that helps web freelancers find local businesses with weak websites, audit them and generate personalized outreach. I’m looking for beta users and can help you find your first 20 leads. Interested in testing it?",
    ],
    negativeTargets: ["local businesses looking for web design", "consumer mailing lists"],
    safetyNotes: SHARED_SOFTWARE_SAFETY,
  },
  {
    id: "unitymcp",
    companyId: "neoflux-software",
    name: "UnityMCP",
    shortDescription:
      "Open-source bridge between Unity Editor and AI assistants through Model Context Protocol.",
    valueProposition:
      "Let AI assistants inspect Unity scenes, manipulate objects, run C# code, control Play Mode and help automate Unity workflows.",
    targetAudiences: [
      "Unity developers",
      "game developers",
      "AI tooling developers",
      "open-source contributors",
      "technical creators",
      "Unity asset/tool creators",
      "Cursor/Claude power users",
    ],
    keywords: [
      "Unity developer AI tools",
      "Unity editor automation",
      "Unity MCP",
      "AI game development Unity",
      "Unity open source tools",
      "Unity tooling",
      "Unity Claude Cursor",
      "game dev automation",
    ],
    suggestedPlatforms: ["GitHub", "X/Twitter", "Reddit/forums", "Game dev communities"],
    goals: [
      "get GitHub stars",
      "get contributors",
      "get feedback",
      "get technical users",
      "get community mentions",
    ],
    outreachAngles: [
      "open-source Unity automation",
      "AI-assisted Unity workflows",
      "MCP integration for Unity",
      "useful tool for Unity developers using AI",
    ],
    messageTypes: ["short DM", "GitHub repo pitch", "community comment", "follow-up"],
    defaultLanguages: ["English", "Polish", "Ukrainian"],
    exampleMessages: [
      "Hey! I noticed you build Unity tools and share game dev workflows. I’m working on UnityMCP — an open-source bridge that lets AI assistants inspect and control Unity Editor through MCP. Thought it might be useful for AI-assisted Unity workflows. Would love your feedback if you try it.",
    ],
    negativeTargets: ["non-Unity game studios", "closed enterprise buyers only"],
    safetyNotes: SHARED_SOFTWARE_SAFETY,
  },
  {
    id: "flux-id",
    companyId: "neoflux-software",
    name: "Flux ID",
    shortDescription: "Unified identity system for the Flux ecosystem.",
    valueProposition:
      "One account across NeoFlux products with identity, reputation, 2FA, payments and ecosystem integrations.",
    targetAudiences: [
      "SaaS founders",
      "marketplace builders",
      "gaming platforms",
      "developer communities",
      "authentication tool users",
      "online community builders",
    ],
    keywords: [
      "marketplace authentication",
      "SaaS auth system",
      "gaming platform login",
      "identity API",
      "user reputation system",
      "2FA SaaS",
      "developer identity platform",
    ],
    suggestedPlatforms: ["General web", "LinkedIn", "GitHub"],
    goals: ["find partners", "get feedback", "find integration opportunities", "find developers"],
    outreachAngles: [
      "identity layer for marketplaces",
      "reputation and trust for digital commerce",
      "unified login for gaming/software ecosystem",
    ],
    messageTypes: ["short email", "partner pitch", "short DM", "follow-up"],
    defaultLanguages: ["English", "Polish", "Ukrainian"],
    exampleMessages: [
      "Hey! I’m building Flux ID as a unified account and reputation layer for NeoFlux products. It could be useful for marketplaces or communities that need identity, trust and payments in one ecosystem.",
    ],
    negativeTargets: ["consumer-only social apps", "companies not building account systems"],
    safetyNotes: SHARED_SOFTWARE_SAFETY,
  },
  {
    id: "fluxy-social",
    companyId: "neoflux-software",
    name: "Fluxy Social",
    shortDescription: "Social layer for gamers, sellers, creators and marketplace users.",
    valueProposition:
      "Profiles, reputation and social discovery around digital commerce and gaming communities.",
    targetAudiences: [
      "gaming communities",
      "digital sellers",
      "creators",
      "marketplace users",
      "Minecraft communities",
      "indie game communities",
    ],
    keywords: [
      "gaming social platform",
      "creator community",
      "marketplace social profiles",
      "Minecraft community",
      "seller reputation",
      "gamer profiles",
    ],
    suggestedPlatforms: ["X/Twitter", "Telegram/Discord communities", "Minecraft forums"],
    goals: ["get early users", "get community feedback", "find creators", "find sellers"],
    outreachAngles: [
      "social reputation for sellers",
      "community layer around digital products",
      "profiles for gamers and creators",
    ],
    messageTypes: ["short DM", "community comment", "launch post", "follow-up"],
    defaultLanguages: ["English", "Polish", "Ukrainian"],
    exampleMessages: [
      "Hey! I’m building Fluxy Social as a profile and reputation layer for gamers, creators and sellers around digital products. I’d love feedback from active community builders.",
    ],
    negativeTargets: ["unrelated consumer audiences", "communities that ban promotion"],
    safetyNotes: SHARED_SOFTWARE_SAFETY,
  },
  {
    id: "neoflux-software",
    companyId: "neoflux-software",
    name: "NeoFlux Software",
    shortDescription:
      "Main software brand for SaaS products, AI tools, automation, lead generation and developer infrastructure.",
    valueProposition:
      "Builds practical software products for digital businesses, automation and AI-assisted workflows.",
    targetAudiences: [
      "SaaS users",
      "founders",
      "agencies",
      "developers",
      "businesses needing automation",
    ],
    keywords: [
      "SaaS automation",
      "AI tools for business",
      "developer tools",
      "lead generation software",
      "digital business automation",
    ],
    suggestedPlatforms: ["General web", "LinkedIn", "X/Twitter"],
    goals: ["find partners", "get feedback", "find developers", "announce launch"],
    outreachAngles: [
      "practical AI-assisted workflows",
      "automation for digital businesses",
      "small engineering team building useful tools",
    ],
    messageTypes: ["short email", "short DM", "partner pitch", "launch post"],
    defaultLanguages: ["English", "Polish", "Ukrainian"],
    exampleMessages: [
      "Hey! I’m building NeoFlux Software as a small product studio for SaaS, AI tools and automation. I’d value feedback from people building digital businesses.",
    ],
    negativeTargets: ["enterprise-only procurement lists", "consumer mailing lists"],
    safetyNotes: SHARED_SOFTWARE_SAFETY,
  },
  {
    id: "custom-software-project",
    companyId: "neoflux-software",
    name: "Custom software project",
    shortDescription: "Custom NeoFlux Software project profile for internal promotion.",
    valueProposition:
      "Promote a specific NeoFlux Software product or experiment with targeted PR outreach.",
    targetAudiences: ["SaaS founders", "developers", "agencies", "automation users"],
    keywords: ["SaaS tool", "AI automation", "developer tool", "software product"],
    suggestedPlatforms: ["General web", "LinkedIn", "X/Twitter"],
    goals: ["get feedback", "find early adopters", "find partners"],
    outreachAngles: ["early product feedback", "targeted beta testing", "practical workflow value"],
    messageTypes: ["short email", "short DM", "follow-up"],
    defaultLanguages: ["English", "Polish", "Ukrainian"],
    exampleMessages: [
      "Hey! I’m testing a NeoFlux Software project and looking for targeted feedback from people in this space. Would you be open to a quick look?",
    ],
    negativeTargets: ["unrelated audiences", "bought email lists"],
    safetyNotes: SHARED_SOFTWARE_SAFETY,
  },
];

const gamesProjects: ProjectProfile[] = [
  {
    id: "flux-marketplace",
    companyId: "neoflux-games",
    name: "Flux MarketPlace",
    shortDescription: "Marketplace for Minecraft servers and digital goods.",
    valueProposition:
      "Sell Minecraft server products and digital goods with automated delivery, payments and seller tools.",
    targetAudiences: [
      "Minecraft server owners",
      "Minecraft plugin developers",
      "Minecraft sellers",
      "BuiltByBit users",
      "SpigotMC users",
      "server monetization communities",
      "gaming communities",
    ],
    keywords: [
      "Minecraft server owner",
      "Minecraft server monetization",
      "Minecraft donation store",
      "SpigotMC seller",
      "BuiltByBit Minecraft",
      "Minecraft plugin developer",
      "Minecraft server shop",
      "Minecraft digital goods",
    ],
    suggestedPlatforms: [
      "Minecraft forums",
      "Telegram/Discord communities",
      "Reddit/forums",
      "General web",
    ],
    goals: [
      "find early sellers",
      "find server owners",
      "get beta users",
      "find partners",
      "find communities",
    ],
    outreachAngles: [
      "early seller benefits",
      "Minecraft server monetization",
      "automatic delivery",
      "marketplace for server products",
    ],
    messageTypes: ["seller invitation", "short DM", "community comment", "follow-up"],
    defaultLanguages: ["English", "Polish", "Ukrainian"],
    exampleMessages: [
      "Hey! I’m building Flux MarketPlace — a marketplace for Minecraft server owners and sellers, with automatic delivery for digital products. I’m looking for early sellers/server owners to test the beta. Would you be interested in checking it out?",
    ],
    negativeTargets: ["unrelated game communities", "players not involved in servers or selling"],
    safetyNotes: SHARED_GAMES_SAFETY,
  },
  {
    id: "neoflux-games",
    companyId: "neoflux-games",
    name: "NeoFlux Games",
    shortDescription:
      "Game development brand for indie games, Minecraft ecosystem products and gaming communities.",
    valueProposition:
      "Builds gaming products, mods, marketplaces and communities.",
    targetAudiences: [
      "gamers",
      "indie game fans",
      "game developers",
      "Minecraft communities",
      "gaming creators",
    ],
    keywords: [
      "indie game community",
      "Minecraft ecosystem",
      "game development brand",
      "gaming creators",
      "game marketplace",
    ],
    suggestedPlatforms: ["Game dev communities", "X/Twitter", "Telegram/Discord communities"],
    goals: ["get feedback", "find creators", "find communities", "announce launch"],
    outreachAngles: [
      "new gaming ecosystem products",
      "community-first game development",
      "Minecraft and indie game tools",
    ],
    messageTypes: ["short DM", "launch post", "community comment", "follow-up"],
    defaultLanguages: ["English", "Polish", "Ukrainian"],
    exampleMessages: [
      "Hey! I’m building NeoFlux Games around indie games, Minecraft products and gaming communities. I’d value feedback from people active in this space.",
    ],
    negativeTargets: ["non-gaming audiences", "communities that disallow launches"],
    safetyNotes: SHARED_GAMES_SAFETY,
  },
  {
    id: "flux-bionics",
    companyId: "neoflux-games",
    name: "Flux Bionics",
    shortDescription:
      "Minecraft mod focused on bionics, cybernetic implants and advanced gameplay systems.",
    valueProposition:
      "Cybernetic implants, new progression systems and futuristic gameplay for Minecraft.",
    targetAudiences: [
      "Minecraft mod players",
      "modded Minecraft communities",
      "NeoForge users",
      "Minecraft mod developers",
      "cyberpunk-themed mod fans",
      "gaming content creators",
    ],
    keywords: [
      "Minecraft cyberpunk mod",
      "NeoForge mod",
      "Minecraft implants mod",
      "Minecraft bionics",
      "modded Minecraft",
      "Minecraft technology mod",
      "Minecraft RPG mod",
    ],
    suggestedPlatforms: ["Minecraft forums", "YouTube", "Reddit/forums", "Telegram/Discord communities"],
    goals: ["get mod testers", "get feedback", "find content creators", "find community mentions"],
    outreachAngles: [
      "cyberpunk-style implants in Minecraft",
      "mod testing",
      "unique progression system",
      "content for modded Minecraft creators",
    ],
    messageTypes: ["beta tester invitation", "short DM", "community comment", "follow-up"],
    defaultLanguages: ["English", "Polish", "Ukrainian"],
    exampleMessages: [
      "Hey! I’m working on Flux Bionics, a Minecraft mod around cybernetic implants and futuristic progression. I’m looking for testers and modded Minecraft feedback.",
    ],
    negativeTargets: ["vanilla-only communities that ban mods", "unrelated gaming groups"],
    safetyNotes: SHARED_GAMES_SAFETY,
  },
  {
    id: "minecraft-related-projects",
    companyId: "neoflux-games",
    name: "Minecraft-related projects",
    shortDescription: "Minecraft ecosystem projects from NeoFlux Games.",
    valueProposition:
      "Promote Minecraft products, mods, server tooling or marketplace experiments.",
    targetAudiences: [
      "Minecraft server owners",
      "Minecraft plugin developers",
      "modded Minecraft communities",
      "Minecraft creators",
    ],
    keywords: [
      "Minecraft server tools",
      "Minecraft plugin",
      "Minecraft mod",
      "Minecraft marketplace",
    ],
    suggestedPlatforms: ["Minecraft forums", "Telegram/Discord communities", "Reddit/forums"],
    goals: ["get feedback", "find communities", "find creators", "find early adopters"],
    outreachAngles: [
      "Minecraft ecosystem tooling",
      "server/community value",
      "early tester feedback",
    ],
    messageTypes: ["short DM", "community comment", "beta tester invitation"],
    defaultLanguages: ["English", "Polish", "Ukrainian"],
    exampleMessages: [
      "Hey! I’m testing a Minecraft-related NeoFlux Games project and looking for feedback from server owners, plugin developers and active communities.",
    ],
    negativeTargets: ["unrelated games", "communities that forbid self-promotion"],
    safetyNotes: SHARED_GAMES_SAFETY,
  },
  {
    id: "roblox-game-projects",
    companyId: "neoflux-games",
    name: "Roblox/game projects",
    shortDescription: "Roblox and broader game experiments from NeoFlux Games.",
    valueProposition:
      "Promote game concepts, testing opportunities and community-driven releases.",
    targetAudiences: [
      "Roblox creators",
      "game developers",
      "gaming communities",
      "content creators",
    ],
    keywords: ["Roblox creator", "Roblox developer", "indie game testing", "game community"],
    suggestedPlatforms: ["YouTube", "X/Twitter", "Telegram/Discord communities"],
    goals: ["get feedback", "find creators", "find testers", "announce launch"],
    outreachAngles: ["early testing", "creator feedback", "community-first launch"],
    messageTypes: ["short DM", "launch post", "beta tester invitation", "follow-up"],
    defaultLanguages: ["English", "Polish", "Ukrainian"],
    exampleMessages: [
      "Hey! I’m testing a NeoFlux Games project and looking for creator/community feedback before launch. Would you be open to checking it out?",
    ],
    negativeTargets: ["unrelated business audiences", "communities that ban promotion"],
    safetyNotes: SHARED_GAMES_SAFETY,
  },
  {
    id: "custom-game-project",
    companyId: "neoflux-games",
    name: "Custom game project",
    shortDescription: "Custom NeoFlux Games project profile for internal promotion.",
    valueProposition:
      "Promote a specific game, mod, marketplace or community experiment with targeted PR outreach.",
    targetAudiences: ["gamers", "game developers", "gaming creators", "gaming communities"],
    keywords: ["game beta", "gaming community", "indie game", "game creator"],
    suggestedPlatforms: ["Game dev communities", "YouTube", "X/Twitter", "Telegram/Discord communities"],
    goals: ["get feedback", "find creators", "find beta users", "announce launch"],
    outreachAngles: ["early game feedback", "community testing", "creator-first launch"],
    messageTypes: ["short DM", "beta tester invitation", "community comment"],
    defaultLanguages: ["English", "Polish", "Ukrainian"],
    exampleMessages: [
      "Hey! I’m testing a NeoFlux Games project and looking for feedback from active gaming communities before launch.",
    ],
    negativeTargets: ["unrelated SaaS audiences", "bought email lists"],
    safetyNotes: SHARED_GAMES_SAFETY,
  },
];

export const FLUX_PROMOTE_COMPANIES: CompanyProfile[] = [
  {
    id: "neoflux-software",
    name: "NeoFlux Software",
    description:
      "Software company building SaaS, AI tools, developer tools, automation systems and digital infrastructure for online businesses.",
    brandPositioning:
      "Practical software products for digital businesses, automation, AI-assisted workflows and developer infrastructure.",
    targetAudiences: [
      "SaaS founders",
      "web agencies",
      "freelance developers",
      "startup founders",
      "automation users",
      "AI tooling users",
      "marketplace builders",
      "developer communities",
    ],
    projects: softwareProjects,
  },
  {
    id: "neoflux-games",
    name: "NeoFlux Games",
    description:
      "Game development and gaming ecosystem brand focused on games, Minecraft-related products, digital marketplaces and gaming communities.",
    brandPositioning:
      "Gaming products, mods, marketplaces and community infrastructure for Minecraft and indie game ecosystems.",
    targetAudiences: [
      "gamers",
      "game developers",
      "Minecraft server owners",
      "Minecraft plugin developers",
      "gaming communities",
      "indie game communities",
      "server monetization communities",
      "digital item sellers",
    ],
    projects: gamesProjects,
  },
];

export const FLUX_PROMOTE_PROJECTS = FLUX_PROMOTE_COMPANIES.flatMap(
  (company) => company.projects,
);

export const FLUX_PROMOTE_GOALS = [
  "Get beta users",
  "Get feedback",
  "Find partners",
  "Find sellers",
  "Find developers",
  "Find creators",
  "Get GitHub stars",
  "Find communities",
  "Announce launch",
  "Find early adopters",
] as const;

export const FLUX_PROMOTE_CHANNELS = [
  "General web",
  "X/Twitter",
  "LinkedIn",
  "Reddit/forums",
  "GitHub",
  "YouTube",
  "Telegram/Discord communities",
  "Minecraft forums",
  "Game dev communities",
] as const;

export const FLUX_PROMOTE_REGIONS = [
  "Global",
  "Poland",
  "Ukraine",
  "English-speaking",
  "Custom",
] as const;

export const FLUX_PROMOTE_CTAS = [
  "Try beta",
  "Give feedback",
  "Star GitHub repo",
  "Join waitlist",
  "Become early seller",
  "Test integration",
  "Join community",
  "Book a quick call",
] as const;

export const FLUX_PROMOTE_TONES = [
  "Friendly",
  "Technical",
  "Direct",
  "Soft",
  "Build-in-public",
  "Community-first",
] as const;

export const FLUX_PROMOTE_MESSAGE_TYPES = [
  "Email",
  "DM",
  "Social post",
  "Community comment",
  "Follow-up",
  "Launch post",
  "Partner pitch",
  "Seller invitation",
  "Beta tester invitation",
  "GitHub repo pitch",
] as const;

export function getFluxPromoteCompany(
  companyId: string,
): CompanyProfile | null {
  return FLUX_PROMOTE_COMPANIES.find((company) => company.id === companyId) ?? null;
}

export function getFluxPromoteProject(
  projectId: string,
): ProjectProfile | null {
  return FLUX_PROMOTE_PROJECTS.find((project) => project.id === projectId) ?? null;
}

export function getFluxPromoteProjectsForCompany(
  companyId: string,
): ProjectProfile[] {
  const company = getFluxPromoteCompany(companyId);
  return company?.projects ?? [];
}

export function isFluxPromoteCompanyId(
  value: string,
): value is FluxPromoteCompanyId {
  return FLUX_PROMOTE_COMPANIES.some((company) => company.id === value);
}

export function isFluxPromoteProjectForCompany(
  projectId: string,
  companyId: string,
): boolean {
  const project = getFluxPromoteProject(projectId);
  return project?.companyId === companyId;
}
