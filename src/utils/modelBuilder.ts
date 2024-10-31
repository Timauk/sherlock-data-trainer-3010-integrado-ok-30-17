import * as tf from '@tensorflow/tfjs';
import { enhancedLogger } from './logging/enhancedLogger';

export interface ModelConfig {
  inputShape: number[];
  batchSize: number;
  learningRate: number;
  useLSTM?: boolean;
}

export class ModelBuilder {
  static createModel(config: ModelConfig): tf.LayersModel {
    const model = tf.sequential();

    if (config.useLSTM) {
      // Adiciona camada LSTM
      model.add(tf.layers.lstm({
        units: 128,
        returnSequences: true,
        inputShape: config.inputShape
      }));

      model.add(tf.layers.lstm({
        units: 64,
        returnSequences: false
      }));
    }

    // Camada densa com regularização
    model.add(tf.layers.dense({
      units: 256,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l1l2({ l1: 0.01, l2: 0.01 })
    }));

    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.3 }));

    // Camada intermediária
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l1l2({ l1: 0.01, l2: 0.01 })
    }));

    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Camada de saída
    model.add(tf.layers.dense({
      units: 15,
      activation: 'sigmoid'
    }));

    // Configura o otimizador
    const optimizer = tf.train.adamax(config.learningRate);

    model.compile({
      optimizer,
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    enhancedLogger.log('model', 'Modelo criado com sucesso', {
      config: {
        hasLSTM: config.useLSTM,
        inputShape: config.inputShape,
        batchSize: config.batchSize
      }
    });

    return model;
  }
}