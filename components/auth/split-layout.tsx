import { cn } from "@/lib/utils";

interface SplitLayoutProps {
  children: React.ReactNode;
  /** Path to an image in /public, e.g. "/images/misty-forest.jpg" */
  imageSrc?: string;
  imageAlt?: string;
  rightContent?: React.ReactNode;
}

export function SplitLayout({ children, imageSrc, imageAlt = "Atmospheric image", rightContent }: SplitLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — form */}
      <div className="w-full md:w-[45%] flex flex-col justify-center px-8 py-12 md:px-12 lg:px-16 bg-white overflow-y-auto">
        <div className="max-w-[400px] mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-[#0A0A0A] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold font-display">S</span>
            </div>
            <span className="text-[15px] font-semibold text-text-primary tracking-tight">SCL Platform</span>
          </div>
          {children}
        </div>
      </div>

      {/* Right panel — atmospheric photo */}
      <div
        className={cn(
          "hidden md:flex md:w-[55%] flex-col justify-end p-12 relative overflow-hidden",
          !imageSrc && "bg-[#0A0A0A]"
        )}
      >
        {/* Background image — plain img tag for reliable rendering */}
        {imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={imageAlt}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Content */}
        <div className="relative z-10">
          {rightContent || (
            <>
              <div className="mb-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3.5 py-1.5">
                <span className="text-accent-gold text-xs">✦</span>
                <span className="text-white/70 text-[11px] font-medium uppercase tracking-widest">SCL Cohort 2025</span>
              </div>
              <h2 className="font-display text-[38px] font-normal text-white leading-[1.15] mb-4">
                From Pain Point<br />to Launch.
              </h2>
              <p className="text-white/60 text-[14px] leading-relaxed max-w-sm">
                A 6-month structured journey for kingdom-minded entrepreneurs — from discovery to real-world impact.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
