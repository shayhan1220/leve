import { router } from 'expo-router';

import { GatheringForm } from '@/components/community/gathering-form';
import { AppHeader } from '@/components/ui/app-header';
import { Screen } from '@/components/ui/screen';
import { useCreateGathering } from '@/features/community/hooks';

export default function GatheringApplyScreen() {
  const create = useCreateGathering();
  return (
    <Screen scroll style={{ paddingTop: 0 }}>
      <AppHeader title="모임 신청" />
      <GatheringForm
        pending={create.isPending}
        submitLabel="검토 요청하기"
        onSubmit={async (input) => {
          const gathering = await create.mutateAsync(input);
          if (gathering.status !== 'pending_review')
            throw new Error('모임 처리 상태를 확인해 주세요.');
          router.replace('/gathering-applied?type=review');
        }}
      />
    </Screen>
  );
}
