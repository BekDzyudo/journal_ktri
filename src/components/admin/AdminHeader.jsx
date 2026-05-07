import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaBell, FaCog, FaNewspaper, FaSearch, FaSignOutAlt, FaUser } from "react-icons/fa";
import { ROLE_NAMES, ROLES } from "../../constants/roles.js";
import { useNotifications } from "../../context/NotificationContext.jsx";
import NotificationPanel from "./NotificationPanel.jsx";
import { NOTIFICATION_TYPES } from "../../utils/fakeNotificationApi.js";

function AdminHeader({
  userRole,
  userData,
  roleConfig,
  activeTab,
  setActiveTab,
  menuItems,
  profileDropdownOpen,
  setProfileDropdownOpen,
  onLogout,
}) {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const { unreadCount, refresh } = useNotifications();

  const firstName = userData?.first_name || userData?.ism || "";
  const lastName  = userData?.last_name  || userData?.familiya || "";
  const fullName  = `${firstName} ${lastName}`.trim() || userData?.email || "";
  const roleName  = ROLE_NAMES[userRole] || "Muallif";

  const initials  = `${firstName?.[0] || ""}${lastName?.[0] || ""}` || "U";
  const roleBadge =
    userRole === ROLES.SUPERADMIN ? "Administrator"
    : userRole === ROLES.ADMIN    ? "Taqrizchi"
    : "Muallif";

  const handleBellClick = () => {
    refresh();
    setNotifOpen((prev) => !prev);
    if (profileDropdownOpen) setProfileDropdownOpen(false);
  };

  const handleProfileClick = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    if (notifOpen) setNotifOpen(false);
  };

  const handleOpenNotification = (notification) => {
    if (notification.type === NOTIFICATION_TYPES.ROLE_CHANGED) {
      setActiveTab("users");
      return;
    }

    setActiveTab("dashboard");
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("ktri:open-article", {
          detail: {
            articleId: notification.articleId,
            notificationType: notification.type,
          },
        })
      );
    }, 120);
  };

  return (
    <>
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <button
          onClick={() => navigate("/")}
          className="flex h-18 items-center gap-3 border-b border-slate-100 px-5 text-left transition hover:bg-slate-50"
          title="Asosiy sahifaga qaytish"
        >
          <img src="/new_logo_white.png" alt="KTRI" className="h-11 w-11 rounded-xl object-contain" />
          <div>
            <p className="text-base font-black tracking-tight text-slate-950">KTRI</p>
            <p className="text-[11px] font-semibold text-slate-500">{roleBadge}</p>
          </div>
        </button>

        <nav className="flex-1 space-y-1.5 px-4 py-5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                activeTab === item.id
                  ? "bg-[#eef4ff] text-[#0d4ea3] ring-1 ring-blue-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition ${
                  activeTab === item.id
                    ? "bg-white text-[#0d4ea3] shadow-sm"
                    : "bg-slate-50 text-slate-400 group-hover:text-slate-700"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-100 px-5 py-4">
          <p className="text-xs font-bold text-slate-700">ID: {firstName || fullName}</p>
          <p className="mt-1 text-[11px] text-slate-400">© 2026 KTRI</p>
        </div>
      </aside>

      {/* Top header */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur lg:left-72">
        <div className="flex h-18 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-4">
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 lg:hidden">
              <FaBars />
            </button>
            <div className="hidden min-w-56 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400 md:flex lg:min-w-88">
              <FaSearch className="mr-2 text-xs" />
              <span className="text-sm">Qidiruv...</span>
            </div>
            <div className="min-w-0 md:hidden">
              <h1 className="truncate text-lg font-black text-slate-950">{roleConfig.title}</h1>
              <p className="truncate text-xs text-slate-500">{roleConfig.subtitle}</p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Bell with badge */}
            <div className="relative">
              <button
                onClick={handleBellClick}
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                title="Bildirishnomalar"
              >
                <FaBell />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              <NotificationPanel
                isOpen={notifOpen}
                onClose={() => setNotifOpen(false)}
                onOpenNotification={handleOpenNotification}
              />
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-slate-50"
              >
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-black text-slate-950">{fullName}</p>
                  <p className="text-[11px] font-medium text-slate-500">{roleName}</p>
                </div>
                <div
                  className={`grid h-10 w-10 place-items-center rounded-full bg-linear-to-br ${roleConfig.headerGradient} text-sm font-bold text-white shadow-md`}
                >
                  {initials}
                </div>
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className={`bg-linear-to-r ${roleConfig.headerGradient} p-5 text-white`}>
                      <p className="font-bold">{fullName}</p>
                      <p className="mt-1 truncate text-xs opacity-90">{userData?.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => { setActiveTab("profile"); setProfileDropdownOpen(false); }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <FaUser className="text-blue-600" />
                        Profil
                      </button>
                      <button
                        onClick={() => { setActiveTab("settings"); setProfileDropdownOpen(false); }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <FaCog className="text-slate-500" />
                        Sozlamalar
                      </button>
                      <button
                        onClick={() => navigate("/")}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <FaNewspaper className="text-emerald-600" />
                        Asosiy sahifa
                      </button>
                      <button
                        onClick={() => { onLogout(); navigate("/"); }}
                        className="mt-2 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        <FaSignOutAlt />
                        Chiqish
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                activeTab === item.id ? "bg-[#0d4ea3] text-white" : "bg-slate-50 text-slate-600"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </header>
    </>
  );
}

export default AdminHeader;
