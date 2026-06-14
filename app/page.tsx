import HeroCta from "@/components/hero-cta";
import ImageTabs from "@/components/image-tabs";
import { Briefcase, CheckCircle2, TrendingUp } from "lucide-react";

const FEATURES = [
  {
    icon: Briefcase,
    title: "Organize every role",
    description:
      "Sort opportunities into custom columns and drag them through each stage of your search.",
  },
  {
    icon: TrendingUp,
    title: "See your pipeline",
    description:
      "Watch every application move from wishlist to applied to offer on one visual board.",
  },
  {
    icon: CheckCircle2,
    title: "Keep it all in one vault",
    description:
      "Store notes, salaries, links, and tags for each role so nothing slips through the cracks.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border">
          {/* faint dotted grid, faded out toward the edges */}
          <div
            aria-hidden
            className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
          />
          <div className="container mx-auto px-4 py-28 sm:py-36">
            <div className="mx-auto max-w-3xl text-center">
              <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[13px] font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                Free forever — no credit card required
              </span>
              <h1 className="mb-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-7xl">
                Track your job search.
                <br className="hidden sm:block" />
                <span className="text-muted-foreground">Beautifully.</span>
              </h1>
              <p className="mx-auto mb-10 max-w-xl text-balance text-lg text-muted-foreground sm:text-xl">
                Capture, organize, and manage every application in one calm,
                focused workspace.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <HeroCta />
              </div>
            </div>
          </div>
        </section>

        {/* Hero Images Section with Tabs */}
        <ImageTabs />

        {/* Features Section */}
        <section className="bg-background py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Your entire job search, organized
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                JobVault keeps every application, status, and detail in one
                focused place.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl overflow-hidden rounded-xl border border-border md:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="group border-border p-8 transition-colors hover:bg-muted/40 md:border-l md:first:border-l-0"
                >
                  <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
