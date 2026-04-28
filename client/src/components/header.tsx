import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import AppLogo from "@/components/app-logo";

interface HeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
  showHomeButton?: boolean;
  onHome?: () => void;
  title?: string;
}

export default function Header({ 
  showBackButton = false, 
  onBack, 
  showHomeButton = false, 
  onHome,
  title 
}: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-8 mb-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          {showBackButton && onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mr-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Zurück
            </Button>
          )}
          {showHomeButton && onHome && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onHome}
              className="mr-4"
            >
              <Home size={16} className="mr-2" />
              Start
            </Button>
          )}
          <Link href="/" data-testid="link-home-logo">
            <AppLogo imgClassName="max-h-64 max-w-full object-contain" />
          </Link>
        </div>

      </div>
    </div>
  );
}