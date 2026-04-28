import { useLocation, Link } from "wouter";
import { User, Settings, Cookie } from "lucide-react";
import AppLogo from "@/components/app-logo";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Logo Section - Top */}
      <div className="pt-12 pb-8">
        <div className="text-center">
          <AppLogo asLink imgClassName="max-h-48 max-w-full mx-auto object-contain drop-shadow-2xl" />
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-6xl">
          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mitarbeiter Card */}
            <button
              onClick={() => selectRole('mitarbeiter')}
              className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-10 border-2 border-transparent hover:border-blue-500 hover:scale-105"
              data-testid="button-role-mitarbeiter"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-blue-500/50 group-hover:scale-110 transition-all duration-300">
                  <User className="text-white" size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t.startPage.roles.employee}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {t.startPage.roles.employeeDesc}
                  </p>
                </div>
              </div>
            </button>

            {/* Teig Card */}
            <button
              onClick={() => selectRole('teig')}
              className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-10 border-2 border-transparent hover:border-orange-500 hover:scale-105"
              data-testid="button-role-teig"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-orange-500/50 group-hover:scale-110 transition-all duration-300">
                  <Cookie className="text-white" size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t.startPage.roles.teig}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {t.startPage.roles.teigDesc}
                  </p>
                </div>
              </div>
            </button>

            {/* Admin Card */}
            <button
              onClick={() => selectRole('admin')}
              className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-10 border-2 border-transparent hover:border-purple-500 hover:scale-105"
              data-testid="button-role-admin"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-purple-500/50 group-hover:scale-110 transition-all duration-300">
                  <Settings className="text-white" size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t.startPage.roles.admin}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {t.startPage.roles.adminDesc}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
