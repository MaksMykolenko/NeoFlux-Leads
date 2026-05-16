/* global React */
const { createElement: h, useState, useEffect } = React;

// =================================================================
// AuthHeader — sticky top bar (light + dark)
// =================================================================

function AuthHeader({ user, plan, locale, onLocaleChange, theme, onThemeToggle }) {
  return h("header", {
    className: "sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-flux-border dark:bg-flux-bg/80 dark:supports-[backdrop-filter]:bg-flux-bg/70"
  },
    h("div", { className: "mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8" }, [
      // Brand
      h("a", {
        key: "brand",
        href: "#",
        onClick: (e) => e.preventDefault(),
        className: "group flex flex-shrink-0 items-center gap-3 rounded-md py-1 text-zinc-900 transition-all duration-200 hover:opacity-90 dark:text-flux-text"
      }, [
        h("span", {
          key: "mark",
          className: "inline-flex h-9 w-9 shrink-0 rounded-xl shadow-[0_0_15px_rgba(106,0,255,0.5)] transition-all duration-200"
        }, h("img", {
          src: "../../assets/logo-mark.svg",
          alt: "",
          className: "h-full w-full"
        })),
        h("span", {
          key: "name",
          className: "hidden whitespace-nowrap text-base font-bold tracking-tight sm:inline"
        }, "Flux Leads")
      ]),

      // Actions + profile
      h("div", { key: "actions", className: "flex min-w-0 items-center gap-2" }, [
        // Theme toggle
        h("button", {
          key: "theme",
          type: "button",
          onClick: onThemeToggle,
          title: theme === "dark" ? "Перемкнути на світлу тему" : "Перемкнути на темну тему",
          className: "inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        }, theme === "dark"
            ? h("svg", { viewBox: "0 0 20 20", fill: "currentColor", className: "h-4 w-4" },
                h("path", { d: "M10 2.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM10 14.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM3.5 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3.5 10ZM14.25 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75ZM5.05 5.05a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06L5.05 6.11a.75.75 0 0 1 0-1.06ZM12.83 12.83a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM5.05 14.95a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 0 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0ZM12.83 7.17a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 0 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0ZM10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" })
              )
            : h("svg", { viewBox: "0 0 20 20", fill: "currentColor", className: "h-4 w-4" },
                h("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M7.455 2.005a.75.75 0 0 1 .272.86 7 7 0 0 0 9.408 9.408.75.75 0 0 1 .96 1.06A8.5 8.5 0 1 1 6.394 1.044a.75.75 0 0 1 1.06.96Z" })
              )
        ),

        // Lang switcher
        h(LanguageSwitcher, { key: "lang", locale, onChange: onLocaleChange }),

        // Plan pill
        h("a", {
          key: "plan",
          href: "#",
          onClick: (e) => e.preventDefault(),
          title: plan.name,
          className: "hidden h-8 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 active:scale-95 dark:border-flux-border dark:bg-flux-card dark:text-flux-text dark:hover:border-flux-purple/40 dark:hover:bg-flux-purple-tint dark:hover:text-flux-purple-soft md:inline-flex"
        }, [
          h("span", { key: "dot", className: "inline-flex h-1.5 w-1.5 rounded-full bg-flux-purple" }),
          plan.name
        ]),

        h("span", { key: "divider", className: "mx-1 hidden h-5 w-px bg-zinc-200 dark:bg-flux-border-strong md:inline-block" }),

        // Avatar
        h("a", {
          key: "avatar",
          href: "#",
          onClick: (e) => e.preventDefault(),
          className: "group flex min-w-0 items-center gap-2 rounded-md py-1 pl-1 pr-1.5 text-left transition-all duration-200 hover:bg-zinc-100 active:scale-95 dark:hover:bg-flux-card"
        }, [
          h("div", {
            key: "av",
            className: "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-[11px] font-semibold uppercase text-purple-700 ring-1 ring-purple-200 dark:bg-flux-purple-tint dark:text-flux-purple-soft dark:ring-flux-purple-ring"
          }, initials(user.displayName)),
          h("div", { key: "name", className: "hidden min-w-0 lg:block" }, [
            h("div", { key: "n", className: "truncate text-sm font-medium leading-tight text-zinc-900 dark:text-flux-text" }, user.displayName),
            h("div", { key: "e", className: "truncate text-[11px] leading-tight text-zinc-500 dark:text-flux-muted" }, user.email)
          ])
        ]),

        // Gear
        h("button", {
          key: "gear",
          type: "button",
          title: "Налаштування",
          className: "inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:text-flux-muted dark:hover:bg-flux-card dark:hover:text-flux-text"
        }, h("svg", { width: 16, height: 16, viewBox: "0 0 20 20", fill: "currentColor" },
            h("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" })
          )
        ),

        // Sign out
        h("button", {
          key: "logout",
          type: "button",
          title: "Sign out",
          className: "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-zinc-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 active:scale-95 dark:text-flux-muted dark:hover:bg-red-500/10 dark:hover:text-red-400 sm:px-3 sm:text-zinc-700 sm:dark:text-zinc-300"
        }, [
          h("svg", { key: "i", width: 14, height: 14, viewBox: "0 0 20 20", fill: "currentColor" }, [
            h("path", { key: 1, fillRule: "evenodd", clipRule: "evenodd", d: "M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" }),
            h("path", { key: 2, fillRule: "evenodd", clipRule: "evenodd", d: "M19 10a.75.75 0 0 0-.22-.53l-3-3a.75.75 0 1 0-1.06 1.06l1.72 1.72H8.75a.75.75 0 0 0 0 1.5h7.69l-1.72 1.72a.75.75 0 1 0 1.06 1.06l3-3A.75.75 0 0 0 19 10Z" })
          ]),
          h("span", { key: "t", className: "hidden sm:inline" }, "Sign out")
        ])
      ])
    ])
  );
}

function LanguageSwitcher({ locale, onChange }) {
  return h("div", {
    role: "group",
    "aria-label": "Locale",
    className: "inline-flex h-8 items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 p-0.5 dark:border-flux-border dark:bg-flux-card"
  }, ["uk", "en"].map((loc) => {
    const active = locale === loc;
    return h("button", {
      key: loc,
      type: "button",
      onClick: () => onChange(loc),
      className: `inline-flex h-7 min-w-[28px] items-center justify-center rounded px-2 text-[11px] font-medium uppercase tracking-wider transition-all duration-200 ${
        active
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      }`
    }, loc);
  }));
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("");
}

Object.assign(window, { AuthHeader, LanguageSwitcher });
