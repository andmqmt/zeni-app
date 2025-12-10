'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { transactionService } from '@/lib/api/transaction.service';
import { smartTransactionService } from '@/lib/api/smartTransaction.service';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

interface SmartInputProps {
  onSuccess?: () => void;
}

export default function SmartTransactionInput({ onSuccess }: SmartInputProps) {
  const [command, setCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCommand(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        error('Erro ao capturar áudio');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [error]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      error('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setCommand('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const parseCommandWithAI = async (cmd: string): Promise<{ description: string; amount: number; type: 'income' | 'expense'; date: string } | null> => {
    try {
      const parsed = await smartTransactionService.parseCommand(cmd);
      
      if (!parsed || !parsed.description || !parsed.amount || !parsed.type || !parsed.transaction_date) {
        return parseCommandWithRegex(cmd);
      }

      if (parsed.amount <= 0) {
        return parseCommandWithRegex(cmd);
      }

      if (!['income', 'expense'].includes(parsed.type)) {
        return parseCommandWithRegex(cmd);
      }

      return {
        description: parsed.description,
        amount: parsed.amount,
        type: parsed.type,
        date: parsed.transaction_date,
      };
    } catch (err) {
      console.error('AI parsing failed:', err);
      return parseCommandWithRegex(cmd);
    }
  };

  const parseCommandWithRegex = (cmd: string): { description: string; amount: number; type: 'income' | 'expense'; date: string } | null => {
    const text = cmd.toLowerCase().trim();
    
    // Detectar tipo (receita ou despesa)
    const isIncome = /receb|ganhe|salário|salario|renda|pagamento recebido/i.test(text);
    const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';
    
    // Extrair valor (procura por números com vírgula ou ponto)
    const amountMatch = text.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|r\$|brl)?/i);
    if (!amountMatch) return null;
    
    const amount = parseFloat(amountMatch[1].replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return null;
    
    // Extrair descrição (tudo que não é valor ou data)
    let description = text
      .replace(/gastei|recebi|paguei|comprei|ganhei/i, '')
      .replace(/\d+(?:[.,]\d{1,2})?\s*(?:reais|real|r\$|brl)?/i, '')
      .replace(/hoje|ontem|anteontem/i, '')
      .replace(/no|na|em|de|com|para/gi, '')
      .trim();
    
    if (!description) {
      description = isIncome ? 'Receita' : 'Despesa';
    }
    
    // Extrair data
    const today = new Date();
    let date = today;
    
    if (/ontem/i.test(text)) {
      date = new Date(today);
      date.setDate(date.getDate() - 1);
    } else if (/anteontem/i.test(text)) {
      date = new Date(today);
      date.setDate(date.getDate() - 2);
    }
    
    const dateStr = date.toISOString().split('T')[0];
    
    return { description, amount, type, date: dateStr };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      const parsed = await parseCommandWithAI(command);
      
      if (!parsed) {
        error('❌ Não consegui entender o comando. Tente: "gastei 50 reais no mercado"');
        return;
      }

      await transactionService.create({
        description: parsed.description,
        amount: parsed.amount,
        type: parsed.type,
        transaction_date: parsed.date,
      });

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['dailyBalance'] });

      success(`✅ ${parsed.type === 'income' ? 'Receita' : 'Despesa'} adicionada: ${parsed.description} - R$ ${parsed.amount.toFixed(2)}`);
      setCommand('');
      onSuccess?.();
    } catch (err: any) {
      console.error('SmartTransaction error:', err);
      
      let message = 'Erro ao criar transação';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.detail?.detail) {
          message = errorData.detail.detail;
        } else if (typeof errorData.detail === 'string') {
          message = errorData.detail;
        } else if (errorData.message) {
          message = errorData.message;
        }
      } else if (err.message) {
        message = err.message;
      }
      
      error(`❌ ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const examples = [
    'Gastei 50 reais no uber hoje',
    'Recebi salário de 3500',
    'Comprei no mercado 120 reais',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gray-900 dark:bg-gray-100 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white dark:text-gray-900" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Adicionar Transação
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Ex: gastei 50 reais no uber hoje"
            disabled={isListening || isProcessing}
            className="w-full px-4 py-3 pr-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent disabled:opacity-50 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <AnimatePresence>
              {recognitionRef.current && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  type="button"
                  onClick={toggleListening}
                  disabled={isProcessing}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  } disabled:opacity-50`}
                  title={isListening ? 'Parar gravação' : 'Gravar por voz'}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </motion.div>
                </motion.button>
              )}
            </AnimatePresence>
            <motion.button
              type="submit"
              disabled={!command.trim() || isProcessing}
              className="p-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Enviar comando"
              whileTap={{ scale: 0.95 }}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {examples.map((example, idx) => (
            <motion.button
              key={idx}
              type="button"
              onClick={() => setCommand(example)}
              disabled={isListening || isProcessing}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {example}
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
            >
              <motion.div
                className="w-2 h-2 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              Ouvindo...
            </motion.div>
          )}

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Criando transação...
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}
