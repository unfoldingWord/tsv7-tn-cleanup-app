import React, { createContext, useState, useEffect } from "react";
import TSV7ULTQuotesToOrigLQuotes from "tsv7-ult-quotes-to-origl-quotes";
import { BibleBookData } from "../common/books";
import Papa from "papaparse";

export const AppContentContext = createContext();

export const AppContentProvider = ({ children }) => {
  const [tsvContent, setTsvContent] = useState("");
  const [selectedBook, setSelectedBook] = useState(
    localStorage.getItem("selectedBook") || "gen"
  );
  const [server, setServer] = useState(
    localStorage.getItem("server") || "PROD"
  );
  const [dcsURL, setDcsURL] = useState(
    localStorage.getItem("dcsURL") || "https://git.door43.org"
  );
  const [selectedBranch, setSelectedBranch] = useState(
    localStorage.getItem("selectedBranch") || "master"
  );
  const [conversionStats, setConversionStats] = useState({
    total: 0,
    done: 0,
    skipped: 0,
    bad: 0,
  });
  const [rows, setRows] = useState([]);
  const [convertedTsvRows, setConvertedTsvRows] = useState([]);
  const [convertedErrors, setConvertedErrors] = useState([]);
  const [mergeWithBranchTsv, setMergeWithBranchTsv] = useState(false);
  const [mergedTsvRows, setMergedTsvRows] = useState([]);
  const [processingRows, setProcessingRows] = useState(false);
  const [doConvert, setDoConvert] = useState(false);

  useEffect(() => {
    const handlePaste = (event) => {
      event.preventDefault();
      const pastedText = event.clipboardData.getData("text");
      setTsvContent(pastedText);
    };

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [setTsvContent]);

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
    setConvertedTsvRows([]);
    setConvertedErrors([]);
    setMergedTsvRows([]);
    setConversionStats({ total: 0, done: 0, skipped: 0, bad: 0 });
    setRows([]);
    setProcessingRows(false);
    setDoConvert(false);
  }, [tsvContent, selectedBook]);

  useEffect(() => {
    if (doConvert) {
      const tsvRows = tsvContent.split("\n").filter((r) => r.trim());
      setRows(tsvRows);
      setConversionStats({ total: tsvRows.length, done: 0, skipped: 0, bad: 0 });
    }
  }, [doConvert])

  useEffect(() => {
    const processTsvRow = async () => {
      if (convertedTsvRows.length >= rows.length) return;

      let rowIdx = convertedTsvRows.length;

      while (rowIdx < rows.length) {
        let row = rows[rowIdx++];

        const columns = row.split("\t");

        if (columns.length != 7) {
          setConvertedTsvRows((prev) => [...prev, row]);
          setConvertedErrors((prev) => [
            ...prev,
            `Error: Row #${convertedTsvRows.length + 1} is malformed: ${row}`,
          ]);
          setConversionStats((prev) => ({
            ...prev,
            done: prev.done + 1,
            bad: prev.bad + 1,
          }));
          continue;
        }
        if (columns[0] === "Reference" || !/[a-zA-Z]/.test(columns[4].replace(/(\\n|<br>)/g, ""))) {
          setConvertedTsvRows((prev) => [...prev, row]);
          setConversionStats((prev) => ({
            ...prev,
            done: prev.done + 1,
            skipped: prev.skipped + 1,
          }));
          continue;
        }
        try {
          console.log("CALLING TSV7ULTQuotesToOrigLQuotes: ", row);
          const result = await TSV7ULTQuotesToOrigLQuotes(selectedBook, row, dcsURL);
          if (result.output.length) {
            setConvertedTsvRows((prev) => [...prev, ...result.output]);
          } else {
            setConvertedTsvRows((prev) => [...prev, row]);
          }
          if (result.errors.length || result.output?.[0]?.includes('QUOTE_NOT_FOUND: ')) {
            setConvertedErrors((prev) => [...prev, ...result.errors]);
            setConversionStats((prev) => ({
              ...prev,
              done: prev.done + 1,
              bad: prev.bad + 1,
            }));
          } else {
            console.log("WEIRDLY DONE??", row);
            setConversionStats((prev) => ({ ...prev, done: prev.done + 1 }));
          }
       } catch (error) {
          setConvertedTsvRows((prev) => [...prev, ...row]);
          setConversionStats((prev) => ({
            ...prev,
            done: prev.done + 1,
            bad: prev.bad + 1,
          }));
          setConvertedErrors((prev) => [
            ...prev,
            `Error processing row #${convertedTsvRows.length + 1}: ${error}`,
          ]);
          console.error(`Error processing row #${convertedTsvRows.length + 1}:`, error);
        }
        break; // We're returning so components can be updated with the progress stats. This will be triggered again.
      }
      setProcessingRows(false);
    };

    if (!processingRows && rows.length > convertedTsvRows.length) {
      setProcessingRows(true);
      processTsvRow();
    }
  }, [rows, convertedTsvRows.length], processingRows);

  useEffect(() => {
    const doMerge = async () => {
      const response = await fetch(`${dcsURL}/unfoldingWord/en_tn/raw/branch/${selectedBranch}/tn_${selectedBook.toUpperCase()}.tsv`);
      const dcsTsv = await response.text();
      const headerRow = `Reference	ID	Tags	SupportReference	Quote	Occurrence	Note`

      let rowsWithHeader = convertedTsvRows;
      if (rowsWithHeader[0] != headerRow) {
        rowsWithHeader = [headerRow, ...convertedTsvRows];
      }

      const parsedConvertedTsv = Papa.parse(rowsWithHeader.join("\n"), {
        delimiter: "\t",
        header: true,
        skipEmptyLines: true,
      });

      const parsedDcsTsv = Papa.parse(dcsTsv, {
        delimiter: "\t",
        header: true,
        skipEmptyLines: true,
      });

      const allTsvMap = new Map();
      parsedDcsTsv.data.forEach((row) => {
        if (!allTsvMap.has(row.Reference)) {
          allTsvMap.set(row.Reference, []);
        }
        allTsvMap.get(row.Reference).push(row);
      });
      
      const convertedRefs = [];
      parsedConvertedTsv.data.forEach((row) => {
        if(! convertedRefs.includes(row.Reference)) {
          allTsvMap.set(row.Reference, [])
          convertedRefs.push(row.Reference)
        }
        allTsvMap.get(row.Reference).push(row);
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

      let mergedTsvObjs = []
      allReferences.forEach((ref) => {
        mergedTsvObjs = [...mergedTsvObjs, ...allTsvMap.get(ref)];
      });

      const mergedRows = mergedTsvObjs.map(obj => {
        return [
          obj.Reference,
          obj.ID,
          obj.Tags,
          obj.SupportReference,
          obj.Quote,
          obj.Occurrence,
          obj.Note
        ].join("\t");
      })
      mergedRows.unshift(headerRow);
      setMergedTsvRows(mergedRows);
    };

    if (mergeWithBranchTsv && selectedBranch && convertedTsvRows.length && convertedTsvRows.length >= rows.length) {
      doMerge();
    } else {
      setMergedTsvRows([]);
    }
  }, [mergeWithBranchTsv, convertedTsvRows, rows, selectedBranch, selectedBook])

  return (
    <AppContentContext.Provider
      value={{
        tsvContent,
        setTsvContent,
        selectedBook,
        setSelectedBook,
        server,
        dcsURL,
        selectedBranch,
        setSelectedBranch,
        conversionStats,
        convertedTsvRows,
        convertedErrors,
        mergeWithBranchTsv,
        setMergeWithBranchTsv,
        mergedTsvRows,
        doConvert,
        setDoConvert,
        processingRows,
      }}
    >
      {children}
    </AppContentContext.Provider>
  );
};
