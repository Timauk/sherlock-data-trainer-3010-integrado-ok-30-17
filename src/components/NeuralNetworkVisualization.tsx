import React, { useState, useEffect } from 'react';
import { ModelVisualization } from '@/types/gameTypes';

interface NeuralNetworkVisualizationProps {
  layers?: number[];
  inputData?: number[];
  outputData?: number[];
  visualization?: ModelVisualization;
  metrics: {
    accuracy: number;
    randomAccuracy: number;
    totalPredictions: number;
  };
}

const NeuralNetworkVisualization: React.FC<NeuralNetworkVisualizationProps> = ({
  layers = [15, 128, 128, 15],
  visualization,
  metrics,
  inputData,
  outputData
}) => {
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const width = 600;
  const height = 400;
  const nodeRadius = 10;
  const layerSpacing = width / (layers.length + 1);

  useEffect(() => {
    if (visualization?.predictions) {
      const newActiveNodes = visualization.predictions
        .filter(pred => pred.probability > 0.5)
        .map(pred => `node-${layers.length - 1}-${pred.number}`);
      setActiveNodes(newActiveNodes);
    }
  }, [visualization, layers.length]);

  const calculateNodePosition = (layerIndex: number, nodeIndex: number, nodesInLayer: number) => {
    const x = (layerIndex + 1) * layerSpacing;
    const layerHeight = (height - 40) / (nodesInLayer + 1);
    const y = (nodeIndex + 1) * layerHeight + 20;
    return { x, y };
  };

  const renderNodes = () => {
    return layers.flatMap((nodesInLayer, layerIndex) =>
      Array.from({ length: nodesInLayer }, (_, nodeIndex) => {
        const { x, y } = calculateNodePosition(layerIndex, nodeIndex, nodesInLayer);
        const nodeKey = `node-${layerIndex}-${nodeIndex}`;
        return (
          <circle
            key={nodeKey}
            cx={x}
            cy={y}
            r={nodeRadius}
            className={`fill-blue-500 transition-all duration-300 ${
              activeNodes.includes(nodeKey) ? 'animate-pulse' : ''
            }`}
          />
        );
      })
    );
  };

  const renderConnections = () => {
    return layers.slice(0, -1).flatMap((nodesInLayer, layerIndex) =>
      Array.from({ length: nodesInLayer }, (_, nodeIndex) =>
        Array.from({ length: layers[layerIndex + 1] }, (_, nextNodeIndex) => {
          const start = calculateNodePosition(layerIndex, nodeIndex, nodesInLayer);
          const end = calculateNodePosition(layerIndex + 1, nextNodeIndex, layers[layerIndex + 1]);
          return (
            <line
              key={`connection-${layerIndex}-${nodeIndex}-${nextNodeIndex}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              className="stroke-gray-300"
              strokeWidth="1"
            />
          );
        })
      ).flat()
    );
  };

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">Visualização da Rede Neural</h3>
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
          <p className="font-semibold">Precisão</p>
          <p>{(metrics.accuracy * 100).toFixed(2)}%</p>
        </div>
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
          <p className="font-semibold">Precisão Aleatória</p>
          <p>{(metrics.randomAccuracy * 100).toFixed(2)}%</p>
        </div>
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
          <p className="font-semibold">Total de Previsões</p>
          <p>{metrics.totalPredictions}</p>
        </div>
      </div>
      <svg width={width} height={height} className="mx-auto">
        {renderConnections()}
        {renderNodes()}
      </svg>
    </div>
  );
};

export default NeuralNetworkVisualization;