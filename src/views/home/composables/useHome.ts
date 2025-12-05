import { useRouter } from 'vue-router';

import type { Home } from '../models/home';

function useHome(): Home {
  const router = useRouter();

  const redirectToRoom = (roomId: string) => {
    if (!roomId) return;

    router.push({ name: 'live', params: { id: roomId } });
  };

  const redirectToBroadcast = () => {
    router.push({ name: 'broadcast' });
  };

  return {
    redirectToRoom,
    redirectToBroadcast,
  };
}

export { useHome };
