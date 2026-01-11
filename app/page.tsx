'use client';

import React, { useMemo, useState } from 'react';
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
import { RefreshCw, Download, Filter, Search, Sun, Moon, Menu, X } from 'lucide-react';

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
  product: string;
  asin: string;
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
      {label}
    </button>
  );
}

type ThemeMode = 'night' | 'day';

export default function Page() {
  // 1) default DAY
  const [theme, setTheme] = useState<ThemeMode>('day');
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

  const rows: ProductRow[] = useMemo(
    () => [
      {
        product: 'Magnelex Car Windshield Sunshade',
        asin: 'B074DL... (MG-WS-2)',
        sales: 205.06,
        units: 14,
        orders: 14,
        fees: 144.86,
        refunds: 38.88,
        netProfit: 33.18,
        netProfitPerUnit: 2.37,
        inventory: 232,
        avgUnitsPerDay: 14,
        stockoutDate: 'Feb 06, 2026',
        bsr: 1897,
      },
      {
        product: 'Windshield Sunshade for Tesla',
        asin: 'B0D2Z... (MG-CWS-18)',
        sales: 119.4,
        units: 6,
        orders: 5,
        fees: 67.19,
        refunds: 0,
        netProfit: 39.19,
        netProfitPerUnit: 6.53,
        inventory: 15,
        avgUnitsPerDay: 6,
        stockoutDate: 'Jan 17, 2026',
        bsr: 4570,
      },
      {
        product: 'Magnelex Car Windshield Sunshade',
        asin: 'B074DL... (MG-WS-1)',
        sales: 81.54,
        units: 6,
        orders: 6,
        fees: 80.72,
        refunds: 36.86,
        netProfit: -9.92,
        netProfitPerUnit: -1.65,
        inventory: 319,
        avgUnitsPerDay: 6,
        stockoutDate: 'Mar 25, 2026',
        bsr: 1897,
      },
      {
        product: 'Windshield Sunshade for Toyota',
        asin: 'B0F4X... (MG-CWS-27)',
        sales: 79.6,
        units: 4,
        orders: 4,
        fees: 35.02,
        refunds: 0,
        netProfit: 36.62,
        netProfitPerUnit: 9.15,
        inventory: 268,
        avgUnitsPerDay: 4,
        stockoutDate: 'Jul 31, 2026',
        bsr: 4570,
      },
      {
        product: 'Microfiber Leather Steering Cover',
        asin: 'B084C... (MG-SC-ST)',
        sales: 76.1,
        units: 5,
        orders: 5,
        fees: 48.05,
        refunds: 0,
        netProfit: 8.8,
        netProfitPerUnit: 1.76,
        inventory: 350,
        avgUnitsPerDay: 5,
        stockoutDate: 'May 22, 2026',
        bsr: 40720,
      },
    ],
    [range]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.product.toLowerCase().includes(q) ||
        r.asin.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const lineKey =
    metric === 'Sales' ? 'sales' : metric === 'Net Profit' ? 'profit' : 'units';

  return (
    <div
      style={themeVars}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
{/* Top bar */}
<header className="sticky top-0 z-20 border-b border-[var(--ring)] bg-[var(--headerBg)] backdrop-blur">
  <div className="mx-auto max-w-[1400px] px-6 py-4">
    <div className="relative flex items-center justify-center">
      {/* LEFT: Dashboard menu button (Cashcow gibi buradan açılacak) */}
      <div className="absolute left-0">
  <div className="relative">
    <button
      onClick={() => setMenuOpen((v) => !v)}
      className="inline-flex items-center gap-2 rounded-xl bg-[var(--chipBg)] ring-1 ring-[var(--ring)]
                 px-3 py-2 text-xs font-semibold text-[var(--text)]
                 hover:bg-[var(--chipHoverBg)] transition"
      aria-label="Open menu"
    >
      DASHBOARD <Menu size={16} />
    </button>

    {/* Dropdown menu (butonun ALTINA) */}
    {menuOpen ? (
      <div className="absolute left-0 top-[calc(100%+10px)] w-[320px] rounded-2xl
                      bg-[var(--menuBg)] ring-1 ring-[var(--ring)] shadow-2xl overflow-hidden z-50">
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


      {/* CENTER: Brand */}
      <div className="text-lg sm:text-xl font-semibold tracking-tight">
        AMZSeller
      </div>

      {/* RIGHT: actions */}
      <div className="absolute right-0 flex items-center gap-2">
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
        {/* KPI row (7 KPI) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          <KpiCard label="Sales" value={money(kpis.sales)} sub="Gross sales (demo)" delta={0.041} />
          <KpiCard  label="Units / Orders"  value={`${num(kpis.units)} / ${num(kpis.orders)}`}  sub={`Units: ${num(kpis.units)} • Orders: ${num(kpis.orders)}`}  delta={0.018}/>
          <KpiCard  label="Amazon Fees"  value={money(kpis.amazonFees)}  sub="Referral & FBA fees"  delta={0.021}/>
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

        {/* Main grid: charts + table */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: table */}
          <section className="lg:col-span-8 rounded-2xl bg-[var(--panel)] ring-1 ring-[var(--ring)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--ring)] flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Products</div>
                <div className="text-xs text-[var(--muted3)]">By ASIN • {range}</div>
              </div>
              <div className="text-xs text-[var(--muted)]">Showing {filtered.length}</div>
            </div>

            <div className="overflow-auto">
              <table className="min-w-[1100px] w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                  <tr className="border-b border-[var(--ring)] bg-[var(--panelAlt)]">
                    <th className="text-left px-4 py-3 w-[320px]">Product</th>
                    <th className="text-left px-3 py-3">ASIN</th>
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
                  {filtered.map((r, idx) => {
                    const profitGood = r.netProfit >= 0;
                    return (
                      <tr
                        key={idx}
                        className="border-b border-[var(--ring)] hover:bg-[var(--panelHover)] transition"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-[var(--text)]">{r.product}</div>
                          <div className="text-xs text-[var(--muted3)]">Product-level clarity</div>
                        </td>
                        <td className="px-3 py-3 text-[var(--muted2)]">{r.asin}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{money(r.sales)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{num(r.units)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{num(r.orders)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-[var(--muted2)]">{money(r.fees)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-[var(--muted2)]">{money(r.refunds)}</td>
                        <td className="px-3 py-3 text-right">
                          <span
                            className={[
                              'inline-flex items-center rounded-xl px-2 py-1 tabular-nums text-xs font-semibold ring-1',
                              profitGood
                                ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25'
                                : 'bg-rose-500/10 text-rose-700 ring-rose-500/25',
                            ].join(' ')}
                          >
                            {money(r.netProfit)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-[var(--muted2)]">
                          {money(r.netProfitPerUnit)}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">{num(r.inventory)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-[var(--muted2)]">{num(r.avgUnitsPerDay)}</td>
                        <td className="px-3 py-3 text-right text-[var(--muted2)]">{r.stockoutDate}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[var(--muted2)]">{num(r.bsr)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right: charts */}
          <aside className="lg:col-span-4 grid gap-4">
            <section className="rounded-2xl bg-[var(--panel)] ring-1 ring-[var(--ring)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Trend</div>
                  <div className="text-xs text-[var(--muted3)]">Sales, profit, units</div>
                </div>

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
              </div>

              <div className="mt-4 h-52">
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

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--muted2)]">
                <div className="rounded-xl bg-[var(--chipBg)] ring-1 ring-[var(--ring)] p-2">
                  <div className="text-[11px] uppercase text-[var(--muted)]">Refund rate</div>
                  <div className="mt-1 font-semibold text-[var(--text)]">{pct(kpis.refunds)}</div>
                </div>
                <div className="rounded-xl bg-[var(--chipBg)] ring-1 ring-[var(--ring)] p-2">
                  <div className="text-[11px] uppercase text-[var(--muted)]">Ad spend</div>
                  <div className="mt-1 font-semibold text-[var(--text)]">{money(kpis.adSpend)}</div>
                </div>
                <div className="rounded-xl bg-[var(--chipBg)] ring-1 ring-[var(--ring)] p-2">
                  <div className="text-[11px] uppercase text-[var(--muted)]">ROI</div>
                  <div className="mt-1 font-semibold text-[var(--text)]">{pct(kpis.roi)}</div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-[var(--panel)] ring-1 ring-[var(--ring)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Top ASINs</div>
                  <div className="text-xs text-[var(--muted3)]">By net profit</div>
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
                    <Bar dataKey="profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </aside>
        </div>

        <div className="mt-6 text-xs text-[var(--muted)]">
          AMZSeller • Advanced Merchant Zone.
        </div>
      </main>
    </div>
  );
}
