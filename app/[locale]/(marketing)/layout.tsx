import { Suspense } from "react";
import MarketingHeader from "@/src/components/marketing/MarketingHeader";
import MarketingFooter from "@/src/components/marketing/MarketingFooter";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-[#0b0c10] text-zinc-100">
      <Suspense fallback={null}>
        <MarketingHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Suspense fallback={null}>
        <MarketingFooter />
      </Suspense>
    </div>
  );
}
