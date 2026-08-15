export interface PartRequirementRequest {
  examPartId?: string;
  requiredPercentage?: number;
}

export interface PartRequirementResponse {
  targetPartRequirementId: string;
  examPartId?: string;
  requiredPercentage?: number;
}

export interface MilestoneRequest {
  examTypeId: string;
  milestoneScore: number;
  description?: string;
  partRequirements?: PartRequirementRequest[];
}

export interface MilestoneResponse {
  examTargetMilestoneId: string;
  examTypeId?: string;
  milestoneScore?: number;
  description?: string;
  createdAt?: string;
  partRequirements?: PartRequirementResponse[];
}

export interface UserPartRequirementRequest {
  examPartId?: string;
  customPercentage?: number;
}

export interface UserTargetPartResponse {
  examPartId: string;
  requiredPercentage?: number;
  currentScore?: number;
  lastUserTestId?: string;
}

export interface UserTargetRequest {
  examTypeId: string;
  targetScore: number;
  targetReadiness?: number;
  customParts?: UserPartRequirementRequest[];
}

export interface UserTargetResponse {
  hasTarget: boolean;
  userTargetId?: string;
  userId?: string;
  examTypeId?: string;
  targetScore?: number;
  targetReadiness?: number;
  achievedAt?: string;
  partRequirements?: UserTargetPartResponse[];
}
