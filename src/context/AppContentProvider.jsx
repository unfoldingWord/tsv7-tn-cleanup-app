import React, { createContext, useState, useEffect } from 'react';
import TSV7ULTQuotesToOrigLQuotes from 'tsv7-ult-quotes-to-origl-quotes';
import { BibleBookData } from '../common/books';
import Papa from 'papaparse';

export const AppContentContext = createContext();

const replaceWithCurlyQuotes = (text) => {
  return text
    .replace(/(\w)'(\w)/g, '$1’$2') // Apostrophe between letters
    .replace(/(\w)'(s\b)/g, '$1’$2') // Apostrophe after 's'
    .replace(/'/g, '‘') // Left single quote
    .replace(/(\W|^)"(\S)/g, '$1“$2') // Left double quote
    .replace(/(\S)"(\W|$)/g, '$1”$2') // Right double quote
    .replace(/"/g, '”'); // Default to right double quote
};

const getUniqueID = (ids) => {
  let newID;
  do {
    newID = Math.random().toString(36).substring(2, 6);
  } while (ids.has(newID));
  return newID;
}

export const AppContentProvider = ({ children }) => {
  const [server, setServer] = useState(localStorage.getItem('server') || 'PROD');
  const [selectedBook, setSelectedBook] = useState(localStorage.getItem('selectedBook') || 'gen');
  const [dcsURL, setDcsURL] = useState(localStorage.getItem('dcsURL') || 'https://git.door43.org');
  const [selectedBranch, setSelectedBranch] = useState(localStorage.getItem('selectedBranch') || 'master');

  const [inputTsvRows, setInputTsvRows] = useState([]);
  const [convertedTsvRows, setConvertedTsvRows] = useState([]);
  const [mergedTsvRows, setMergedTsvRows] = useState([]);
  const [rowsSkipped, setRowsSkipped] = useState(0);
  const [rowsFailed, setRowsFailed] = useState(0);
  const [errors, setErrors] = useState([]);

  const [doConvert, setDoConvert] = useState(false);
  const [processingRows, setProcessingRows] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [doneConverting, setDoneConverting] = useState(false);
  const [doNotPromptAgain, setDoNotPromptAgain] = useState(false);
  const [showOnlyConvertedRows, setShowOnlyConvertedRows] = useState(false);
  const [lastProcessedRowIndex, setLastProcessedRowIndex] = useState(0);

  const [existingIDs, setExistingIDs] = useState(new Set());

  // useEffect(() => {
  //   const handlePaste = (event) => {
  //     event.preventDefault();
  //     const pastedText = event.clipboardData.getData('text');
  //     setInputTsvRows(pastedText.split('\n').filter((row) => row.trim()));
  //   };

  //   document.addEventListener('paste', handlePaste);

  //   return () => {
  //     document.removeEventListener('paste', handlePaste);
  //   };
  // }, [inputTsvRows]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const serverParam = urlParams.get('server');
    const book = urlParams.get('book');
    const branch = urlParams.get('branch');

    if (serverParam) {
      setServer(serverParam.toUpperCase());
      localStorage.setItem('server', serverParam.toUpperCase());

      const newDcsURL = serverParam.toUpperCase() === 'QA' ? 'https://qa.door43.org' : 'https://git.door43.org';
      setDcsURL(newDcsURL);
      localStorage.setItem('dcsURL', newDcsURL);
    }

    if (book) {
      setSelectedBook(book);
    }

    if (branch) {
      setSelectedBranch(branch);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedBook', selectedBook);
  }, [selectedBook]);

  useEffect(() => {
    localStorage.setItem('selectedBranch', selectedBranch);
    setMergedTsvRows([]);
  }, [selectedBranch]);

  useEffect(() => {
    setDoConvert(false);
    setConvertedTsvRows([]);
    setMergedTsvRows([]);
    setErrors([]);
    setRowsSkipped(0);
    setRowsFailed(0);
    setShowOnlyConvertedRows(false);
    setShowNotFound(false);
    setProcessingRows(false);
    setDoneConverting(false);
    setExistingIDs(new Set());
    setDoNotPromptAgain(false);
    setLastProcessedRowIndex(0);
  }, [selectedBook, inputTsvRows]);

  useEffect(() => {
    const processTsvRow = async () => {
      let rowIdx = lastProcessedRowIndex;

      while (rowIdx < inputTsvRows.length) {
        let row = inputTsvRows[rowIdx++];

        const columns = row.split('\t');

        if (columns.length != 7) {
          setConvertedTsvRows((prev) => [...prev, row]);
          setErrors((prev) => [...prev, `Error: Row #${convertedTsvRows.length + 1} is malformed: ${row}`]);
          setRowsFailed((prev) => prev + 1);
          continue;
        }

        if (existingIDs.has(columns[1])) {
          columns[1] = getUniqueID(existingIDs);          
        }
        existingIDs.add(columns[1]);
        setExistingIDs((prev) => new Set(prev).add(columns[1]));

        const newNote = replaceWithCurlyQuotes(columns[6]);
        if (newNote != columns[6]) {
          columns[6] = newNote;
        }

        row = columns.join("\t");

        if (columns[0] === 'Reference' || !/[a-zA-Z]/.test(columns[4].replace(/(\\n|<br>)/g, ''))) {
          setConvertedTsvRows((prev) => [...prev, row]);
          setRowsSkipped((prev) => prev + 1);
          continue;
        }
        try {
          const result = await TSV7ULTQuotesToOrigLQuotes(selectedBook, row, dcsURL);
          if (result.output.length) {
            setConvertedTsvRows((prev) => [...prev, ...result.output]);
          } else {
            setConvertedTsvRows((prev) => [...prev, row]);
          }
          if (result.errors.length || result.output?.[0]?.includes('QUOTE_NOT_FOUND: ')) {
            setErrors((prev) => [...prev, ...result.errors]);
            setRowsFailed((prev) => prev + 1);
          }
        } catch (error) {
          setConvertedTsvRows((prev) => [...prev, row]);
          setRowsFailed((prev) => prev + 1);
          setErrors((prev) => [...prev, `Error processing row #${convertedTsvRows.length + 1}: ${error}`]);
          console.error(`Error processing row #${convertedTsvRows.length + 1}:`, error);
        }
        break; // We're returning so components can be updated with the progress stats. This will be triggered again.
      }
      setLastProcessedRowIndex(rowIdx);
      setProcessingRows(false);
      if (rowIdx >= inputTsvRows.length) {
        setDoneConverting(true);
      }
    };

    if (doConvert && !processingRows && !doneConverting && inputTsvRows.length > convertedTsvRows.length) {
      setProcessingRows(true);
      processTsvRow();
    }
  }, [doConvert, convertedTsvRows, processingRows, doneConverting, lastProcessedRowIndex]);

  useEffect(() => {
    const doMerge = async () => {
      let response;
      setDoNotPromptAgain(false);
      try {
        response = await fetch(`${dcsURL}/unfoldingWord/en_tn/raw/branch/${selectedBranch}/tn_${selectedBook.toUpperCase()}.tsv`);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
      } catch (error) {
        setErrors((prev) => [...prev, `Error fetching DCS TSV: ${error.message}`]);
        return;
      }
      const dcsTsvRows = (await response.text()).split('\n').filter((row) => row.trim());
      const headerRow = `Reference	ID	Tags	SupportReference	Quote	Occurrence	Note`;
      const idToRefMap = new Map();

      const allTsvMap = new Map();
      dcsTsvRows.forEach((row) => {
        const columns = row.split('\t');
        if (columns.length < 2 || columns[0] === 'Reference') return;
        const [ref, id] = columns;
        if (ref === 'Reference') return;
        if (!allTsvMap.has(ref)) {
          allTsvMap.set(ref, []);
        }
        allTsvMap.get(ref).push(row);
        idToRefMap.set(id, ref);
      });

      const convertedRefs = new Set();;
      const convertedTsvIDs = new Set();
      convertedTsvRows.forEach((row) => {
        const columns = row.split('\t');
        if (columns.length < 2 || columns[0] === 'Reference') return;
        let [ref, id] = columns;
        if (ref === 'Reference') return;
        if (!convertedRefs.has(ref)) {
          allTsvMap.set(ref, []);
          convertedRefs.add(ref);
        }
        if ((!idToRefMap.has(id) || idToRefMap.get(id) == ref) && ! convertedTsvIDs.has(id)) {
          allTsvMap.get(ref).push(row);
        } else {
          const ids = new Set([...idToRefMap.keys(), ...convertedTsvIDs]);
          id = getUniqueID(ids);
          const newRow = [ref, id, ...columns.slice(2)].join('\t');
          allTsvMap.get(ref).push(newRow);
        }
        convertedTsvIDs.add(id);
      });

      const allReferences = Array.from(allTsvMap.keys()).sort((a, b) => {
        const parseReference = (ref) => {
          const [chap, verse] = ref.split(':');
          const chapNum = isNaN(chap) ? chap : Number(chap);
          const verseNum = isNaN(verse) ? verse : Number(verse);
          return [chapNum, verseNum];
        };

        const [aChap, aVerse] = parseReference(a);
        const [bChap, bVerse] = parseReference(b);

        if (aChap === bChap) {
          if (typeof aVerse === 'string' && typeof bVerse === 'string') {
            return aVerse.localeCompare(bVerse);
          }
          if (typeof aVerse === 'string') return -1;
          if (typeof bVerse === 'string') return 1;
          return aVerse - bVerse;
        }

        if (typeof aChap === 'string' && typeof bChap === 'string') {
          return aChap.localeCompare(bChap);
        }
        if (typeof aChap === 'string') return -1;
        if (typeof bChap === 'string') return 1;
        return aChap - bChap;
      });

      const mergedRows = [headerRow];
      allReferences.forEach((ref) => {
        allTsvMap.get(ref).forEach((row) => {
          mergedRows.push(row);
        });
      });

      setMergedTsvRows(mergedRows);
    };

    if (doneConverting && selectedBranch && ! mergedTsvRows.length) {
      doMerge();
    }
  }, [convertedTsvRows, doneConverting, dcsURL, selectedBranch, selectedBook, mergedTsvRows]);

  useEffect(() => {
    if (mergedTsvRows.length > 0 && !doNotPromptAgain) {
      setDoNotPromptAgain(true);
      const userConfirmed = window.confirm(`Do you want to copy the converted & merged content to your clipboard and paste it into the editor for tn_${selectedBook.toUpperCase()}.tsv on DCS?${selectedBranch == 'master' ? '\n\nNote: Before commiting changes, select the create branch option and change "patch" to "tc-create", e.g.: richmahn-tc-create-1' : ''}\n\nYou will be redirected in this window to DCS if you click "Ok". Click "Cancel" if you want to first review the conversion results. You can then "Paste into DCS Editor" when you are ready which opens in a new window.`);
      if (userConfirmed) {
        const mergedContent = mergedTsvRows.join('\n');
        navigator.clipboard.writeText(mergedContent).then(() => {
          const dcsEditorUrl = `${dcsURL}/unfoldingWord/en_tn/_edit/${selectedBranch}/tn_${selectedBook.toUpperCase()}.tsv`;
          window.location.href = dcsEditorUrl;
        }).catch((err) => {
          console.error('Failed to copy text to clipboard:', err);
        });
      }
    }
  }, [mergedTsvRows, selectedBook, dcsURL, selectedBranch]);

  return (
    <AppContentContext.Provider
      value={{
        server,
        dcsURL,
        selectedBook,
        setSelectedBook,
        selectedBranch,
        setSelectedBranch,
        inputTsvRows,
        setInputTsvRows,
        convertedTsvRows,
        setConvertedTsvRows,
        doConvert,
        setDoConvert,
        processingRows,
        setProcessingRows,
        errors,
        setErrors,
        rowsSkipped,
        setRowsSkipped,
        rowsFailed,
        setRowsFailed,
        showOnlyConvertedRows,
        setShowOnlyConvertedRows,
        mergedTsvRows,
        setMergedTsvRows,
        showNotFound,
        setShowNotFound,
        showErrors,
        setShowErrors,
        doneConverting,
        setDoneConverting,
      }}
    >
      {children}
    </AppContentContext.Provider>
  );
};
