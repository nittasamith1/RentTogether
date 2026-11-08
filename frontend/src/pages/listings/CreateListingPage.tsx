import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { CreateListingWizard } from '../../components/listings/CreateListingWizard';

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/listings', {
      state: { message: 'Item listed successfully and published to campus marketplace!' },
    });
  };

  const handleCancel = () => {
    navigate('/listings');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 select-none">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          to="/listings"
          className="hover:text-slate-900 font-semibold flex items-center gap-1 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>My Listings</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-[#5B4DFF]">New Listing</span>
      </div>

      {/* Wizard */}
      <CreateListingWizard onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
};
