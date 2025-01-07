import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { convertULTQuotes2OL, addGLQuoteCols } from 'tsv7-ult-quotes-to-origl-quotes';
import { BibleBookData } from '../common/books';

const replaceWithCurlyQuotes = (text) => {
  if (!text) {
    return text;
  }
  return text
    .replace(/(\w)'(\w)/g, '$1’$2') // Apostrophe between letters
    .replace(/(\w)'(s\b)/g, '$1’$2') // Apostrophe after 's'
    .replace(/'/g, '‘') // Left single quote
    .replace(/(\W|^)"(\S)/g, '$1“$2') // Left double quote
    .replace(/(\S)"(\W|$)/g, '$1”$2') // Right double quote
};

const getUniqueID = (ids) => {
  let newID;
  do {
    newID = Math.random().toString(36).substring(2, 6);
  } while (ids.has(newID));
  return newID;
};

export const AppContentContext = createContext();

export const AppContentProvider = ({ children }) => {
  const [server, setServer] = useState(localStorage.getItem('server') || 'PROD');
  const [selectedBook, setSelectedBook] = useState(localStorage.getItem('selectedBook') || 'gen');
  const [dcsURL, setDcsURL] = useState(localStorage.getItem('dcsURL') || 'https://git.door43.org');
  const [selectedBranch, setSelectedBranch] = useState(localStorage.getItem('selectedBranch') || 'master');

  const [inputTsvRows, setInputTsvRows] = useState([]);
  const [convertedTsvRows, setConvertedTsvRows] = useState([]);
  const [standardizedTsvRows, setStandardizedTsvRows] = useState([]);
  const [mergedTsvRows, setMergedTsvRows] = useState([]);
  const [glQuotesTsvRows, setGLQuotesTsvRows] = useState([]);
  const [errors, setErrors] = useState([]);

  const [doConvert, setDoConvert] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [doNotPromptAgain, setDoNotPromptAgain] = useState(false);
  const [showOnlyConvertedRows, setShowOnlyConvertedRows] = useState(false);
  const [checkboxStates, setCheckboxStates] = useState({
    convertToGreekHebrew: true,
    standardizeQuotes: false,
    makeGLCols: false,
    mergeWithDCS: true,    
  });

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

    if (book && BibleBookData[book.toLowerCase()]) {
      setSelectedBook(book.toLowerCase());
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
    setStandardizedTsvRows([]);
    setMergedTsvRows([]);
    setGLQuotesTsvRows([]);
    setErrors([]);
    setShowOnlyConvertedRows(false);
    setShowNotFound(false);
    setDoNotPromptAgain(false);
  }, [selectedBook, inputTsvRows, checkboxStates]);

  useEffect(() => {
    const doUlt2OL = async () => {
      try {
        const result = await convertULTQuotes2OL(selectedBook, inputTsvRows.join('\n'), dcsURL);
        if (result.output.length) {
          const rows = result.output;
          for(const i in rows) {
            rows[i] = replaceWithCurlyQuotes(rows[i])
          }
          setConvertedTsvRows(rows);
        }
        if (result.errors.length) {
          setErrors(result.errors);
        }
      } catch (error) {
        setErrors([`Error processing row #${convertedTsvRows.length + 1}: ${error}`]);
        console.error(`Error processing row #${convertedTsvRows.length + 1}:`, error);
      }
    };

    if (doConvert && !convertedTsvRows.length) {
      if (checkboxStates.convertToGreekHebrew) {
        doUlt2OL();
      } else {
        setConvertedTsvRows(inputTsvRows);
      }
    }
  }, [doConvert, convertedTsvRows, checkboxStates.convertToGreekHebrew]);

  useEffect(() => {
    const standardizeQuotes = async () => {
      try {
        const result = await addGLQuoteCols(selectedBook, convertedTsvRows.join('\n'), dcsURL);
        console.log(result);
        let result2;
        if (result.output.length) {
            const updatedRows = result.output.map((row, idx) => {
              const columns = row.split('\t');
              if (idx !== 0 && columns[6] && columns[6] !== 'QUOTE_NOT_FOUND') {
                columns[4] = columns[6];
                columns[5] = columns[7];
              }
              return [...columns.slice(0, 6), columns[8]].join('\t');
            });
          result2 = await convertULTQuotes2OL(selectedBook, updatedRows.join('\n'), dcsURL);
          if (result2.output.length) {
            const rows = result2.output;
            for(const i in rows) {
              rows[i] = replaceWithCurlyQuotes(rows[i])
            }
            setStandardizedTsvRows(rows);
          }
        }
        if (result.errors.length) {
          setErrors(result.errors);
        } else if (result2.errors.length) {
          setErrors(result2.errors);
        }
      } catch (error) {
        setErrors([`Error processing row #${convertedTsvRows.length + 1}: ${error}`]);
        console.error(`Error processing row #${convertedTsvRows.length + 1}:`, error);
      }
    };

    if(doConvert &&  convertedTsvRows.length && !standardizedTsvRows.length) {
      if (checkboxStates.standardizeQuotes) {
        standardizeQuotes();
      } else {
        setStandardizedTsvRows(convertedTsvRows);
      }
    }
  }, [doConvert, convertedTsvRows, standardizedTsvRows, checkboxStates.standardizeQuotes]);

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
        if (columns[6]) {
          columns[6] = replaceWithCurlyQuotes(columns[6]);
          row = columns.join('\t');
        }
        allTsvMap.get(ref).push(row);
        idToRefMap.set(id, ref);
      });

      const convertedRefs = new Set();
      const convertedTsvIDs = new Set();
      standardizedTsvRows.forEach((row) => {
        const columns = row.split('\t');
        if (columns.length < 2 || columns[0] === 'Reference') return;
        let [ref, id] = columns;
        if (ref === 'Reference') return;
        if (!convertedRefs.has(ref)) {
          allTsvMap.set(ref, []);
          convertedRefs.add(ref);
        }
        if (columns[6]) {
          columns[6] = replaceWithCurlyQuotes(columns[6]);
          row = columns.join('\t');
        }
        if ((!idToRefMap.has(id) || idToRefMap.get(id) == ref) && !convertedTsvIDs.has(id)) {
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

        let [aChap, aVerse] = parseReference(a);
        let [bChap, bVerse] = parseReference(b);

        if (aChap === bChap) {
          if (typeof aVerse === 'string' || typeof bVerse === 'string') {
            if (aVerse === 'intro') return -1;
            if (bVerse === 'intro') return 1;
            if (typeof aVerse === 'number') aVerse = `${aVerse}-${aVerse}`;
            if (typeof bVerse === 'number') bVerse = `${bVerse}-${bVerse}`;
            const aVerses = aVerse.split(/[-,]/).map(Number);
            const bVerses = bVerse.split(/[-,]/).map(Number);
            if (aVerses[0] && bVerses[0]) {
              if (aVerses[0] === bVerses[0]) {
                return aVerses[1] - bVerses[1];
              }
              return aVerses[0] - bVerses[0];
            }
            if (typeof aVerse === 'string') return -1;
            if (typeof bVerse === 'string') return 1;
            return aVerse.localeCompare(bVerse);
          }
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

    if (selectedBranch && standardizedTsvRows.length && !mergedTsvRows.length && checkboxStates.mergeWithDCS) {
      doMerge();
    }
  }, [standardizedTsvRows, dcsURL, selectedBranch, selectedBook, mergedTsvRows, checkboxStates.mergeWithDCS]);

  useEffect(() => {
    if (mergedTsvRows.length > 0 && !doNotPromptAgain && doConvert === "ult2ol") {
      setDoNotPromptAgain(true);
      const userConfirmed = window.confirm(
        `Do you want to copy the converted & merged content to your clipboard and paste it into the editor for tn_${selectedBook.toUpperCase()}.tsv on DCS?${
          selectedBranch == 'master' ? '\n\nNote: Before commiting changes, select the create branch option and change "patch" to "tc-create", e.g.: richmahn-tc-create-1' : ''
        }\n\nA nnew windows for DCS will open if you click "Ok". Click "Cancel" if you want to first review the conversion results. You can then "Paste into DCS Editor" when you are ready which opens in a new window.`
      );
      if (userConfirmed) {
        const mergedContent = mergedTsvRows.join('\n');
        navigator.clipboard
          .writeText(mergedContent)
          .then(() => {
            const dcsEditorUrl = `${dcsURL}/unfoldingWord/en_tn/_edit/${selectedBranch}/tn_${selectedBook.toUpperCase()}.tsv`;
            window.open(dcsEditorUrl, '_blank');
          })
          .catch((err) => {
            console.error('Failed to copy text to clipboard:', err);
          });
      }
    }
  }, [mergedTsvRows, selectedBook, dcsURL, selectedBranch]);

  useEffect(() => {
    const doGLQuoteCols = async () => {
      try {
        const result = await addGLQuoteCols(selectedBook, standardizedTsvRows.join('\n'), dcsURL);
        console.log(result);
        if (result.output.length) {
          const rows = result.output;
          for(const i in rows) {
            rows[i] = replaceWithCurlyQuotes(rows[i])
          }
          setGLQuotesTsvRows(rows);
        }
        if (result.errors.length) {
          setErrors(result.errors);
        }
      } catch (error) {
        setErrors([`Error processing row #${convertedTsvRows.length + 1}: ${error}`]);
        console.error(`Error processing row #${convertedTsvRows.length + 1}:`, error);
      }
    };

    if (doConvert && standardizedTsvRows.length && !glQuotesTsvRows.length) {
      if(checkboxStates.makeGLCols) {
        doGLQuoteCols();
      } else {
        setGLQuotesTsvRows(standardizedTsvRows);
      }
    }
  }, [doConvert, standardizedTsvRows, glQuotesTsvRows, checkboxStates.makeGLCols]);

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
        errors,
        setErrors,
        showOnlyConvertedRows,
        setShowOnlyConvertedRows,
        mergedTsvRows,
        setMergedTsvRows,
        standardizedTsvRows,
        setStandardizedTsvRows,
        glQuotesTsvRows,
        setGLQuotesTsvRows,
        showNotFound,
        setShowNotFound,
        showErrors,
        setShowErrors,
        setCheckboxStates,
        checkboxStates,
      }}
    >
      {children}
    </AppContentContext.Provider>
  );
};

AppContentProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
