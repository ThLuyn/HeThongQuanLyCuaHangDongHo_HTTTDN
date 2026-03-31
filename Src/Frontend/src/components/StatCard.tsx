// @ts-nocheck
export function StatCard({ icon: Icon, label, value }) {
    return (<div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 cursor-default">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-gold-500/15 to-gold-400/5 border border-gold-200/50">
          <Icon className="w-6 h-6 text-gold-500"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </div>);
}
