import React from 'react'
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface RealTimeFeedbackProps {
  accuracy: number;
  predictionConfidence: number;
  processingSpeed: number;
  memoryUsage: number;
}

const RealTimeFeedback = ({
  accuracy,
  predictionConfidence,
  processingSpeed,
  memoryUsage
}: RealTimeFeedbackProps) => {
  const { toast } = useToast()

  React.useEffect(() => {
    if (accuracy < 50) {
      toast({
        title: "Baixa Precisão",
        description: "O modelo está apresentando baixa precisão nas previsões.",
        variant: "destructive"
      })
    }
  }, [accuracy, toast])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Feedback em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress
          value={accuracy}
          showPercentage
          label="Precisão do Modelo"
        />
        <Progress
          value={predictionConfidence}
          showPercentage
          label="Confiança da Previsão"
        />
        <Progress
          value={processingSpeed}
          showPercentage
          label="Velocidade de Processamento"
        />
        <Progress
          value={memoryUsage}
          showPercentage
          label="Uso de Memória"
        />
      </CardContent>
    </Card>
  )
}

export default RealTimeFeedback