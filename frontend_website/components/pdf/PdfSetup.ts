"use client";

import { pdfjs } from "react-pdf";

// Uses the CDN worker; react-pdf ships with a matching worker URL helper.
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
