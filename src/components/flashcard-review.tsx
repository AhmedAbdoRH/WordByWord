
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X, ArrowLeft, Loader2 } from "lucide-react"; // Import ArrowLeft
import { useRouter } from 'next/navigation';
import { Progress } from "@/components/ui/progress";

interface Word {
  arabic: string;
  english: string;
  id: string; // ID is mandatory here
  uid?: string;
  difficulty?: 'easy' | 'hard'; // Optional difficulty marker
}


interface FlashcardReviewProps {
  words: Word[]; // Expect words with IDs, english, and arabic
  onToggleHardWord: (wordId: string, isHard: boolean) => void;
  onReviewComplete: (easyWordIds: string[]) => void; // Callback when review finishes
  loading: boolean; // Add loading prop
}


export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ words, onToggleHardWord, onReviewComplete, loading }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [easyWordIds, setEasyWordIds] = useState<string[]>([]); // Store IDs of easy words
  const [hardWordCount, setHardWordCount] = useState(0); // Count hard words marked in this session
  const [reviewedCount, setReviewedCount] = useState(0); // Count total words reviewed in this session
  const [reviewCompleted, setReviewCompleted] = useState(false); // Track if review is completed
  const [isDelaying, setIsDelaying] = useState(false); // Track if we are in the 3-second delay
  const hardButtonTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref to store the timeout ID

  // Reset state when words change or loading finishes
  useEffect(() => {
    if (!loading) { // Reset only when loading is complete
        setCurrentWordIndex(0);
        setShowTranslation(false);
        setEasyWordIds([]);
        setHardWordCount(0);
        setReviewedCount(0);
        setReviewCompleted(false);
        setIsDelaying(false);
        if (hardButtonTimeoutRef.current) {
          clearTimeout(hardButtonTimeoutRef.current); // Clear any existing timeout on reset
          hardButtonTimeoutRef.current = null;
        }
    }
    // Cleanup timeout on component unmount
    return () => {
        if (hardButtonTimeoutRef.current) {
            clearTimeout(hardButtonTimeoutRef.current);
        }
    };
  }, [words, loading]); // Depend on words and loading


  // Get the current word based on the index
  const currentWord = words.length > 0 ? words[currentWordIndex] : null;

  const handlePreviousWord = useCallback(() => {
     if (words.length === 0 || currentWordIndex === 0 || isDelaying) return; // Prevent going below 0 or during delay
    setCurrentWordIndex((prevIndex) => prevIndex - 1); // Simple decrement
    setShowTranslation(false);
     // Don't decrement reviewedCount when going back, as it tracks forward progress
  }, [words.length, currentWordIndex, isDelaying]);


 const handleNextWordLogic = useCallback(() => {
    setIsDelaying(false); // End delay
    const nextIndex = currentWordIndex + 1;
    if (nextIndex >= words.length) {
        // Last word reviewed
        if (!reviewCompleted) {
            // Ensure count matches total before completing
             setReviewedCount(prev => Math.max(prev, words.length)); // Ensure count is at least words.length
            handleReviewComplete();
        }
    } else {
        setCurrentWordIndex(nextIndex);
        setShowTranslation(false);
    }
 }, [currentWordIndex, words.length, reviewCompleted]); // Removed dependency on reviewedCount


  // Effect to trigger completion check after reviewedCount updates
  useEffect(() => {
    // Check completion only when not delaying and review isn't already marked complete
    if (!isDelaying && !reviewCompleted && words.length > 0 && reviewedCount >= words.length) {
       handleReviewComplete();
    }
  }, [reviewedCount, words.length, reviewCompleted, isDelaying]); // Add isDelaying


  const handleToggleTranslation = () => {
    if (isDelaying) return; // Prevent toggling during delay
    setShowTranslation((prev) => !prev);
  };

 const handleMarkEasy = () => {
    if (currentWord && !isDelaying) {
      if (!easyWordIds.includes(currentWord.id)) {
        setEasyWordIds(prev => [...prev, currentWord.id]);
      }
      onToggleHardWord(currentWord.id, false); // Mark as easy
      setReviewedCount(prev => prev + 1); // Increment reviewed count
      handleNextWordLogic(); // Move to the next word or complete
    }
  };


 const handleMarkHard = () => {
    if (currentWord && !isDelaying) {
      setHardWordCount(prevCount => prevCount + 1);
      onToggleHardWord(currentWord.id, true); // Mark as hard

      // Show translation and start delay
      setShowTranslation(true);
      setIsDelaying(true);

      // Clear previous timeout if any
      if (hardButtonTimeoutRef.current) {
          clearTimeout(hardButtonTimeoutRef.current);
      }

      // Set timeout to advance after 3 seconds
      hardButtonTimeoutRef.current = setTimeout(() => {
        setReviewedCount(prev => prev + 1); // Increment reviewed count *after* delay
        handleNextWordLogic(); // Move to the next word or complete
         hardButtonTimeoutRef.current = null; // Clear ref after execution
      }, 1500); // 1500 milliseconds = 1.5 seconds
    }
  };

  const handleReviewComplete = () => {
    console.log("Calling onReviewComplete with easy IDs:", easyWordIds);
    setReviewCompleted(true); // Mark review as completed first
    onReviewComplete(easyWordIds); // Pass easy IDs for deletion
    // Do not automatically navigate
    // router.push('/hard-words');
     toast({ title: "تمت مراجعة جميع الكلمات!" });
  };


  const progress = words.length > 0 ? (reviewedCount / words.length) * 100 : 0;

   if (loading) {
     return (
       <div className="flex flex-col items-center justify-center h-64">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         <p className="mt-2 text-muted-foreground">جاري تحميل الكلمات...</p>
       </div>
     );
   }


  if (words.length === 0) {
    return <div className="text-center mt-10">لا توجد كلمات للمراجعة. الرجاء إضافة بعض الكلمات أولاً.</div>;
  }

  if (reviewCompleted) {
    return (
      <div className="flex flex-col items-center space-y-4 mt-10">
        <div className="text-center text-lg font-semibold">
          🎉 تمت مراجعة جميع الكلمات! 🎉
        </div>
        <p className="text-muted-foreground text-sm">تم تصنيف {easyWordIds.length} كلمة كـ "سهلة" وسيتم حذفها.</p>
        <p className="text-muted-foreground text-sm">تم تصنيف {hardWordCount} كلمة كـ "صعبة" في هذه الجلسة.</p>
        <div className="flex justify-center space-x-4 rtl:space-x-reverse mt-4">
          <Button onClick={() => {
            // Reset state for a new review session
            setCurrentWordIndex(0);
            setReviewedCount(0);
            setHardWordCount(0);
            setEasyWordIds([]);
            setReviewCompleted(false);
            setShowTranslation(false);
            setIsDelaying(false); // Reset delay state
             if (hardButtonTimeoutRef.current) {
                clearTimeout(hardButtonTimeoutRef.current); // Clear timeout
                hardButtonTimeoutRef.current = null;
             }
          }}>
            المراجعة مرة أخرى
          </Button>
          <Button variant="secondary" onClick={() => router.push('/hard-words')}>
             الذهاب إلى الكلمات الصعبة ({words.length - easyWordIds.length}) {/* Show remaining count */}
          </Button>
        </div>
      </div>
    );
  }


   // Added loading state check
  if (!currentWord) {
     // Should be covered by loading or empty state, but as a safeguard.
    return <div className="text-center mt-10">جاري تحميل الكلمة...</div>;
  }


  return (
    <div className="flex flex-col items-center">

      <div className="mb-4 w-full max-w-md">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>التقدم:</span>
          <span>{reviewedCount} / {words.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
           <span>صعبة (الجلسة): {hardWordCount}</span>
           <span>سهلة (الجلسة): {easyWordIds.length}</span>
           <span>متبقي: {words.length - reviewedCount}</span>
        </div>
      </div>

        <Card className="glass-card p-6 w-full max-w-md mb-4 min-h-[12rem] flex flex-col justify-center items-center">
         {/* Display English word */}
        <div className="text-4xl lg:text-5xl font-bold text-center mb-2 break-words w-full px-2">
          {currentWord?.english || '...'}
        </div>
        {showTranslation && (
           // Display Arabic translation when shown
          <div className="text-xl text-gray-400 text-center mt-2 break-words w-full px-2">
            {currentWord?.arabic || '...'}
          </div>
        )}
        {isDelaying && ( // Indicate delaying state visually
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                <Loader2 className="inline-block h-3 w-3 animate-spin mr-1"/>
                التالي بعد قليل...
            </div>
        )}
      </Card>


        <div className="flex justify-between items-center space-x-4 rtl:space-x-reverse mb-4 w-full max-w-md">
          {/* Left side buttons (Previous and Show/Hide) */}
          <div className="flex space-x-2 rtl:space-x-reverse">
             <Button onClick={handlePreviousWord} disabled={currentWordIndex === 0 || isDelaying} size="icon" variant="outline">
               <ArrowLeft className="w-5 h-5" /> {/* Use ArrowLeft icon */}
               <span className="sr-only">الكلمة السابقة</span> {/* Screen reader text */}
             </Button>
            <Button variant="secondary" onClick={handleToggleTranslation} disabled={isDelaying} className="px-4 py-3">
            {showTranslation ? "إخفاء" : "إظهار"}
            </Button>
        </div>

        {/* Right side buttons (Easy and Hard) - Centered */}
         <div className="flex justify-center space-x-2 rtl:space-x-reverse flex-1"> {/* Added justify-center and flex-1 */}
            {/* Hard Button (appears on the right in RTL) */}
            <Button variant="destructive" onClick={handleMarkHard} disabled={isDelaying} className="px-6 py-3">
                <X className="w-5 h-5 mr-2 rtl:ml-2" /> {/* Adjust icon margin for RTL */}
                صعبة
            </Button>
             {/* Easy Button (appears on the left in RTL) */}
            <Button variant="success" onClick={handleMarkEasy} disabled={isDelaying} className="px-6 py-3">
                <Check className="w-5 h-5 mr-2 rtl:ml-2" /> {/* Adjust icon margin for RTL */}
                سهلة
            </Button>
        </div>


      </div>
    </div>
  );
};
