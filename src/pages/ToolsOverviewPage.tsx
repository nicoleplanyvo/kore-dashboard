import { Link } from 'react-router-dom';
import { Badge } from '../components/ui';
import { useTools, useToolStats } from '../hooks/useTools';
import { TOOL_CATEGORIES, CATEGORY_ORDER } from '../lib/moduleCategories';
import { getToolRoute } from '../lib/toolRoutes';
import { Euro, Wrench, BarChart3, ChevronRight } from 'lucide-react';
import t from '../locales/de.json';

function StatsCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-kore-white border border-kore-border p-xl flex items-start gap-lg">
      <div className="w-[44px] h-[44px] flex items-center justify-center flex-shrink-0" style={{ background: color || 'var(--kore-surface)' }}>
        <Icon size={20} className="text-kore-ink" />
      </div>
      <div>
        <p className="font-body text-caption text-kore-mid uppercase tracking-[0.14em]">{label}</p>
        <p className="font-display text-h2 text-kore-ink mt-xs">{value}</p>
      </div>
    </div>
  );
}

export function ToolsOverviewPage() {
  const { data: toolsData, isLoading } = useTools();
  const { data: stats } = useToolStats();

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  if (isLoading) {
    return <p className="text-kore-mid font-body">{t.common.loading}</p>;
  }

  return (
    <div>
      <h1 className="font-display text-h2 sm:text-h1 text-kore-ink mb-lg sm:mb-xl">{t.tools.title}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg mb-2xl">
        <StatsCard icon={Wrench} label={t.tools.totalTools} value={stats?.totalTools ?? 0} />
        <StatsCard icon={BarChart3} label={t.tools.totalAssignments} value={stats?.totalAssignments ?? 0} color="rgba(107, 140, 107, 0.1)" />
        <StatsCard icon={Euro} label={t.tools.mrr} value={formatPrice(stats?.mrr ?? 0)} color="rgba(158, 132, 96, 0.15)" />
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-xl">
        {CATEGORY_ORDER.map((catKey) => {
          const catInfo = TOOL_CATEGORIES[catKey];
          const catTools = toolsData?.grouped[catKey] ?? [];
          if (!catInfo || catTools.length === 0) return null;

          return (
            <div key={catKey} className="bg-kore-white border border-kore-border">
              <div className="px-md sm:px-xl py-lg border-b border-kore-border">
                <h2 className="font-display text-h3 text-kore-ink">{catInfo.label}</h2>
                <p className="font-body text-small text-kore-mid mt-xs">{catInfo.description}</p>
              </div>
              <div className="divide-y divide-kore-border">
                {catTools.map((tool) => {
                  const route = getToolRoute(tool.key);
                  const content = (
                    <>
                      <div className="min-w-0">
                        <p className="font-body text-body text-kore-ink font-normal">{tool.name}</p>
                        <p className="font-body text-small text-kore-mid truncate">{tool.description}</p>
                      </div>
                      <div className="flex items-center gap-md flex-shrink-0">
                        <Badge variant="brass">
                          {tool._count.assignments} Stores
                        </Badge>
                        <span className="font-body text-small text-kore-ink whitespace-nowrap">
                          {formatPrice(tool.priceMonthly)}
                        </span>
                        {route && (
                          <ChevronRight size={16} className="text-kore-brass" />
                        )}
                      </div>
                    </>
                  );

                  return route ? (
                    <Link
                      key={tool.id}
                      to={route}
                      className="px-md sm:px-xl py-md flex items-center justify-between gap-md hover:bg-kore-surface transition-colors duration-150"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={tool.id} className="px-md sm:px-xl py-md flex items-center justify-between gap-md opacity-60">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
