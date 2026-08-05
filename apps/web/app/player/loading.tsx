import { PageSkeleton } from '@/components/ui/Loading';

export default function PlayerLoading() {
  return <PageSkeleton headerTitle="Player Portal" cardCount={1} listCount={3} />;
}
