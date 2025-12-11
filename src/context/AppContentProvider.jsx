import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { convertGLQuotes2OLQuotes, addGLQuoteCols } from 'tsv-quote-converters';
import { BibleBookData } from '../common/books';

const replaceWithCurlyQuotes = (row) => {
  if (!row.trim()) {
    return row;
  }
  let cols = row.split('\t');
  let ref = cols.shift().replaceAll('–', '-');
  let note = cols
    .pop()
    .replace(/(\w)'(\w)/g, '$1’$2') // Apostrophe between letters
    .replace(/(\w)'(s\b)/g, '$1’$2') // Apostrophe after 's'
    .replace(/'/g, '‘') // Left single quote
    .replace(/(\W|^)"(\S)/g, '$1“$2') // Left double quote
    .replace(/(\S)"(\W|$)/g, '$1”$2'); // Right double quote
  return [ref, ...cols, note].join('\t');
};

const getUniqueID = (ids) => {
  let newID;
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  do {
    newID = alphabet.charAt(Math.floor(Math.random() * alphabet.length)) + Math.random().toString(36).substring(2, 5);
  } while (ids.has(newID));
  return newID;
};

export const AppContentContext = createContext();

export const AppContentProvider = ({ children }) => {
  const [server, setServer] = useState(localStorage.getItem('server') || 'PROD');
  const [selectedBook, setSelectedBook] = useState(localStorage.getItem('selectedBook') || 'gen');
  const [dcsURL, setDcsURL] = useState(localStorage.getItem('dcsURL') || 'https://git.door43.org');
  const [selectedBranch, setSelectedBranch] = useState(localStorage.getItem('selectedBranch') || 'master');

  const [inputTsvText, setInputTsvText] = useState('');
  const [inputTsvRows, setInputTsvRows] = useState([]);
  const [convertedTsvRows, setConvertedTsvRows] = useState([]);
  const [mergedTsvRows, setMergedTsvRows] = useState([]);
  const [conversionStage, setConversionStage] = useState(0);
  const [conversionDone, setConversionDone] = useState(false);
  const [errors, setErrors] = useState([]);

  const [doConvert, setDoConvert] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [doNotPromptAgain, setDoNotPromptAgain] = useState(false);
  const [showOnlyConvertedRows, setShowOnlyConvertedRows] = useState(false);
  const [showOnlyChangedRows, setShowOnlyChangedRows] = useState(false);
  const [checkboxStates, setCheckboxStates] = useState({
    convertToGreekHebrew: true,
    standardizeQuotes: false,
    replaceWithCurlyQuotes: true,
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
    if (inputTsvText) {
      const rows = inputTsvText.split('\n').map((row) =>
        row
          .split('\t')
          .map((cell) => {
            cell = cell.trim();
            if (cell.startsWith('"') && cell.endsWith('"')) {
              cell = cell.substring(1, cell.length - 1).trim();
            }
            return cell;
          })
          .join('\t')
      );
      setInputTsvRows(rows);
    }
  }, [inputTsvText]);

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
  }, [selectedBook, selectedBranch, inputTsvRows, checkboxStates]);

  useEffect(() => {
    if (doConvert) {
      setConvertedTsvRows([]);
      setMergedTsvRows([]);
      setShowOnlyConvertedRows(false);
      setShowOnlyChangedRows(false);
      setShowNotFound(false);
      setDoNotPromptAgain(false);

      // Validate TSV rows: each row must have 6 tabs (7 columns)
      const validationErrors = [];
      console.log('DOING VALIDATION');
      for (let idx = 0; idx < inputTsvRows.length; idx++) {
        if (!inputTsvRows[idx].trim()) continue;
        const row = inputTsvRows[idx];
        const cols = row.split('\t');
        if (cols.length !== 7) {
          validationErrors.push(`Error: Row #${idx + 1} is malformed. There are ${cols.length} columns instead of 7 in line ${idx + 1}: ${inputTsvRows[idx].substr(0, 80)}...`);
        }
      }

      if (validationErrors.length) {
        console.log('Validation errors:', validationErrors);
        setErrors(validationErrors);
        // End the conversion run
        setConversionStage(0);
        setConversionDone(true);
        setDoConvert(false);
        setShowErrors(true);
        console.log('RETURNING!!!');
        return;
      }

      setErrors([]);
      setShowErrors(false);
      setConversionDone(false);
      setConversionStage(1);
    }
  }, [doConvert]);

  // Conversion Stage 1: Convert ULT quotes to OL quotes
  useEffect(() => {
    const doUlt2OL = async () => {
      // make sure all rows are proper
      try {
        if (inputTsvRows[0].split('\t')[0] !== 'Reference') {
          inputTsvRows.unshift('Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tNote');
        }
        const result = await convertGLQuotes2OLQuotes({
          bibleLink: 'unfoldingWord/en_ult/master',
          bookCode: selectedBook,
          tsvContent: inputTsvRows.join('\n'),
          trySeparatorsAndOccurrences: true,
          dcsURL,
        });
        if (result.output.length) {
          setConvertedTsvRows(result.output.split('\n'));
          setConversionStage((prev) => prev + 1);
        } else {
          setConversionDone(true);
        }
        if (result?.errors?.length) {
          setErrors(result.errors);
        }
      } catch (error) {
        const errStr = error && error.message ? error.message : String(error);
        const match = errStr.match(/on line\s*(\d+)/i);
        let idx;
        if (match && match[1]) {
          idx = parseInt(match[1], 10);
        }
        if (typeof idx === 'undefined') {
          idx = Math.max(0, convertedTsvRows.length - 1);
        }
        console.log(match, idx, inputTsvRows[idx]);
        const context = inputTsvRows[idx - 1] ? inputTsvRows[idx - 1].substring(0, 80) : '';
        setErrors([`Error processing row #${idx}: ${errStr}: ${context}...`]);
        console.error(`Error processing row #${idx}:`, error);
        setConversionDone(true);
      }
    };

    if (doConvert && conversionStage === 1 && !convertedTsvRows.length && errors.length === 0) {
      console.log('At stage 1');
      if (checkboxStates.convertToGreekHebrew) {
        console.log('Doing stage 1');
        doUlt2OL();
      } else {
        console.log('Skipping stage 1');
        if (inputTsvRows[0].split('\t')[0] !== 'Reference') {
          inputTsvRows.unshift('Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tNote');
        }
        setConvertedTsvRows(inputTsvRows);
        setConversionStage((prev) => prev + 1);
      }
    }
  }, [errors, doConvert, inputTsvRows, convertedTsvRows, conversionStage, checkboxStates.convertToGreekHebrew]);

  // Conversion Stage 2: Standardize quotes
  useEffect(() => {
    const standardizeQuotes = async () => {
      try {
        const result = await addGLQuoteCols({
          bibleLinks: ['unfoldingWord/en_ult/master'],
          bookCode: selectedBook,
          tsvContent: convertedTsvRows.join('\n'),
          trySeparatorsAndOccurrences: true,
          dcsURL,
        });
        let result2;
        console.log('addGLQuoteCols output:', result.output);
        if (result.output.length) {
          let tsvRecords = result.output.split('\n').map((row) => {
            const cols = row.split('\t');
            return cols;
          });

          const headers = tsvRecords[0];
          tsvRecords = tsvRecords
            .slice(1)
            .map((cols) => {
              const record = {};
              headers.forEach((header, index) => {
                record[header] = cols[index] || '';
              });
              return record;
            })
            .filter((record) => Object.values(record).some((val) => val.trim()));

          console.log(tsvRecords);

          tsvRecords.forEach((rec) => {
            rec['Quote'] = rec['GLQuote'];
            rec['Occurrence'] = rec['GLOccurrence'];
          });

          const newHeaders = headers.filter((header) => header !== 'GLQuote' && header !== 'GLOccurrence');
          const outputTsv = newHeaders.join('\t') + '\n' + tsvRecords.map((rec) => newHeaders.map((header) => rec[header] || '').join('\t')).join('\n');
          console.log('outputTsv', outputTsv);

          let result2 = await convertGLQuotes2OLQuotes({ bibleLink: 'unfoldingWord/en_ult/master', bookCode: selectedBook, tsvContent: outputTsv, dcsURL });
          if (result2.output.length) {
            const rows = result2.output.split('\n');
            setConvertedTsvRows(rows);
            setConversionStage((prev) => prev + 1);
          } else {
            setConversionDone(true);
          }
        } else {
          setConversionDone(true);
        }
        setErrors([...(result?.errors || []), ...(result2?.errors || [])]);
      } catch (error) {
        const errStr = error && error.message ? error.message : String(error);
        const match = errStr.match(/on line\s*(\d+)/i);
        let idx;
        if (match && match[1]) {
          idx = parseInt(match[1], 10);
        }
        console.log(match, idx);
        if (typeof idx === 'undefined') {
          idx = Math.max(0, convertedTsvRows.length - 1);
        }
        const context = inputTsvRows[idx - 1] ? inputTsvRows[idx - 1].substring(0, 80) : '';
        setErrors([`Error processing row #${idx}: ${errStr}: ${context}...`]);
        console.error(`Error processing row #${idx}:`, error);
        setConversionDone(true);
      }
    };

    if (doConvert && conversionStage === 2 && convertedTsvRows.length) {
      if (checkboxStates.standardizeQuotes) {
        console.log('At stage 2');
        standardizeQuotes();
      } else {
        console.log('Skipping stage 2');
        setConversionStage((prev) => prev + 1);
      }
    }
  }, [doConvert, convertedTsvRows, conversionStage, checkboxStates.standardizeQuotes]);

  // Conversion Stage 3: Merge with DCS
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
        if (!allTsvMap.has(ref.split(':')[0])) {
          allTsvMap.set(ref.split(':')[0], []);
        }
        allTsvMap.get(ref.split(':')[0]).push(row);
        idToRefMap.set(id, ref);
      });

      const convertedRefs = new Set();
      const convertedTsvIDs = new Set();
      const newConvertedTsvRows = [];
      convertedTsvRows.forEach((row) => {
        if (!row.trim()) return;
        const columns = row.split('\t');
        if (columns.length < 2 || columns[0] === 'Reference') return;
        let [ref, id] = columns;
        if (!convertedRefs.has(ref.split(':')[0])) {
          allTsvMap.set(ref.split(':')[0], []);
          convertedRefs.add(ref.split(':')[0]);
        }
        if ((!idToRefMap.has(id) || idToRefMap.get(id) === ref) && !id.match(/^\d/) && !convertedTsvIDs.has(id)) {
          allTsvMap.get(ref.split(':')[0]).push(row);
        } else {
          const ids = new Set([...idToRefMap.keys(), ...convertedTsvIDs]);
          id = getUniqueID(ids);
          const newRow = [ref, id, ...columns.slice(2)].join('\t');
          allTsvMap.get(ref.split(':')[0] ).push(newRow);
        }
        convertedTsvIDs.add(id);
        newConvertedTsvRows.push([ref, id, ...columns.slice(2)].join('\t'));
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
            const aVerses = aVerse.split(/[-–,]/).map(Number);
            const bVerses = bVerse.split(/[-–,]/).map(Number);
            if (aVerses[0] && bVerses[0]) {
              if (aVerses[0] == bVerses[0]) {
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

      setConvertedTsvRows(newConvertedTsvRows);
      setMergedTsvRows(mergedRows);
      setConversionStage((prev) => prev + 1);
    };

    if (selectedBranch && conversionStage === 3 && convertedTsvRows.length && !mergedTsvRows.length && checkboxStates.mergeWithDCS) {
      console.log('At stage 3 - DCS');
      doMerge();
    }
  }, [convertedTsvRows, dcsURL, selectedBranch, selectedBook, mergedTsvRows, conversionStage, checkboxStates.mergeWithDCS]);

  // Conversion Stage 3: Add GL Quotes and Occurrences
  useEffect(() => {
    const doGLQuoteCols = async () => {
      try {
        const result = await addGLQuoteCols({
          bibleLinks: ['unfoldingWord/en_ult/master'],
          bookCode: selectedBook,
          tsvContent: convertedTsvRows.join('\n'),
          trySeparatorsAndOccurrences: true,
          dcsURL,
        });
        if (result.output.length) {
          setConvertedTsvRows(result.output.split('\n'));
        } else {
          setConversionDone(true);
        }
        setConversionStage((prev) => prev + 1);
        if (result?.errors?.length) {
          setErrors(result?.errors);
        }
      } catch (error) {
        const errStr = error && error.message ? error.message : String(error);
        const match = errStr.match(/on line\s*(\d+)/i);
        let idx;
        if (match && match[1]) {
          idx = parseInt(match[1], 10);
        }
        console.log(match, idx);
        if (typeof idx === 'undefined') {
          idx = Math.max(0, convertedTsvRows.length - 1);
        }
        console.log(inputTsvRows);
        const context = inputTsvRows[idx - 1] ? inputTsvRows[idx - 1].substring(0, 80) : '';
        setErrors([`Error processing row #${idx}: ${errStr}: ${context}...`]);
        console.error(`Error processing row #${idx}:`, error);
        setConversionDone(true);
      }
    };

    if (doConvert && convertedTsvRows.length && conversionStage === 3) {
      if (checkboxStates.makeGLCols) {
        console.log('At stage 3 - GL');
        doGLQuoteCols();
      } else if (!checkboxStates.mergeWithDCS) {
        console.log('Skipping stage 3');
        setConversionStage((prev) => prev + 1);
      }
    }
  }, [doConvert, convertedTsvRows, conversionStage, checkboxStates.makeGLCols]);

  // Conversion Stage 4: Fix curly quotes
  useEffect(() => {
    if (doConvert && conversionStage === 4 && convertedTsvRows.length && !conversionDone) {
      console.log('At stage 4');
      if (checkboxStates.replaceWithCurlyQuotes) {
        const newRows = [];
        for (const i in convertedTsvRows) {
          newRows.push(replaceWithCurlyQuotes(convertedTsvRows[i]));
        }
        setConvertedTsvRows(newRows);
        if (mergedTsvRows.length) {
          const newRows = [];
          for (const i in mergedTsvRows) {
            newRows.push(replaceWithCurlyQuotes(mergedTsvRows[i]));
          }
          setMergedTsvRows(newRows);
        }
      }
      console.log('DONE');
      setConversionStage((prev) => prev + 1);
      setConversionDone(true);
    }
  }, [doConvert, convertedTsvRows, conversionStage, checkboxStates.replaceWithCurlyQuotes]);

  // Finishing up by popping up a model if mergeTsvRows has content
  useEffect(() => {
    if (mergedTsvRows.length > 0 && !doNotPromptAgain && conversionDone) {
      setDoNotPromptAgain(true);
      const userConfirmed = window.confirm(
        `Do you want to copy the converted & merged content to your clipboard and paste it into the editor for tn_${selectedBook.toUpperCase()}.tsv on DCS?${
          selectedBranch == 'master' ? '\n\nNote: Before commiting changes, select the create branch option and change "patch" to "tc-create", e.g.: richmahn-tc-create-1' : ''
        }\n\nA new windows for DCS will open if you click "Ok". Click "Cancel" if you want to first review the conversion results. You can then "Paste into DCS Editor" when you are ready which opens in a new window.`
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
  }, [mergedTsvRows, selectedBook, dcsURL, selectedBranch, conversionDone]);

  return (
    <AppContentContext.Provider
      value={{
        server,
        dcsURL,
        selectedBook,
        setSelectedBook,
        selectedBranch,
        setSelectedBranch,
        inputTsvText,
        inputTsvRows,
        setInputTsvRows,
        setInputTsvText,
        convertedTsvRows,
        setConvertedTsvRows,
        doConvert,
        setDoConvert,
        errors,
        setErrors,
        showOnlyConvertedRows,
        setShowOnlyConvertedRows,
        showOnlyChangedRows,
        setShowOnlyChangedRows,
        mergedTsvRows,
        setMergedTsvRows,
        conversionDone,
        showNotFound,
        setShowNotFound,
        showErrors,
        setShowErrors,
        checkboxStates,
        setCheckboxStates,
        conversionStage,
      }}
    >
      {children}
    </AppContentContext.Provider>
  );
};

AppContentProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
