import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const SHOOT_TYPES = {
  portrait: 'Портрет',
  business: 'Бизнес',
  family: 'Семья',
  products: 'Предметы',
  wedding: 'Свадьба',
  other: 'Другое',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('leads').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setLoading(false) })
  }, [])

  if (loading) return <div className="text-gray-400 text-sm">Загрузка...</div>

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-6">
        Заявки <span className="text-gray-500 font-normal text-base">({leads.length})</span>
      </h1>

      {leads.length === 0 ? (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-10 text-center text-gray-500 text-sm">
          Заявок пока нет
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => (
            <div key={lead.id} className="bg-gray-950 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-white font-medium">{lead.name}</span>
                  {lead.plan && (
                    <span className="ml-2 text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">{lead.plan}</span>
                  )}
                  {lead.shoot_type && (
                    <span className="ml-2 text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                      {SHOOT_TYPES[lead.shoot_type] ?? lead.shoot_type}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(lead.created_at).toLocaleString('ru', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <a href={`tel:${lead.phone}`} className="text-blue-400 hover:underline">{lead.phone}</a>
                <a href={`mailto:${lead.email}`} className="text-blue-400 hover:underline">{lead.email}</a>
              </div>
              {lead.message && (
                <p className="text-gray-400 text-sm border-t border-gray-800 pt-3">{lead.message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
