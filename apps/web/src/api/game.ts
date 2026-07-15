import type {
  AnswerInput, AnswerResult, OnboardingInput, PublicUser,
  StagePlay, WorldDetail, WorldSummary, StatsResult, RangeGrid, LessonResult,
  AchievementView, MissionView, MissionClaimResult, ReviewItem, EnergyState,
  FriendsResponse, FriendView,
} from '@pokerpath/shared';
import { apiRequest } from '../lib/api.js';

export interface RangeFilters {
  gameType: string; tableSize: string; stack: number; position: string;
  /** 'RFI' (padrão) ou 'VS_<posição>' — chart de defesa vs open. */
  scenario?: string;
}

/** Chamadas da API do loop de jogo (PRD 5, 6, 7, 15.3). */
export const gameApi = {
  worlds: () => apiRequest<{ worlds: WorldSummary[] }>('/worlds').then((r) => r.worlds),
  trail: () => apiRequest<{ trail: WorldDetail[] }>('/trail').then((r) => r.trail),
  world: (worldId: string) => apiRequest<{ world: WorldDetail }>(`/worlds/${worldId}`).then((r) => r.world),
  stage: (stageId: string, resume = false) => apiRequest<StagePlay>(`/stages/${stageId}${resume ? '?resume=1' : ''}`),
  answer: (input: AnswerInput) => apiRequest<AnswerResult>('/answers', { method: 'POST', body: input }),
  completeLesson: (stageId: string, perfect = false) =>
    apiRequest<LessonResult>(`/stages/${stageId}/complete`, { method: 'POST', body: { perfect } }),
  stats: () => apiRequest<StatsResult>('/stats'),
  energy: () => apiRequest<EnergyState>('/energy'),
  review: () => apiRequest<{ review: ReviewItem[] }>('/review').then((r) => r.review),
  skipBasics: () => apiRequest<{ ok: true; count: number }>('/skip-basics', { method: 'POST' }),
  placement: (level: number) => apiRequest<{ ok: true; completed: number }>('/placement', { method: 'POST', body: { level } }),
  range: (f: RangeFilters) =>
    apiRequest<{ range: RangeGrid | null }>(
      `/ranges?gameType=${f.gameType}&tableSize=${f.tableSize}&stack=${f.stack}&position=${f.position}&scenario=${f.scenario ?? 'RFI'}`,
    ).then((r) => r.range),
  friends: () => apiRequest<FriendsResponse>('/friends'),
  addFriend: (code: string) => apiRequest<{ friend: FriendView }>('/friends', { method: 'POST', body: { code } }).then((r) => r.friend),
  removeFriend: (friendId: string) => apiRequest<{ ok: true }>(`/friends/${friendId}`, { method: 'DELETE' }),
  achievements: () => apiRequest<{ achievements: AchievementView[] }>('/achievements').then((r) => r.achievements),
  missions: () => apiRequest<{ missions: MissionView[] }>('/missions').then((r) => r.missions),
  claimMission: (code: string) => apiRequest<MissionClaimResult>(`/missions/${code}/claim`, { method: 'POST' }),
  resetProgress: () => apiRequest<{ ok: true }>('/progress/reset', { method: 'POST' }),
  debugSetPlan: (plan: 'FREE' | 'PREMIUM') => apiRequest<{ ok: true; plan: string }>('/debug/plan', { method: 'POST', body: { plan } }),
  debugAddXp: (amount: number) => apiRequest<{ ok: true; totalXp: number }>('/debug/xp', { method: 'POST', body: { amount } }),
  debugCompleteAll: () => apiRequest<{ ok: true; count: number }>('/debug/complete-all', { method: 'POST' }),
};

export const userApi = {
  onboarding: (input: OnboardingInput) =>
    apiRequest<{ user: PublicUser }>('/onboarding', { method: 'POST', body: input }).then((r) => r.user),
};
