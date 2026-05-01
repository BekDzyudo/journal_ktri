import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaCog, FaNewspaper, FaSignOutAlt } from "react-icons/fa";
import { ROLE_NAMES, ROLES } from "../../constants/roles.js";

function AdminHeader({ 
  userRole, 
  userData, 
  roleConfig, 
  activeTab, 
  setActiveTab, 
  menuItems,
  profileDropdownOpen,
  setProfileDropdownOpen,
  onLogout
}) {
  const navigate = useNavigate();
  const firstName = userData?.first_name || userData?.ism || "";
  const lastName = userData?.last_name || userData?.familiya || "";
  const fullName = `${firstName} ${lastName}`.trim() || userData?.email || "";
  const roleName = ROLE_NAMES[userRole] || "Muallif";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/")}
              className="hover:opacity-80 transition-opacity"
              title="Asosiy sahifaga qaytish"
            >
              <img src="/new_logo_white.png" alt="KTRI" className="h-10 w-auto" />
            </button>
            <div className="border-l border-gray-300 pl-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{roleConfig.title}</h1>
                {userRole === ROLES.SUPERADMIN && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-sm">
                    ADMIN
                  </span>
                )}
                {userRole === ROLES.ADMIN && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full shadow-sm">
                    TAQRIZCHI
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{roleConfig.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 rounded-full border border-gray-200 hover:border-gray-300 transition-all hover:shadow-md"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">{fullName}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${userRole === ROLES.SUPERADMIN ? 'bg-emerald-500' : userRole === ROLES.ADMIN ? 'bg-purple-500' : 'bg-blue-500'} animate-pulse`}></span>
                    {roleName}
                  </p>
                </div>
                <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${roleConfig.headerGradient} flex items-center justify-center text-white font-bold text-lg shadow-lg ring-4 ring-white`}>
                  <span className="relative z-10">{firstName?.[0]}{lastName?.[0]}</span>
                  <div className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-20 transition-opacity"></div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setProfileDropdownOpen(false)}
                  ></div>
                  
                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    {/* Profile Header */}
                    <div className={`px-5 py-4 bg-gradient-to-r ${userRole === ROLES.SUPERADMIN ? 'from-emerald-500 to-teal-500' : userRole === ROLES.ADMIN ? 'from-purple-500 to-indigo-500' : 'from-blue-500 to-indigo-500'} text-white`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-xl ring-2 ring-white/50">
                          {firstName?.[0]}{lastName?.[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-lg">{fullName}</p>
                          <p className="text-xs opacity-90">{userData?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                          {roleName}
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        <FaUser className="text-blue-600" />
                        <span className="text-sm font-medium">Profil</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        <FaCog className="text-gray-600" />
                        <span className="text-sm font-medium">Sozlamalar</span>
                      </button>

                      <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        <FaNewspaper className="text-green-600" />
                        <span className="text-sm font-medium">Asosiy sahifa</span>
                      </button>

                      <div className="border-t border-gray-200 my-2"></div>

                      <button
                        onClick={() => {
                          onLogout();
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-red-600"
                      >
                        <FaSignOutAlt />
                        <span className="text-sm font-medium">Chiqish</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-4 border-t border-gray-200 pt-3 pb-2 overflow-x-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all font-medium whitespace-nowrap ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={activeTab === item.id ? 'text-lg' : 'text-base'}>{item.icon}</span>
              <span className={activeTab === item.id ? 'font-semibold' : ''}>{item.label}</span>
              {activeTab === item.id && (
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              )}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
