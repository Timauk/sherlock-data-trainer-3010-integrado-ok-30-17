import React, { useState, useEffect } from 'react';

interface NeuralNetworkVisualizationProps {
  layers: number[];
  inputData?: number[];
  outputData?: number[];
}

const NeuralNetworkVisualization: React.FC<NeuralNetworkVisualizationProps> = ({ layers, inputData, outputData }) => {
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const width = 600;
  const height = 400;
  const nodeRadius = 10;
  const layerSpacing = width / (layers.length + 1);

  useEffect(() => {
    if (inputData && outputData) {
      const newActiveNodes: string[] = [];
      
      // Ativar nós da camada de entrada
      inputData.forEach((value, index) => {
        if (value > 0.5) { // Podemos ajustar este limiar conforme necessário
          newActiveNodes.push(`node-0-${index}`);
        }
      });
      
      // Ativar nós da camada de saída
      outputData.forEach((value, index) => {
        if (value > 0.5) { // Podemos ajustar este limiar conforme necessário
          newActiveNodes.push(`node-${layers.length - 1}-${index}`);
        }
      });
      
      setActiveNodes(newActiveNodes);
    }
  }, [inputData, outputData, layers]);

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
    <div className="mt-8 bg-white p-4 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">Visualização da Rede Neural</h3>
      <svg width={width} height={height}>
        {renderConnections()}
        {renderNodes()}
      </svg>
    </div>
  );
};

export default NeuralNetworkVisualization;