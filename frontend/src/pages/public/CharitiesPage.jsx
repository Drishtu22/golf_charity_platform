import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { charityService } from '@/services';
import { Skeleton, Pagination } from '@/components/common';

export default function CharitiesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['charities', search, page],
    queryFn: () => charityService.list({ search, page, limit: 12 }),
    keepPreviousData: true,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-white mb-3">
          Our Charity Partners
        </h1>
        <p className="text-white/50 max-w-2xl">
          Choose a cause to support with your subscription. Every month, your contribution goes directly to the charity you've selected.
        </p>
      </div>

      <div className="mb-8">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-field max-w-sm"
          placeholder="Search charities…"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(data?.charities || []).map((charity, i) => (
              <motion.div
                key={charity.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/charities/${charity.id}`} className="card-hover flex flex-col items-center text-center gap-3 group block">
                  {charity.is_featured && (
                    <span className="badge-gold self-start text-[10px]">Featured</span>
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-brand-500/10 transition-colors">
                    {charity.logo_url
                      ? <img src={charity.logo_url} alt={charity.name} className="w-10 h-10 object-contain rounded-xl" />
                      : <span className="text-2xl">💚</span>
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors">{charity.name}</p>
                    {charity.description && (
                      <p className="text-xs text-white/40 mt-1 line-clamp-2">{charity.description}</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <Pagination page={page} total={data?.total || 0} limit={12} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
