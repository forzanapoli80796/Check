import { useLocation } from "wouter";
import { User, Shield, Settings } from "lucide-react";

export default function RoleSelection() {
  const [, navigate] = useLocation();

  const selectRole = (role: string) => {
    if (role === 'admin') {
      navigate("/admin-login");
    } else if (role === 'mitarbeiter') {
      navigate("/employee");
    } else if (role === 'betriebsleiter') {
      navigate("/betriebsleiter");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">
            <span className="inline-block transform -skew-x-12 bg-black text-white px-2 py-1 mr-2">=</span>
            FORZACHECK
          </h1>
        </div>

        {/* Role Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => selectRole('mitarbeiter')}
            className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
              <User className="text-white" size={24} />
            </div>
            <span className="text-lg font-medium text-gray-900">Mitarbeiter</span>
          </button>
          
          <button
            onClick={() => selectRole('betriebsleiter')}
            className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
              <Shield className="text-white" size={24} />
            </div>
            <span className="text-lg font-medium text-gray-900">Betriebsleiter</span>
          </button>
          
          <button
            onClick={() => selectRole('admin')}
            className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4">
              <Settings className="text-white" size={24} />
            </div>
            <span className="text-lg font-medium text-gray-900">Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
