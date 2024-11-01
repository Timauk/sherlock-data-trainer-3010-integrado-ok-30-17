import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 mt-8">
      <div className="container mx-auto text-center space-y-2">
        <p className="text-lg">2024 © Sherlok - Treinamento de Sherlock. Todos os direitos reservados.</p>
        <p>
          Orgulhosamente feito com{' '}
          <a href="https://gptengineer.app/" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
            GPT Engineer
          </a>
          {' '}e{' '}
          <a href="https://chat.openai.com" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
            ChatGPT
          </a>
        </p>
        <p>
          Idealizado por{' '}
          <a href="https://www.twitch.tv/1barba" className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
            1BARBA
          </a>
        </p>
        <div className="text-sm text-gray-400 mt-2">
          <p>Agradecimentos especiais:</p>
          <p>SERENNABR, Anjinho, Ruivo, Irmão Jovelino, O Jovelino!</p>
          <p className="italic mt-1">E um agradecimento especial aos loucos que me disseram que era impossível!</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;