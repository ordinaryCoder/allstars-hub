import { PageSkeleton } from '@/components/ui/Loading';

export default function AdminLoading() {
  return <PageSkeleton headerTitle="Admin Dashboard" cardCount={2} listCount={4} />;
}
