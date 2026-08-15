import { CosmeticType, QuestConditionType } from '@/app/enums';

export interface CoinResponse {
  userId: string;
  balance?: number;
}

export interface CoinBalanceRequest {
  balance: number;
}

export interface CoinUpsertRequest {
  userId: string;
  balance: number;
}

export interface CoinWalletResponse {
  userCoinId: string;
  userId?: string;
  userName?: string;
  fullName?: string;
  email?: string;
  balance?: number;
  updatedAt?: string;
}

export interface CosmeticRequest {
  name: string;
  description?: string;
  type: CosmeticType;
  costCoins: number;
  assetValue?: string;
  frameStyle?: string;
  imageUrl?: string;
  active?: boolean;
  displayOrder?: number;
}

export interface CosmeticResponse {
  cosmeticId: string;
  name?: string;
  description?: string;
  type?: CosmeticType;
  typeLabel?: string;
  costCoins?: number;
  assetValue?: string;
  frameStyle?: string;
  imageUrl?: string;
  active?: boolean;
  displayOrder?: number;
  owned?: boolean;
  equipped?: boolean;
}

export interface EquippedCosmeticsResponse {
  frame?: CosmeticResponse;
  badge?: CosmeticResponse;
}

export interface QuestRequest {
  title: string;
  description?: string;
  rewardCoins: number;
  conditionType: QuestConditionType;
  conditionTarget?: number;
  startAt?: string;
  endAt?: string;
  active?: boolean;
}

export interface QuestResponse {
  questId: string;
  title?: string;
  description?: string;
  rewardCoins?: number;
  conditionType?: QuestConditionType;
  conditionLabel?: string;
  conditionTarget?: number;
  startAt?: string;
  endAt?: string;
  active?: boolean;
  createdAt?: string;
  claimCount?: number;
}

export interface UserQuestResponse {
  questId: string;
  title?: string;
  description?: string;
  rewardCoins?: number;
  conditionType?: QuestConditionType;
  conditionLabel?: string;
  currentProgress?: number;
  target?: number;
  claimed?: boolean;
  eligible?: boolean;
  endAt?: string;
}

export interface QuestClaimResponse {
  questId: string;
  rewardCoins?: number;
  newBalance?: number;
}

export interface StreakResponse {
  currentStreak?: number;
  longestStreak?: number;
  lastActivityDate?: string;
  increased?: boolean;
  lostStreak?: number;
  canRecover?: boolean;
  recoverCost?: number;
}

export interface StreakRecoverConfigRequest {
  costCoins: number;
  active?: boolean;
}

export interface StreakRecoverConfigResponse {
  costCoins?: number;
  active?: boolean;
}
