import React from "react";

function StatsCard({ icon, title, value, gradient, iconBg }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center text-white text-2xl shadow-md`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatsCard;
