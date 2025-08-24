import { useLocation } from "wouter";
import { User, Shield, Settings, Cookie, Globe } from "lucide-react";
import logoPath from "@assets/FORZACHECK1_black_1753816621910.png";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RoleSelection() {
  const [, navigate] = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const selectRole = (role: string) => {
    if (role === 'admin') {
      navigate("/admin-login");
    } else if (role === 'mitarbeiter') {
      navigate("/employee");
    } else if (role === 'betriebsleiter') {
      // Betriebsleiter nutzt jetzt den normalen Employee-Workflow
      navigate("/employee?role=betriebsleiter");
    } else if (role === 'teig') {
      // Teig führt zur speziellen Teig-Dashboard
      navigate("/teig");
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'de' ? 'en' : 'de');
  };

  return (
    <div className="min-h-screen napoli-pattern flex flex-col items-center justify-center relative overflow-hidden">      
      <div className="max-w-md w-full mx-auto px-4 relative z-10">
        {/* Logo */}
        <div className="text-center mb-12">
          <img 
            src={logoPath} 
            alt="ForzaCheck Logo" 
            className="max-h-80 max-w-full mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {t.startPage.title}
          </h1>
          <p className="text-gray-600">
            {t.startPage.subtitle}
          </p>
        </div>

        {/* Role Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => selectRole('mitarbeiter')}
            className="role-button mitarbeiter"
          >
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <User className="text-white drop-shadow-lg" size={28} />
            </div>
            <div className="text-left">
              <span className="text-lg font-medium text-gray-900 block">
                {t.startPage.roles.employee}
              </span>
              <span className="text-sm text-gray-500">
                {t.startPage.roles.employeeDesc}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => selectRole('betriebsleiter')}
            className="role-button betriebsleiter"
          >
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <Shield className="text-white drop-shadow-lg" size={28} />
            </div>
            <div className="text-left">
              <span className="text-lg font-medium text-gray-900 block">
                {t.startPage.roles.manager}
              </span>
              <span className="text-sm text-gray-500">
                {t.startPage.roles.managerDesc}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => selectRole('teig')}
            className="role-button teig"
          >
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <Cookie className="text-white drop-shadow-lg" size={28} />
            </div>
            <div className="text-left">
              <span className="text-lg font-medium text-gray-900 block">
                {t.startPage.roles.teig}
              </span>
              <span className="text-sm text-gray-500">
                {t.startPage.roles.teigDesc}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => selectRole('admin')}
            className="role-button admin"
          >
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <Settings className="text-white drop-shadow-lg" size={28} />
            </div>
            <div className="text-left">
              <span className="text-lg font-medium text-gray-900 block">
                {t.startPage.roles.admin}
              </span>
              <span className="text-sm text-gray-500">
                {t.startPage.roles.adminDesc}
              </span>
            </div>
          </button>

          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mr-4">
              <Globe className="text-white" size={24} />
            </div>
            <div className="text-left">
              <span className="text-lg font-medium text-gray-900 block" translate="no">
                {language === 'de' ? 'English' : 'Deutsch'}
              </span>
              <span className="text-sm text-gray-500">
                {t.startPage.roles.languageDesc}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
