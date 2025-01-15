import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface DataUploaderProps {
  onCsvUpload: (file: File) => void;
  onModelUpload: (jsonFile: File, weightsFile: File) => void;
}

const DataUploader: React.FC<DataUploaderProps> = ({
  onCsvUpload,
  onModelUpload
}) => {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const modelJsonInputRef = useRef<HTMLInputElement>(null);
  const modelWeightsInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onCsvUpload(file);
      toast({
        title: "CSV Carregado",
        description: "Arquivo CSV foi carregado com sucesso."
      });
    }
  };

  const handleModelUpload = () => {
    const jsonFile = modelJsonInputRef.current?.files?.[0];
    const weightsFile = modelWeightsInputRef.current?.files?.[0];

    if (jsonFile && weightsFile) {
      onModelUpload(jsonFile, weightsFile);
      toast({
        title: "Modelo Carregado",
        description: "Arquivos do modelo foram carregados com sucesso."
      });
    } else {
      toast({
        title: "Erro no Upload",
        description: "Por favor, selecione ambos os arquivos do modelo.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          type="file"
          ref={csvInputRef}
          onChange={handleCsvUpload}
          accept=".csv"
          className="hidden"
        />
        <Button 
          onClick={() => csvInputRef.current?.click()}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Carregar CSV
        </Button>
      </div>

      <div className="space-y-2">
        <input
          type="file"
          ref={modelJsonInputRef}
          accept=".json"
          className="hidden"
        />
        <input
          type="file"
          ref={modelWeightsInputRef}
          accept=".weights.bin"
          className="hidden"
        />
        <Button 
          onClick={() => modelJsonInputRef.current?.click()}
          className="w-full mb-2"
        >
          <Upload className="mr-2 h-4 w-4" />
          Carregar Modelo (JSON)
        </Button>
        <Button 
          onClick={() => modelWeightsInputRef.current?.click()}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Carregar Pesos do Modelo
        </Button>
        <Button 
          onClick={handleModelUpload}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Save className="mr-2 h-4 w-4" />
          Finalizar Upload do Modelo
        </Button>
      </div>
    </div>
  );
};

export default DataUploader;