import { getPlayerRecords } from '../_actions/action';
import { UserManagementBoardView } from './UserManagementBoardView';

export async function UserManagementBoard() {
  // SSR-prefetch active player records for instant first paint
  const initialPlayers = await getPlayerRecords('active');
  return <UserManagementBoardView initialPlayers={initialPlayers} />;
}