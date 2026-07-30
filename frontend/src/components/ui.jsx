import React from "react";

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-amber-600 text-stone-950 hover:bg-amber-500",
    dark: "bg-stone-100 text-stone-950 hover:bg-white",
    outline: "border border-stone-700 text-stone-200 hover:border-amber-600 hover:text-amber-500",
    ghost: "text-stone-400 hover:text-stone-100",
    danger: "border border-red-900 text-red-500 hover:bg-red-950",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Field({ label, icon: Icon, hint, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-500">{label}</span>}
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />}
        <input
          className={`w-full border border-stone-700 bg-stone-900 py-2.5 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-600 ${
            Icon ? "pl-9 pr-3" : "px-3"
          }`}
          {...props}
        />
      </div>
      {hint && <span className="mt-1 block text-xs text-stone-600">{hint}</span>}
    </label>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-500">{label}</span>}
      <select
        className="w-full border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-100 outline-none focus:border-amber-600"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Badge({ children, tone = "amber" }) {
  const tones = {
    amber: "bg-amber-950 text-amber-400 border-amber-800",
    green: "bg-emerald-950 text-emerald-400 border-emerald-800",
    stone: "bg-stone-800 text-stone-300 border-stone-700",
    red: "bg-red-950 text-red-400 border-red-900",
  };
  return <span className={`border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${tones[tone]}`}>{children}</span>;
}

export function RazorStripe({ className = "" }) {
  return (
    <div
      className={`h-1 w-full ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(-45deg, #d97706 0px, #d97706 10px, #f5f5f4 10px, #f5f5f4 20px, #7f1d1d 20px, #7f1d1d 30px)",
      }}
    />
  );
}

export function Spinner({ className = "" }) {
  return (
    <div className={`h-5 w-5 animate-spin rounded-full border-2 border-stone-700 border-t-amber-500 ${className}`} />
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <p className="border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-400">{children}</p>;
}

export function EmptyState({ children }) {
  return <p className="border border-dashed border-stone-800 p-6 text-center text-sm text-stone-500">{children}</p>;
}

export function Avatar({ name, color = "amber", size = "md", className = "" }) {
  const initials = name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-12 w-12 text-lg", lg: "h-16 w-16 text-xl" };
  const colors = {
    amber: "bg-amber-700", stone: "bg-stone-700", red: "bg-red-900", emerald: "bg-emerald-800", blue: "bg-blue-900",
  };
  return (
    <div className={`flex items-center justify-center rounded-full font-bold text-stone-100 ${sizes[size]} ${colors[color] || colors.amber} ${className}`}>
      {initials}
    </div>
  );
}
