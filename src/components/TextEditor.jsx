import React, { useState, useEffect, useRef } from "react";
import { Trie } from "./Trie";
import { kmpSearch, escapeHtml } from "./KMP";
import { getCorrection } from "./SpellChecker";

export default function TextEditor() {
  const [text, setText] = useState("Type here. Try words like 'ban', 'app', or misspell a word like 'recieve'.");
  const [pattern, setPattern] = useState("");
  const [matches, setMatches] = useState([]);
  const [current, setCurrent] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);

  const editorRef = useRef(null);
  const textareaRef = useRef(null);

  const trie = useRef(new Trie()).current;

 
 useEffect(() => {
  fetch("/words.txt")
    .then((res) => res.text())
    .then((data) => {
      const words = data.split("\n");
      words.forEach((word) => trie.insert(word));
    });
}, [trie]);


 function handleTextChange(e) {
  const input = e.target;
  let value = input.value;

  const start = input.selectionStart;
  const end = input.selectionEnd;

   // Determine trailing separators and the last complete token before them
   const trailingMatch = value.match(/[\s.,!?]+$/);
   const trailing = trailingMatch ? trailingMatch[0] : "";
   const core = trailing ? value.slice(0, value.length - trailing.length) : value;
   const words = core.split(/\s+/);
   const last = words[words.length - 1] || "";

  
  if (last.length > 2) {
    const lastChar = value.slice(-1);
   
    if (/\s|[.,!?]/.test(lastChar)) {
      // Provide dictionary lookup to spell checker and preserve capitalization
      const corrected = getCorrection(last, (w) => trie.contains(w));
      if (corrected !== last) {
        const delta = corrected.length - last.length;
        const newCore = core.slice(0, core.length - last.length) + corrected;
        value = newCore + trailing;

        // Adjust caret if it was at end or inside trailing
        if (textareaRef.current) {
          if (start >= core.length) {
            // caret was at or beyond end of core (i.e., before/inside trailing)
            const newStart = start + delta;
            const newEnd = end + delta;
            requestAnimationFrame(() => {
              if (textareaRef.current) {
                textareaRef.current.setSelectionRange(newStart, newEnd);
              }
            });
          }
        }
      }
    }

    const sug = trie.getSuggestions(last, 3);
    setSuggestions(sug);
  } else {
    setSuggestions([]);
  }

  setText(value);

  // If we didn't already adjust the caret due to a correction, keep it as-is
  requestAnimationFrame(() => {
    if (textareaRef.current) {
      // Do not override if we already moved the selection in the correction branch
      // We detect this heuristically: if selection currently equals start/end, set it.
      const selStart = textareaRef.current.selectionStart;
      const selEnd = textareaRef.current.selectionEnd;
      if (selStart === selEnd && selStart === start) {
        textareaRef.current.setSelectionRange(start, end);
      }
    }
  });
}



  
  useEffect(() => {
    if (!pattern.trim()) {
      setMatches([]);
      setCurrent(-1);
      return;
    }
    const m = kmpSearch(text, pattern);
    setMatches(m);
    setCurrent(m.length ? 0 : -1);
  }, [text, pattern]);

 
  function highlightText() {
    if (!matches.length) return escapeHtml(text);
    let out = "", last = 0;
    matches.forEach(idx => {
      out += escapeHtml(text.slice(last, idx));
      out += `<mark class="match">${escapeHtml(text.slice(idx, idx + pattern.length))}</mark>`;
      last = idx + pattern.length;
    });
    out += escapeHtml(text.slice(last));
    return out;
  }

  useEffect(() => {
    if (!editorRef.current) return;
    const marks = editorRef.current.querySelectorAll("mark.match");
    if (marks.length === 0 || current < 0) return;
    const el = marks[current];
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [current]);

  function handleSuggestionClick(word) {
    const words = text.split(/\s+/);
    words[words.length - 1] = word;
    setText(words.join(" ") + " ");
    setSuggestions([]);
  }

  return (
    <div style={styles.container}>
      <h3>React Text Editor + KMP + Trie + SpellChecker</h3>

      <div style={styles.toolbar}>
        <textarea
            ref={textareaRef}       
            style={styles.textarea}
            value={text}
            onChange={handleTextChange}
            placeholder="Type text..."
            />

        <div style={styles.controls}>
          <input
            style={styles.input}
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Search pattern"
          />
          <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
            <button onClick={() => setCurrent((c) => (matches.length ? (c - 1 + matches.length) % matches.length : -1))}>Prev</button>
            <button onClick={() => setCurrent((c) => (matches.length ? (c + 1) % matches.length : -1))}>Next</button>
          </div>
          <small style={{ color: "#777" }}>
            Matches: {matches.length} {matches.length ? `— ${current + 1}/${matches.length}` : ""}
          </small>

          {suggestions.length > 0 && (
            <div style={styles.suggestions}>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  style={styles.suggestionItem}
                  onClick={() => handleSuggestionClick(s)}
                >
                  💡 Do you want to type this? <b>{s}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        ref={editorRef}
        style={styles.preview}
        dangerouslySetInnerHTML={{ __html: highlightText() }}
      />
    </div>
  );
}














const styles = {
  container: {
    fontFamily: "system-ui, sans-serif",
    maxWidth: "900px",
    margin: "30px auto",
    padding: "20px",
    background: "#f5f7fa",       
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
  },
  toolbar: {
    display: "flex",
    gap: "15px",
    alignItems: "flex-start",
    marginBottom: "15px"
  },
  textarea: {
    flex: 1,
    minHeight: "220px",
    borderRadius: "8px",
    border: "1px solid #cfd3d9",    
    padding: "12px",
    fontFamily: "monospace",
    fontSize: "14px",
    lineHeight: "1.5",
    resize: "vertical",
    background: "#ffffff"            
  },
  controls: {
    width: "260px",
    display: "flex",
    flexDirection: "column",
    position: "relative"
  },
  input: {
    padding: "8px",
    border: "1px solid #cfd3d9",
    borderRadius: "6px",
    marginBottom: "10px",
    fontSize: "14px",
    background: "#fff"
  },
  preview: {
    background: "#ffffff",
    border: "1px solid #cfd3d9",
    borderRadius: "8px",
    padding: "12px",
    whiteSpace: "pre-wrap",
    overflow: "auto",
    minHeight: "180px",
    fontFamily: "monospace",
    fontSize: "14px",
    lineHeight: "1.5"
  },
  suggestions: {
    position: "absolute",
    top: "50px",
    left: "0",
    background: "#ffffff",
    border: "1px solid #cfd3d9",
    borderRadius: "6px",
    padding: "4px",
    width: "100%",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    zIndex: 10
  },
  suggestionItem: {
    padding: "6px 8px",
    cursor: "pointer",
    borderRadius: "4px",
    transition: "background 0.2s",
    color: "#333"                   
  },
  toolbarButtons: {
    display: "flex",
    gap: "6px",
    marginBottom: "6px"
  },
  matchesInfo: {
    color: "#555",
    fontSize: "12px",
    marginTop: "6px"
  },
  markHighlight: {
    background: "#ffeaa7",          
    borderRadius: "2px"
  },
  button: {
    padding: "6px 10px",
    borderRadius: "5px",
    border: "1px solid #74b9ff",
    background: "#0984e3",
    color: "#fff",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  buttonHover: {
    background: "#74b9ff"
  }
};
