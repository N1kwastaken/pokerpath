import { useQuery } from '@tanstack/react-query';
import { gameApi, type RangeFilters } from '../api/game.js';

export function useWorlds() {
  return useQuery({ queryKey: ['worlds'], queryFn: gameApi.worlds });
}
export function useTrail() {
  return useQuery({ queryKey: ['trail'], queryFn: gameApi.trail });
}
export function useWorld(worldId: string | undefined) {
  return useQuery({ queryKey: ['world', worldId], queryFn: () => gameApi.world(worldId!), enabled: !!worldId });
}
export function useStage(stageId: string | undefined, resume = false) {
  return useQuery({ queryKey: ['stage', stageId, resume], queryFn: () => gameApi.stage(stageId!, resume), enabled: !!stageId, staleTime: 0 });
}
export function useStats() {
  return useQuery({ queryKey: ['stats'], queryFn: gameApi.stats });
}
export function useEnergy() {
  return useQuery({ queryKey: ['energy'], queryFn: gameApi.energy });
}
export function useReview() {
  return useQuery({ queryKey: ['review'], queryFn: gameApi.review });
}
export function useRange(filters: RangeFilters, opts?: { enabled?: boolean }) {
  return useQuery({ queryKey: ['range', filters], queryFn: () => gameApi.range(filters), enabled: opts?.enabled ?? true });
}
export function useAchievements() {
  return useQuery({ queryKey: ['achievements'], queryFn: gameApi.achievements });
}
export function useMissions() {
  return useQuery({ queryKey: ['missions'], queryFn: gameApi.missions });
}
