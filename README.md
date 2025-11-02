# A Text Editor which implements String Algorithmns like KMP,Trie Typeahead and mini spellchecker 
This **minimal text editor** is made on **react**  and demonstrates classical algorithms in a modern web app 

It features : 
- **KMP-based pattern searche** (fast substring highighting with a TIME COMPLEXITY od O(m+n)
- **Trie based typeahead suggestions** (autocomplete)
- **Spellchecker/autocorrect** for the 200 most commonly mistyped words

This project is modular,educational, and easily extendable. 

## Features

1. **Real-time KMP Search**  
   Highlight all occurrences of a search pattern in the text using the **Knuth-Morris-Pratt (KMP)** algorithm.  

   The KMP algorithm preprocesses the pattern to build a **Longest Prefix Suffix (LPS)** array:

   $$ 
   LPS[i] = \text{length of the longest proper prefix of } pattern[0..i] \text{ which is also a suffix} 
   $$

   Search runs in \(O(n + m)\) time, where \(n\) is the text length and \(m\) is the pattern length.

2. **Trie Typeahead**  
   Provides **prefix-based suggestions** in real time.  

   - Stores words in a **prefix tree (Trie)**.
   - Retrieves top 3 suggestions for the current prefix.
   - Prompts: *“Do you want to type this?”*

   Conceptually, a Trie is defined recursively:

  

3. **Spellchecker / Autocorrect**  
   Corrects common misspellings using a **hardcoded dictionary of 100 words**.  
   Uses **Levenshtein distance**  to correct words

## How to Run

Follow these steps to get the **React Text Editor** up and running locally:

### 1. Clone the Repository

```
git clone https://github.com/pixelhamza/smart-text-editor
cd react-text-editor
```
### 2. Install dependencies

```
npm install
```

### 3. Start Server 

```
npm start

```









