import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LotofacilLoggerProps {
  numbers: number[][];
  dates?: Date[];
}

const LotofacilLogger: React.FC<LotofacilLoggerProps> = ({ numbers, dates }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Logs da Lotofácil</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          {numbers.map((draw, index) => (
            <div key={index} className="mb-4 p-2 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">
                  Concurso #{numbers.length - index}
                </Badge>
                {dates && (
                  <span className="text-sm text-muted-foreground">
                    {new Date(dates[index]).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {draw.sort((a, b) => a - b).map((number, numIndex) => (
                  <span
                    key={numIndex}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                  >
                    {number.toString().padStart(2, '0')}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Soma: {draw.reduce((a, b) => a + b, 0)}
                {' | '}
                Pares: {draw.filter(n => n % 2 === 0).length}
                {' | '}
                Ímpares: {draw.filter(n => n % 2 !== 0).length}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LotofacilLogger;