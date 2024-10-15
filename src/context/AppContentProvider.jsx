import React, { createContext, useState, useEffect } from "react";
import TSV7ULTQuotesToOrigLQuotes from "tsv7-ult-quotes-to-origl-quotes";
import { BibleBookData } from "../common/books";
import Papa from "papaparse";

export const AppContentContext = createContext();

export const AppContentProvider = ({ children }) => {
  const [server, setServer] = useState(
    localStorage.getItem("server") || "PROD"
  );
  const [selectedBook, setSelectedBook] = useState(
    localStorage.getItem("selectedBook") || "gen"
  );
  const [dcsURL, setDcsURL] = useState(
    localStorage.getItem("dcsURL") || "https://git.door43.org"
  );
  const [selectedBranch, setSelectedBranch] = useState(
    localStorage.getItem("selectedBranch") || "master"
  );

  const [inputTsvRows, setInputTsvRows] = useState([]);
  const [convertedTsvRows, setConvertedTsvRows] = useState([]);
  const [rowsSkipped, setRowsSkipped] = useState(0);
  const [rowsFailed, setRowsFailed] = useState(0);
  const [errors, setErrors] = useState([]);

  const [mergeWithDcs, setMergeWithDcs] = useState(false);
  const [mergedTsvRows, setMergedTsvRows] = useState([]);

  const [doConvert, setDoConvert] = useState(false);
  const [processingRows, setProcessingRows] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [doneConverting, setDoneConverting] = useState(false);

  useEffect(() => {
    const handlePaste = (event) => {
      event.preventDefault();
      const pastedText = event.clipboardData.getData("text");
      setInputTsvRows(pastedText.split("\n").filter(row => row.trim()));
    };

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [inputTsvRows]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const serverParam = urlParams.get("server");
    const book = urlParams.get("book");

    if (serverParam) {
      setServer(serverParam.toUpperCase());
      localStorage.setItem("server", serverParam.toUpperCase());

      const newDcsURL =
        serverParam.toUpperCase() === "QA"
          ? "https://qa.door43.org"
          : "https://git.door43.org";
      setDcsURL(newDcsURL);
      localStorage.setItem("dcsURL", newDcsURL);
    }

    if (book) {
      setSelectedBook(book);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedBook", selectedBook);
  }, [selectedBook]);

  useEffect(() => {
    localStorage.setItem("selectedBranch", selectedBranch);
  }, [selectedBranch]);

  useEffect(() => {
    setDoConvert(false);
    setConvertedTsvRows([])
    setMergedTsvRows([]);
    setErrors([]);
    setRowsSkipped(0);
    setRowsFailed(0);
    setMergeWithDcs(false);
    setShowNotFound(false);
    setProcessingRows(false);
    setDoneConverting(false);
  }, [selectedBook, inputTsvRows]);

  useEffect(() => {
    const processTsvRow = async () => {
      let rowIdx = convertedTsvRows.length;

      while (rowIdx < inputTsvRows.length) {
        let row = inputTsvRows[rowIdx++];

        const columns = row.split("\t");

        if (columns.length != 7) {
          setConvertedTsvRows((prev) => [...prev, row]);
          setErrors((prev) => [
            ...prev,
            `Error: Row #${convertedTsvRows.length + 1} is malformed: ${row}`,
          ]);
          setRowsFailed((prev) => prev + 1)
          continue;
        }
        if (columns[0] === "Reference" || !/[a-zA-Z]/.test(columns[4].replace(/(\\n|<br>)/g, ""))) {
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
            setRowsFailed((prev) => prev + 1)
          }
       } catch (error) {
          setConvertedTsvRows((prev) => [...prev, row]);
          setRowsFailed((prev) => prev + 1)
          setErrors((prev) => [
            ...prev,
            `Error processing row #${convertedTsvRows.length + 1}: ${error}`,
          ]);
          console.error(`Error processing row #${convertedTsvRows.length + 1}:`, error);
        }
        break; // We're returning so components can be updated with the progress stats. This will be triggered again.
      }
      setProcessingRows(false);
      if (rowIdx >= inputTsvRows.length) {
        setDoneConverting(true);
      }
    };

    if (doConvert && !processingRows && !doneConverting && inputTsvRows.length > convertedTsvRows.length) {
      setProcessingRows(true);
      processTsvRow();
    }
  }, [doConvert, convertedTsvRows, processingRows, doneConverting]);

  useEffect(() => {
    const doMerge = async () => {
      const response = await fetch(`${dcsURL}/unfoldingWord/en_tn/raw/branch/${selectedBranch}/tn_${selectedBook.toUpperCase()}.tsv`);
      const dcsTsvRows = (await response.text()).split("\n").filter(row => row.trim());
      const headerRow = `Reference	ID	Tags	SupportReference	Quote	Occurrence	Note`

      const allTsvMap = new Map();
      dcsTsvRows.forEach((row) => {
        const ref = row.split("\t")[0]
        if (ref === "Reference") return;
        if (!allTsvMap.has(ref)) {
          allTsvMap.set(ref, []);
        }
        allTsvMap.get(ref).push(row);
      });
      
      const convertedRefs = [];
      convertedTsvRows.forEach((row) => {
        const ref = row.split("\t")[0]
        if (ref === "Reference") return;
        if(! convertedRefs.includes(ref)) {
          allTsvMap.set(ref, [])
          convertedRefs.push(ref)
        }
        allTsvMap.get(ref).push(row);
      });

      const allReferences = Array.from(allTsvMap.keys()).sort((a, b) => {
        const parseReference = (ref) => {
          const [chap, verse] = ref.split(":");
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

      const mergedRows = [headerRow]
      allReferences.forEach((ref) => {
        allTsvMap.get(ref).forEach(row => {
          mergedRows.push(row)
        });
      });

      setMergedTsvRows(mergedRows);
    };

    if (mergeWithDcs && doneConverting && selectedBranch) {
      doMerge();
    }
  }, [mergeWithDcs, convertedTsvRows, dcsURL, selectedBranch, selectedBook])

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
        mergeWithDcs,
        setMergeWithDcs,
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
