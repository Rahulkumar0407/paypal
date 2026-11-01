import Link from "next/link";

type Variant = "primary" | "secondary" | "quiet";

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-[15px] font-medium leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-45";
const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-ink",
  secondary: "bg-paper text-ink ring-1 ring-line ring-inset hover:bg-surface",
  quiet: "px-1 text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink",
};

export function buttonClasses(variant: Variant = "primary", extra = ""): string {
  return `${BASE} ${VARIANT[variant]} ${extra}`;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = "primary", className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...rest} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses(variant, className)}>
      {children}
    </Link>
  );
}
