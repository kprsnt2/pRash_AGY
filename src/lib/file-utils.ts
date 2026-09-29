import { Attachment, AttachmentType } from '@/types/chat';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function detectAttachmentType(file: File): AttachmentType {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    mime.includes('text') ||
    mime.includes('json') ||
    mime.includes('csv') ||
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.csv') ||
    name.endsWith('.json') ||
    name.endsWith('.sql') ||
    name.endsWith('.py') ||
    name.endsWith('.js') ||
    name.endsWith('.ts') ||
    name.endsWith('.tsx') ||
    name.endsWith('.jsx')
  ) {
    return 'document';
  }
  return 'other';
}

/**
 * Extracts plain text strings from standard PDF data for text model failovers.
 */
function extractRawPdfStrings(dataUrl: string): string {
  try {
    const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
    const binary = atob(base64);
    const textMatches: string[] = [];
    const regex = /\(([^)]{2,})\)\s*(?:Tj|'|"|TJ)/g;
    let match;
    while ((match = regex.exec(binary)) !== null) {
      const clean = match[1].replace(/\\([()\\])/g, '$1').trim();
      if (clean && !clean.startsWith('/')) {
        textMatches.push(clean);
      }
    }
    if (textMatches.length >= 3) {
      return textMatches.join(' ');
    }
  } catch {
    /* fallback to binary dataUrl */
  }
  return '';
}

/**
 * Reads a File into an Attachment object.
 * Images are read as base64 data URLs.
 * Text/CSV/JSON/Code files are read as text into extractedText and base64.
 * PDFs are read as base64 data URLs with optional text extraction for text fallbacks.
 */
export async function processFileToAttachment(file: File): Promise<Attachment> {
  const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const type = detectAttachmentType(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (type === 'image') {
      reader.onload = () => {
        resolve({
          id,
          name: file.name,
          type: 'image',
          mimeType: file.type || 'image/jpeg',
          size: file.size,
          data: reader.result as string,
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    } else if (type === 'document' || type === 'code') {
      reader.onload = () => {
        const textContent = reader.result as string;
        const base64Data = `data:${file.type || 'text/plain'};base64,${btoa(unescape(encodeURIComponent(textContent)))}`;
        resolve({
          id,
          name: file.name,
          type,
          mimeType: file.type || 'text/plain',
          size: file.size,
          data: base64Data,
          extractedText: textContent,
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    } else {
      // PDF or other binary
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const extractedText = type === 'pdf' ? extractRawPdfStrings(dataUrl) : undefined;
        resolve({
          id,
          name: file.name,
          type,
          mimeType: file.type || (type === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
          size: file.size,
          data: dataUrl,
          extractedText: extractedText || undefined,
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    }
  });
}
