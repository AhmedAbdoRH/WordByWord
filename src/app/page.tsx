
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { WordInput } from "@/components/word-input";
import { db } from "@/firebase/firebase-config";
import { collection, getDocs, addDoc, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { Button } from "@/components/ui/button";
import { FlashcardReview } from "@/components/flashcard-review";
// Import server actions
import { generateWordsAction, extractWordsAction } from "@/app/actions"; // Use generateWordsAction
import { useRouter, useSearchParams } from 'next/navigation';
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WordType = {
  arabic: string;
  english: string;
  id: string;
  uid?: string;
  difficulty?: 'easy' | 'hard';
};

// TabHandler component remains the same
function TabHandler() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'add';
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        const tabFromQuery = searchParams.get('tab');
        if (tabFromQuery && tabFromQuery !== activeTab) {
            setActiveTab(tabFromQuery);
        }
    }, [searchParams, activeTab]);
    return { activeTab, setActiveTab };
}

export default function Home() {
  const [words, setWords] = useState<WordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [wordsCollectionRef, setWordsCollectionRef] = useState<any>(null);
  const { user, loading: authLoading } = useAuth();
  const [hardWords, setHardWords] = useState<WordType[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'add';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [longText, setLongText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const { toast } = useToast();

   useEffect(() => {
     if (db) {
       setDbInitialized(true);
       setWordsCollectionRef(collection(db, "words"));
     } else {
        // If db initialization failed or is still pending, keep loading false
        setLoading(false);
     }
   }, [db]); // Depend on db itself

   useEffect(() => {
     const tabFromQuery = searchParams.get('tab');
     if (tabFromQuery && tabFromQuery !== activeTab) {
       setActiveTab(tabFromQuery);
     }
   }, [searchParams, activeTab]);

  const getWords = useCallback(async () => {
    if (!dbInitialized || !wordsCollectionRef || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(wordsCollectionRef, where("uid", "==", user.uid));
      const data = await getDocs(q);
      const allWords = data.docs.map((doc) => ({ ...(doc.data() as Omit<WordType, 'id'>), id: doc.id }));
      setWords(allWords);
      const hard = allWords.filter(word => word.difficulty !== 'easy');
      setHardWords(hard);
    } catch (error) {
      console.error("Error fetching words:", error);
      toast({ title: "فشل تحميل الكلمات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, dbInitialized, wordsCollectionRef, toast]);

  useEffect(() => {
    if (user && dbInitialized) {
      getWords();
    } else if (!authLoading && !dbInitialized) {
      // Ensure loading is false if auth is done but db is not ready
      setLoading(false);
    } else if (!authLoading && dbInitialized) {
      // User is not logged in, clear words
      setWords([]);
      setHardWords([]);
      setLoading(false);
    }
  }, [user, getWords, authLoading, dbInitialized]);

  const handleAddWords = async (newWords: { arabic: string; translation: string }[]) => {
     if (!dbInitialized || !wordsCollectionRef || !user) return;
    setLoading(true);
    try {
      const wordsToAdd = newWords.map(word => ({
        arabic: word.arabic,
        english: word.translation,
        uid: user.uid,
        difficulty: 'hard', // Default to hard
      }));
      const batch = [];
      for (const word of wordsToAdd) {
        if (word.english && word.arabic) {
          batch.push(addDoc(wordsCollectionRef, word));
        } else {
          console.warn("Skipping word due to missing English or Arabic field:", word);
        }
      }
      await Promise.all(batch);
      await getWords();
      setBulkInput("");
      toast({ title: `تمت إضافة ${newWords.length} كلمات بنجاح.` });
       setActiveTab('review');
       router.push('/?tab=review');
    } catch (error) {
      console.error("Error adding words to Firestore:", error);
      toast({ title: "فشل إضافة الكلمات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

   const handleToggleHardWord = useCallback(async (wordId: string, isHard: boolean) => {
     if (!dbInitialized || !user || !wordId) return;
    const wordRef = doc(db, "words", wordId);
    try {
      await updateDoc(wordRef, {
        difficulty: isHard ? 'hard' : 'easy'
      });
      console.log(`Word ${wordId} marked as ${isHard ? 'hard' : 'easy'}`);
       // Update local state immediately for faster UI feedback
       setWords(prevWords =>
            prevWords.map(w =>
              w.id === wordId ? { ...w, difficulty: isHard ? 'hard' : 'easy' } : w
            )
          );
       if (!isHard) {
            // Remove from local hard words state if marked easy
            setHardWords(prev => prev.filter(hw => hw.id !== wordId));
       } else {
           // Add to local hard words state if marked hard (and not already there)
           const wordToAdd = words.find(w => w.id === wordId);
           if (wordToAdd && !hardWords.some(hw => hw.id === wordId)) {
                setHardWords(prev => [...prev, wordToAdd]);
           }
       }
    } catch (error) {
      console.error("Error updating word difficulty in Firestore:", error);
      toast({
        title: "فشل تحديث صعوبة الكلمة",
        variant: "destructive",
      });
    }
  }, [user, dbInitialized, toast, words, hardWords]);

  // Use the server action for generating words
  const handleGenerateWords = async (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setLoading(true);
    try {
      // Call the server action
      const newGeneratedWords = await generateWordsAction({ difficulty: selectedDifficulty, count: 10 }); // Use generateWordsAction
      const formattedWords = newGeneratedWords.map((word: { english: string; arabic: string; }) => `${word.english} : ${word.arabic}`).join('\n');
      setBulkInput(prevBulkInput => (prevBulkInput ? prevBulkInput + '\n' : '') + formattedWords);
      toast({ title: `تم توليد ${newGeneratedWords.length} كلمات جديدة!` });
    } catch (error) {
      console.error("Error generating words:", error);
      toast({ title: "فشل توليد الكلمات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Use the server action for extracting words
  const handleExtractWords = async () => {
    if (!longText.trim()) {
      toast({ title: "الرجاء إدخال نص للاستخراج منه.", variant: "destructive" });
      return;
    }
    setIsExtracting(true);
    try {
      // Call the server action
      const extracted = await extractWordsAction({ text: longText, count: 15 });
      if (extracted.length === 0) {
        toast({ title: "لم يتم العثور على كلمات صعبة.", variant: "default" });
      } else {
        const formattedWords = extracted.map((word: { english: string; arabic: string; }) => `${word.english} : ${word.arabic}`).join('\n');
        setBulkInput(prevBulkInput => (prevBulkInput ? prevBulkInput + '\n' : '') + formattedWords);
        toast({ title: `تم استخراج ${extracted.length} كلمات صعبة وإضافتها إلى صندوق الإدخال.` });
        setLongText("");
      }
    } catch (error) {
      console.error("Error extracting words:", error);
      toast({ title: "فشل استخراج الكلمات", variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReviewComplete = useCallback(async (easyWordIds: string[]) => {
    if (!dbInitialized || !user || !wordsCollectionRef || easyWordIds.length === 0) {
        // Navigate even if no words were marked easy in this session if review is considered complete
        if (activeTab === 'review' && !loading) {
           router.push('/hard-words');
        }
        return;
    }
    console.log("Review complete. Marking easy words for deletion:", easyWordIds);
    setLoading(true);
    try {
      const batch = [];
      for (const wordId of easyWordIds) {
        // Ensure wordId is a non-empty string before creating a doc ref
        if (typeof wordId === 'string' && wordId.length > 0) {
          const wordRef = doc(db, "words", wordId);
          batch.push(deleteDoc(wordRef));
        } else {
          console.warn("Invalid word ID encountered during deletion:", wordId);
        }
      }
      if (batch.length > 0) {
          await Promise.all(batch);
          console.log(`Successfully deleted ${batch.length} easy words.`);
          await getWords(); // Refresh the words list after deletion
          toast({ title: "تمت مراجعة جميع الكلمات بنجاح! تم حذف الكلمات السهلة." });
      } else {
          console.log("No valid easy words to delete.");
          toast({ title: "تمت مراجعة جميع الكلمات!" });
      }

       router.push('/hard-words'); // Navigate after successful deletion or if no words to delete
    } catch (error) {
      console.error("Error deleting easy words:", error);
      toast({
        title: "فشل حذف الكلمات السهلة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, getWords, toast, dbInitialized, wordsCollectionRef, router, loading, activeTab]); // Added loading and activeTab


  if (authLoading || (!dbInitialized && !authLoading)) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             <p className="ml-2">جاري التحميل...</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 pb-20"> {/* Increased padding-bottom */}
      <h1 className="text-3xl font-bold text-center mb-6 text-foreground">تطبيق كلماتي</h1>
      {user ? (
        <>
          {/* Tabs component removed, logic handled by BottomNav */}
          {/* Conditional rendering based on activeTab state */}
          {activeTab === 'add' && (
            <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WordInput
                  onAddWords={handleAddWords}
                  bulkInput={bulkInput}
                  setBulkInput={setBulkInput}
                  onGenerateWords={handleGenerateWords} // Pass the action handler
                  isLoading={loading || isExtracting}
                />
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-xl text-center">استخراج الكلمات الصعبة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={longText}
                      onChange={(e) => setLongText(e.target.value)}
                      rows={8}
                      placeholder="ألصق النص الطويل هنا لاستخراج الكلمات الصعبة مع ترجمتها..."
                      className="mb-4 bg-input/80 border-border focus:ring-ring focus:border-primary transition duration-200"
                      disabled={isExtracting || loading}
                    />
                    <Button onClick={handleExtractWords} className="w-full" disabled={isExtracting || loading || !longText.trim()}>
                      {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      استخراج وإضافة للإدخال
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </Suspense>
          )}

          {activeTab === 'review' && (
            <div className="mt-5">
              {!loading && words.length > 0 && (
                 <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                    <FlashcardReview
                        words={words.filter(w => !!w.id && !!w.english && !!w.arabic)} // Ensure words have necessary properties
                        onToggleHardWord={handleToggleHardWord}
                        onReviewComplete={handleReviewComplete}
                        loading={loading} // Pass loading state
                    />
                 </Suspense>
              )}
              {loading && (
                 <div className="text-center p-10">
                     <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                     <p className="mt-2 text-muted-foreground">جاري تحميل الكلمات للمراجعة...</p>
                 </div>
              )}
              {!loading && words.length === 0 && (
                  <div className="text-center p-10 text-muted-foreground">لا توجد كلمات للمراجعة حالياً. قم بإضافة كلمات أو توليدها أولاً.</div>
              )}
            </div>
          )}
        </>
      ) : (
         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
          <Card className="glass-card w-full max-w-md p-6 mb-6">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold">مرحباً بك في كلماتي</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground mb-6">
                سجل الدخول أو أنشئ حسابًا جديدًا للبدء في تعلم المفردات.
              </p>
              <div className="grid grid-cols-1 gap-4">
                <SignIn />
                <SignUp />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


