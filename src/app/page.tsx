
"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WordInput } from "@/components/word-input";
import { db } from "@/firebase/firebase-config";
import { collection, getDocs, addDoc, query, where, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { SignOut } from "@/components/sign-out";
import { Button } from "@/components/ui/button";
import { generateWords } from "@/ai/flows/generate-words-flow";
import { FlashcardReview } from "@/components/flashcard-review";
import { useRouter } from 'next/navigation';


type WordType = {
  arabic: string;
  english: string; // Ensure english is part of the type
  translation?: string; // Make translation optional or align usage
  id: string; // ID is mandatory for Firestore operations
  uid?: string; // Added UID for user association
  difficulty?: 'easy' | 'hard'; // Optional difficulty marker
};

export default function Home() {
  const [words, setWords] = useState<WordType[]>([])
  const [loading, setLoading] = useState(true); // Loading state for words
  const [wordsCollectionRef, setWordsCollectionRef] = useState<any>(null);
  const { user, loading: authLoading } = useAuth(); // Auth loading state
  const [bulkInput, setBulkInput] = useState("");
  const [hardWords, setHardWords] = useState<WordType[]>([]);
  const [activeTab, setActiveTab] = useState("add"); // State to control active tab
  const router = useRouter();


  useEffect(() => {
    if (db) {
      setWordsCollectionRef(collection(db, "words"));
    } else {
      console.log("Db not initialized yet");
    }
  }, []); // Corrected dependency array

  const getWords = useCallback(async () => {
    if (!wordsCollectionRef || !user) {
        setLoading(false); // Stop loading if no collection ref or user
        return;
    };

    setLoading(true); // Start loading when fetching words
    try {
      const q = query(wordsCollectionRef, where("uid", "==", user.uid));
      const data = await getDocs(q);
      const allWords = data.docs.map((doc) => ({ ...(doc.data() as Omit<WordType, 'id'>), id: doc.id }));
      setWords(allWords);
      // Separate hard words based on 'difficulty' field or absence thereof
      const hard = allWords.filter(word => word.difficulty !== 'easy');
      setHardWords(hard);

    } catch (error) {
      console.error("Error fetching words:", error);
    } finally {
      setLoading(false); // Stop loading after fetching or error
    }
  }, [wordsCollectionRef, user]);

  useEffect(() => {
    if (wordsCollectionRef && user) {
      getWords();
    } else if (!user) {
      // Clear words and stop loading when user logs out
      setWords([]);
      setHardWords([]);
      setLoading(false);
    }
  }, [wordsCollectionRef, user, getWords]);


  const handleAddWords = async (newWords: { arabic: string; translation: string }[]) => {
    if (!wordsCollectionRef || !user) return;

    setLoading(true); // Indicate loading while adding words
    try {
      const wordsToAdd = newWords.map(word => ({
        arabic: word.arabic,
        english: word.translation, // Assuming translation is the English word
        uid: user.uid,
        difficulty: 'hard', // Default new words to 'hard' (or unclassified)
      }));

      for (const word of wordsToAdd) {
        // Only add if english and arabic fields are present
        if (word.english && word.arabic) {
           await addDoc(wordsCollectionRef, word);
        } else {
            console.warn("Skipping word due to missing English or Arabic field:", word);
        }
      }
      await getWords(); // Refresh words after adding
    } catch (error) {
      console.error("Error adding words to Firestore:", error);
    } finally {
        setLoading(false); // Stop loading indicator
    }
  };

 const handleToggleHardWord = useCallback(async (wordId: string, isHard: boolean) => {
    if (!db || !user || !wordId) return;
    const wordRef = doc(db, "words", wordId);
    try {
        // Update the difficulty in Firestore
        await updateDoc(wordRef, {
            difficulty: isHard ? 'hard' : 'easy'
        });
        console.log(`Word ${wordId} marked as ${isHard ? 'hard' : 'easy'}`);

        // Optimistically update local state or wait for refresh
        // setWords(prevWords => prevWords.map(w => w.id === wordId ? { ...w, difficulty: isHard ? 'hard' : 'easy' } : w));
        // setHardWords(prevHardWords => isHard
        //     ? [...prevHardWords, words.find(w => w.id === wordId)!] // Add if not already present
        //     : prevHardWords.filter(w => w.id !== wordId)
        // );
         // No, rely on getWords to refresh state after review completion for consistency

    } catch (error) {
        console.error("Error updating word difficulty in Firestore:", error);
    }
  }, [db, user]);


  const handleGenerateWords = async (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setLoading(true); // Show loading indicator
    try {
        const newGeneratedWords = await generateWords({ difficulty: selectedDifficulty, count: 10 });
        // Assuming newGeneratedWords is [{ english: '...', arabic: '...' }, ...]
        const formattedWords = newGeneratedWords.map(word => `${word.english} : ${word.arabic}`).join('\n');
        setBulkInput(prevBulkInput => (prevBulkInput ? prevBulkInput + '\n' : '') + formattedWords);
    } catch(error) {
        console.error("Error generating words:", error);
        // Add user feedback like a toast message
    } finally {
        setLoading(false); // Hide loading indicator
    }

  };

    // Renamed updateDoc import
  const { updateDoc } = require("firebase/firestore");


   const handleReviewComplete = useCallback(async (easyWordIds: string[]) => {
        if (!db || !user) return;
        console.log("Review complete. Deleting easy words:", easyWordIds);
        setLoading(true);
        try {
            for (const wordId of easyWordIds) {
                const wordRef = doc(db, "words", wordId);
                await deleteDoc(wordRef);
            }
            await getWords(); // Refresh words after deletion
            // Navigate to hard words page after successful deletion
            router.push('/hard-words');
        } catch (error) {
            console.error("Error deleting easy words:", error);
        } finally {
            setLoading(false);
        }
    }, [db, user, getWords, router]);


    // Display loading message if auth is loading or if user is logged in but words are still loading
  if (authLoading || (user && loading)) {
    return <div className="flex justify-center items-center h-screen">تحميل...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold text-center mb-5">تطبيق كلماتي</h1>
      {user ? (
        <>
          <div className="flex justify-between items-center mb-4">
             <span className="text-sm text-muted-foreground">مرحباً, {user.email}</span>
            <SignOut />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
             <TabsList className="grid w-full grid-cols-2 mb-5">
               <TabsTrigger value="add">إضافة كلمات</TabsTrigger>
               <TabsTrigger value="review" disabled={words.length === 0}>مراجعة الكلمات</TabsTrigger>
             </TabsList>
            <TabsContent value="add">
              <WordInput
                onAddWords={handleAddWords}
                bulkInput={bulkInput}
                setBulkInput={setBulkInput}
                onGenerateWords={handleGenerateWords}
                isLoading={loading} // Pass loading state
              />
            </TabsContent>
             <TabsContent value="review" className="mt-5">
               {activeTab === 'review' && ( // Only render when tab is active and words are loaded
                 <FlashcardReview
                   words={words.filter(w => !!w.id && !!w.english && !!w.arabic)} // Ensure words have necessary fields
                   onToggleHardWord={handleToggleHardWord}
                   onReviewComplete={handleReviewComplete}
                   loading={loading} // Pass loading state here
                 />
               )}
             </TabsContent>
          </Tabs>
           {/* Buttons positioned below tabs */}
           <div className="flex flex-col items-center mt-6 space-y-2 w-full max-w-md mx-auto">
                {/* Button to explicitly switch to review tab */}
               {activeTab !== 'review' && words.length > 0 && (
                 <Button
                    onClick={() => setActiveTab('review')}
                    className="w-full"
                    variant="outline"
                    disabled={loading} // Disable while loading
                 >
                    مراجعة الكلمات ({words.length})
                 </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => router.push('/hard-words')}
                  className="w-full"
                  disabled={loading} // Disable while loading
                >
                 عرض الكلمات الصعبة ({hardWords.length})
                </Button>
           </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
          <SignIn />
          <SignUp />
        </div>
      )}
    </div>
  );
}

    