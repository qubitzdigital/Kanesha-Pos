import { useState, useEffect, useRef } from "react";

// Character-by-character typewriter animation
const useTypewriter = (text, speed = 100, delay = 0) => {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    // Reset when text changes
    setDisplayText("");
    setIsComplete(false);
    indexRef.current = 0;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Start typing after delay
    const startTyping = () => {
      if (indexRef.current < text.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(text.slice(0, indexRef.current + 1));
          indexRef.current++;
          startTyping();
        }, speed);
      } else {
        setIsComplete(true);
      }
    };

    const initialTimeout = setTimeout(startTyping, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearTimeout(initialTimeout);
    };
  }, [text, speed, delay]);

  return { displayText, isComplete };
};

// Word-by-word typewriter animation
const useTypewriterWords = (text, wordDelay = 150, initialDelay = 0) => {
  const [words, setWords] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef(null);
  const indexRef = useRef(0);
  const wordsArray = text.split(" ");

  useEffect(() => {
    setWords([]);
    setIsComplete(false);
    indexRef.current = 0;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const addWord = () => {
      if (indexRef.current < wordsArray.length) {
        timeoutRef.current = setTimeout(() => {
          setWords(wordsArray.slice(0, indexRef.current + 1));
          indexRef.current++;
          addWord();
        }, wordDelay);
      } else {
        setIsComplete(true);
      }
    };

    const initialTimeout = setTimeout(addWord, initialDelay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearTimeout(initialTimeout);
    };
  }, [text, wordDelay, initialDelay, wordsArray.length]);

  return { words, isComplete };
};

/**
 * TypewriterText Component
 * Displays text with a typewriter animation effect
 *
 * @param {string} text - The text to animate
 * @param {string} mode - Animation mode: "character" or "word" (default: "character")
 * @param {number} speed - Animation speed in milliseconds (default: 100 for character, 150 for word)
 * @param {number} delay - Initial delay in milliseconds (default: 0)
 * @param {string} className - Additional CSS classes to apply
 * @param {object} cursorProps - Props for the cursor element (opacity, animation, etc.)
 * @param {function} onComplete - Callback when animation completes
 */
export const TypewriterText = ({
  text = "",
  mode = "character",
  speed,
  delay = 0,
  className = "",
  cursorProps = {},
  onComplete = null,
}) => {
  const defaultSpeed = mode === "word" ? 150 : 100;
  const animationSpeed = speed !== undefined ? speed : defaultSpeed;

  if (mode === "word") {
    const { words, isComplete } = useTypewriterWords(
      text,
      animationSpeed,
      delay,
    );

    useEffect(() => {
      if (isComplete && onComplete) {
        onComplete();
      }
    }, [isComplete, onComplete]);

    return (
      <span className={className}>
        {words.join(" ")}
        {!isComplete && (
          <span
            className="inline-block w-0.5 h-1em ml-1 bg-current animate-pulse"
            {...cursorProps}
          />
        )}
      </span>
    );
  }

  // Character mode (default)
  const { displayText, isComplete } = useTypewriter(
    text,
    animationSpeed,
    delay,
  );

  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {!isComplete && (
        <span
          className="inline-block w-0.5 h-1em ml-1 bg-current animate-pulse"
          {...cursorProps}
        />
      )}
    </span>
  );
};

export default TypewriterText;
