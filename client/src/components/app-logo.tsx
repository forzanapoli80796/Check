import { Link } from "wouter";
import logoPath from "@assets/FORZACHECK1_black_1753816621910.png";

interface AppLogoProps {
  imgClassName?: string;
  asLink?: boolean;
  linkHref?: string;
  wrapperClassName?: string;
}

export default function AppLogo({
  imgClassName = "h-16 object-contain",
  asLink = false,
  linkHref = "/",
  wrapperClassName = "",
}: AppLogoProps) {
  const inner = (
    <>
      <img src={logoPath} alt="ForzaCheck Logo" className={imgClassName} />
      <p className="mt-1.5 text-xs font-medium text-gray-400 tracking-wide text-center select-none">
        Version 2.0
      </p>
    </>
  );

  if (asLink) {
    return (
      <Link href={linkHref}>
        <div className={`flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity ${wrapperClassName}`}>
          {inner}
        </div>
      </Link>
    );
  }

  return (
    <div className={`flex flex-col items-center ${wrapperClassName}`}>
      {inner}
    </div>
  );
}
