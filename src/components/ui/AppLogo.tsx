import Image from "next/image";
import Link from "next/link";

type AppLogoProps = {
  href?: string;
  showText?: boolean;
  textClassName?: string;
  imageSize?: number;
};

export function AppLogo({
  href = "/ ",
  showText = true,
  textClassName = "text-xl font-bold tracking-tight",
  imageSize = 36,
}: AppLogoProps) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <Image
        src="/logo.png"
        alt="NextStep logo"
        width={imageSize}
        height={imageSize}
        className="rounded-md object-contain"
        priority
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={textClassName}>NextStep</span>
        </div>
      )}
    </Link>
  );
}
