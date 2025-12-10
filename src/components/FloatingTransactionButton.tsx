'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Mic, MicOff, Send, Loader2, Sparkles, CheckCircle, Camera, Upload, Trash2, Edit2 } from 'lucide-react';
import { transactionService } from '@/lib/api/transaction.service';
import { smartTransactionService } from '@/lib/api/smartTransaction.service';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface ParsedTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
}

export default function FloatingTransactionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [confirmData, setConfirmData] = useState<ParsedTransaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();
  const queryClient = useQueryClient();

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
      error('Reconhecimento de voz não suportado');
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Por favor, selecione uma imagem válida');
      return;
    }

    setIsProcessing(true);
    setStatus(null);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('image', file);

      const response = await smartTransactionService.parseImage(file);
      
      if (response && response.description && response.amount && response.type) {
        setConfirmData({
          description: response.description,
          amount: response.amount,
          type: response.type,
          date: response.transaction_date || new Date().toISOString().split('T')[0],
        });
      } else {
        setStatus({ type: 'error', message: 'Não consegui identificar os dados da imagem. Tente digitar manualmente.' });
        setPreviewImage(null);
      }
    } catch (err) {
      console.error('Image processing error:', err);
      setStatus({ type: 'error', message: 'Erro ao processar imagem. Tente novamente.' });
      setPreviewImage(null);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      error('Por favor, selecione um arquivo de áudio válido');
      return;
    }

    setIsProcessing(true);
    setStatus(null);
    setAudioFile(file);

    try {
      const response = await smartTransactionService.parseAudio(file);
      
      if (response && response.description && response.amount && response.type) {
        setConfirmData({
          description: response.description,
          amount: response.amount,
          type: response.type,
          date: response.transaction_date || new Date().toISOString().split('T')[0],
        });
      } else {
        setStatus({ type: 'error', message: 'Não consegui entender o áudio. Tente novamente.' });
        setAudioFile(null);
      }
    } catch (err) {
      console.error('Audio processing error:', err);
      setStatus({ type: 'error', message: 'Erro ao processar áudio. Tente novamente.' });
      setAudioFile(null);
    } finally {
      setIsProcessing(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  const parseCommandWithAI = async (cmd: string): Promise<ParsedTransaction | null> => {
    try {
      const parsed = await smartTransactionService.parseCommand(cmd);
      
      if (!parsed || !parsed.description || !parsed.amount || !parsed.type || !parsed.transaction_date) {
        return null;
      }

      if (parsed.amount <= 0) {
        return null;
      }

      if (!['income', 'expense'].includes(parsed.type)) {
        return null;
      }

      return {
        description: parsed.description,
        amount: parsed.amount,
        type: parsed.type,
        date: parsed.transaction_date,
      };
    } catch (err) {
      console.error('AI parsing failed:', err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    setStatus(null);

    try {
      const parsed = await parseCommandWithAI(command);
      
      if (!parsed) {
        setStatus({ type: 'error', message: 'Não consegui entender. Tente: "gastei 50 reais no mercado"' });
        setIsProcessing(false);
        return;
      }

      setConfirmData(parsed);
    } catch (err: any) {
      console.error('Transaction error:', err);
      setStatus({ type: 'error', message: 'Erro ao processar. Tente novamente.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmData) return;

    setIsProcessing(true);
    setStatus(null);

    try {
      await transactionService.create({
        description: confirmData.description,
        amount: confirmData.amount,
        type: confirmData.type,
        transaction_date: confirmData.date,
      });

      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['dailyBalance'] });

      const typeText = confirmData.type === 'income' ? 'Receita' : 'Despesa';
      setStatus({ 
        type: 'success', 
        message: `${typeText} "${confirmData.description}" de R$ ${confirmData.amount.toFixed(2)} cadastrada com sucesso!` 
      });
      setCommand('');
      setConfirmData(null);
      setPreviewImage(null);
      setAudioFile(null);
      setIsEditing(false);
      
      setTimeout(() => {
        setIsOpen(false);
        setStatus(null);
      }, 3000);
    } catch (err: any) {
      console.error('Transaction error:', err);
      setStatus({ type: 'error', message: 'Erro ao criar transação. Tente novamente.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setConfirmData(null);
    setPreviewImage(null);
    setAudioFile(null);
    setIsEditing(false);
    setCommand('');
  };

  const examples = [
    'Gastei 50 reais no uber',
    'Recebi salário de 3500',
    'Comprei no mercado 120',
  ];

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioUpload}
        className="hidden"
      />

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => !isProcessing && setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-20 right-4 md:bottom-24 md:right-8 w-[calc(100vw-2rem)] max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden"
            >
              <div className="bg-gray-900 dark:bg-gray-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 dark:bg-gray-900/10 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white dark:text-gray-900" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white dark:text-gray-900">Nova Transação</h3>
                    <p className="text-xs text-white/70 dark:text-gray-900/70">
                      {confirmData ? 'Confirme os dados' : 'Digite, fale ou envie foto/áudio'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isProcessing && setIsOpen(false)}
                  disabled={isProcessing}
                  className="p-2 hover:bg-white/10 dark:hover:bg-gray-900/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-white dark:text-gray-900" />
                </button>
              </div>

              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {isProcessing && !confirmData && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8"
                  >
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Processando com IA...
                    </p>
                  </motion.div>
                )}

                {status ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border-2 ${
                      status.type === 'success'
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {status.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <p className={`text-sm ${
                        status.type === 'success'
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {status.message}
                      </p>
                    </div>
                  </motion.div>
                ) : confirmData ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {previewImage && (
                      <div className="relative">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => setPreviewImage(null)}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}

                    {audioFile && (
                      <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Upload className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                          {audioFile.name}
                        </span>
                        <button
                          onClick={() => setAudioFile(null)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    )}

                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Dados identificados:</h4>
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Descrição
                            </label>
                            <Input
                              type="text"
                              value={confirmData.description}
                              onChange={(e) => setConfirmData({ ...confirmData, description: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Valor
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={confirmData.amount}
                                onChange={(e) => setConfirmData({ ...confirmData, amount: parseFloat(e.target.value) })}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Data
                              </label>
                              <Input
                                type="date"
                                value={confirmData.date}
                                onChange={(e) => setConfirmData({ ...confirmData, date: e.target.value })}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Tipo
                            </label>
                            <Select
                              value={confirmData.type}
                              onValueChange={(value: 'income' | 'expense') => setConfirmData({ ...confirmData, type: value })}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="expense">Despesa</SelectItem>
                                <SelectItem value="income">Receita</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Descrição:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{confirmData.description}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Valor:</span>
                            <span className="font-medium text-gray-900 dark:text-white">R$ {confirmData.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                            <span className={`font-medium ${confirmData.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {confirmData.type === 'income' ? 'Receita' : 'Despesa'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Data:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {new Date(confirmData.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          'Confirmar'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="Ex: gastei 50 reais no uber"
                        disabled={isListening || isProcessing}
                        className="w-full px-4 py-3 pr-20 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent disabled:opacity-50 transition-all"
                        autoFocus
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {recognitionRef.current && (
                          <motion.button
                            type="button"
                            onClick={toggleListening}
                            disabled={isProcessing}
                            className={`p-2 rounded-lg transition-colors ${
                              isListening
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            } disabled:opacity-50`}
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
                        <motion.button
                          type="submit"
                          disabled={!command.trim() || isProcessing}
                          className="p-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm font-medium"
                      >
                        <Camera className="w-4 h-4" />
                        Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => audioInputRef.current?.click()}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm font-medium"
                      >
                        <Upload className="w-4 h-4" />
                        Áudio
                      </button>
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

                    {isListening && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
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
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="plus"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
