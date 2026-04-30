import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useImpersonation } from '@/lib/impersonation';
import { Button } from '@/components/ui/button';
import { X, Eye } from 'lucide-react';

export function ImpersonationBanner() {
  const { t } = useTranslation();
  const { impersonatedRetailer, stopImpersonation, isImpersonating } = useImpersonation();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  const handleExit = () => {
    stopImpersonation();
    navigate('/admin');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        <span className="font-medium text-sm">
          {t('admin.impersonation.viewing')} <strong>{impersonatedRetailer?.salon_name}</strong>
        </span>
      </div>
      <Button 
        size="sm" 
        variant="secondary"
        onClick={handleExit}
        className="gap-1 bg-amber-100 hover:bg-amber-200 text-amber-950"
      >
        <X className="w-4 h-4" />
        {t('admin.impersonation.exit')}
      </Button>
    </div>
  );
}
