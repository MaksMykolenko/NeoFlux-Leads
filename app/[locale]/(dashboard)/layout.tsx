import type { Metadata } from "next";
import { Suspense } from "react";
import AuthHeader from "@/src/components/AuthHeader";
import Footer from "@/src/components/Footer";

/** Gemini + Search grounding для universal / складних запитів може тривати хвилини. */
export const maxDuration = 180;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <AuthHeader />
      </Suspense>
      <div className="flex-1">{children}</div>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}
