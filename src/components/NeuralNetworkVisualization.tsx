import React from 'react';

interface NeuralNetworkVisualizationProps {
  layers: number[];
}

const NeuralNetworkVisualization: React.FC<NeuralNetworkVisualizationProps> = ({ layers }) => {
  const width = 600;
  const height = 400;
  const nodeRadius = 10;
  const layerSpacing = width / (layers.length + 1);
  const maxNodesInLayer = Math.max(...layers);

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
        return (
          <circle
            key={`node-${layerIndex}-${nodeIndex}`}
            cx={x}
            cy={y}
            r={nodeRadius}
            fill="#4299e1"
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
              stroke="#a0aec0"
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