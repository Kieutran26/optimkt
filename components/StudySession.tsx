
import React, { useState, useEffect } from 'react';
import { StudyMode, Word } from '../types';
import { StorageService } from '../services/storageService';
import { Star, ArrowLeft, ArrowRight } from 'lucide-react';

interface StudySessionProps {
  mode: StudyMode;
  setIds?: string[]; // Optional now
  initialWords?: Word[]; // New prop for studying specific words
  onExit: () => void;
}

const StudySession: React.FC<StudySessionProps> = ({ mode, setIds, initialWords, onExit }) => {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false); // Flashcard
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null); // Quiz
  const [options, setOptions] = useState<string[]>([]); // Quiz
  const [inputValue, setInputValue] = useState(''); // Writing
  const [checkResult, setCheckResult] = useState<'correct' | 'incorrect' | null>(null); // Writing

  useEffect(() => {
    let loadedWords: Word[] = [];
    
    if (initialWords && initialWords.length > 0) {
        // Use words passed directly (from Starred view)
        loadedWords = [...initialWords];
    } else if (setIds && setIds.length > 0) {
        // Fetch from storage based on set IDs
        loadedWords = StorageService.getWordsBySet(setIds);
    }

    // Shuffle words
    const shuffled = [...loadedWords].sort(() => 0.5 - Math.random());
    setWords(shuffled);
  }, [setIds, initialWords]);

  // Quiz Options Logic
  useEffect(() => {
    if (mode === StudyMode.QUIZ && words.length > 0) {
      const currentWord = words[currentIndex];
      const otherWords = words.filter(w => w.id !== currentWord.id);
      
      // We need distractors. If not enough words in the filtered list, we might need to fetch random words from storage
      // For now, let's try to get distractors from the current session list first
      let pool = otherWords;
      
      // If pool is too small (e.g. studying only 2 starred words), fetch more random words from storage to act as distractors
      if (pool.length < 3) {
          const allStorageWords = StorageService.getWords();
          const moreDistractors = allStorageWords.filter(w => w.id !== currentWord.id && !pool.find(p => p.id === w.id));
          pool = [...pool, ...moreDistractors];
      }

      const distractors = pool
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(w => w.definition);
      
      const allOptions = [...distractors, currentWord.definition].sort(() => 0.5 - Math.random());
      setOptions(allOptions);
      setSelectedAnswer(null);
    }
  }, [currentIndex, words, mode]);

  // Writing Reset
  useEffect(() => {
    if (mode === StudyMode.WRITING) {
        setInputValue('');
        setCheckResult(null);
    }
  }, [currentIndex, mode]);

  const toggleStar = () => {
    if (!words[currentIndex]) return;
    const word = words[currentIndex];
    StorageService.toggleStar(word.id);
    // Update local state to reflect change immediately
    const updatedWords = [...words];
    updatedWords[currentIndex] = { ...word, starred: !word.starred };
    setWords(updatedWords);
  };

  const nextCard = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
        alert("Đã hoàn thành danh sách!");
        onExit();
    }
  };

  // --- RENDERERS ---

  const renderFlashcard = () => {
    const word = words[currentIndex];
    return (
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full max-w-lg aspect-[4/3] cursor-pointer [perspective:1000px] mx-auto"
      >
        <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] shadow-2xl shadow-indigo-100 rounded-3xl ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          {/* Front */}
          <div className="absolute w-full h-full [backface-visibility:hidden] bg-white rounded-3xl flex flex-col items-center justify-center p-8 border border-white">
            <span className="text-sm text-slate-400 font-medium uppercase tracking-wider absolute top-8">Tiếng Anh</span>
            <h2 className="text-4xl font-bold text-center text-slate-800">{word.term}</h2>
            <p className="text-slate-300 text-sm mt-4 italic">Click để lật</p>
          </div>
          {/* Back */}
          <div className="absolute w-full h-full [backface-visibility:hidden] bg-green-500 text-white rounded-3xl [transform:rotateY(180deg)] flex flex-col items-center justify-center p-8 shadow-inner">
            <span className="text-sm text-green-100 font-medium uppercase tracking-wider absolute top-8">Tiếng Việt</span>
            <h2 className="text-3xl font-bold text-center">{word.definition}</h2>
          </div>
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    const word = words[currentIndex];
    
    const handleAnswer = (option: string) => {
        if (selectedAnswer) return; // Prevent multiple clicks
        setSelectedAnswer(option);
    };

    return (
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white p-10 rounded-3xl shadow-soft border border-slate-100 mb-8 text-center">
            <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Thuật ngữ</span>
            <h2 className="text-4xl font-bold mt-2 text-slate-800">{word.term}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt, idx) => {
                let btnClass = "bg-white hover:bg-slate-50 border-slate-200";
                if (selectedAnswer) {
                    if (opt === word.definition) btnClass = "bg-green-100 border-green-500 text-green-800 ring-2 ring-green-200";
                    else if (opt === selectedAnswer) btnClass = "bg-red-100 border-red-500 text-red-800 ring-2 ring-red-200";
                    else btnClass = "bg-slate-50 opacity-50 border-transparent";
                }

                return (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        className={`p-6 rounded-2xl border-2 font-medium text-lg transition-all text-left shadow-sm ${btnClass}`}
                    >
                        {opt}
                    </button>
                )
            })}
        </div>
        {selectedAnswer && (
             <div className="mt-8 flex justify-center">
                 <button onClick={nextCard} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)]">
                    Câu tiếp theo <ArrowRight size={20} strokeWidth={1.5}/>
                 </button>
             </div>
        )}
      </div>
    );
  };

  const renderWriting = () => {
    const word = words[currentIndex];
    
    const checkAnswer = () => {
        if (inputValue.toLowerCase().trim() === word.term.toLowerCase().trim()) {
            setCheckResult('correct');
        } else {
            setCheckResult('incorrect');
        }
    };

    return (
        <div className="max-w-xl mx-auto w-full">
            <div className="bg-white p-10 rounded-3xl shadow-soft border border-slate-100 mb-8 text-center">
                <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Định nghĩa</span>
                <h2 className="text-3xl font-bold mt-2 text-slate-800">{word.definition}</h2>
            </div>

            <div className="flex flex-col gap-4">
                <input 
                    className={`w-full p-5 text-xl text-center font-bold border-2 rounded-2xl focus:outline-none transition-all
                        ${checkResult === 'correct' ? 'border-green-500 bg-green-50 text-green-800' : 
                          checkResult === 'incorrect' ? 'border-red-500 bg-red-50 text-red-800' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'}`}
                    placeholder="Nhập từ tiếng Anh..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            if (checkResult) nextCard();
                            else checkAnswer();
                        }
                    }}
                    disabled={checkResult === 'correct'}
                />
                
                {checkResult === null ? (
                     <button onClick={checkAnswer} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)]">
                        Kiểm tra
                    </button>
                ) : (
                    <div className="animate-fade-in">
                        {checkResult === 'incorrect' && (
                            <div className="mb-4 text-center">
                                <p className="text-red-600 font-medium mb-1">Sai rồi!</p>
                                <p className="text-slate-600">Đáp án đúng: <span className="font-bold text-slate-900">{word.term}</span></p>
                            </div>
                        )}
                        <button onClick={nextCard} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-soft">
                            Tiếp tục <ArrowRight size={20} strokeWidth={1.5}/>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
  };

  if (words.length === 0) return <div className="p-10 text-center">Đang tải dữ liệu hoặc danh sách trống...</div>;

  const currentWord = words[currentIndex];

  return (
    <div className="h-screen flex flex-col bg-slate-50">
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-slate-200 shadow-sm z-10">
            <button onClick={onExit} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors">
                <ArrowLeft size={18} strokeWidth={1.5}/> Thoát
            </button>
            <div className="font-bold text-lg text-slate-700">
                {currentIndex + 1} / {words.length}
            </div>
            <button 
                onClick={toggleStar} 
                className={`p-2.5 rounded-full transition-all ${currentWord.starred ? 'text-yellow-500 bg-yellow-50 shadow-sm' : 'text-slate-300 hover:text-slate-400 hover:bg-slate-100'}`}
            >
                <Star size={22} fill={currentWord.starred ? "currentColor" : "none"} strokeWidth={1.5} />
            </button>
        </div>

        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-y-auto">
            {mode === StudyMode.FLASHCARD && renderFlashcard()}
            {mode === StudyMode.QUIZ && renderQuiz()}
            {mode === StudyMode.WRITING && renderWriting()}

            {mode === StudyMode.FLASHCARD && (
                 <div className="mt-12 flex gap-4">
                     <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 font-medium shadow-sm transition-all text-slate-600">
                         Trước
                     </button>
                     <button onClick={nextCard} className="px-8 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] transition-all">
                         Tiếp theo
                     </button>
                 </div>
            )}
        </div>
    </div>
  );
};

export default StudySession;
