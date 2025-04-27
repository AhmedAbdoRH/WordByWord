
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs"; // Removed TabsList and TabsTrigger import
import { WordInput } from "@/components/word-input"; // Corrected import path
import { db } from "@/firebase/firebase-config";
import { collection, getDocs, addDoc, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { Button } from "@/components/ui/button";
import { FlashcardReview } from "@/components/flashcard-review"; // Import FlashcardReview
import { generateWords } from "@/ai/flows/generate-words-flow";
import { extractWords } from "@/ai/flows/extract-words-flow";
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
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

function TabHandler() {
    const searchParams = useSearchParams(); // Get search params
    const initialTab = searchParams.get('tab') || 'add'; // Read tab from query param
    const [activeTab, setActiveTab] = useState(initialTab);

    // Update activeTab if query parameter changes
    useEffect(() => {
        const tabFromQuery = searchParams.get('tab');
        if (tabFromQuery && tabFromQuery !== activeTab) {
            setActiveTab(tabFromQuery);
        }
    }, [searchParams, activeTab]);
    return { activeTab, setActiveTab };
}

export default function Home() {
  const [words, setWords] = useState<WordType[]>([])
  const [loading, setLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [wordsCollectionRef, setWordsCollectionRef] = useState<any>(null);
  const { user, loading: authLoading } = useAuth();
  const [hardWords, setHardWords] = useState<WordType[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const initialTab = searchParams.get('tab') || 'add'; // Read tab from query param
  const [activeTab, setActiveTab] = useState(initialTab);
  const [longText, setLongText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [bulkInput, setBulkInput] = useState(""); // Added state for bulk word input
  const { toast } = useToast();

   useEffect(() => {
     if (db) {
       setDbInitialized(true);
       setWordsCollectionRef(collection(db, "words"));
     }
   }, []);

  // Update activeTab if query parameter changes
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
       // Filter hard words after fetching all words
      const hard = allWords.filter(word => word.difficulty !== 'easy');
      setHardWords(hard);

    } catch (error) {
      console.error("Error fetching words:", error);
      toast({ title: "فشل تحميل الكلمات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, dbInitialized, wordsCollectionRef, toast]); // Added toast dependency

  useEffect(() => {
    if (user && dbInitialized) {
      getWords();
    } else if (!authLoading) {
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
        english: word.translation, // Use 'english' field name
        uid: user.uid,
        difficulty: 'hard', // Default new words to 'hard'
      }));

      const batch = [];
      for (const word of wordsToAdd) {
        if (word.english && word.arabic) { // Check for english and arabic fields
          batch.push(addDoc(wordsCollectionRef, word));
        } else {
          console.warn("Skipping word due to missing English or Arabic field:", word);
        }
      }
      await Promise.all(batch);
      await getWords(); // Refresh words after adding
      // Clear bulk input after successful addition
      setBulkInput("");
      toast({ title: `تمت إضافة ${newWords.length} كلمات بنجاح.` });
       setActiveTab('review'); // Switch to review tab after adding
       router.push('/?tab=review'); // Ensure URL reflects the tab change

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
      // Optimistic update for hard words list is handled in FlashcardReview
      // Update the main words list state as well for consistency if needed immediately
       setWords(prevWords =>
            prevWords.map(w =>
              w.id === wordId ? { ...w, difficulty: isHard ? 'hard' : 'easy' } : w
            )
          );
       // Update hardWords state based on the main words list after update
       // Filter out easy words from the hardWords state immediately
       if (!isHard) {
            setHardWords(prev => prev.filter(hw => hw.id !== wordId));
       } else {
           // If marked as hard, ensure it's in hardWords (might already be there)
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
  }, [user, dbInitialized, toast, words, hardWords]); // Added words and hardWords dependencies


  const handleGenerateWords = async (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setLoading(true); // Use general loading state
    try {
      const newGeneratedWords = await generateWords({ difficulty: selectedDifficulty, count: 10 });
      const formattedWords = newGeneratedWords.map(word => `${word.english} : ${word.arabic}`).join('\n');
      setBulkInput(prevBulkInput => (prevBulkInput ? prevBulkInput + '\n' : '') + formattedWords);
      toast({ title: `تم توليد ${newGeneratedWords.length} كلمات جديدة!` });
    } catch (error) {
      console.error("Error generating words:", error);
      toast({ title: "فشل توليد الكلمات", variant: "destructive" });
    } finally {
      setLoading(false); // Stop general loading state
    }
  };

  const handleExtractWords = async () => {
    if (!longText.trim()) {
      toast({ title: "الرجاء إدخال نص للاستخراج منه.", variant: "destructive" });
      return;
    }
    setIsExtracting(true);
    try {
      const extracted = await extractWords({ text: longText, count: 15 });
      if (extracted.length === 0) {
        toast({ title: "لم يتم العثور على كلمات صعبة.", variant: "default" });
      } else {
        const formattedWords = extracted.map(word => `${word.english} : ${word.arabic}`).join('\n');
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
        // If no words were marked easy, just navigate
        if (easyWordIds.length === 0 && !loading) {
           router.push('/hard-words'); // Navigate even if no easy words
        }
        return;
    }
    console.log("Review complete. Marking easy words for deletion:", easyWordIds);
    setLoading(true);
    try {
      const batch = [];
      for (const wordId of easyWordIds) {
        const wordRef = doc(db, "words", wordId);
        batch.push(deleteDoc(wordRef));
      }
      await Promise.all(batch);
      console.log(`Successfully deleted ${easyWordIds.length} easy words.`);
      await getWords(); // Refresh words list after modification
       toast({ title: "تمت مراجعة جميع الكلمات بنجاح! تم حذف الكلمات السهلة." });
       router.push('/hard-words'); // Navigate to hard words page after completion
    } catch (error) {
      console.error("Error deleting easy words:", error);
      toast({
        title: "فشل حذف الكلمات السهلة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, getWords, toast, dbInitialized, wordsCollectionRef, router, loading]); // Added loading dependency


  if (authLoading || (!dbInitialized && !authLoading)) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             <p className="ml-2">جاري التحميل...</p>
        </div>
    );
  }


  return (
    <div className="container mx-auto py-10 px-4 pb-20"> {/* Added padding-bottom */}
      <h1 className="text-3xl font-bold text-center mb-6 text-foreground">تطبيق كلماتي</h1>
      {user ? (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Removed TabsList component */}
            <TabsContent value="add"> <Suspense>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WordInput
                  onAddWords={handleAddWords}
                  bulkInput={bulkInput}
                  setBulkInput={setBulkInput}
                  onGenerateWords={handleGenerateWords}
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
            </TabsContent>
            <TabsContent value="review" className="mt-5">
              {activeTab === 'review' && !loading && words.length > 0 && (
                <FlashcardReview
                  words={words.filter(w => !!w.id && !!w.english && !!w.arabic)} // Ensure words have necessary fields
                  onToggleHardWord={handleToggleHardWord}
                  onReviewComplete={handleReviewComplete}
                  loading={loading}
                />
              )}
              {activeTab === 'review' && loading && (
                 <div className="text-center p-10">
                     <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                     <p className="mt-2 text-muted-foreground">جاري تحميل الكلمات للمراجعة...</p>
                 </div>
              )}
              {activeTab === 'review' && !loading && words.length === 0 && (
                  <div className="text-center p-10 text-muted-foreground">لا توجد كلمات للمراجعة حالياً. قم بإضافة كلمات أو توليدها أولاً.</div>
              )}
            </TabsContent>
          </Tabs>

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
