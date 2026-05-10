/* global React */
const { createElement: h } = React;

// =================================================================
// Heroicons — the only icon system in the product. Inline SVG.
// Mini = 20×20 fill. Outline = 24×24 stroke=1.5. Match Heroicons.
// =================================================================

const mini = (path) => ({ className = "w-4 h-4", ...rest } = {}) =>
  h("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    className,
    "aria-hidden": "true",
    ...rest
  }, h("path", { fillRule: "evenodd", clipRule: "evenodd", d: path }));

const outline = (path) => ({ className = "w-6 h-6", ...rest } = {}) =>
  h("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    className,
    "aria-hidden": "true",
    ...rest
  }, h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: path }));

const ChevronLeft = mini("M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z");
const ChevronDown = mini("M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z");
const Check       = mini("M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z");
const X           = mini("M5.47 5.47a.75.75 0 0 1 1.06 0L10 8.94l3.47-3.47a.75.75 0 1 1 1.06 1.06L11.06 10l3.47 3.47a.75.75 0 1 1-1.06 1.06L10 11.06l-3.47 3.47a.75.75 0 0 1-1.06-1.06L8.94 10 5.47 6.53a.75.75 0 0 1 0-1.06Z");
const Sparkle     = mini("M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z");
const Clipboard   = mini("M15.988 3.012A2.25 2.25 0 0 1 18 5.25v6.5A2.25 2.25 0 0 1 15.75 14H13.5v-3.75A2.75 2.75 0 0 0 10.75 7.5H7v-2.25c0-1.21.92-2.205 2.099-2.235l.022-.001A.75.75 0 0 1 9.25 3h6a.75.75 0 0 1 .738.012Z");
const Save        = mini("M3.75 3A1.75 1.75 0 0 0 2 4.75v10.5C2 16.216 2.784 17 3.75 17h12.5A1.75 1.75 0 0 0 18 15.25V8.336c0-.464-.184-.909-.513-1.236l-4.587-4.587A1.75 1.75 0 0 0 11.664 2H3.75ZM6 5.75A.75.75 0 0 1 6.75 5h5a.75.75 0 0 1 0 1.5h-5A.75.75 0 0 1 6 5.75ZM10 11a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z");

const SearchOutline   = outline("M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z");
const DocumentOutline = outline("M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.42 48.42 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586M8.25 8.25H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z");
const EnvelopeOutline = outline("M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75");

function Spinner({ className = "h-4 w-4" }) {
  return h("svg", {
    className: `${className} animate-spin`,
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    "aria-hidden": "true"
  }, [
    h("circle", { key: "c", className: "opacity-25", cx: 12, cy: 12, r: 10, stroke: "currentColor", strokeWidth: 4 }),
    h("path", { key: "p", className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })
  ]);
}

Object.assign(window, {
  ChevronLeft, ChevronDown, Check, X, Sparkle, Clipboard, Save,
  SearchOutline, DocumentOutline, EnvelopeOutline, Spinner
});
