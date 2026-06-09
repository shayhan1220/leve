import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { computeLoveDna, getMyLoveDnaResponses, saveLoveDnaResponse } from '@/features/lovedna/api';

export function useLoveDnaResponses(enabled = true) {
  return useQuery({
    queryKey: ['love-dna-responses', 'me'],
    queryFn: getMyLoveDnaResponses,
    enabled,
  });
}

export function useSaveLoveDnaResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveLoveDnaResponse,
    onSuccess: (saved) => {
      if (!saved) return;
      queryClient.setQueryData<
        { question_id: number; axis: 'S' | 'D' | 'A' | 'V' | 'M'; value: number }[]
      >(['love-dna-responses', 'me'], (current = []) => [
        ...current.filter((item) => item.question_id !== saved.question_id),
        saved,
      ]);
    },
  });
}

export function useComputeLoveDna() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: computeLoveDna,
    onSuccess: (result) => {
      queryClient.setQueryData(['love-dna', 'me'], result);
    },
  });
}
