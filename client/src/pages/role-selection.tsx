import { useLocation } from "wouter";
import { User, Settings, Cookie } from "lucide-react";
import logoPath from "@assets/FORZACHECK1_black_1753816621910.png";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RoleSelection() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();

  const selectRole = (role: string) => {
    if (role === 'admin') {
      navigate("/admin-login");
    } else if (role === 'teig') {
      navigate("/teig");
    } else {
      // Mitarbeiter
      navigate("/employee?role=mitarbeiter");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-5xl w-full mx-auto">
        {/* Logo & Header */}
        <div className="text-center mb-16">
          <img 
            src={logoPath} 
            alt="ForzaCheck Logo" 
            className="max-h-64 max-w-full mx-auto mb-8 object-contain drop-shadow-lg"
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {t.startPage.title}
          </h1>
          <p className="text-lg text-gray-600">
            {t.startPage.subtitle}
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Mitarbeiter Card */}
          <button
            onClick={() => selectRole('mitarbeiter')}
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-blue-500 hover:-translate-y-2"
            data-testid="button-role-mitarbeiter"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <User className="text-white" size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t.startPage.roles.employee}
                </h3>
                <p className="text-sm text-gray-600">
                  {t.startPage.roles.employeeDesc}
                </p>
              </div>
            </div>
          </button>

          {/* Teig Card */}
          <button
            onClick={() => selectRole('teig')}
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-orange-500 hover:-translate-y-2"
            data-testid="button-role-teig"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Cookie className="text-white" size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t.startPage.roles.teig}
                </h3>
                <p className="text-sm text-gray-600">
                  {t.startPage.roles.teigDesc}
                </p>
              </div>
            </div>
          </button>

          {/* Admin Card */}
          <button
            onClick={() => selectRole('admin')}
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-purple-500 hover:-translate-y-2"
            data-testid="button-role-admin"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Settings className="text-white" size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t.startPage.roles.admin}
                </h3>
                <p className="text-sm text-gray-600">
                  {t.startPage.roles.adminDesc}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
