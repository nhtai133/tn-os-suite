import { PORTFOLIO_MAP } from "@/lib/portfolio-registry";
import { PortfolioHeader } from "@/components/portfolio/PortfolioHeader";
import { PortfolioTabNav } from "@/components/portfolio/PortfolioTabNav";

export default function PortfolioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const def = PORTFOLIO_MAP[params.id];

  if (!def) {
    return (
      <div className="p-8">
        <p className="text-red-400 text-sm">Portfolio not found: {params.id}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PortfolioHeader definition={def} />
      <PortfolioTabNav portfolioId={params.id} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
