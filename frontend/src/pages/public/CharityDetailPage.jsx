import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { charityService } from '@/services';
import { Spinner } from '@/components/common';

export default function CharityDetailPage() {
  const { id } = useParams();
  const { data: charity, isLoading } = useQuery({
    queryKey: ['charity', id],
    queryFn: () => charityService.get(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!charity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-white/50">Charity not found.</p>
        <Link to="/charities" className="btn-secondary mt-4">← Back to Charities</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <Link to="/charities" className="text-sm text-white/40 hover:text-white transition-colors mb-8 inline-block">
        ← All Charities
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-start gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
            {charity.logo_url
              ? <img src={charity.logo_url} alt={charity.name} className="w-12 h-12 object-contain" />
              : <span className="text-3xl">💚</span>
            }
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-2xl font-bold text-white">{charity.name}</h1>
              {charity.is_featured && <span className="badge-gold">Featured</span>}
            </div>
            {charity.website_url && (
              <a href={charity.website_url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                Visit website →
              </a>
            )}
          </div>
        </div>

        {charity.description && (
          <p className="text-white/60 leading-relaxed mb-8">{charity.description}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <Link to="/subscribe" className="btn-primary">
            Support This Charity →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
