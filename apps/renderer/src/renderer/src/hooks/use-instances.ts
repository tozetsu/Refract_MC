import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateInstanceInput, Instance } from '@refract/core'

export function useInstances() {
  return useQuery({
    queryKey: ['instances'],
    queryFn: () => window.api.instance.list(),
  })
}

export function useCreateInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateInstanceInput) => window.api.instance.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instances'] }),
  })
}

export function useUpdateInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Instance> }) =>
      window.api.instance.update(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instances'] }),
  })
}

export function useDeleteInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, deleteFiles }: { id: string; deleteFiles: boolean }) =>
      window.api.instance.delete(id, deleteFiles),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instances'] }),
  })
}
