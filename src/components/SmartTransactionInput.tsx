'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Send, Loader2 } from 'lucide-react';
import { smartTransactionService } from '@/lib/api/smartTransaction.service';
import { transactionService } from '@/lib/api/transaction.service';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

interface SmartInputProps {
  onSuccess?: () => void;
}

export default function SmartTransactionInput({ onSuccess }: SmartInputProps) {
  const [command, setCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing || isSaving) return;

    setIsProcessing(true);

    try {
      // Parse command with AI
      const parsed = await smartTransactionService.parseCommand(command.trim());

      // Show confidence warning if low
      if (parsed.confidence < 0.7) {
        error('Interpretação com baixa confiança. Verifique os dados.');
      }

      setIsProcessing(false);
      setIsSaving(true);

      // Find category by name if provided
      let categoryId: number | undefined;
      if (parsed.category_name) {
        try {
          const categories = await queryClient.fetchQuery({
            queryKey: ['categories'],
            queryFn: async () => {
              const { categoryService } = await import('@/lib/api/category.service');
              return categoryService.getAll();
            },
          });
          const category = categories.find(
            (c: any) => c.name.toLowerCase() === parsed.category_name?.toLowerCase()
          );
          if (category) categoryId = category.id;
        } catch {
          // Ignore category lookup errors
        }
      }

      // Create transaction
      await transactionService.create({
        description: parsed.description,
        amount: parsed.amount,
        type: parsed.type,
        transaction_date: parsed.transaction_date,
        category_id: categoryId,
      });

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['dailyBalance'] });

      success(`Transação adicionada: ${parsed.description}`);
      setCommand('');
      onSuccess?.();
    } catch (err: any) {
      const message = err.response?.data?.detail?.detail || 'Erro ao processar comando';
      error(message);
    } finally {
      setIsProcessing(false);
      setIsSaving(false);
    }
  };

  const examples = [
    'Gastei 50 reais no uber hoje',
    'Recebi salário de 3500',
    'Comprei no mercado 120 reais',
  ];

  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 md:p-6 border border-primary-200 dark:border-gray-700 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
          Adicionar por Voz ou Texto
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Ex: gastei 50 reais no uber hoje"
            disabled={isListening || isProcessing || isSaving}
            className="w-full px-4 py-3 pr-24 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 text-sm md:text-base"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {recognitionRef.current && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={isProcessing || isSaving}
                className={`p-2 rounded-lg transition-all ${
                  isListening
                    ? 'bg-danger-500 text-white animate-pulse'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                } disabled:opacity-50`}
                title={isListening ? 'Parar gravação' : 'Gravar por voz'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <button
              type="submit"
              disabled={!command.trim() || isProcessing || isSaving}
              className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Enviar comando"
            >
              {isProcessing || isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Examples */}
        <div className="flex flex-wrap gap-2">
          {examples.map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCommand(example)}
              disabled={isListening || isProcessing || isSaving}
              className="px-3 py-1.5 text-xs md:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>

        {isListening && (
          <div className="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400">
            <div className="w-2 h-2 bg-danger-500 rounded-full animate-pulse" />
            Ouvindo...
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processando com AI...
          </div>
        )}

        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-success-600 dark:text-success-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando transação...
          </div>
        )}
      </form>
    </div>
  );
}
