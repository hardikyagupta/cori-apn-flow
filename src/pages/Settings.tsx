import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Palette, SlidersHorizontal, Sparkles, UserRound,
  Blocks, Bell, ShieldCheck, Cog, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useAtmosphere } from '@/contexts/AtmosphereContext';
import { useTheme } from '../../components/theme-provider';

const FONT = { fontFamily: 'Manrope, sans-serif' } as const;
// Matches the homepage sidebar's icon slot so the logo lands in the same spot.
const ICON_SLOT = 'flex items-center justify-center w-[40px] h-[40px] shrink-0';

type NavItem = { id: string; label: string; icon: React.ComponentType<{ className?: string }> };
const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: 'APPEARANCE', items: [
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'general', label: 'General', icon: SlidersHorizontal },
  ] },
  { title: 'INTELLIGENCE', items: [
    { id: 'model', label: 'Model & behavior', icon: Sparkles },
    { id: 'personalization', label: 'Memory & personalization', icon: UserRound },
  ] },
  { title: 'CAPABILITIES', items: [
    { id: 'tools', label: 'Tools & integrations', icon: Blocks },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] },
  { title: 'SECURITY', items: [
    { id: 'privacy', label: 'Privacy & data', icon: ShieldCheck },
    { id: 'advanced', label: 'Advanced', icon: Cog },
  ] },
];

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = React.useState('theme');
  const { translucent, setTranslucent, themeId, setThemeId, presets } = useAtmosphere();
  const { theme, setTheme } = useTheme();

  return (
    // Mirrors the homepage shell: logo sits at the top of the left rail, and a
    // 56px header sits over the right content column — so navigating from the
    // homepage doesn't shift the layout. No outer borders (matches homepage).
    <div className="fixed inset-0 flex overflow-hidden bg-transparent">
      {/* ── Left rail (logo + search + nav) ─────────────────────────── */}
      <aside className="atmo-glass flex w-[288px] shrink-0 flex-col bg-card">
        {/* Logo block — same paddings/slot as the homepage sidebar */}
        <div className="flex items-center px-[12px] h-[56px] shrink-0">
          <div className={ICON_SLOT}>
            <div className="flex items-center justify-center rounded-full overflow-hidden shrink-0 size-[24px] bg-[var(--color-plum)]">
              <img src="/co-marketer-logo.gif" alt="Zeno" className="size-full object-cover" />
            </div>
          </div>
          <span className="font-bold text-[16px] leading-[20px] text-[var(--color-ink)]" style={FONT}>Zeno</span>
          <span className="mx-[12px] h-[20px] w-px rounded-[2px] bg-[oklch(0_0_0_/_0.08)]" />
          <span className="text-[14px] font-medium text-[var(--color-slate)]" style={FONT}>Settings</span>
        </div>

        {/* Search + nav sections */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[12px] pb-[16px]">
          <div className="flex h-[38px] w-full items-center gap-[9px] rounded-[9px] border border-[var(--color-line-input)] bg-[oklch(1_0_0_/_0.56)] px-[11px]">
            <Search className="size-[16px] text-[var(--color-grey-soft)]" />
            <span className="text-[12px] text-[var(--color-grey-soft)]" style={FONT}>Search settings…</span>
          </div>

          <nav className="mt-[24px] flex flex-col gap-[24px]">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="flex flex-col gap-[8px]">
                <p className="text-[10px] font-medium uppercase tracking-[0.6px] text-[var(--color-grey-soft)]" style={FONT}>
                  {section.title}
                </p>
                <div className="flex flex-col">
                  {section.items.map((item) => {
                    const isActive = activeNav === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveNav(item.id)}
                        className={cn(
                          'flex h-[38px] items-center gap-[10px] rounded-[8px] px-[10px] transition-colors',
                          isActive ? 'bg-[oklch(0_0_0_/_0.06)]' : 'hover:bg-[oklch(0_0_0_/_0.06)]'
                        )}
                      >
                        <Icon className={cn('size-[17px]', isActive ? 'text-[var(--color-ink)]' : 'text-[var(--color-slate)]')} />
                        <span
                          className={cn('text-[13px]', isActive ? 'font-medium text-[var(--color-ink)]' : 'text-[var(--color-slate)]')}
                          style={FONT}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* ── Right column: 56px header + content card ────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header — Back, same 56px height as the homepage header */}
        <div className="atmo-glass flex h-[56px] shrink-0 items-center bg-card pl-[16px]">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-[4px] rounded-[8px] px-[4px] py-[4px] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
          >
            <ArrowLeft className="size-[16px] text-[var(--color-charcoal)]" />
            <span className="text-[13px] font-medium text-[var(--color-charcoal)]" style={FONT}>Back</span>
          </button>
        </div>

        {/* Content — frosted outer wrapper, neutral inner card (readable) */}
        <main className="atmo-glass flex min-h-0 flex-1 flex-col bg-card p-[8px]">
          <div className="flex min-h-0 flex-1 justify-center overflow-y-auto rounded-[16px] border-[0.5px] border-[var(--color-line-input)] bg-[var(--color-surface-0)]">
            <div className="w-full max-w-[940px] px-[24px] py-[40px]">
              {activeNav === 'theme' ? (
                <ThemePanel
                  translucent={translucent}
                  setTranslucent={setTranslucent}
                  theme={theme}
                  setTheme={setTheme}
                  themeId={themeId}
                  setThemeId={setThemeId}
                  presets={presets}
                />
              ) : (
                <PlaceholderPanel title={NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.id === activeNav)?.label ?? ''} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/* ── Theme panel ─────────────────────────────────────────────────── */
type Theme = ReturnType<typeof useTheme>['theme'];
const MODES: { id: Theme; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const ThemePanel: React.FC<{
  translucent: boolean;
  setTranslucent: (v: boolean) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  themeId: string;
  setThemeId: (id: string) => void;
  presets: ReturnType<typeof useAtmosphere>['presets'];
}> = ({ translucent, setTranslucent, theme, setTheme, themeId, setThemeId, presets }) => {
  return (
    <div className="flex flex-col gap-[16px]">
      {/* Heading */}
      <div className="flex flex-col gap-[8px]">
        <h1 className="text-[24px] font-medium text-[var(--color-ink)]" style={FONT}>Theme</h1>
        <p className="text-[13px] text-[var(--color-grey)]" style={FONT}>
          Choose a subtle sidebar atmosphere while keeping content surfaces neutral and readable.
        </p>
      </div>

      {/* Interface mode */}
      <div className="flex h-[52px] items-center justify-between">
        <SettingCopy title="Interface mode" sub="Use system appearance or choose a fixed mode." />
        <div className="flex items-center gap-[2px] rounded-[9px] bg-[var(--color-surface-1)] p-[3px]">
          {MODES.map((m) => {
            const on = theme === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setTheme(m.id)}
                className={cn(
                  'rounded-[7px] px-[13px] py-[7px] text-[12px] transition-colors',
                  on ? 'bg-card font-medium text-[var(--color-slate)] shadow-[0px_1px_0px_0px_oklch(0_0_0_/_0.02)]' : 'text-[var(--color-grey)]'
                )}
                style={FONT}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px w-full bg-[var(--color-line)]" />

      {/* Translucent sidebar */}
      <div className="flex items-center justify-between">
        <SettingCopy title="Translucent sidebar" sub="Frost the navigation and reveal a soft color atmosphere behind it." />
        <Switch checked={translucent} onCheckedChange={setTranslucent} />
      </div>

      {/* Sidebar theme grid — only when translucent is on */}
      {translucent && (
        <div className="flex flex-col gap-[12px] animate-in fade-in slide-in-from-top-1 duration-300">
          <SettingCopy title="Sidebar theme" sub="Themes affect the settings rail and the main app navigation." />
          <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((preset) => {
              const selected = themeId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setThemeId(preset.id)}
                  className={cn(
                    'relative flex h-[76px] items-center gap-[12px] rounded-[12px] border bg-card py-[11px] pl-[11px] pr-[12px] text-left transition-all',
                    selected ? 'border-[1.5px] border-[var(--color-royal)]' : 'border-[var(--color-line)] hover:border-[var(--color-line-strong)]'
                  )}
                >
                  <span
                    className="relative size-[54px] shrink-0 overflow-hidden rounded-[10px] shadow-[0px_8px_24px_-6px_oklch(0.18_0.03_265_/_0.18)] ring-1 ring-inset ring-[oklch(1_0_0_/_0.72)]"
                    style={{ backgroundImage: preset.swatch }}
                  >
                    {/* Mini UI mockup — matches Figma node 1819:6618 */}
                    <svg
                      viewBox="0 0 54 54"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute inset-0 size-full"
                      aria-hidden="true"
                    >
                      {/* Brand dot */}
                      <circle cx="12" cy="12" r="4" fill="white" fillOpacity="0.82" />
                      {/* Nav line 1 — full width */}
                      <rect x="8" y="23" width="30" height="3" rx="1.5" fill="white" fillOpacity="0.82" />
                      {/* Nav line 2 */}
                      <rect x="8" y="31" width="24" height="3" rx="1.5" fill="white" fillOpacity="0.58" />
                      {/* Nav line 3 */}
                      <rect x="8" y="39" width="24" height="3" rx="1.5" fill="white" fillOpacity="0.58" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col gap-[3px]">
                    <span className="truncate text-[13px] font-medium text-[var(--color-slate)]" style={FONT}>{preset.name}</span>
                    <span className="truncate text-[11px] text-[var(--color-grey-soft)]" style={FONT}>{preset.hint}</span>
                  </span>
                  {selected && (
                    <span className="absolute right-[12px] top-[11px] flex size-[18px] items-center justify-center rounded-[9px] bg-[var(--color-royal)]">
                      <Check className="size-[10px] text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const SettingCopy: React.FC<{ title: string; sub: string }> = ({ title, sub }) => (
  <div className="flex flex-col gap-[3px]">
    <p className="text-[14px] font-medium text-[var(--color-slate)]" style={FONT}>{title}</p>
    <p className="text-[12px] text-[var(--color-grey-soft)]" style={FONT}>{sub}</p>
  </div>
);

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col gap-[8px]">
    <h1 className="text-[24px] font-medium text-[var(--color-ink)]" style={FONT}>{title}</h1>
    <p className="text-[13px] text-[var(--color-grey)]" style={FONT}>This section is coming soon.</p>
  </div>
);

export default Settings;
