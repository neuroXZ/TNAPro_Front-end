import { createCrudApi } from './crud-factory';

export interface DevelopmentStrategy {
  id: string;
  name: string;
  minGap: number;
  color: string;
  isTrainingLinked: boolean;
  order: number;
}

export const developmentStrategyAPI = createCrudApi<DevelopmentStrategy>('/developmentstrategy');
