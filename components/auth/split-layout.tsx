import { cn } from "@/lib/utils";

interface SplitLayoutProps {
  children: React.ReactNode;
  /** Path to an image in /public, e.g. "/images/big-sur.jpg" */
  imageSrc?: string;
  imageAlt?: string;
  rightContent?: React.ReactNode;
}

export function SplitLayout({ children, imageSrc, imageAlt = "Atmospheric image", rightContent }: SplitLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Mobile: top image strip */}
      {imageSrc && (
        <div className="relative h-36 w-full shrink-0 overflow-hidden md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt={imageAlt} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50" />
          {/* Logo over image on mobile */}
          <div className="absolute bottom-4 left-5 flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 flex items-center justify-center">
              <span className="text-white text-xs font-bold font-display">S</span>
            </div>
            <span className="text-white/90 text-[13px] font-semibold">SCL Platform</span>
          </div>
        </div>
      )}

      {/* Left panel — form */}
      <div className={cn(
        "w-full flex flex-col justify-center px-5 py-8 bg-white overflow-y-auto",
        "md:w-[45%] md:px-12 lg:px-16 md:py-12",
        imageSrc && "md:min-h-screen"
      )}>
        <div className="max-w-[400px] mx-auto w-full">
          {/* Desktop logo — hidden on mobile (shown over image strip instead) */}
          <div className="hidden md:flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-[#0A0A0A] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold font-display">S</span>
            </div>
            <span className="text-[15px] font-semibold text-text-primary tracking-tight">SCL Platform</span>
          </div>
          {/* Mobile logo — only when no image strip */}
          {!imageSrc && (
            <div className="flex md:hidden items-center gap-2.5 mb-8">
              <div className="w-8 h-8 bg-[#0A0A0A] rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold font-display">S</span>
              </div>
              <span className="text-[15px] font-semibold text-text-primary tracking-tight">SCL Platform</span>
            </div>
          )}
          {children}
        </div>
      </div>

      {/* Right panel — atmospheric photo — desktop only */}
      <div
        className={cn(
          "hidden md:flex md:w-[55%] flex-col justify-end p-12 relative overflow-hidden",
          !imageSrc && "bg-[#0A0A0A]"
        )}
      >
        {imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={imageAlt}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10">
          {rightContent || (
            <>
              <div className="mb-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3.5 py-1.5">
                <span className="text-accent-gold text-xs">✦</span>
                <span className="text-white/70 text-[11px] font-medium uppercase tracking-widest">SCL Kingdom Impact Work</span>
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
