import React, { useState } from 'react';
import { MessageSquare, Phone, X } from 'lucide-react';
import StatAIChat from './chats/StatAIChat';
import OperatorChat from './chats/OperatorChat';

const FloatingSupport: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isOperatorOpen, setIsOperatorOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isMenuOpen) {
      setIsChatbotOpen(false);
      setIsOperatorOpen(false);
    }
  };

  const openChatbot = () => {
    setIsChatbotOpen(true);
    setIsOperatorOpen(false);
    setIsMenuOpen(false);
  };

  const openOperator = () => {
    setIsOperatorOpen(true);
    setIsChatbotOpen(false);
    setIsMenuOpen(false);
  };

  const closeChatbot = () => {
    setIsChatbotOpen(false);

    
    setIsMenuOpen(true);
  };

  const closeOperator = () => {
    setIsOperatorOpen(false);
    setIsMenuOpen(true);
  };

  return (
    <>
      {/* Floating Menu */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3">
        {isMenuOpen && (
          <div className="flex items-center gap-3 animate-fadeIn">
            <button
              onClick={openChatbot}
              className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="w-6 h-6" />
            </button>
            <button
              onClick={openOperator}
              className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        )}
        <button
          onClick={toggleMenu}
          className={`p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-transform duration-300 ${
            isMenuOpen ? 'rotate-45' : ''
          }`}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Chat Windows */}
      {isChatbotOpen && <StatAIChat onClose={closeChatbot} />}
      {isOperatorOpen && <OperatorChat onClose={closeOperator} />}
    </>
  );
};

export default FloatingSupport;