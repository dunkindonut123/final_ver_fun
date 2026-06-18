import Image from "next/image";

export function FunMandarinLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/images/logofunmanda.png"
      alt="Fun Mandarin Logo"
      width={200}
      height={200}
      className={className}
      priority
    />
  );
}
