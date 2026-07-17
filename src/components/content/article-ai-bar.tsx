"use client";

import { useState } from "react";
import { Link2, Share2 } from "lucide-react";

function ChatGPTIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M9.20509 8.76511V6.50545C9.20509 6.31513 9.27649 6.17234 9.44293 6.0773L13.9861 3.46088C14.6046 3.10413 15.342 2.93769 16.103 2.93769C18.9573 2.93769 20.7651 5.14983 20.7651 7.50454C20.7651 7.67098 20.7651 7.86129 20.7412 8.05161L16.0316 5.2924C15.7462 5.12596 15.4607 5.12596 15.1753 5.2924L9.20509 8.76511ZM19.8135 17.5659V12.1664C19.8135 11.8333 19.6708 11.5955 19.3854 11.429L13.4152 7.95633L15.3656 6.83833C15.5321 6.74328 15.6749 6.74328 15.8413 6.83833L20.3845 9.45474C21.6928 10.216 22.5728 11.8333 22.5728 13.4031C22.5728 15.2108 21.5025 16.8758 19.8135 17.5657V17.5659ZM7.80173 12.8088L5.8513 11.6671C5.68486 11.5721 5.61346 11.4293 5.61346 11.239V6.00613C5.61346 3.46111 7.56389 1.53433 10.2042 1.53433C11.2033 1.53433 12.1307 1.86743 12.9159 2.46202L8.2301 5.17371C7.94475 5.34015 7.80195 5.57798 7.80195 5.91109V12.809L7.80173 12.8088ZM12 15.2349L9.20509 13.6651V10.3351L12 8.76534L14.7947 10.3351V13.6651L12 15.2349ZM13.7958 22.4659C12.7967 22.4659 11.8693 22.1328 11.0841 21.5382L15.7699 18.8265C16.0553 18.6601 16.198 18.4222 16.198 18.0891V11.1912L18.1723 12.3329C18.3388 12.4279 18.4102 12.5707 18.4102 12.761V17.9939C18.4102 20.5389 16.4359 22.4657 13.7958 22.4657V22.4659ZM8.15848 17.1617L3.61528 14.5452C2.30696 13.784 1.42701 12.1667 1.42701 10.5969C1.42701 8.76534 2.52115 7.12414 4.20987 6.43428V11.8574C4.20987 12.1905 4.35266 12.4284 4.63802 12.5948L10.5846 16.0436L8.63415 17.1617C8.46771 17.2567 8.32492 17.2567 8.15848 17.1617ZM7.897 21.0625C5.20919 21.0625 3.23488 19.0407 3.23488 16.5432C3.23488 16.3529 3.25875 16.1626 3.2824 15.9723L7.96817 18.6839C8.25352 18.8504 8.53911 18.8504 8.82446 18.6839L14.7947 15.2351V17.4948C14.7947 17.6851 14.7233 17.8279 14.5568 17.9229L10.0136 20.5393C9.39518 20.8961 8.6578 21.0625 7.89677 21.0625H7.897ZM13.7958 23.8929C16.6739 23.8929 19.0762 21.8474 19.6235 19.1357C22.2874 18.4459 24 15.9484 24 13.4034C24 11.7383 23.2865 10.121 22.002 8.95542C22.121 8.45588 22.1924 7.95633 22.1924 7.45702C22.1924 4.0557 19.4331 1.51045 16.2458 1.51045C15.6037 1.51045 14.9852 1.60549 14.3668 1.81968C13.2963 0.773071 11.8215 0.107086 10.2042 0.107086C7.32606 0.107086 4.92383 2.15256 4.37653 4.86425C1.7126 5.55411 0 8.05161 0 10.5966C0 12.2617 0.713506 13.879 1.99795 15.0446C1.87904 15.5441 1.80764 16.0436 1.80764 16.543C1.80764 19.9443 4.56685 22.4895 7.75421 22.4895C8.39632 22.4895 9.01478 22.3945 9.63324 22.1803C10.7035 23.2269 12.1783 23.8929 13.7958 23.8929Z" fill="white" />
    </svg>
  );
}
function ClaudeIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 248 248" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M52.4285 162.873L98.7844 136.879L99.5485 134.602L98.7844 133.334H96.4921L88.7237 132.862L62.2346 132.153L39.3113 131.207L17.0249 130.026L11.4214 128.844L6.2 121.873L6.7094 118.447L11.4214 115.257L18.171 115.847L33.0711 116.911L55.485 118.447L71.6586 119.392L95.728 121.873H99.5485L100.058 120.337L98.7844 119.392L97.7656 118.447L74.5877 102.732L49.4995 86.1905L36.3823 76.62L29.3779 71.7757L25.8121 67.2858L24.2839 57.3608L30.6515 50.2716L39.3113 50.8623L41.4763 51.4531L50.2636 58.1879L68.9842 72.7209L93.4357 90.6804L97.0015 93.6343L98.4374 92.6652L98.6571 91.9801L97.0015 89.2625L83.757 65.2772L69.621 40.8192L63.2534 30.6579L61.5978 24.632C60.9565 22.1032 60.579 20.0111 60.579 17.4246L67.8381 7.49965L71.9133 6.19995L81.7193 7.49965L85.7946 11.0443L91.9074 24.9865L101.714 46.8451L116.996 76.62L121.453 85.4816L123.873 93.6343L124.764 96.1155H126.292V94.6976L127.566 77.9197L129.858 57.3608L132.15 30.8942L132.915 23.4505L136.608 14.4708L143.994 9.62643L149.725 12.344L154.437 19.0788L153.8 23.4505L150.998 41.6463L145.522 70.1215L141.957 89.2625H143.994L146.414 86.7813L156.093 74.0206L172.266 53.698L179.398 45.6635L187.803 36.802L193.152 32.5484H203.34L210.726 43.6549L207.415 55.1159L196.972 68.3492L188.312 79.5739L175.896 96.2095L168.191 109.585L168.882 110.689L170.738 110.53L198.755 104.504L213.91 101.787L231.994 98.7149L240.144 102.496L241.036 106.395L237.852 114.311L218.495 119.037L195.826 123.645L162.07 131.592L161.696 131.893L162.137 132.547L177.36 133.925L183.855 134.279H199.774L229.447 136.524L237.215 141.605L241.8 147.867L241.036 152.711L229.065 158.737L213.019 154.956L175.45 145.977L162.587 142.787H160.805V143.85L171.502 154.366L191.242 172.089L215.82 195.011L217.094 200.682L213.91 205.172L210.599 204.699L188.949 188.394L180.544 181.069L161.696 165.118H160.422V166.772L164.752 173.152L187.803 207.771L188.949 218.405L187.294 221.832L181.308 223.959L174.813 222.777L161.187 203.754L147.305 182.486L136.098 163.345L134.745 164.2L128.075 235.42L125.019 239.082L117.887 241.8L111.902 237.31L108.718 229.984L111.902 215.452L115.722 196.547L118.779 181.541L121.58 162.873L123.291 156.636L123.14 156.219L121.773 156.449L107.699 175.752L86.304 204.699L69.3663 222.777L65.291 224.431L58.2867 220.768L58.9235 214.27L62.8713 208.48L86.304 178.705L100.44 160.155L109.551 149.507L109.462 147.967L108.959 147.924L46.6977 188.512L35.6182 189.93L30.7788 185.44L31.4156 178.115L33.7079 175.752L52.4285 162.873Z" fill="#D97757" />
    </svg>
  );
}
function GrokIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815" />
    </svg>
  );
}

type AIProvider = { id: string; label: string; icon: React.ReactNode; getUrl: (url: string) => string };

const AI_PROVIDERS: AIProvider[] = [
  { id: "chatgpt", label: "ChatGPT", icon: <ChatGPTIcon />, getUrl: (url) => `https://chat.openai.com/?q=${encodeURIComponent(`Read this article: ${url}`)}` },
  { id: "claude", label: "Claude", icon: <ClaudeIcon />, getUrl: (url) => `https://claude.ai/new?q=${encodeURIComponent(`Read this article: ${url}`)}` },
  { id: "grok", label: "Grok", icon: <GrokIcon />, getUrl: (url) => `https://grok.com/?q=${encodeURIComponent(`Read ${url}`)}` },
];

export function ArticleAITools({ blocks, title, url }: { blocks: any[]; title?: string; url?: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const currentUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  const copyText = (text: string, id: string) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, 999999);
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {}
    try { navigator.clipboard.writeText(text); } catch {}
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (blocks.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[1.2rem] border border-white/[0.08] bg-white/[0.02] px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">Ask AI</span>
        <span className="hidden sm:inline text-[11px] text-white/25">• link only</span>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {/* Copy link */}
        <div className="relative group">
          <button
            onClick={() => copyText(currentUrl, "copy-link")}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 text-[11px] font-medium text-white/70 hover:bg-white/[0.12] hover:text-white transition-colors"
          >
            <Link2 className="size-3.5" />
            {copied === "copy-link" ? "Copied" : "Copy link"}
          </button>
          <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-black/90 border border-white/10 px-2.5 py-1 text-[11px] text-white/80 group-hover:block z-50">
            {copied === "copy-link" ? "Copied!" : "Copy link"}
          </div>
        </div>

        {/* Share */}
        <div className="relative group">
          <button
            onClick={async () => {
              if ((navigator as any).share && currentUrl) {
                try { await (navigator as any).share({ title: title || document.title, url: currentUrl }); }
                catch { copyText(currentUrl, "share"); }
              } else {
                copyText(currentUrl, "share");
              }
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 text-[11px] font-medium text-white/70 hover:bg-white/[0.12] hover:text-white transition-colors"
          >
            <Share2 className="size-3.5" />
            {copied === "share" ? "Copied" : "Share"}
          </button>
          <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-black/90 border border-white/10 px-2.5 py-1 text-[11px] text-white/80 group-hover:block z-50">
            {copied === "share" ? "Copied!" : "Share article"}
          </div>
        </div>

        <div className="mx-1 h-4 w-px bg-white/10" />

        {/* AI - icon only, official logos, link only */}
        {AI_PROVIDERS.map((p) => (
          <div key={p.id} className="relative group">
            <button
              onClick={() => {
                copyText(currentUrl, p.id);
                window.open(p.getUrl(currentUrl), "_blank", "noopener,noreferrer");
              }}
              className="relative inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-[#1e1e1e] text-white/80 hover:bg-white/[0.12] hover:text-white hover:border-white/20 transition-all hover:scale-105 active:scale-95"
              aria-label={p.label}
            >
              {p.icon}
              {copied === p.id && <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-emerald-400 border-2 border-[#1e1e1e]" />}
            </button>
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-black/90 border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 group-hover:block z-50">
              {copied === p.id ? "Link copied!" : p.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
