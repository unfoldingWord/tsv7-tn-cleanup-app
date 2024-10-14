import React from 'react';

const HighlightedText = ({ text }) => {
  const highlightText = (text) => {
    // Regular expression for Hebrew characters
    const hebrewRegex = /[\u0590-\u05FF]+/g;
    // Regular expression for "QUOTE_NOT_FOUND:"
    const quoteNotFoundRegex = /QUOTE_NOT_FOUND:/g;

    // Replace Hebrew characters with highlighted span
    const highlightedText = text
      .replace(hebrewRegex, (match) => `<span style="background-color: yellow;">${match}</span>`)
      .replace(quoteNotFoundRegex, (match) => `<span style="background-color: red; color: white;">${match}</span>`);

    return { __html: highlightedText };
  };

  return (
    <div
      contentEditable={false}
      dangerouslySetInnerHTML={highlightText(text)}
      style={{ whiteSpace: 'pre-wrap', overflow: 'auto', border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}
    />
  );
};

export default HighlightedText;
