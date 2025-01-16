import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/play');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Bem-vindo ao Jogo</h1>
      <p className="text-lg mb-8">Prepare-se para analisar e prever resultados!</p>
      <Button onClick={handleNavigate}>Iniciar Jogo</Button>
    </div>
  );
};

export default HomePage;
