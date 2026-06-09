import { router, useLocalSearchParams } from 'expo-router';

import { GatheringForm } from '@/components/community/gathering-form';
import { AppHeader } from '@/components/ui/app-header';
import { Screen } from '@/components/ui/screen';
import { useHostGathering, useUpdateGathering } from '@/features/community/hooks';

export default function EditGatheringScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const gathering = useHostGathering(id);
  const update = useUpdateGathering(id ?? '');
  return (
    <Screen scroll style={{ paddingTop: 0 }}>
      <AppHeader title="모임 정보 수정" />
      {gathering.data ? (
        <GatheringForm
          initial={gathering.data}
          pending={update.isPending}
          submitLabel="수정 완료"
          onSubmit={async (input) => {
            await update.mutateAsync(input);
            router.back();
          }}
        />
      ) : null}
    </Screen>
  );
}
