'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  RefreshCw,
  Download,
  Filter,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type RangeKey =
  | 'Today'
  | 'Yesterday'
  | 'Last 7 Days'
  | 'WTD'
  | 'MTD'
  | 'Last 30 Days'
  | 'YTD'
  | 'Custom';

type ProductRow = {
  imageUrl: string;
  product: string;
  asin: string;
  sku: string;
  sales: number;
  units: number;
  orders: number;
  fees: number;
  refunds: number;
  netProfit: number;
  netProfitPerUnit: number;
  inventory: number;
  avgUnitsPerDay: number;
  stockoutDate: string;
  bsr: number;
};

function money(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}
function num(n: number) {
  return n.toLocaleString();
}
function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function Pill({
  value,
  positiveIsGood = true,
}: {
  value: number;
  positiveIsGood?: boolean;
}) {
  const isPositive = value >= 0;
  const good = positiveIsGood ? isPositive : !isPositive;

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        good
          ? 'bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/25'
          : 'bg-rose-500/12 text-rose-700 ring-1 ring-rose-500/25',
      ].join(' ')}
    >
      {isPositive ? '▲' : '▼'} {pct(Math.abs(value))}
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
}) {
  return (
    <div className="rounded-2xl bg-[var(--panel)] ring-1 ring-[var(--ring)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-wide text-[var(--muted)] uppercase">
            {label}
          </div>
          <div className="mt-1 text-2xl font-semibold text-[var(--text)]">
            {value}
          </div>
          {sub ? (
            <div className="mt-1 text-xs text-[var(--muted3)]">{sub}</div>
          ) : null}
        </div>
        {typeof delta === 'number' ? <Pill value={delta} /> : null}
      </div>
    </div>
  );
}

function RangeTabs({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
}) {
  const tabs: RangeKey[] = [
    'Today',
    'Yesterday',
    'Last 7 Days',
    'WTD',
    'MTD',
    'Last 30 Days',
    'YTD',
    'Custom',
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = t === value;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={[
              'rounded-xl px-3 py-1.5 text-xs font-medium transition',
              active
                ? 'bg-[var(--chipActiveBg)] text-[var(--chipActiveText)]'
                : 'bg-[var(--chipBg)] text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--chipHoverBg)] ring-1 ring-[var(--ring)]',
            ].join(' ')}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

function IconButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-[var(--chipBg)] ring-1 ring-[var(--ring)] px-3 py-2 text-xs font-medium text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--chipHoverBg)] transition"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

type ThemeMode = 'night' | 'day';

function ACheck({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onChange();
        }
      }}
      className={[
        'h-4 w-4 rounded-[4px] ring-1 ring-[var(--ring)] flex items-center justify-center cursor-pointer',
        checked ? 'bg-[#FF9900]' : 'bg-transparent',
      ].join(' ')}
      aria-label={checked ? 'Checked' : 'Unchecked'}
    >
      {checked ? (
        <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none">
          <path
            d="M16.5 6.2 8.7 14 3.5 9"
            stroke="#fff"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

// ===== Compare Sales Card =====
function CompareSalesCard({
  data,
  totals,
  compareOn,
  setCompareOn,
  asinList,
  selectedAsins,
  toggleAsin,
  selectAllAsins,
  clearAllAsins,
}: {
  data: Array<{
    label: string;
    today: number;
    yesterday: number;
    lastWeek: number;
    lastYear: number;
  }>;
  totals: {
    todayUnits: number;
    yesterdayUnits: number;
    lastWeekUnits: number;
    lastYearUnits: number;
    todaySales: number;
    yesterdaySales: number;
    lastWeekSales: number;
    lastYearSales: number;
  };
  compareOn: {
    today: boolean;
    yesterday: boolean;
    lastWeek: boolean;
    lastYear: boolean;
  };
  setCompareOn: React.Dispatch<
    React.SetStateAction<{
      today: boolean;
      yesterday: boolean;
      lastWeek: boolean;
      lastYear: boolean;
    }>
  >;
  asinList: string[];
  selectedAsins: Set<string>;
  toggleAsin: (asin: string) => void;
  selectAllAsins: () => void;
  clearAllAsins: () => void;
}) {
  const [asinOpen, setAsinOpen] = useState(false);
  const [asinQuery, setAsinQuery] = useState('');

  const items = [
    {
      key: 'today' as const,
      label: 'Today so far',
      units: totals.todayUnits,
      sales: totals.todaySales,
      color: '#00A4B3',
    },
    {
      key: 'yesterday' as const,
      label: 'Yesterday',
      units: totals.yesterdayUnits,
      sales: totals.yesterdaySales,
      color: '#D13212',
    },
    {
      key: 'lastWeek' as const,
      label: 'Same day last week',
      units: totals.lastWeekUnits,
      sales: totals.lastWeekSales,
      color: '#FF9900',
    },
    {
      key: 'lastYear' as const,
      label: 'Same day last year',
      units: totals.lastYearUnits,
      sales: totals.lastYearSales,
      color: '#7A869A',
    },
  ];

  const shownAsins = useMemo(() => {
    const q = asinQuery.trim().toLowerCase();
    if (!q) return asinList;
    return asinList.filter((a) => a.toLowerCase().includes(q));
  }, [asinList, asinQuery]);

  return (
    <section className="h-full rounded-2xl bg-[var(--panel)] ring-1 ring-[var(--ring)] p-4 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Compare Sales</div>
          <div className="text-xs text-[var(--muted3)]">
            Units ordered
          </div>
        </div>

        <button
          onClick={() => setAsinOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--chipBg)] ring-1 ring-[var(--ring)]
                     px-2.5 py-1 text-[11px] font-medium text-[var(--muted2)]
                     hover:text-[var(--text)] hover:bg-[var(--chipHoverBg)] transition"
        >
          ASINs ({selectedAsins.size}/{asinList.length})
          {asinOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div className="mt-4 h-52 flex-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
            <XAxis
              dataKey="label"
              stroke="var(--axis)"
              tick={{ fontSize: 11 }}
              interval={1}
            />
            <YAxis stroke="var(--axis)" tick={{ fontSize: 11 }} />
            <RTooltip
              contentStyle={{
                background: 'var(--tooltipBg)',
                border: '1px solid var(--tooltipBorder)',
                borderRadius: 12,
              }}
              labelStyle={{ color: 'var(--muted2)' }}
            />

            {compareOn.today ? (
              <Line
                type="linear"
                dataKey="today"
                stroke="#00A4B3"
                strokeWidth={2}
                dot={false}
              />
            ) : null}
            {compareOn.yesterday ? (
              <Line
                type="linear"
                dataKey="yesterday"
                stroke="#D13212"
                strokeWidth={2}
                dot={false}
              />
            ) : null}
            {compareOn.lastWeek ? (
              <Line
                type="linear"
                dataKey="lastWeek"
                stroke="#FF9900"
                strokeWidth={2}
                dot={false}
              />
            ) : null}
            {compareOn.lastYear ? (
              <Line
                type="linear"
                dataKey="lastYear"
                stroke="#7A869A"
                strokeWidth={2}
                dot={false}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => setCompareOn((p) => ({ ...p, [it.key]: !p[it.key] }))}
            className="text-left rounded-xl bg-[var(--chipBg)] ring-1 ring-[var(--ring)] p-2 hover:bg-[var(--chipHoverBg)] transition"
          >
            <div className="flex items-center gap-2">
              <ACheck
  checked={compareOn[it.key]}
  onChange={() => setCompareOn((p) => ({ ...p, [it.key]: !p[it.key] }))}
 />
              <div
                className="text-[11px] uppercase text-[var(--muted)]"
                style={{ letterSpacing: 0.6 }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full mr-2"
                  style={{ background: it.color }}
                />
                {it.label}
              </div>
            </div>

            <div className="mt-1 text-xs text-[var(--muted2)]">
              <span className="font-semibold text-[var(--text)]">
                {it.units.toLocaleString()}
              </span>{' '}
              Units
            </div>
            <div className="text-xs text-[var(--muted2)]">
              <span className="font-semibold text-[var(--text)]">
                {it.sales.toLocaleString(undefined, {
                  style: 'currency',
                  currency: 'USD',
                })}
              </span>
            </div>
          </button>
        ))}
      </div>

      {asinOpen ? (
        <div className="mt-3 rounded-2xl bg-[var(--panelAlt)] ring-1 ring-[var(--ring)] p-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 rounded-xl bg-[var(--panel)] ring-1 ring-[var(--ring)] px-3 py-2">
              <Search size={16} className="text-[var(--muted)]" />
              <input
                value={asinQuery}
                onChange={(e) => setAsinQuery(e.target.value)}
                placeholder="Filter ASINs"
                className="w-full sm:w-[260px] bg-transparent outline-none text-sm placeholder:text-[var(--muted)]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={selectAllAsins}
                className="rounded-xl px-3 py-2 text-xs font-medium bg-[var(--chipBg)] ring-1 ring-[var(--ring)] hover:bg-[var(--chipHoverBg)] transition"
              >
                Select all
              </button>
              <button
                onClick={clearAllAsins}
                className="rounded-xl px-3 py-2 text-xs font-medium bg-[var(--chipBg)] ring-1 ring-[var(--ring)] hover:bg-[var(--chipHoverBg)] transition"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-3 max-h-44 overflow-auto rounded-xl bg-[var(--panel)] ring-1 ring-[var(--ring)] p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {shownAsins.map((a) => (
                <label
                  key={a}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--chipHoverBg)] cursor-pointer"
                >
                  <ACheck
  checked={selectedAsins.has(a)}
  onChange={() => toggleAsin(a)}
/>

                  <span className="text-xs text-[var(--muted2)]">{a}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function Page() {
  const [theme, setTheme] = useState<ThemeMode>('day');
  const [showTrendStats, setShowTrendStats] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [range, setRange] = useState<RangeKey>('Today');
  const [query, setQuery] = useState('');
  const [metric, setMetric] = useState<'Sales' | 'Net Profit' | 'Units'>(
    'Sales'
  );

  const themeVars =
    theme === 'night'
      ? ({
          '--bg': '#060B17',
          '--headerBg': 'rgba(6,11,23,0.80)',
          '--panel': 'rgba(255,255,255,0.05)',
          '--panelAlt': 'rgba(255,255,255,0.03)',
          '--panelHover': 'rgba(255,255,255,0.04)',
          '--ring': 'rgba(255,255,255,0.10)',
          '--text': 'rgba(255,255,255,1)',
          '--muted': 'rgba(255,255,255,0.60)',
          '--muted2': 'rgba(255,255,255,0.70)',
          '--muted3': 'rgba(255,255,255,0.55)',
          '--tableText': 'rgba(255,255,255,0.85)',
          '--grid': 'rgba(255,255,255,0.08)',
          '--axis': 'rgba(255,255,255,0.35)',
          '--tooltipBg': 'rgba(10,14,26,0.95)',
          '--tooltipBorder': 'rgba(255,255,255,0.12)',
          '--chipBg': 'rgba(255,255,255,0.05)',
          '--chipHoverBg': 'rgba(255,255,255,0.08)',
          '--chipActiveBg': 'rgba(255,255,255,1)',
          '--chipActiveText': '#0f172a',
          '--menuBg': 'rgba(6,11,23,0.98)',
        } as React.CSSProperties)
      : ({
          '--bg': '#F6F7FB',
          '--headerBg': 'rgba(246,247,251,0.80)',
          '--panel': 'rgba(255,255,255,0.92)',
          '--panelAlt': 'rgba(15,23,42,0.03)',
          '--panelHover': 'rgba(15,23,42,0.04)',
          '--ring': 'rgba(15,23,42,0.10)',
          '--text': 'rgba(15,23,42,1)',
          '--muted': 'rgba(15,23,42,0.55)',
          '--muted2': 'rgba(15,23,42,0.72)',
          '--muted3': 'rgba(15,23,42,0.55)',
          '--tableText': 'rgba(15,23,42,0.90)',
          '--grid': 'rgba(15,23,42,0.10)',
          '--axis': 'rgba(15,23,42,0.40)',
          '--tooltipBg': 'rgba(255,255,255,0.98)',
          '--tooltipBorder': 'rgba(15,23,42,0.14)',
          '--chipBg': 'rgba(15,23,42,0.05)',
          '--chipHoverBg': 'rgba(15,23,42,0.08)',
          '--chipActiveBg': 'rgba(15,23,42,1)',
          '--chipActiveText': '#ffffff',
          '--menuBg': 'rgba(255,255,255,0.98)',
        } as React.CSSProperties);

  const kpis = {
    sales: 1621.01,
    units: 95,
    orders: 93,
    amazonFees: 482.15,
    adSpend: 156.16,
    refundCost: 38.88,
    netRevenue: 1285.77,
    netProfit: 214.63,
    margin: 0.132,
    refunds: 0.028,
    roi: 0.97,
  };

  const trend = useMemo(() => {
    const base = [
      92, 110, 98, 140, 130, 155, 148, 160, 172, 190, 175, 210, 205, 230,
    ];
    return base.map((s, i) => ({
      day: `D${i + 1}`,
      sales: s,
      profit: Math.round(s * 0.13),
      units: Math.max(1, Math.round(s / 18)),
    }));
  }, [range]);

  const topAsins = useMemo(() => {
    return [
      { name: 'B07A...', profit: 92 },
      { name: 'B09B...', profit: 68 },
      { name: 'B0C1...', profit: 55 },
      { name: 'B074...', profit: 44 },
      { name: 'B0D2...', profit: 39 },
    ];
  }, [range]);

  const rows: ProductRow[] = useMemo(() => {
    const templates = [
      { product: 'Magnelex Car Windshield Sunshade', sku: 'MG-WS-2' },
      { product: 'Windshield Sunshade for Tesla', sku: 'MG-CWS-18' },
      { product: 'Windshield Sunshade for Toyota', sku: 'MG-CWS-27' },
      { product: 'Microfiber Leather Steering Cover', sku: 'MG-SC-ST' },
      { product: 'Magnelex Snow Cover', sku: 'MG-SC-F' },
      { product: 'Side Window Shade', sku: 'MG-SIDE-01' },
      { product: 'Car Cover – All Weather', sku: 'MG-COVER-01' },
      { product: 'Sunshade for BMW', sku: 'MG-CWS-33' },
      { product: 'Sunshade for Ford', sku: 'MG-CWS-41' },
      { product: 'Sunshade for Honda', sku: 'MG-CWS-52' },
    ];

    const pad = (n: number) => String(n).padStart(2, '0');
    const asin = (i: number) => {
      const core = (10000000 + i * 7919).toString(36).toUpperCase();
      return `B0${core.padStart(8, '0').slice(0, 8)}`;
    };

    return Array.from({ length: 30 }, (_, i) => {
      const t = templates[i % templates.length];
      const units = 2 + ((i * 3) % 14);
      const orders = Math.max(1, units - (i % 3));
      const sales = Math.round((45 + i * 7.3 + (i % 5) * 11) * 100) / 100;

      const fees = Math.round(sales * (0.32 + (i % 4) * 0.03) * 100) / 100;
      const refunds = i % 7 === 0 ? Math.round(sales * 0.18 * 100) / 100 : 0;

      const netProfit =
        Math.round(((sales - fees - refunds) * (0.18 + (i % 5) * 0.02) - 4) * 100) /
        100;

      const netProfitPerUnit =
        Math.round((netProfit / Math.max(1, units)) * 100) / 100;

      const inventory = 10 + ((i * 37) % 420);
      const avgUnitsPerDay = Math.max(
        1,
        Math.round(units * (0.6 + (i % 4) * 0.15))
      );

      const day = 12 + (i % 18);
      const stockoutDate = `Jan ${pad(day)}, 2026`;

      const bsr = 1200 + i * 173;

      const imageUrl = 'https://m.media-amazon.com/images/I/71fmAN6pqNL.jpg';

      return {
        imageUrl,
        product: t.product,
        asin: asin(i),
        sku: `${t.sku}-${pad(i + 1)}`,
        sales,
        units,
        orders,
        fees,
        refunds,
        netProfit,
        netProfitPerUnit,
        inventory,
        avgUnitsPerDay,
        stockoutDate,
        bsr,
      };
    });
  }, [range]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.product.toLowerCase().includes(q) || r.asin.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const lineKey =
    metric === 'Sales' ? 'sales' : metric === 'Net Profit' ? 'profit' : 'units';

  // ===== Compare Sales (ASIN filter default all selected) =====
  const hourLabels = useMemo(() => {
    const fmt = (h: number) => {
      const ampm = h < 12 ? 'AM' : 'PM';
      const hr = h % 12 === 0 ? 12 : h % 12;
      return `${hr}${ampm}`;
    };
    return Array.from({ length: 24 }, (_, i) => fmt(i));
  }, []);

  const asinList = useMemo(() => {
    const set = new Set(rows.map((r) => r.asin));
    return Array.from(set);
  }, [rows]);

  const [selectedAsins, setSelectedAsins] = useState<Set<string>>(new Set());
  const [compareOn, setCompareOn] = useState({
    today: true,
    yesterday: true,
    lastWeek: true,
    lastYear: true,
  });

  useEffect(() => {
    setSelectedAsins(new Set(asinList)); // default all selected
  }, [asinList]);

  const toggleAsin = (asin: string) => {
    setSelectedAsins((prev) => {
      const next = new Set(prev);
      if (next.has(asin)) next.delete(asin);
      else next.add(asin);
      return next;
    });
  };

  const selectAllAsins = () => setSelectedAsins(new Set(asinList));
  const clearAllAsins = () => setSelectedAsins(new Set());

  const unitAt = (
  asin: string,
  hour: number,
  variant: 'today' | 'yesterday' | 'lastWeek' | 'lastYear'
) => {
  // stable hash
  let h = 0;
  for (let i = 0; i < asin.length; i++) h = (h * 31 + asin.charCodeAt(i)) >>> 0;

  // Variant-specific separation knobs (makes lines visually more distinct)
  const cfg =
    variant === 'today'
      ? { amp: 0.85, shift: 0, noiseAmp: 0.10, bias: 0 }
      : variant === 'yesterday'
      ? { amp: 1.25, shift: 1, noiseAmp: 0.3, bias: 1 } // higher + slightly shifted
      : variant === 'lastWeek'
      ? { amp: 1.05, shift: -2, noiseAmp: 0.6, bias: 0 } // earlier peak
      : { amp: 1.55, shift: 2, noiseAmp: 0.16, bias: 2 }; // clearly higher + later peak

  const hh = (hour + cfg.shift + 24) % 24;

  // 3-peak daily shape (shifted per variant)
  const morning = Math.max(0, 6 - Math.abs(hh - 9));
  const midday = Math.max(0, 8 - Math.abs(hh - 13));
  const evening = Math.max(0, 5 - Math.abs(hh - 19));
  const shape = (morning * 0.7 + midday * 1.0 + evening * 0.6) * cfg.amp;

  // chunkier noise so lines diverge more
  const n = (((h ^ (hh * 2654435761)) + (variant === 'today' ? 11 : variant === 'yesterday' ? 23 : variant === 'lastWeek' ? 37 : 51)) % 13) - 6; // -6..+6
  const noise = n * cfg.noiseAmp;

  const base = Math.max(0, Math.round(shape + noise + cfg.bias));
  return base;
};

  const compareData = useMemo(() => {
    const selected = selectedAsins;
    return hourLabels.map((label, hour) => {
      let today = 0;
      let yesterday = 0;
      let lastWeek = 0;
      let lastYear = 0;

      selected.forEach((asin) => {
        today += unitAt(asin, hour, 'today');
        yesterday += unitAt(asin, hour, 'yesterday');
        lastWeek += unitAt(asin, hour, 'lastWeek');
        lastYear += unitAt(asin, hour, 'lastYear');
      });

      return { label, today, yesterday, lastWeek, lastYear };
    });
  }, [hourLabels, selectedAsins]);

  const compareTotals = useMemo(() => {
    const sum = (k: 'today' | 'yesterday' | 'lastWeek' | 'lastYear') =>
      compareData.reduce((a, x) => a + x[k], 0);

    const avgPrice = 16.0; // demo
    const todayUnits = sum('today');
    const yesterdayUnits = sum('yesterday');
    const lastWeekUnits = sum('lastWeek');
    const lastYearUnits = sum('lastYear');

    return {
      todayUnits,
      yesterdayUnits,
      lastWeekUnits,
      lastYearUnits,
      todaySales: todayUnits * avgPrice,
      yesterdaySales: yesterdayUnits * avgPrice,
      lastWeekSales: lastWeekUnits * avgPrice,
      lastYearSales: lastYearUnits * avgPrice,
    };
  }, [compareData]);

  return (
    <div
      style={themeVars}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-[var(--ring)] bg-[var(--headerBg)] backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <div className="relative flex items-center justify-between sm:justify-center gap-2">
            {/* LEFT */}
            <div className="absolute left-0">
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--chipBg)] ring-1 ring-[var(--ring)]
                             px-3 py-2 text-xs font-semibold text-[var(--text)]
                             hover:bg-[var(--chipHoverBg)] transition"
                  aria-label="Open menu"
                >
                  <span className="hidden sm:inline">DASHBOARD</span> <Menu size={16} />
                </button>

                {menuOpen ? (
                  <div
                    className="absolute left-0 top-[calc(100%+10px)] w-[320px] rounded-2xl
                               bg-[var(--menuBg)] ring-1 ring-[var(--ring)] shadow-2xl overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ring)]">
                      <div className="text-sm font-semibold">Menu</div>
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="rounded-lg p-2 hover:bg-[var(--chipHoverBg)] transition"
                        aria-label="Close"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <nav className="p-2">
                      {[
                        'Dashboard',
                        'Sales Estimator',
                        'Keyword Rank Tracker',
                        'Keyword Finder',
                        'Listing Analyzer',
                        'Inventory',
                        'Review Automation',
                        'Listing Builder',
                        'Issue Assistance',
                        'Amazon Liability Insurance',
                      ].map((item) => (
                        <button
                          key={item}
                          onClick={() => setMenuOpen(false)}
                          className="w-full text-left rounded-xl px-3 py-2.5 text-sm text-[var(--text)]
                                     hover:bg-[var(--chipHoverBg)] transition"
                        >
                          {item}
                        </button>
                      ))}
                    </nav>
                  </div>
                ) : null}
              </div>
            </div>

            {/* CENTER */}
            <div className="text-lg sm:text-xl font-semibold tracking-tight pl-12 sm:pl-0">
              <span className="text-[#FF9900]">AMZ</span>Seller
            </div>

            {/* RIGHT */}
            <div className="static sm:absolute sm:right-0 flex items-center gap-2">
              <IconButton
                icon={theme === 'night' ? <Sun size={16} /> : <Moon size={16} />}
                label={theme === 'night' ? 'Day' : 'Night'}
                onClick={() => setTheme((t) => (t === 'night' ? 'day' : 'night'))}
              />
              <IconButton icon={<Download size={16} />} label="Export" />
              <IconButton icon={<RefreshCw size={16} />} label="Refresh" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          <KpiCard label="Sales" value={money(kpis.sales)} sub="Gross sales (demo)" delta={0.041} />
          <KpiCard
            label="Units / Orders"
            value={`${num(kpis.units)} / ${num(kpis.orders)}`}
            sub={`Units: ${num(kpis.units)} • Orders: ${num(kpis.orders)}`}
            delta={0.018}
          />
          <KpiCard label="Amazon Fees" value={money(kpis.amazonFees)} sub="Referral & FBA fees" delta={0.021} />
          <KpiCard label="Ad Spend" value={money(kpis.adSpend)} sub="Advertising cost" delta={0.006} />
          <KpiCard label="Refund Cost" value={money(kpis.refundCost)} sub="Refunded amount" delta={0.012} />
          <KpiCard label="Net Revenue" value={money(kpis.netRevenue)} sub="After fees & refunds" delta={0.022} />
          <KpiCard label="Net Profit" value={money(kpis.netProfit)} sub={`Margin: ${pct(kpis.margin)}`} delta={0.015} />
        </div>

        {/* Range + controls */}
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <RangeTabs value={range} onChange={setRange} />

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex items-center gap-2 rounded-xl bg-[var(--panel)] ring-1 ring-[var(--ring)] px-3 py-2">
              <Search size={16} className="text-[var(--muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by product or ASIN"
                className="w-full sm:w-[320px] bg-transparent outline-none text-sm placeholder:text-[var(--muted)]"
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-[var(--chipBg)] ring-1 ring-[var(--ring)] px-3 py-2 text-xs font-medium text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--chipHoverBg)] transition">
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Charts row (horizontal scroll; 3rd goes out) */}
          <aside className="lg:col-span-12">
            <div className="flex items-stretch gap-4 overflow-x-auto pb-2">
              {/* 1) Compare Sales (NEW, first) */}
              <div className="min-w-[520px] flex-shrink-0">
                <CompareSalesCard
                  data={compareData}
                  totals={compareTotals}
                  compareOn={compareOn}
                  setCompareOn={setCompareOn}
                  asinList={asinList}
                  selectedAsins={selectedAsins}
                  toggleAsin={toggleAsin}
                  selectAllAsins={selectAllAsins}
                  clearAllAsins={clearAllAsins}
                />
              </div>

              {/* 2) Trend */}
              <div className="min-w-[520px] flex-shrink-0">
                <section className="h-full rounded-2xl bg-[var(--panel)] ring-1 ring-[var(--ring)] p-4 flex flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Trend</div>
                      <div className="text-xs text-[var(--muted3)]">
                        Sales, profit, units
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      <div className="flex gap-2">
                        {(['Sales', 'Net Profit', 'Units'] as const).map((m) => {
                          const active = metric === m;
                          return (
                            <button
                              key={m}
                              onClick={() => setMetric(m)}
                              className={[
                                'rounded-xl px-2.5 py-1 text-[11px] font-medium transition',
                                active
                                  ? 'bg-[var(--chipActiveBg)] text-[var(--chipActiveText)]'
                                  : 'bg-[var(--chipBg)] text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--chipHoverBg)] ring-1 ring-[var(--ring)]',
                              ].join(' ')}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setShowTrendStats((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--chipBg)] ring-1 ring-[var(--ring)]
                                   px-2.5 py-1 text-[11px] font-medium text-[var(--muted2)]
                                   hover:text-[var(--text)] hover:bg-[var(--chipHoverBg)] transition"
                      >
                        {showTrendStats ? 'Hide stats' : 'Show stats'}
                        {showTrendStats ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 h-52 flex-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
                        <XAxis dataKey="day" stroke="var(--axis)" tick={{ fontSize: 11 }} />
                        <YAxis stroke="var(--axis)" tick={{ fontSize: 11 }} />
                        <RTooltip
                          contentStyle={{
                            background: 'var(--tooltipBg)',
                            border: '1px solid var(--tooltipBorder)',
                            borderRadius: 12,
                          }}
                          labelStyle={{ color: 'var(--muted2)' }}
                        />
                        <Line type="monotone" dataKey={lineKey} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {showTrendStats ? (
                    <div className="mt-auto pt-3 grid grid-cols-3 gap-2 text-xs text-[var(--muted2)]">
                      <div className="rounded-xl bg-[var(--chipBg)] ring-1 ring-[var(--ring)] p-2">
                        <div className="text-[11px] uppercase text-[var(--muted)]">
                          Refund rate
                        </div>
                        <div className="mt-1 font-semibold text-[var(--text)]">
                          {pct(kpis.refunds)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[var(--chipBg)] ring-1 ring-[var(--ring)] p-2">
                        <div className="text-[11px] uppercase text-[var(--muted)]">
                          Ad spend
                        </div>
                        <div className="mt-1 font-semibold text-[var(--text)]">
                          {money(kpis.adSpend)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[var(--chipBg)] ring-1 ring-[var(--ring)] p-2">
                        <div className="text-[11px] uppercase text-[var(--muted)]">
                          ROI
                        </div>
                        <div className="mt-1 font-semibold text-[var(--text)]">
                          {pct(kpis.roi)}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>

              {/* 3) Top ASINs */}
              <div className="min-w-[520px] flex-shrink-0">
                <section className="rounded-2xl bg-[var(--panel)] ring-1 ring-[var(--ring)] p-4">
                  <div>
                    <div className="text-sm font-semibold">Top ASINs</div>
                    <div className="text-xs text-[var(--muted3)]">
                      By net profit
                    </div>
                  </div>

                  <div className="mt-4 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topAsins}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
                        <XAxis dataKey="name" stroke="var(--axis)" tick={{ fontSize: 11 }} />
                        <YAxis stroke="var(--axis)" tick={{ fontSize: 11 }} />
                        <RTooltip
                          contentStyle={{
                            background: 'var(--tooltipBg)',
                            border: '1px solid var(--tooltipBorder)',
                            borderRadius: 12,
                          }}
                          labelStyle={{ color: 'var(--muted2)' }}
                        />
                        <Bar dataKey="profit" fill="#FF9900" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>
            </div>
          </aside>

          {/* Table */}
          <section className="lg:col-span-12 rounded-2xl bg-[var(--panel)] ring-1 ring-[var(--ring)] overflow-hidden">
            <div className="overflow-auto">
              <table className="min-w-[1180px] w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                  <tr className="border-b border-[var(--ring)] bg-[var(--panelAlt)]">
                    <th className="text-left px-4 py-3 w-[360px]">Product</th>
                    <th className="text-left px-3 py-3">ASIN</th>
                    <th className="text-left px-3 py-3">SKU</th>
                    <th className="text-right px-3 py-3">Sales</th>
                    <th className="text-right px-3 py-3">Units</th>
                    <th className="text-right px-3 py-3">Orders</th>
                    <th className="text-right px-3 py-3">Fees</th>
                    <th className="text-right px-3 py-3">Refunds</th>
                    <th className="text-right px-3 py-3">Net Profit</th>
                    <th className="text-right px-3 py-3">Profit/Unit</th>
                    <th className="text-right px-3 py-3">Inv.</th>
                    <th className="text-right px-3 py-3">Avg/Day</th>
                    <th className="text-right px-3 py-3">Stockout</th>
                    <th className="text-right px-4 py-3">BSR</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--tableText)]">
                  {filtered.map((r) => {
                    const profitGood = r.netProfit >= 0;

                    return (
                      <tr
                        key={r.asin + r.sku}
                        className="border-b border-[var(--ring)] hover:bg-[var(--panelHover)] transition"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={r.imageUrl}
                              alt={r.product}
                              className="h-10 w-10 rounded object-cover"
                            />
                            <div className="font-medium">{r.product}</div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[var(--muted2)]">{r.asin}</td>
                        <td className="px-3 py-3 text-[var(--muted2)]">{r.sku}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{money(r.sales)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{num(r.units)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{num(r.orders)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-red-400">
                          {money(r.fees)}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-orange-400">
                          {money(r.refunds)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span
                            className={[
                              'inline-flex items-center justify-end rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ring-1',
                              r.netProfit >= 0
                                ? 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/25'
                                  : 'bg-rose-500/12 text-rose-700 ring-rose-500/25',
                              ].join(' ')}
                            >
                              {money(r.netProfit)}
                            </span>
                          </td>        
                        <td className="px-3 py-3 text-right tabular-nums">
                          {money(r.netProfitPerUnit)}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">{num(r.inventory)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{num(r.avgUnitsPerDay)}</td>
                        <td className="px-3 py-3 text-right text-[var(--muted2)]">
                          {r.stockoutDate}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{num(r.bsr)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="mt-6 text-xs text-[var(--muted)]">
          AMZSeller • Advanced Merchant Zone.
        </div>
      </main>
    </div>
  );
}

// deploy ping
