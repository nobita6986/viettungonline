import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface OptimisticMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<{ success: boolean; data?: any; error?: string }>;
  onSuccess?: (data: any, variables: TVariables) => void;
  onError?: (error: string, variables: TVariables) => void;
}

export function useOptimisticMutation<TData, TVariables>({
  mutationFn,
  onSuccess,
  onError,
}: OptimisticMutationOptions<TData, TVariables>) {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (
      variables: TVariables,
      optimisticUpdate: (currentData: TData[]) => TData[],
      currentData: TData[],
      setData: (newData: TData[]) => void
    ) => {
      // 1. Snapshot the current state (to rollback if needed)
      const previousData = [...currentData];

      // 2. Optimistically update the UI immediately
      const optimisticData = optimisticUpdate(currentData);
      setData(optimisticData);
      setIsPending(true);

      try {
        // 3. Perform the actual mutation
        const result = await mutationFn(variables);

        if (!result.success) {
          throw new Error(result.error || 'Có lỗi xảy ra');
        }

        // 4. Call onSuccess callback
        if (onSuccess) onSuccess(result.data, variables);
      } catch (err: any) {
        // 5. Rollback to previous state on error
        setData(previousData);
        toast.error(err.message || 'Lỗi thao tác, đã khôi phục dữ liệu!');
        if (onError) onError(err.message, variables);
      } finally {
        setIsPending(false);
      }
    },
    [mutationFn, onSuccess, onError]
  );

  return { mutate, isPending };
}
