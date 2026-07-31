import { PageSkeleton } from '@/components/ui/Loading';
import { CoachBottomNav } from '@/components/layout/CoachBottomNav';

export default function CoachLoading() {
  return (
    <div className="relative">
      <PageSkeleton cardCount={2} listCount={4} />
      <CoachBottomNav currentTab="home" />
    </div>
  );
}

