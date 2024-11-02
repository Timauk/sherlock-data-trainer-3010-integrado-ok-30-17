import { saveModel, loadLatestModel } from './training/modelOperations';
import { getTrainingHistory, getLastStoredGame, getStoredGamesCount } from './training/historyService';
import { exportCurrentModel, saveModelFiles } from './training/modelExport';

export const trainingService = {
  saveModel,
  loadLatestModel,
  getTrainingHistory,
  getLastStoredGame,
  getStoredGamesCount,
  exportCurrentModel,
  saveModelFiles
};