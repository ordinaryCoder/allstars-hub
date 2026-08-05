import { getUsersByCategory } from '../_actions/action';
import { UserManagementBoardView, type User } from './UserManagementBoardView';

export type { User };

export async function UserManagementBoard() {
  // Reuse the single authoritative Server Action fetcher for initial SSR load
  const initialPlayers = await getUsersByCategory('players');
  return <UserManagementBoardView initialPlayers={initialPlayers} />;
}